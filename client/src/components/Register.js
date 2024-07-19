// src/components/Register.js

import React, { useState, useRef } from 'react';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const generateSalt = (length = 16) => {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    const hashPassword = async (password, salt) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const checkUsernameAndPassword = (username, password) => {
        if (username.length < 6) {
            return 'Username must be at least 6 characters long';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    }

    const register = async () => {
        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        const confirmPassword = confirmPasswordRef.current.value;

        const error = checkUsernameAndPassword(username, password);
        if (error) {
            console.error(error);
            return NaN;
        }

        if (password !== confirmPassword) {
            console.error('Passwords do not match');
            return NaN;
        }

        const salt = generateSalt();
        const hashedPassword = await hashPassword(password, salt);
        return { username, hashedPassword, salt };
    };

    const loginButton = () => {
        window.location.href = "/login";
    };

    const joinButton = async (event) => {
        event.preventDefault();

        try {
            const registerObj = await register();
            if (registerObj) {
                const { username, hashedPassword, salt } = registerObj;

                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, hashedPassword, salt })
                });

                const data = await response.json();
                console.log(data);
                if (data.success) {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };


    return (
        <div class="register">
            <h1 class="header">PySync</h1>
            <p class="header-text">Code Python Together</p>
            <form class="register-info" action="/register" method="post">
                <input ref={usernameRef}class="username" type="text" name="username" placeholder="Username" required />
                <input ref={passwordRef} class="password" type="password" name="password" placeholder="Password" required />
                <input ref={confirmPasswordRef} class="confirm-password" type="password" name="confirm-password" placeholder="Confirm Password" required />
                <button type="button" class="login-text" onClick={loginButton}>Have an account? Login</button>
                <button class="join" type="submit" onClick={joinButton}>Join</button>
            </form>
        </div>
    );
}

export default Register;
