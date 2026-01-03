import React from 'react';

const StatsDashboard = ({ user, onClose }) => {
    if (!user || !user.stats) return null;

    // Ensure default values if fields are missing (backwards compatibility)
    const stats = {
        totalProfit: user.stats.totalProfit || 0,
        gamesPlayed: user.stats.gamesPlayed || 0,
        wins: user.stats.wins || 0,
        bestSession: user.stats.bestSession || 0,
        worstSession: user.stats.worstSession || 0,
        totalBuyInsAmount: user.stats.totalBuyInsAmount || 0,
        totalRebuysCount: user.stats.totalRebuysCount || 0,
        currentStreak: user.stats.currentStreak || 0,
        lastPlayed: user.stats.lastPlayed
    };

    const history = user.history || [];

    // Derived Calcs
    const wonGames = stats.wins;
    const lostGames = stats.gamesPlayed - wonGames;
    const winRate = stats.gamesPlayed > 0 ? Math.round((wonGames / stats.gamesPlayed) * 100) : 0;

    const avgProfit = stats.gamesPlayed > 0 ? Math.round(stats.totalProfit / stats.gamesPlayed) : 0;
    const avgBuyIn = stats.gamesPlayed > 0 ? Math.round(stats.totalBuyInsAmount / stats.gamesPlayed) : 0;
    const avgRebuys = stats.gamesPlayed > 0 ? (stats.totalRebuysCount / stats.gamesPlayed).toFixed(1) : 0;

    // ROI: (Total Profit / Total Invested) * 100. Invested approx = Total Profit - (Cashout... actually we need TotalBuyInsAmount tracked)
    // If we only tracked profit, we can't get exact ROI without Total Buy In. 
    // Lucky we added totalBuyInsAmount to schema. 
    const roi = stats.totalBuyInsAmount > 0
        ? Math.round((stats.totalProfit / stats.totalBuyInsAmount) * 100)
        : 0;

    // Trend Sparkline Data (Last 10 games)
    const trendData = history.slice(-10).map(h => h.profit);

    // Simple Sparkline Render
    const Sparkline = ({ data }) => {
        if (!data || data.length < 2) return <div className="text-xs text-gray-500">אין מספיק נתונים לגרף</div>;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const height = 40;
        const width = 100;

        // Normalize points
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height; // Invert Y
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <polyline
                    points={points}
                    fill="none"
                    stroke={data[data.length - 1] >= 0 ? "#4ade80" : "#ef4444"} // Green/Red based on last result
                    strokeWidth="2"
                />
                {/* Dot on last point */}
                <circle
                    cx={width}
                    cy={height - ((data[data.length - 1] - min) / range) * height}
                    r="3"
                    fill={data[data.length - 1] >= 0 ? "#4ade80" : "#ef4444"}
                />
            </svg>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">📊</span> הסטטיסטיקות שלי
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">
                        &times;
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Main Financials */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                            <div className="text-sm text-gray-400 mb-1">רווח כולל</div>
                            <div className={`text-3xl font-mono font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stats.totalProfit > 0 ? '+' : ''}{stats.totalProfit} ₪
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                            <div className="text-sm text-gray-400 mb-1">רווח ממוצע למשחק</div>
                            <div className={`text-2xl font-mono font-bold ${avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {avgProfit > 0 ? '+' : ''}{avgProfit} ₪
                            </div>
                        </div>
                    </div>

                    {/* Deep Stats Grid */}
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">נתוני עומק</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* ROI */}
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-500 mb-1">ROI (החזר השקעה)</div>
                            <div className={`text-lg font-bold ${roi >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {roi}%
                            </div>
                        </div>

                        {/* Best Session */}
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-500 mb-1">הזכייה הגדולה ביותר</div>
                            <div className="text-lg font-bold text-green-400">
                                {stats.bestSession > -900000 ? `+${stats.bestSession} ₪` : '-'}
                            </div>
                        </div>

                        {/* Worst Session */}
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-500 mb-1">ההפסד הכואב ביותר</div>
                            <div className="text-lg font-bold text-red-400">
                                {stats.worstSession < 900000 ? `${stats.worstSession} ₪` : '-'}
                            </div>
                        </div>

                        {/* Streak */}
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-500 mb-1">רצף נוכחי</div>
                            <div className="text-lg font-bold text-white flex items-center gap-1">
                                {stats.currentStreak > 0
                                    ? <><span className="text-orange-500">🔥</span> {stats.currentStreak} W</>
                                    : stats.currentStreak < 0
                                        ? <><span className="text-blue-300">🧊</span> {Math.abs(stats.currentStreak)} L</>
                                        : '0'}
                            </div>
                        </div>
                    </div>

                    {/* Play Style */}
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">סגנון משחק</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50 text-center">
                            <div className="text-xs text-gray-500">אחוז ניצחונות</div>
                            <div className="text-xl font-bold text-white mt-1">{winRate}%</div>
                            <div className="text-[10px] text-gray-600">{wonGames}W - {lostGames}L</div>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50 text-center">
                            <div className="text-xs text-gray-500">כניסה ממוצעת</div>
                            <div className="text-xl font-bold text-white mt-1">{avgBuyIn} ₪</div>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700/50 text-center">
                            <div className="text-xs text-gray-500">Rebuys בממוצע</div>
                            <div className="text-xl font-bold text-white mt-1">{avgRebuys}</div>
                        </div>
                    </div>

                    {/* History Trend */}
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <div className="text-sm text-gray-400">מגמת רווח (10 משחקים אחרונים)</div>
                            {history.length > 0 && (
                                <div className={`text-xs font-bold ${history[history.length - 1].profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    אחרון: {history[history.length - 1].profit} ₪
                                </div>
                            )}
                        </div>
                        <div className="h-12 w-full">
                            <Sparkline data={trendData} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
