const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { MongoClient } = require('mongodb');
const path = require('path');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

const server = http.createServer(app);
const io = socketIo(server);
let fileNameValue = "";

const url = 'mongodb://localhost:27017';
const dbName = 'Authentication';

const store = new MongoDBStore({
    uri: url,
    databaseName: dbName,
    collection: 'Sessions'
});

const rooms = new MongoDBStore({
    uri: url,
    databaseName: dbName,
    collection: 'Rooms'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'node_modules', 'monaco-editor', 'core', 'vs')));
app.use(express.static(path.join(__dirname, 'client/build')));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const isAuthenticated = (req, res, next) => {
    console.log(req.session)
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

io.on('connection', (socket) => {

    const roomCode = socket.handshake.query.roomCode;

    socket.on('join-room', async (roomCode) => {
        socket.join(roomCode); // Join the room

        // Fetch the user list from the database
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const roomsCollection = db.collection('Rooms');

        const room = await roomsCollection.findOne({ roomCode });
        if (room) {

            let users = room.users;

            // convert users list of ids to usernames
            const usersCollection = db.collection('Users');
            for (let i = 0; i < users.length; i++) {
                const user = await usersCollection.findOne({ _id: users[i] });
                users[i] = user.username;
            }    

            // Emit the user list to the newly connected user
            socket.emit('user-list', users);
            // Optionally, emit the user list to all clients in the room
            socket.to(roomCode).emit('user-list', users);
        }

        client.close();
    });

    socket.on('code-change', (data) => {
        socket.broadcast.emit('code-change', data);
    });

    socket.on('cursor-change', (data) => {
        socket.broadcast.emit('cursor-change', data);
    })

    socket.emit('file-name', fileNameValue);

    socket.on('leave-room', async () => {
        const roomCode = socket.handshake.query.roomCode;
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const roomsCollection = db.collection('Rooms');
 
        const room = await roomsCollection.findOne({ roomCode });
        if (room) {

            let users = room.users;

            // convert users list of ids to usernames
            const usersCollection = db.collection('Users');
            for (let i = 0; i < users.length; i++) {
                const user = await usersCollection.findOne({ _id: users[i] });
                users[i] = user.username;
            }    

            // Emit the user list to the newly connected user
            socket.emit('user-list', users);
            // Optionally, emit the user list to all clients in the room
            socket.to(roomCode).emit('user-list', users);
        }
 
        client.close();
    });
});

app.get('/room-code', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.get('/room/:roomCode', isAuthenticated, (req, res) => {
  const user = req.session.user && req.session.user.id;

  if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

// Check room availability without creating it
app.post('/check-room/:roomCode', async (req, res) => {
  const { roomCode } = req.params;

  try {
      const client = new MongoClient(url);
      await client.connect();
      const db = client.db(dbName);
      const roomsCollection = db.collection('Rooms');

      const room = await roomsCollection.findOne({ roomCode });
      const length = roomCode.length;
      
      res.json({ roomAvailable: (room == null && length === 6) });

      client.close();
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Check room availability and password when joining
app.post('/check-room-joining/:roomCode', async (req, res) => {
    const { roomCode } = req.params;
    const roomPassword = req.body.roomPassword;
    
    try {
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const roomsCollection = db.collection('Rooms');
    
        const room = await roomsCollection.findOne({ roomCode });
    
        if (room) {
            // add user to room if password is correct
            if (room.roomPassword === roomPassword) {
                res.json({ roomAvailable: true, password: true });
            } else {
                res.json({ roomAvailable : true, password: false });
            }
        } else {
            res.json({ roomAvailable: false, password: false });
        }
    
        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
    }
);

// Create room and add user when joining
app.post('/add-to-room/:roomCode', async (req, res) => {
  const { roomCode } = req.params;
  const user = req.session.user && req.session.user.id;
  const roomPassword = req.body.roomPassword;

  if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
      const client = new MongoClient(url);
      await client.connect();
      const db = client.db(dbName);
      const roomsCollection = db.collection('Rooms');

      let room = await roomsCollection.findOne({ roomCode });
      const length = roomCode.length;

      if (length === 6) {
          if (room) {
              // Room exists, add user if not already present
              fileNameValue = room.fileNameValue;
              if (!room.users.includes(user)) {
                  await roomsCollection.updateOne(
                      { roomCode },
                      { $addToSet: { users: user } }
                  );
              }
              let users = room.users;
              // convert users list of ids to usernames
              const usersCollection = db.collection('Users');
              for (let i = 0; i < users.length; i++) {
                const user = await usersCollection.findOne({ _id: users[i] });
                users[i] = user.username;
              } 
              io.to(roomCode).emit('user-list', users); // Emit the user list to all clients in the room

          } else {
              // Room does not exist, create it and add the user as admin, users list is empty
              fileNameValue = req.body.fileName;
              await roomsCollection.insertOne({ roomCode, admin: user, users: [user], fileNameValue, roomPassword });
          }
          io.emit('file-name', fileNameValue); // Emit the file name to all clients
          res.json({ success: true });
      } else {
          res.json({ success: false, message: 'Invalid room code length' });
      }

      client.close();
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/register', async (req, res) => {
    const { username, hashedPassword, salt } = req.body;

    try {
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection('Users');

        const user = await usersCollection.findOne({ username });

        if (user) {
            res.json({ success: false, message: 'User already exists' });
        } else {
            await usersCollection.insertOne({ username, hashedPassword, salt });
            res.json({ success: true, message: 'User registered successfully' });
        }

        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/get-salt', async (req, res) => {
    const { username } = req.body;

    try {
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection('Users');

        const user = await usersCollection.findOne({ username });

        if (user) {
            res.json({ salt: user.salt });
        } else {
            res.json({ salt: null });
        }

        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, hashedPassword } = req.body;

    try {
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection('Users');

        // If username or password are empty strings, return an error
        if (!username || !hashedPassword) {
            res.json({ success: false, message: 'Username and password are required' });
            return;
        }

        const user = await usersCollection.findOne({ username });

        if (!user) {
            res.json({ success: false, message: 'User does not exist' });
        } else {
            if (user.hashedPassword === hashedPassword) {
                req.session.user = { id: user._id, username: user.username };
                console.log(req.session.user)
                res.json({ success: true, message: 'User logged in successfully' });
            } else {
                res.json({ success: false, message: 'Invalid password' });
            }
        }

        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// logout and remove user from given roomCode
app.post('/logout', async (req, res) => {
    const user = req.session.user && req.session.user.id;
    const roomCode = req.body.roomCode;

    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const client = new MongoClient(url);
        await client.connect();
        const db = client.db(dbName);
        const roomsCollection = db.collection('Rooms');

        await roomsCollection.updateOne(
            { roomCode },
            { $pull: { users: user } }
        );

        const room = await roomsCollection.findOne({ roomCode });
        let users = room.users;

        // convert users list of ids to usernames
        const usersCollection = db.collection('Users');
        for (let i = 0; i < users.length; i++) {
            const user = await usersCollection.findOne({ _id: users[i] });
            users[i] = user.username;
        }

        io.to(roomCode).emit('user-list', users);
        res.json({ success: true });

        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/run-code', (req, res) => {
    // Write the code into a python file
    // Run the python file and print the output into output.txt
    // Read the output.txt and send the output as response

    const { code } = req.body;
    const fileName = 'runner.py';
    const outputFileName = 'output.txt';

    // Replace all non-breaking spaces with regular spaces
    const newCode = code.replace(/\u00a0/g, ' ');

    fs.writeFileSync(fileName, newCode);

    const pythonProcess = spawn('python', [fileName]);

    pythonProcess.stdout.on('data', (data) => {
        fs.writeFileSync(outputFileName, data);
    });

    pythonProcess.stderr.on('data', (data) => {
        fs.writeFileSync(outputFileName, data);
    });

    pythonProcess.on('close', () => {
        const output = fs.readFileSync(outputFileName, 'utf-8');
        res.json({ output });
    });

    pythonProcess.on('error', (error) => {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    });

    pythonProcess.stdin.end();
});


server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
});