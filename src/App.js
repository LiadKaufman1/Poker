import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './index.css';

// חיבור לשרת - ניתן לשנות את ה-URL לפי הצורך (בפרודקשן צריך להיות הכתובת האמיתית)
const SOCKET_URL = 'https://poker-newnew.onrender.com';
const socket = io(SOCKET_URL);

// Google Client ID
const GOOGLE_CLIENT_ID = '123250047088-jllcujs59cej75f3u16s3jgmmovsp663.apps.googleusercontent.com';

function App() {
  const [gameState, setGameState] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [serverStats, setServerStats] = useState({ activeRooms: 0, totalRoomsCreated: 0 });

  // User Authentication State
  const [user, setUser] = useState(null); // { _id, name, picture, stats }

  useEffect(() => {
    // מאזינים לאירועים מהשרת

    socket.on('room-created', ({ roomCode, room, adminSecret }) => {
      setRoomCode(roomCode);
      setRoom(room);
      setGameState('game');
      setError('');

      // Save admin secret for reconnection
      if (adminSecret) {
        localStorage.setItem(`poker_admin_${roomCode}`, adminSecret);
      }
    });

    socket.on('room-updated', (updatedRoom) => {
      setRoom(updatedRoom);
      // תיקון: אם אנחנו מקבלים עדכון חדר ועדיין בלובי, סימן שהצטרפנו בהצלחה
      setGameState(currentState => {
        if (currentState === 'lobby') {
          // שומרים נתונים לחיבור מחדש
          localStorage.setItem('poker_current_room', updatedRoom.code);
          const currentPlayer = updatedRoom.players.find(p => p.id === socket.id);
          if (currentPlayer) {
            localStorage.setItem('poker_player_name', currentPlayer.name);
          }
          return 'game';
        }
        return currentState;
      });
    });

    socket.on('error', (errMsg) => {
      setError(errMsg);
      // אחרי 10 שניות מנקים את השגיאה
      setTimeout(() => setError(''), 10000);
    });

    socket.on('stats-update', (stats) => {
      setServerStats(stats);
    });

    socket.on('login-success', (userData) => {
      setUser(userData);
      localStorage.setItem('poker_session_token', userData.sessionToken);
    });

    socket.on('session-expired', () => {
      console.log('Session expired');
      localStorage.removeItem('poker_session_token');
      setUser(null);
    });

    socket.on('room-closed', () => {
      setGameState('lobby');
      setRoomCode('');
      setPlayerName('');
      setRoom(null);
      localStorage.removeItem('poker_current_room');
      localStorage.removeItem('poker_player_name');
      alert('החדר נסגר על ידי המנהל');
    });

    return () => {
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('error');
      socket.off('stats-update');
      socket.off('room-closed');
      socket.off('login-success');
      socket.off('session-expired');
    };
  }, []);

  useEffect(() => {
    // 1. Try to restore session
    const sessionToken = localStorage.getItem('poker_session_token');
    if (sessionToken) {
      console.log('Found session token, attempting auto-login...');
      socket.emit('login-session', sessionToken);
    }

    // 2. Check for Room URL
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    if (roomParam) {
      setRoomCode(roomParam);
    } else {
      // 3. Fallback: Check for active room in LocalStorage
      const savedRoom = localStorage.getItem('poker_current_room');
      const savedName = localStorage.getItem('poker_player_name');

      if (savedRoom && savedName) {
        setRoomCode(savedRoom);
        setPlayerName(savedName);
        console.log('Attemping auto-reconnect to', savedRoom);
        const adminSecret = localStorage.getItem(`poker_admin_${savedRoom}`);
        socket.emit('join-room', { roomCode: savedRoom, playerName: savedName, adminSecret });
      }
    }
  }, []);

  const handleCreateGame = (newPlayerName) => {
    setPlayerName(newPlayerName);
    socket.emit('create-room', newPlayerName);
  };

  const handleJoinGame = (existingRoomCode, newPlayerName) => {
    setPlayerName(newPlayerName);
    setRoomCode(existingRoomCode); // Fix: Ensure state is updated so GameRoom receives it
    const adminSecret = localStorage.getItem(`poker_admin_${existingRoomCode}`);
    socket.emit('join-room', { roomCode: existingRoomCode, playerName: newPlayerName, adminSecret });
  };

  const handleUpdatePlayer = (playerNameToUpdate, updates) => {
    socket.emit('update-player', { roomCode, playerName: playerNameToUpdate, updates });
  };

  const handleUpdateGameSettings = (newSettings) => {
    socket.emit('update-game-settings', { roomCode, newSettings });
  };

  const handleLeaveGame = () => {
    const isAdmin = room && room.adminId === socket.id;

    if (isAdmin) {
      if (window.confirm('האם אתה בטוח שברצונך לסגור את החדר לכולם?')) {
        socket.emit('close-room');
        // Client cleanup happens in 'room-closed' listener or immediately here
        setGameState('lobby');
        setRoomCode('');
        setPlayerName('');
        setRoom(null);
        localStorage.removeItem('poker_current_room');
        localStorage.removeItem('poker_player_name');
      }
    } else {
      if (window.confirm('האם אתה בטוח שברצונך לעזוב את המשחק?')) {
        socket.emit('leave-room');
        setGameState('lobby');
        setRoomCode('');
        setPlayerName('');
        setRoom(null);
        localStorage.removeItem('poker_current_room');
        localStorage.removeItem('poker_player_name');
      }
    }
  };

  // בדיוק כפי שהיה, רק עם טיפול בשגיאות
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App relative bg-gray-900 min-h-screen font-sans text-right" dir="rtl">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
            {error}
          </div>
        )}

        {gameState === 'lobby' ? (
          <Lobby
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            initialRoomCode={roomCode}
            stats={serverStats}
            user={user}
            socket={socket}
          />
        ) : room ? (
          <GameRoom
            roomCode={roomCode}
            playerName={playerName}
            isAdmin={room.adminId === socket.id}
            adminId={room.adminId}
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
    </GoogleOAuthProvider>
  );
}

export default App;