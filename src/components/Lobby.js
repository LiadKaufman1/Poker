import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { generateRoomCode } from '../utils/settlementLogic';

const Lobby = ({ onJoinGame, onCreateGame, initialRoomCode, stats, user, socket }) => {
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

  const handleGoogleLoginSuccess = (credentialResponse) => {
    console.log('Google Login Success:', credentialResponse);
    socket.emit('login-google', credentialResponse.credential);
  };

  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-poker-green-400 mb-2 drop-shadow-lg text-center">
            ניהול משחקי פוקר ביתיים
          </h1>
          {stats && (
            <div className="flex justify-center gap-4 text-xs text-gray-400 mt-2 mb-4">
              <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                סה"כ חדרים שנפתחו: <span className="text-white font-bold">{stats.totalRoomsCreated}</span>
              </div>
              <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                חדרים פעילים כרגע: <span className="text-green-400 font-bold">{stats.activeRooms}</span>
              </div>
            </div>
          )}

          {/* User Profile & Login Section */}
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-sm">
            {!user ? (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-300 mb-3">התחבר כדי לשמור סטטיסטיקות והיסטוריית משחקים</p>
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    alert('התחברות נכשלה');
                  }}
                  theme="filled_black"
                  shape="pill"
                  text="signin_with"
                  locale="he"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full border-2 border-poker-green-500" />
                  <div className="text-right">
                    <h3 className="font-bold text-white">{user.name}</h3>
                    <p className="text-xs text-green-400">מחובר</p>
                  </div>
                </div>
                <div className="text-left rtl:text-right bg-gray-900/80 p-2 rounded-lg border border-gray-700 min-w-[100px]">
                  <div className="text-xs text-gray-400">רווח מצטבר</div>
                  <div className={`font-mono font-bold ${user.stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {user.stats.totalProfit > 0 ? '+' : ''}{user.stats.totalProfit} ₪
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    משחקים: {user.stats.gamesPlayed}
                  </div>
                </div>
              </div>
            )}
          </div>
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

      <div className="mt-8 text-center space-y-4">
        <a
          href="https://links.payboxapp.com/eKFtZLBgBZb"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg"
        >
          <span>נהניתם? פרגנו</span>
          <span className="text-xl">🍺</span>
        </a>
        <footer className="text-gray-400 text-lg">
          <p>עיצוב ופיתוח: Liad Kaufman</p>
        </footer>
      </div>
    </div >
  );
};

export default Lobby;