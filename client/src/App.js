// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RoomCode from './components/RoomCode';
import Editor from './components/Editor';

function App() {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/room-code" element={<RoomCode />} />
          <Route path="/room/:roomCode" element={<Editor />} />
          <Route path="/" element={<Home />} />
        </Routes>
    </Router>
    );
}

export default App;
