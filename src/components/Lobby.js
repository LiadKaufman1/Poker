import React, { useState } from 'react';
import { generateRoomCode } from '../utils/settlementLogic';

const Lobby = ({ onJoinGame, onCreateGame, initialRoomCode }) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // עדכון קוד החדר אם הוא מגיע ב-props (מה-URL)
  React.useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert('אנא הכנס שם שחקן');
      return;
    }

    setIsCreating(true);
    onCreateGame(playerName.trim());
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('אנא הכנס שם שחקן');
      return;
    }

    if (!roomCode.trim()) {
      alert('אנא הכנס קוד חדר');
      return;
    }

    onJoinGame(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-poker-green-400 mb-2 drop-shadow-lg text-center">
            ניהול משחקי פוקר ביתיים
          </h1>
        </div>

        <div className="space-y-6">
          <div className="card">
            <label className="block text-sm font-medium mb-2">
              שם השחקן
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input-field"
              placeholder="הכנס את שמך"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateGame}
              disabled={isCreating}
              className="w-full bg-poker-green-600 hover:bg-poker-green-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg"
            >
              {isCreating ? 'יוצר משחק...' : 'צור משחק חדש'}
            </button>

            <div className="text-center text-gray-300">
              או
            </div>

            <div className="card">
              <label className="block text-sm font-medium mb-2">
                קוד חדר
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="input-field text-center text-lg tracking-wider"
                placeholder="ABCD12"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinGame}
              className="w-full bg-gray-700/80 hover:bg-gray-600/80 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors shadow-lg backdrop-blur-sm"
            >
              הצטרף למשחק
            </button>
          </div>
        </div>
      </div>
      <footer className="text-center p-4 text-gray-400 text-lg mt-12">
        <p>פותח על ידי Liad Kaufman</p>
      </footer>
    </div>
  );
};

export default Lobby;