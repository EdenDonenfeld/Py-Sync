// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Rooms from './components/Rooms';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Editor from './components/Editor';

function App() {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/room-code" element={<Rooms />} />
          <Route path="/room-code-create" element={<CreateRoom />} />
          <Route path="/room-code-join" element={<JoinRoom />} />
          <Route path="/room/:roomCode" element={<Editor />} />
          <Route path="/" element={<Home />} />
        </Routes>
    </Router>
    );
}

export default App;
