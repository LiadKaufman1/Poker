import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './index.css';

// שימוש ב-localStorage עם polling לסנכרון
function App() {
  const [gameState, setGameState] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(null);

  // פונקציה לשמירה ב-localStorage עם timestamp
  const saveRoomData = (roomCode, roomData) => {
    const data = {
      ...roomData,
      lastUpdated: Date.now()
    };
    localStorage.setItem(`poker-room-${roomCode}`, JSON.stringify(data));
  };

  // פונקציה לטעינת נתוני חדר
  const loadRoomData = (roomCode) => {
    const data = localStorage.getItem(`poker-room-${roomCode}`);
    return data ? JSON.parse(data) : null;
  };

  // polling לעדכונים כל שנייה
  useEffect(() => {
    if (gameState === 'game' && roomCode) {
      const interval = setInterval(() => {
        const updatedRoom = loadRoomData(roomCode);
        if (updatedRoom && updatedRoom.lastUpdated > (room?.lastUpdated || 0)) {
          setRoom(updatedRoom);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState, roomCode, room?.lastUpdated]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGame = (newPlayerName) => {
    const newRoomCode = generateRoomCode();
    const newRoom = {
      code: newRoomCode,
      players: [{
        name: newPlayerName,
        buyIns: [],
        cashOut: undefined
      }],
      gameSettings: {
        chipRatio: { shekel: 1, chips: 1 }
      },
      lastUpdated: Date.now()
    };
    
    setRoomCode(newRoomCode);
    setPlayerName(newPlayerName);
    setRoom(newRoom);
    setGameState('game');
    saveRoomData(newRoomCode, newRoom);
  };

  const handleJoinGame = (existingRoomCode, newPlayerName) => {
    let existingRoom = loadRoomData(existingRoomCode);
    
    if (!existingRoom) {
      // יצירת חדר חדש אם לא קיים
      existingRoom = {
        code: existingRoomCode,
        players: [],
        gameSettings: {
          chipRatio: { shekel: 1, chips: 1 }
        },
        lastUpdated: Date.now()
      };
    }

    // בדיקה אם השחקן כבר קיים
    const existingPlayer = existingRoom.players.find(p => p.name === newPlayerName);
    
    if (!existingPlayer) {
      existingRoom.players.push({
        name: newPlayerName,
        buyIns: [],
        cashOut: undefined
      });
    }

    existingRoom.lastUpdated = Date.now();
    
    setRoomCode(existingRoomCode);
    setPlayerName(newPlayerName);
    setRoom(existingRoom);
    setGameState('game');
    saveRoomData(existingRoomCode, existingRoom);
  };

  const handleUpdatePlayer = (playerNameToUpdate, updates) => {
    if (!room) return;
    
    const updatedRoom = {
      ...room,
      players: room.players.map(player => 
        player.name === playerNameToUpdate 
          ? { ...player, ...updates }
          : player
      ),
      lastUpdated: Date.now()
    };
    
    setRoom(updatedRoom);
    saveRoomData(roomCode, updatedRoom);
  };

  const handleUpdateGameSettings = (newSettings) => {
    if (!room) return;
    
    const updatedRoom = {
      ...room,
      gameSettings: { ...room.gameSettings, ...newSettings },
      lastUpdated: Date.now()
    };
    
    setRoom(updatedRoom);
    saveRoomData(roomCode, updatedRoom);
  };

  const handleLeaveGame = () => {
    setGameState('lobby');
    setRoomCode('');
    setPlayerName('');
    // לא מוחקים את השחקנים כדי לאפשר חזרה
  };

  return (
    <div className="App">
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