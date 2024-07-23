import React, { useRef, useEffect, useState } from 'react';
import './Style.css';

function RoomCode() {

    const handleCreateButtonClick = () => {
        window.location.href = '/room-code-create';
    }

    const handleJoinButtonClick = () => {
        window.location.href = '/room-code-join';
    }
    
    return (
        <div className="room-code">
            <h1 className="header">PySync</h1>
            <p className="header-text">Code Python Together</p>
            <button
                className="create create-room"
                type="submit"
                onClick={handleCreateButtonClick}
            >
                Create Room
            </button>

            <button
                className="join join-room"
                type="submit"
                onClick={handleJoinButtonClick}
            >
                Join Room
            </button>
        </div>
    );
}

export default RoomCode;
