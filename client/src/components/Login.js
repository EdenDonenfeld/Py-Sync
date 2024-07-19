// src/components/Login.js

import React, { useState, useRef } from 'react';
import './Style.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    const login = async () => {
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;

        console.log("Username: ", username);
        console.log("Password: ", password);

        const saltResponse = await fetch('/get-salt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        
        const { salt } = await saltResponse.json();

        console.log("SALT: ", salt);

        if (salt) {
            const hashedPassword = await hashPassword(password, salt);
            console.log("HASHED PASSWORD: ", hashedPassword);
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, hashedPassword })
            });

            const data = await response.json();
            console.log("DATA: ", data);

            if (data.success) {
                window.location.href = '/room-code';
            } else {
                console.error('Login failed: ', data.message);
            }
        } else {
            console.error('User not found');
        }
    };


    const hashPassword = async (password, salt) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const registerButton = () => {
        window.location.href = "/register";
    };

    const joinButton = async (event) => {
        event.preventDefault();
        await login();
    };

    return (
        <div class="login">
            <h1 class="header">PySync</h1>
            <p class="header-text">Code Python Together</p>
            <form class="login-info" action="/login" method="post">
                <input ref={usernameRef} class="username" type="text" name="username" placeholder="Username" required />
                <input ref={passwordRef} class="password" type="password" name="password" placeholder="Password" required />
                <button type="button" class="register-text" onClick={registerButton}>Don't have an account? Register</button>
                <button class="join" type="submit" onClick={joinButton}>Join</button>
            </form>
        </div>
    );
}

export default Login;
