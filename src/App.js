import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import { createDefaultGameSettings } from './utils/settlementLogic';
import './index.css';

function App() {
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'game'
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState(createDefaultGameSettings());

  // Load saved game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('pokerSettlerState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(parsed.gameState || 'lobby');
        setRoomCode(parsed.roomCode || '');
        setPlayerName(parsed.playerName || '');
        setPlayers(parsed.players || []);
        setGameSettings(parsed.gameSettings || createDefaultGameSettings());
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save game state to localStorage
  useEffect(() => {
    const stateToSave = {
      gameState,
      roomCode,
      playerName,
      players,
      gameSettings
    };
    localStorage.setItem('pokerSettlerState', JSON.stringify(stateToSave));
  }, [gameState, roomCode, playerName, players, gameSettings]);

  const handleCreateGame = (newRoomCode, newPlayerName) => {
    const newPlayer = {
      name: newPlayerName,
      buyIns: [],
      cashOut: undefined
    };

    setRoomCode(newRoomCode);
    setPlayerName(newPlayerName);
    setPlayers([newPlayer]);
    setGameSettings(createDefaultGameSettings());
    setGameState('game');
  };

  const handleJoinGame = (existingRoomCode, newPlayerName) => {
    // בגרסה פשוטה, נוסיף את השחקן לרשימה המקומית
    // בגרסה מלאה זה יהיה דרך Socket.io
    const existingPlayer = players.find(p => p.name === newPlayerName);
    
    if (existingPlayer) {
      // שחקן קיים - פשוט מתחבר
      setRoomCode(existingRoomCode);
      setPlayerName(newPlayerName);
      setGameState('game');
    } else {
      // שחקן חדש
      const newPlayer = {
        name: newPlayerName,
        buyIns: [],
        cashOut: undefined
      };

      setRoomCode(existingRoomCode);
      setPlayerName(newPlayerName);
      setPlayers(prev => [...prev, newPlayer]);
      setGameState('game');
    }
  };

  const handleUpdatePlayer = (playerNameToUpdate, updates) => {
    setPlayers(prev => 
      prev.map(player => 
        player.name === playerNameToUpdate 
          ? { ...player, ...updates }
          : player
      )
    );
  };

  const handleUpdateGameSettings = (newSettings) => {
    setGameSettings(prev => ({ ...prev, ...newSettings }));
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
      ) : (
        <GameRoom
          roomCode={roomCode}
          playerName={playerName}
          players={players}
          gameSettings={gameSettings}
          onUpdatePlayer={handleUpdatePlayer}
          onUpdateGameSettings={handleUpdateGameSettings}
          onLeaveGame={handleLeaveGame}
        />
      )}
    </div>
  );
}

export default App;