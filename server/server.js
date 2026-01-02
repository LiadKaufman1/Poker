const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Poker Server is running');
});

// מאחסן את כל החדרים
const rooms = new Map();

// יצירת קוד חדר ייחודי
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('שחקן התחבר:', socket.id);

  // יצירת חדר חדש
  socket.on('create-room', (playerName) => {
    const roomCode = generateRoomCode();
    const adminSecret = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2); // Secret token
    const room = {
      code: roomCode,
      adminId: socket.id, // Creator is the admin
      adminSecret,        // Secret to reclaim admin rights
      players: [{
        id: socket.id,
        name: playerName,
        buyIns: [],
        cashOut: undefined
      }],
      gameSettings: {
        chipRatio: { shekel: 1, chips: 1 }
      }
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    // Send secret ONLY to the creator (in the callback/response)
    socket.emit('room-created', { roomCode, room, adminSecret });
    console.log(`חדר ${roomCode} נוצר על ידי ${playerName} (Admin Secret generated)`);
  });

  // הצטרפות לחדר
  socket.on('join-room', ({ roomCode, playerName, adminSecret }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', 'חדר לא נמצא');
      return;
    }

    // בדיקה אם השחקן כבר קיים
    const existingPlayer = room.players.find(p => p.name === playerName);

    if (existingPlayer) {
      // עדכון ID של שחקן קיים
      existingPlayer.id = socket.id;
    } else {
      // הוספת שחקן חדש
      room.players.push({
        id: socket.id,
        name: playerName,
        buyIns: [],
        cashOut: undefined
      });
    }

    // בדיקה אם השחקן הוא האדמין (reclaim via secret)
    if (adminSecret && room.adminSecret === adminSecret) {
      room.adminId = socket.id;
      console.log(`Admin reclaimed room ${roomCode} via secret`);
    }

    socket.join(roomCode);
    socket.roomCode = roomCode;

    // שליחת עדכון לכל השחקנים בחדר
    io.to(roomCode).emit('room-updated', room);
    console.log(`${playerName} הצטרף לחדר ${roomCode}`);
  });

  // עדכון שחקן
  socket.on('update-player', ({ playerName, updates }) => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);

    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        Object.assign(player, updates);
        io.to(roomCode).emit('room-updated', room);
      }
    }
  });

  // עדכון הגדרות משחק
  socket.on('update-game-settings', (newSettings) => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);

    if (room) {
      Object.assign(room.gameSettings, newSettings);
      io.to(roomCode).emit('room-updated', room);
    }
  });

  // התנתקות
  socket.on('disconnect', () => {
    console.log('שחקן התנתק:', socket.id);

    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        // לא מוחקים את השחקן, רק מעדכנים שהוא לא מחובר
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.id = null; // מסמן שהשחקן לא מחובר
        }

        io.to(socket.roomCode).emit('room-updated', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server רץ על פורט ${PORT}`);
});