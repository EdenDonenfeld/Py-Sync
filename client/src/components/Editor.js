// src/components/Editor.js
import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import io from 'socket.io-client';
import './Style.css';

const socket = io('http://localhost:3000');

function Editor() {
    const editorRef = useRef(null);
    
    const [codeEditor, setCodeEditor] = useState('');
    const [output, setOutput] = useState('');
    const [fileName, setFileName] = useState('');
  
    const runCode = async () => {
      let code = document.querySelector('.editor').innerText;
      console.log(`Code: ${code}`);
      
      code = code.split('\n').filter(line => !/^\d+$/.test(line)).join('\n');
  
      console.log(`Code: ${code}`);
  
      const response = await fetch('/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
  
      const data = await response.json();
      console.log("Data: ", data)
      setOutput(data.output);
    }
  
    const openNav = () => {
      document.getElementById("mySidebar").style.width = "250px";
      document.querySelector(".header-app").style.marginLeft = "250px";
      document.querySelector(".content").style.marginLeft = "250px";
    };
  
    const closeNav = () => {
      document.getElementById("mySidebar").style.width = "0";
      document.querySelector(".header-app").style.marginLeft = "0";
      document.querySelector(".content").style.marginLeft = "0";
    };

    useEffect(() => {
      socket.on('connect', () => {
          console.log('Connected to WebSocket server');
      });

      socket.on('code-change', (data) => {
          setCodeEditor(data);
      });

      socket.on('file-name', (fileName) => {
          setFileName(fileName + ".py");
      });

      socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
      });

      return () => {
          socket.off('code-change');
          socket.off('file-name');
          socket.off('connect');
          socket.off('disconnect');
      };
    }, []);

    const handleChange = (newValue) => {
      socket.emit('code-change', newValue);
  };

  const editorDidMount = (editor) => {
    console.log('Editor mounted:', editor);
    editorRef.current = editor;
  };

    return (
      <div className="app-container">
        <div id="mySidebar" className="sidebar">
          <a href="javascript:void(0)" className="closebtn" onClick={closeNav}>x</a>
          <a href="#">About</a>
          <a href="#">Services</a>
          <a href="#">Clients</a>
          <a href="#">Contact</a>
        </div>
        <div className="header-app">
          <button className="openbtn" onClick={openNav}>☰</button>
          <h1>Collaborative Python Editor</h1>
          <ul className="online-users">
            <li><button>A</button></li>
            <li><button>S</button></li>
            <li><button>T</button></li>
          </ul>
        </div>
        <div className="content">
          <div className="editor-container">
            <div className="editor-title">{fileName}</div>
            <MonacoEditor
              ref={editorRef}
              height="80vh"
              defaultLanguage="python"
              theme="vs-dark"
              className="editor"
              onChange={handleChange}
              editorDidMount={editorDidMount}
              options={{
                fontFamily: 'Fira Code, monospace',
                fontSize: 16,
              }}
              value={codeEditor}
            />
            <button className="run-button" onClick={runCode}>Run</button>
          </div>
          <div className="output-container">
            <div className="output-title">output</div>
            <div className="output">{output}</div>
          </div>
        </div>
      </div>
    );
}

export default Editor;
