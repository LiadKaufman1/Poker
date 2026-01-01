// פתרון זמני עם JSONBin.io (חינם)
const API_KEY = '$2a$10$demo.key.replace.with.real';
const BIN_ID = '64f8b2c8b89b1e2280d4c8a1';

export const saveRoomData = async (roomCode, roomData) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify({
        [roomCode]: {
          ...roomData,
          lastUpdated: Date.now()
        }
      })
    });
    return response.ok;
  } catch (error) {
    console.error('שגיאה בשמירה:', error);
    return false;
  }
};

export const loadRoomData = async (roomCode) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    const data = await response.json();
    return data.record[roomCode] || null;
  } catch (error) {
    console.error('שגיאה בטעינה:', error);
    return null;
  }
};