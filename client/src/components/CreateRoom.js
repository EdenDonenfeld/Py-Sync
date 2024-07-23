import React, { useRef, useEffect, useState } from 'react';
import './Style.css';

function CreateRoom() {
    const [roomCode, setRoomCode] = useState('');
    const [fileName, setFileName] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const roomCodeInputRef = useRef(null);
    const fileNameInputRef = useRef(null);
    const roomPasswordInputRef = useRef(null);

    const checkRoomCode = async (roomCode) => {
        try {
            const response = await fetch(`/check-room/${roomCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log(data.roomAvailable);
            return data.roomAvailable;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    };

    const checkFileName = (fileName) => {
        if (fileName.endsWith('.py')) {
            fileName = fileName.slice(0, -3); // Remove .py extension
        }
        // file name cannot be empty and contain only letters or underscores
        const regex = /^[a-zA-Z_]+$/;
        return regex.test(fileName) && fileName.length > 0;
    };

    const generateRoomCode = async () => {
        let flag = false;
        let generatedRoomCode;
        while (!flag) {
            generatedRoomCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // Ensure 6 digits
            flag = await checkRoomCode(generatedRoomCode);
            if (!flag) break; // If room is not found, we can use this code
        }
        return generatedRoomCode;
    };

    const generateRoomPassword = () => {
        return Math.random().toString(36).slice(-8);
    };

    useEffect(() => {
        const roomCodeInputElement = roomCodeInputRef.current;
        setRoomPassword(generateRoomPassword());

        const handleRoomCodeInput = (event) => {
            let value = event.target.value;
            let formattedValue = value.replace(/\D/g, '').substring(0, 6); // Trim the input to 6 characters
            event.target.value = formattedValue;
            setRoomCode(formattedValue);
        };

        roomCodeInputElement.addEventListener('input', handleRoomCodeInput);

        return () => {
            roomCodeInputElement.removeEventListener('input', handleRoomCodeInput);
        };
    }, []);

    const handleGenerateButtonClick = async () => {
        const generatedRoomCode = await generateRoomCode();
        console.log(`Room Code: ${generatedRoomCode}`);
        setRoomCode(generatedRoomCode);
        roomCodeInputRef.current.value = generatedRoomCode; // Update the input field with the new room code
    };

    const handleCreateButtonClick = async (event) => {
        event.preventDefault();
        if (roomCode.length === 0) {
            setErrorMessage('Room code must be 6 digits');
            return;
        }

        if (!checkFileName(fileName)) {
            setErrorMessage('File name must contain only letters or underscores');
            return;
        }

        let flag = await checkRoomCode(roomCode);
        if (!flag) {
            setErrorMessage('Room code already exists');
            return;
        }

        try {
            const response = await fetch(`/add-to-room/${roomCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName, roomPassword })
            });
            const data = await response.json();
            console.log('Create room response:', data);
            if (data.success) {
                console.log('Creating room with code:', roomCode);
                window.location.href = `/room/${roomCode}`;
            } else {
                setErrorMessage('Room code must be 6 digits');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="room-code">
            <h1 className="header">PySync</h1>
            <p className="header-text">Code Python Together</p>
            <form className="room-code-info" action="/room-code" method="post">
                <input
                    ref={fileNameInputRef}
                    className="file-name-input"
                    type="text"
                    name="file-name"
                    placeholder="File name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    required
                />
                <input
                    ref={roomCodeInputRef}
                    className="room-code-input"
                    type="text"
                    name="room-code"
                    placeholder="Room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    required
                />
                <input
                    ref={roomPasswordInputRef}
                    className="room-password-input"
                    type="text"
                    name="room-password"
                    placeholder="Room password"
                    value={roomPassword}
                    disabled
                />
                <button
                    className="generate-room-code-text"
                    type="button"
                    id="gen-room-code"
                    onClick={handleGenerateButtonClick}
                >
                    Generate Room Code
                </button>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button
                    className="create"
                    type="submit"
                    onClick={handleCreateButtonClick}
                >
                    Create
                </button>
            </form>
        </div>
    );
}

export default CreateRoom;
