// src/components/Editor.js

import React, { useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './Style.css';

function Editor() {
    const editorRef = useRef(null);
    const [output, setOutput] = useState('');
  
    const runCode = async () => {
      let code = document.querySelector('.editor').innerText;
      console.log(`Code: ${code}`);
      
      code = code.split('\n').filter(line => !/^\d+$/.test(line)).join('\n');
  
      console.log(`Code: ${code}`);
  
      // Send the code to the server
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
  
    function cleanString(input) {
      // Remove non-printable characters using a regular expression
      const cleanedString = input.replace(/[^\x20-\x7E]/g, ' ');
  
      // Replace the escaped newline sequence with an actual newline
      const finalString = cleanedString.replace(/\\r\\n/g, '\r\n');
  
      return finalString;
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
            <div className="editor-title">name.py</div>
            <MonacoEditor
              height="80vh"
              defaultLanguage="python"
              theme="vs-dark"
              className="editor"
              editorDidMount={(editor) => (editorRef.current = editor)}
              options={{
                fontFamily: 'Fira Code, monospace',
                fontSize: 16,
              }}
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
