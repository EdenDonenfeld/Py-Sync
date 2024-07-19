// src/components/Home.js

import React from 'react';
import './Style.css';

function Home() {

    const loginButton = () => {
        window.location.href = "/login";
    };
    
    const registerButton = () => {
        window.location.href = "/register";
    };

    return (
        <div class="home">
            <h1 class="header">PySync</h1>
            <p class="header-text">Code Python Together</p>
            <div class="btns">
                <button class="login-btn" onClick={loginButton}>Login</button>
                <button class="register-btn" onClick={registerButton}>Register</button>
            </div>
        </div>
    );
}

export default Home;
