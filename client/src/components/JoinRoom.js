import React, { useRef, useEffect, useState } from 'react';
import './Style.css';

function JoinRoom() {
    const [roomCode, setRoomCode] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const roomCodeInputRef = useRef(null);
    const roomPasswordInputRef = useRef(null);

    const checkRoomCode = async (roomCode) => {
        try {
            const response = await fetch(`/check-room-joining/${roomCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roomPassword })
            });
            const data = await response.json();
            
            if (!data.roomAvailable) {
                setErrorMessage('Room code does not exist');
                return false;
            }
            else if (!data.password) {
                setErrorMessage('Incorrect password');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
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

    const handleJoinButtonClick = async (event) => {
        event.preventDefault();
        if (roomCode.length === 0) {
            setErrorMessage('Room code must be 6 digits');
            return;
        }

        if (roomPassword.length === 0) {
            setErrorMessage('Room password must not be empty');
            return;
        }

        let flag = await checkRoomCode(roomCode);

        if (!flag) {
            return;
        }

        try {
            const response = await fetch(`/add-to-room/${roomCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName: "", roomPassword })
            });
            const data = await response.json();
            if (data.success) {
                console.log('Joining room with code:', roomCode);
                window.location.href = `/room/${roomCode}`;
            } else {
                setErrorMessage(data.message);
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
                <input
                    ref={roomPasswordInputRef}
                    className="room-password-input"
                    type="text"
                    name="room-password"
                    placeholder="Room password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    required
                />
                {errorMessage && <p className="error-message">{errorMessage}</p>}
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

export default JoinRoom;
