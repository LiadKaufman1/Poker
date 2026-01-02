import React, { useState, useEffect } from 'react';
import { calculateSettlement } from '../utils/settlementLogic';

const GameRoom = ({ roomCode, playerName, players, gameSettings, onUpdatePlayer, onUpdateGameSettings, onLeaveGame, isAdmin, adminId }) => {
  const [newBuyIn, setNewBuyIn] = useState('');
  const [buyInType, setBuyInType] = useState('cash');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chipRatio, setChipRatio] = useState(gameSettings.chipRatio);

  const currentPlayer = players.find(p => p.name === playerName);

  const handleAddBuyIn = () => {
    const amount = parseFloat(newBuyIn);
    if (isNaN(amount) || amount <= 0) {
      alert('אנא הכנס סכום תקין');
      return;
    }

    const newBuyInObj = {
      amount,
      type: buyInType,
      timestamp: new Date().toISOString()
    };

    const updatedBuyIns = [...(currentPlayer.buyIns || []), newBuyInObj];
    onUpdatePlayer(playerName, { buyIns: updatedBuyIns });
    setNewBuyIn('');
  };

  const handleCashOut = () => {
    const amount = parseFloat(cashOutAmount);
    if (isNaN(amount) || amount < 0) {
      alert('אנא הכנס סכום תקין');
      return;
    }

    onUpdatePlayer(playerName, { cashOut: amount });
    setCashOutAmount('');
  };

  const handleCalculateSettlement = () => {
    const playersWithCashOut = players.filter(p => p.cashOut !== undefined);
    if (playersWithCashOut.length === 0) {
      alert('אין שחקנים עם cash-out');
      return;
    }

    const result = calculateSettlement(players, gameSettings);
    setSettlement(result);
    setShowSettlement(true);
  };

  const handleUpdateChipRatio = () => {
    onUpdateGameSettings({ chipRatio });
    setShowSettings(false);
  };

  const getTotalBuyIn = (player) => {
    return (player.buyIns || []).reduce((sum, buyIn) => sum + buyIn.amount, 0);
  };

  const getBuyInsByType = (player, type) => {
    return (player.buyIns || []).filter(b => b.type === type).reduce((sum, b) => sum + b.amount, 0);
  };

  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="glass-effect rounded-lg p-2 w-[65%] mr-2">
            <h1 className="text-xl font-bold text-poker-green-400 drop-shadow-lg leading-tight">
              חדר: {roomCode}
            </h1>
            <div className="flex justify-between items-end mt-1">
              <span className="text-gray-200 text-lg font-medium">{playerName}</span>
              <span className="text-sm text-gray-400 ml-2">
                ₪{gameSettings.chipRatio.shekel} = {gameSettings.chipRatio.chips}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const url = `${window.location.protocol}//${window.location.host}?room=${roomCode}`;
                navigator.clipboard.writeText(url).then(() => alert('הקישור הועתק!'));
              }}
              className="bg-blue-600/80 hover:bg-blue-700/80 px-3 py-2 rounded text-sm backdrop-blur-sm mb-1"
            >
              שתף חדר
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-600/80 hover:bg-gray-700/80 px-3 py-2 rounded text-sm backdrop-blur-sm"
            >
              הגדרות
            </button>
            <button
              onClick={onLeaveGame}
              className="bg-red-600/80 hover:bg-red-700/80 px-4 py-2 rounded-lg text-sm backdrop-blur-sm"
            >
              עזוב
            </button>
          </div>
        </div>

        {!showSettlement && !showSettings ? (
          <>
            {/* Buy-in Section */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Buy-in</h2>

              {/* בחירת סוג תשלום */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setBuyInType('cash')}
                  className={`flex-1 py-2 px-4 rounded font-medium ${buyInType === 'cash'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  מזומן
                </button>
                <button
                  type="button"
                  onClick={() => setBuyInType('bit')}
                  className={`flex-1 py-2 px-4 rounded font-medium ${buyInType === 'bit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  BIT
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={newBuyIn}
                  onChange={(e) => setNewBuyIn(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="סכום בשקלים"
                />
                <button
                  onClick={handleAddBuyIn}
                  className="bg-poker-green-600 hover:bg-poker-green-700 px-4 py-2 rounded font-semibold"
                >
                  הוסף
                </button>
              </div>

              {currentPlayer && currentPlayer.buyIns && (
                <div className="text-sm">
                  <p className="text-gray-400 mb-2">Buy-ins שלך:</p>
                  <div className="space-y-1">
                    {currentPlayer.buyIns.map((buyIn, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-700 px-2 py-1 rounded">
                        <span>₪{buyIn.amount}</span>
                        <span className={`text-xs px-2 py-1 rounded ${buyIn.type === 'cash' ? 'bg-green-600' : 'bg-blue-600'
                          }`}>
                          {buyIn.type === 'cash' ? 'מזומן' : 'BIT'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-gray-700 rounded">
                    <p className="font-semibold">סה"כ: ₪{getTotalBuyIn(currentPlayer)}</p>
                    <div className="text-xs text-gray-300 mt-1">
                      <span>מזומן: ₪{getBuyInsByType(currentPlayer, 'cash')}</span>
                      <span className="ml-3">BIT: ₪{getBuyInsByType(currentPlayer, 'bit')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cash-out Section */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Cash-out</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="מספר צ'יפים"
                />
                <button
                  onClick={handleCashOut}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                >
                  עדכן
                </button>
              </div>

              {currentPlayer && currentPlayer.cashOut !== undefined && (
                <div className="text-sm bg-gray-700 p-2 rounded">
                  <p>צ'יפים: <span className="font-semibold">{currentPlayer.cashOut}</span></p>
                  <p>שווי בשקלים: <span className="font-semibold">
                    ₪{Math.round((currentPlayer.cashOut * gameSettings.chipRatio.shekel / gameSettings.chipRatio.chips) * 100) / 100}
                  </span></p>
                </div>
              )}
            </div>

            {/* Players List */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">שחקנים ({players.length})</h2>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium flex items-center gap-2">
                        {player.name}
                        {(adminId === player.id || index === 0) && <span className="text-xs text-yellow-400">👑</span>}
                      </span>
                      <span className="text-sm text-gray-300">
                        Buy-in: ₪{getTotalBuyIn(player)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 flex justify-between mb-2">
                      <div>
                        <span>מזומן: ₪{getBuyInsByType(player, 'cash')}</span>
                        <span className="ml-2">BIT: ₪{getBuyInsByType(player, 'bit')}</span>
                      </div>
                      {player.cashOut !== undefined && (
                        <span>
                          Cash-out: {player.cashOut} צ'יפים (₪{Math.round((player.cashOut * gameSettings.chipRatio.shekel / gameSettings.chipRatio.chips) * 100) / 100})
                        </span>
                      )}
                    </div>

                    {/* Admin Controls */}
                    {isAdmin && player.name !== playerName && (
                      <div className="mt-2 pt-2 border-t border-gray-600 grid grid-cols-2 gap-2">
                        <div className="col-span-2 text-xs text-gray-400 mb-1">ניהול מנהל:</div>

                        {/* Quick Add Buy-in */}
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="buy-in"
                            className="w-full bg-gray-800 rounded px-2 py-1 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const amount = parseFloat(e.target.value);
                                if (amount > 0) {
                                  const updatedBuyIns = [...(player.buyIns || []), {
                                    amount,
                                    type: 'bit', // Default to Bit for remote edits usually, or explicit?
                                    timestamp: new Date().toISOString()
                                  }];
                                  onUpdatePlayer(player.name, { buyIns: updatedBuyIns });
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Quick Cashout */}
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="cash-out"
                            className="w-full bg-gray-800 rounded px-2 py-1 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const amount = parseFloat(e.target.value);
                                if (!isNaN(amount)) {
                                  onUpdatePlayer(player.name, { cashOut: amount });
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="col-span-2 text-[10px] text-gray-500 text-center">
                          (לחץ Enter לשמירה. Buy-in ברירת מחדל: BIT)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculate Settlement Button */}
            <button
              onClick={handleCalculateSettlement}
              className="w-full bg-poker-green-600 hover:bg-poker-green-700 text-white font-semibold py-4 px-6 rounded-lg text-lg"
            >
              חשב התחשבנות
            </button>
          </>
        ) : showSettings ? (
          /* Settings Screen */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-poker-green-400">הגדרות משחק</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                חזור
              </button>
            </div>

            {/* Chip Ratio Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">יחס צ'יפים</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">שקלים</label>
                    <input
                      type="number"
                      value={chipRatio.shekel}
                      onChange={(e) => setChipRatio(prev => ({ ...prev, shekel: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="1"
                    />
                  </div>
                  <div className="text-2xl text-gray-400 mt-6">=</div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">צ'יפים</label>
                    <input
                      type="number"
                      value={chipRatio.chips}
                      onChange={(e) => setChipRatio(prev => ({ ...prev, chips: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      min="1"
                    />
                  </div>
                </div>

                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-300">
                    דוגמה: ₪{chipRatio.shekel} = {chipRatio.chips} צ'יפים
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    צ'יפ אחד שווה ₪{(chipRatio.shekel / chipRatio.chips).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={handleUpdateChipRatio}
                  className="w-full bg-poker-green-600 hover:bg-poker-green-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  שמור הגדרות
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Settlement Results */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-poker-green-400">התחשבנות</h2>
              <button
                onClick={() => setShowSettlement(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                חזור
              </button>
            </div>

            {/* Balance Check */}
            {settlement && (
              <>
                <div className={`p-4 rounded-lg ${settlement.isBalanced ? 'bg-green-900' : 'bg-red-900'}`}>
                  <p className="font-semibold">
                    {settlement.isBalanced ? '✅ המשחק מאוזן' : '❌ יש אי-התאמה'}
                  </p>
                  {!settlement.isBalanced && (
                    <p className="text-sm mt-1">
                      הפרש: ₪{settlement.discrepancy}
                    </p>
                  )}
                </div>

                {/* Transactions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">העברות נדרשות ({settlement.transactions.length})</h3>
                  {settlement.transactions.length === 0 ? (
                    <p className="text-gray-400">אין העברות נדרשות</p>
                  ) : (
                    <div className="space-y-3">
                      {settlement.transactions.map((transaction, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium text-red-400">{transaction.from}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium text-green-400">{transaction.to}</span>
                            </div>
                            <span className="font-bold text-lg">₪{transaction.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">אופן תשלום:</span>
                            <span className={`text-xs px-2 py-1 rounded ${transaction.paymentMethod.type === 'cash' ? 'bg-green-600' :
                              transaction.paymentMethod.type === 'mixed' ? 'bg-purple-600' : 'bg-blue-600'
                              }`}>
                              {transaction.paymentMethod.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">סיכום</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>סה"כ Buy-ins:</span>
                      <span>₪{settlement.summary.totalBuyIns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>סה"כ Cash-outs:</span>
                      <span>₪{settlement.summary.totalCashOuts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מספר העברות:</span>
                      <span>{settlement.summary.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>יחס צ'יפים:</span>
                      <span>{settlement.summary.chipRatio}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;