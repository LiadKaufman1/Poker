import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './index.css';

// חיבור לשרת - ניתן לשנות את ה-URL לפי הצורך (בפרודקשן צריך להיות הכתובת האמיתית)
const SOCKET_URL = 'https://poker-newnew.onrender.com';
const socket = io(SOCKET_URL);

function App() {
  const [gameState, setGameState] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // מאזינים לאירועים מהשרת

    socket.on('room-created', ({ roomCode, room }) => {
      setRoomCode(roomCode);
      setRoom(room);
      setGameState('game');
      setError('');
    });

    socket.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('error', (errMsg) => {
      setError(errMsg);
      // אחרי 3 שניות מנקים את השגיאה
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('error');
    };
  }, []);

  const handleCreateGame = (newPlayerName) => {
    setPlayerName(newPlayerName);
    socket.emit('create-room', newPlayerName);
  };

  const handleJoinGame = (existingRoomCode, newPlayerName) => {
    setPlayerName(newPlayerName);
    socket.emit('join-room', { roomCode: existingRoomCode, playerName: newPlayerName });
  };

  const handleUpdatePlayer = (playerNameToUpdate, updates) => {
    socket.emit('update-player', { playerName: playerNameToUpdate, updates });
  };

  const handleUpdateGameSettings = (newSettings) => {
    socket.emit('update-game-settings', newSettings);
  };

  const handleLeaveGame = () => {
    setGameState('lobby');
    setRoomCode('');
    setPlayerName('');
    setRoom(null);
    // אופציונלי: לשלוח אירוע עזיבה לשרת אם רוצים
  };

  // בדיוק כפי שהיה, רק עם טיפול בשגיאות
  return (
    <div className="App relative">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {error}
        </div>
      )}

      {gameState === 'lobby' ? (
        <Lobby
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      ) : room ? (
        <GameRoom
          roomCode={roomCode}
          playerName={playerName}
          players={room.players}
          gameSettings={room.gameSettings}
          onUpdatePlayer={handleUpdatePlayer}
          onUpdateGameSettings={handleUpdateGameSettings}
          onLeaveGame={handleLeaveGame}
        />
      ) : (
        <div className="min-h-screen text-white flex items-center justify-center">
          <p>טוען...</p>
        </div>
      )}
    </div>
  );
}

export default App;