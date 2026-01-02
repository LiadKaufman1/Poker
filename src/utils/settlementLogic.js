/**
 * אלגוריתם התחשבנות פוקר - מחשב את המינימום העברות כסף
 * @param {Array} players - רשימת שחקנים עם buy-ins ו-cashouts
 * @param {Object} gameSettings - הגדרות המשחק (יחס צ'יפים)
 * @returns {Object} תוצאות ההתחשבנות
 */
export const calculateSettlement = (players, gameSettings = { chipRatio: { shekel: 1, chips: 1 } }) => {
  // חישוב נטו לכל שחקן (רווח/הפסד)
  const playersWithNet = players.map(player => {
    const totalBuyIn = player.buyIns.reduce((sum, buyIn) => sum + buyIn.amount, 0);
    const cashOutInShekel = (player.cashOut || 0) * gameSettings.chipRatio.shekel / gameSettings.chipRatio.chips;
    const net = cashOutInShekel - totalBuyIn; // חיובי = רווח, שלילי = הפסד

    return {
      ...player,
      totalBuyIn,
      cashOut: player.cashOut || 0,
      cashOutInShekel,
      net
    };
  });

  // בדיקת איזון (סכום כל הרווחים והפסדים צריך להיות 0)
  const totalNet = playersWithNet.reduce((sum, player) => sum + player.net, 0);
  const isBalanced = Math.abs(totalNet) < 0.01; // סובלנות לטעויות עיגול

  // הפרדה לזוכים ומפסידים
  const winners = playersWithNet.filter(p => p.net > 0.01).sort((a, b) => b.net - a.net);
  const losers = playersWithNet.filter(p => p.net < -0.01).sort((a, b) => a.net - b.net);

  // אלגוריתם מינימיזציה של העברות עם תמיכה בסוגי תשלום
  const transactions = [];
  const winnersCopy = winners.map(w => ({ ...w, remaining: w.net }));
  const losersCopy = losers.map(l => ({ ...l, remaining: Math.abs(l.net) }));

  let winnerIndex = 0;
  let loserIndex = 0;

  while (winnerIndex < winnersCopy.length && loserIndex < losersCopy.length) {
    const winner = winnersCopy[winnerIndex];
    const loser = losersCopy[loserIndex];

    const amount = Math.min(winner.remaining, loser.remaining);

    if (amount > 0.01) { // רק אם הסכום משמעותי
      // חישוב איך לשלם - לפי העדפות התשלום
      const paymentMethod = calculateOptimalPayment(loser, winner, amount);

      transactions.push({
        from: winner.name, // Inverted by user request
        to: loser.name,    // Inverted by user request
        amount: Math.round(amount * 100) / 100,
        paymentMethod
      });

      winner.remaining -= amount;
      loser.remaining -= amount;
    }

    // מעבר לשחקן הבא אם סיים
    if (winner.remaining < 0.01) winnerIndex++;
    if (loser.remaining < 0.01) loserIndex++;
  }

  return {
    players: playersWithNet,
    transactions,
    isBalanced,
    discrepancy: Math.round(totalNet * 100) / 100,
    gameSettings,
    summary: {
      totalBuyIns: playersWithNet.reduce((sum, p) => sum + p.totalBuyIn, 0),
      totalCashOuts: playersWithNet.reduce((sum, p) => sum + p.cashOutInShekel, 0),
      totalTransactions: transactions.length,
      chipRatio: `₪${gameSettings.chipRatio.shekel} = ${gameSettings.chipRatio.chips} צ'יפים`
    }
  };
};

/**
 * חישוב אופטימלי של אופן התשלום
 * @param {Object} payer - המשלם
 * @param {Object} receiver - המקבל
 * @param {number} amount - הסכום
 */
const calculateOptimalPayment = (payer, receiver, amount) => {
  // חישוב כמה כסף מזומן יש לכל אחד
  const payerCash = (payer.buyIns || []).filter(b => b.type === 'cash').reduce((sum, b) => sum + b.amount, 0);
  const receiverCash = (receiver.buyIns || []).filter(b => b.type === 'cash').reduce((sum, b) => sum + b.amount, 0);

  // אם למשלם יש מספיק מזומן ולמקבל יש מזומן - עדיף מזומן
  if (payerCash >= amount && receiverCash > 0) {
    return { type: 'cash', description: 'מזומן' };
  }

  // אחרת - BIT
  return { type: 'bit', description: 'BIT' };
};
/**
 * פונקציה לוולידציה של נתוני שחקן
 */
export const validatePlayer = (player) => {
  const errors = [];

  if (!player.name || player.name.trim().length === 0) {
    errors.push('שם השחקן נדרש');
  }

  if (!player.buyIns || player.buyIns.length === 0) {
    errors.push('נדרש לפחות buy-in אחד');
  }

  if (player.buyIns && player.buyIns.some(buyIn => buyIn.amount <= 0)) {
    errors.push('כל ה-buy-ins חייבים להיות חיוביים');
  }

  if (player.cashOut !== undefined && player.cashOut < 0) {
    errors.push('cash-out לא יכול להיות שלילי');
  }

  return errors;
};

/**
 * פונקציה ליצירת קוד חדר ייחודי
 */
export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * פונקציה ליצירת הגדרות משחק בסיסיות
 */
export const createDefaultGameSettings = () => {
  return {
    chipRatio: {
      shekel: 1,
      chips: 1
    }
  };
};