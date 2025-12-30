import { calculateSettlement } from '../utils/settlementLogic';

// דוגמה לבדיקת האלגוריתם
const testSettlement = () => {
  console.log('🧪 בדיקת אלגוריתם ההתחשבנות');
  
  // דוגמה 1: משחק פשוט עם יחס 1:1
  const players1 = [
    { 
      name: 'אלי', 
      buyIns: [{ amount: 100, type: 'cash' }], 
      cashOut: 150 
    },    // רווח 50
    { 
      name: 'דני', 
      buyIns: [{ amount: 100, type: 'bit' }], 
      cashOut: 80 
    },     // הפסד 20
    { 
      name: 'חיים', 
      buyIns: [{ amount: 100, type: 'cash' }], 
      cashOut: 70 
    }     // הפסד 30
  ];

  const gameSettings1 = { chipRatio: { shekel: 1, chips: 1 } };
  const result1 = calculateSettlement(players1, gameSettings1);
  console.log('\n📊 דוגמה 1 - משחק פשוט (יחס 1:1):');
  console.log('שחקנים:', result1.players.map(p => `${p.name}: ${p.net > 0 ? '+' : ''}${p.net}`));
  console.log('העברות:', result1.transactions.map(t => `${t.from} → ${t.to}: ₪${t.amount} (${t.paymentMethod.description})`));
  console.log('מאוזן:', result1.isBalanced);

  // דוגמה 2: משחק עם יחס 1:2 (שקל אחד = 2 צ'יפים)
  const players2 = [
    { 
      name: 'אבי', 
      buyIns: [{ amount: 100, type: 'cash' }, { amount: 50, type: 'bit' }], 
      cashOut: 400  // 400 צ\'יפים = 200 שקל
    },  // רווח 50
    { 
      name: 'בני', 
      buyIns: [{ amount: 100, type: 'cash' }], 
      cashOut: 240  // 240 צ\'יפים = 120 שקל
    },      // רווח 20
    { 
      name: 'גיל', 
      buyIns: [{ amount: 100, type: 'bit' }], 
      cashOut: 160  // 160 צ\'יפים = 80 שקל
    },       // הפסד 20
    { 
      name: 'דוד', 
      buyIns: [{ amount: 100, type: 'cash' }, { amount: 100, type: 'bit' }], 
      cashOut: 260  // 260 צ\'יפים = 130 שקל
    }  // הפסד 70
  ];

  const gameSettings2 = { chipRatio: { shekel: 1, chips: 2 } };
  const result2 = calculateSettlement(players2, gameSettings2);
  console.log('\n📊 דוגמה 2 - משחק עם יחס 1:2:');
  console.log('שחקנים:', result2.players.map(p => `${p.name}: ${p.net > 0 ? '+' : ''}${p.net} (${p.cashOut} צ\'יפים = ₪${p.cashOutInShekel})`));
  console.log('העברות:', result2.transactions.map(t => `${t.from} → ${t.to}: ₪${t.amount} (${t.paymentMethod.description})`));
  console.log('מאוזן:', result2.isBalanced);
  console.log('סה"כ העברות:', result2.summary.totalTransactions);
  console.log('יחס צ\'יפים:', result2.summary.chipRatio);

  // דוגמה 3: משחק לא מאוזן
  const players3 = [
    { 
      name: 'רון', 
      buyIns: [{ amount: 100, type: 'cash' }], 
      cashOut: 150 
    },
    { 
      name: 'שי', 
      buyIns: [{ amount: 100, type: 'bit' }], 
      cashOut: 80 
    }
  ];

  const gameSettings3 = { chipRatio: { shekel: 1, chips: 1 } };
  const result3 = calculateSettlement(players3, gameSettings3);
  console.log('\n📊 דוגמה 3 - משחק לא מאוזן:');
  console.log('שחקנים:', result3.players.map(p => `${p.name}: ${p.net > 0 ? '+' : ''}${p.net}`));
  console.log('מאוזן:', result3.isBalanced);
  console.log('הפרש:', result3.discrepancy);
};

// הפעלת הבדיקות
testSettlement();

export default testSettlement;