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

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('code-change', (data) => {
        socket.broadcast.emit('code-change', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

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
}

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
      
      res.json({ roomAvailable: room && length === 6 });

      client.close();
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create room and add user when joining
app.post('/join-room/:roomCode', async (req, res) => {
  const { roomCode } = req.params;
  const user = req.session.user && req.session.user.id;

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
              if (!room.users.includes(user)) {
                  await roomsCollection.updateOne(
                      { roomCode },
                      { $addToSet: { users: user } }
                  );
              }
          } else {
              // Room does not exist, create it and add the user
              await roomsCollection.insertOne({ roomCode, users: [user] });
          }
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
                console.log("here")
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