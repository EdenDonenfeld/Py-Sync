import React, { useRef, useEffect, useState } from 'react';
import './Style.css';

function RoomCode() {
    const [roomCode, setRoomCode] = useState('');
    const roomCodeInputRef = useRef(null);

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

    useEffect(() => {
        const roomCodeInputElement = roomCodeInputRef.current;

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

    const handleJoinButtonClick = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`/join-room/${roomCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log('Join room response:', data);
            if (data.success) {
                console.log('Joining room with code:', roomCode);
                window.location.href = `/room/${roomCode}`;
            } else {
                console.log('Room code is not available or invalid');
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
                    ref={roomCodeInputRef}
                    className="room-code-input"
                    type="text"
                    name="room-code"
                    placeholder="Room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    required
                />
                <button
                    className="generate-room-code-text"
                    type="button"
                    id="gen-room-code"
                    onClick={handleGenerateButtonClick}
                >
                    Generate Room Code
                </button>
                <button
                    className="join"
                    type="submit"
                    onClick={handleJoinButtonClick}
                >
                    Join
                </button>
            </form>
        </div>
    );
}

export default RoomCode;
