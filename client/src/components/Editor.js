// src/components/Editor.js
import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import './Style.css';
import { debounce } from 'lodash';

const socket = io('http://localhost:3000');

function Editor() {
    const editorRef = useRef(null);
    const { roomCode } = useParams();
    
    const [codeEditor, setCodeEditor] = useState('');
    const [output, setOutput] = useState('');
    const [fileName, setFileName] = useState('');
    const [users, setUsers] = useState([]);
  
    const runCode = async () => {
      let code = document.querySelector('.editor').innerText;    
      code = code.split('\n').filter(line => !/^\d+$/.test(line)).join('\n');
    
      const response = await fetch('/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
  
      const data = await response.json();
      setOutput(data.output);
      await saveCode();
    }

    const logOut = async () => {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode }),
      });
      const data = await response.json();
      if (data.success) {
        console.log("Logged out successfully");
        await saveCode();
        window.location.href = '/login';
      }
      else {
        console.log("Error logging out");
      }
    }

    const saveCode = async () => {
      let code = document.querySelector('.editor').innerText;
      code = code.split('\n').filter(line => !/^\d+$/.test(line)).join('\n');
      code = code.replace(/\u00a0/g, ' ');

      const response = await fetch('/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, roomCode }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Code saved successfully");
      }
      else {
        console.log("Error saving code");
      }
    }

    useEffect(() => {
      socket.on('connect', () => {
          console.log('Connected to WebSocket server');
      });

      socket.on('code-change', (data) => {
          setCodeEditor(data);
      });

      socket.on('code', (data) => {
        data = data.replace(/\u00a0/g, ' ');
        setCodeEditor(data);
      });
      
      socket.on('file-name', (fileName) => {
        setFileName(fileName + ".py");
      });

      socket.on('cursor-position', (position) => {
          editorRef.current.setPosition(position);
      });

      return () => {
          socket.off('code-change');
          socket.off('code');
          socket.off('cursor-position');
          socket.off('file-name');
          socket.off('connect');
      };
    }, []);

    useEffect(() => {
      socket.emit('join-room', roomCode);
        
      // Listen for the user list from the server
      socket.on('user-list', (users) => {
          setUsers(users);
      });
  
      return () => {
          socket.off('user-list');
      };
    }, [roomCode]);


  const handleChange = (newValue) => {
      socket.emit('code-change', newValue);
  };

  const handleCursorPositionChange = debounce((e) => {
    console.log("Cursor position: ", e.position);
    socket.emit('cursor-position', { position: e.position });
  }, 100); // Adjust debounce time as needed

  const editorDidMount = (editor) => {
    console.log('Editor mounted:', editor);
    editorRef.current = editor;
  };

    return (
      <div className="app-container">
        <div className="header-app">
          <h1>Collaborative Python Editor</h1>
          <ul className="online-users">
              {users.map((user, index) => (
                  <li key={index}><button>{user}</button></li>
              ))}
          </ul>
          <div class="side-btns">
            <button class="log-out" onClick={logOut}>Log out</button>
          </div>
        </div>
        <div className="content">
          <div className="editor-container">
            <div class="editor-header">
              <div className="editor-title">{fileName}</div>
              <div class="run-button" onClick={runCode}>Run</div>
            </div>
            <MonacoEditor
              ref={editorRef}
              height="80vh"
              defaultLanguage="python"
              theme="vs-dark"
              className="editor"
              onChange={handleChange}
              editorDidMount={editorDidMount}
              onDidChangeCursorPosition={handleCursorPositionChange}
              options={{
                fontFamily: 'Fira Code, monospace',
                fontSize: 16,
              }}
              value={codeEditor}
            />
          </div>
          <div className="output-container">
            <div className="output-header">
              <div className="output-title">output</div>
            </div>
            <div className="output">
              {output.split('\n').map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
            </div>
          </div>
        </div>
      </div>
    );
}

export default Editor;
