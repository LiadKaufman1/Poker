const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

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

// MongoDB Connection
const uri = process.env.MONGO_URI;
if (uri) {
  console.log('Attempting to connect to MongoDB...');
  console.log('URI format check:', uri.replace(/:([^:@]{1,})@/, ':****@'));
} else {
  console.error('CRITICAL: MONGO_URI is missing!');
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  picture: String,
  sessionToken: String,
  sessionExpires: Date,
  stats: {
    totalProfit: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    lastPlayed: Date
  }
});
const User = mongoose.model('User', UserSchema);

const { OAuth2Client } = require('google-auth-library');
// Hardcoding the ID for certainty during debug
const CLIENT_ID = '123250047088-jllcujs59cej75f3u16s3jgmmovsp663.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verifying Google token:', error.message);
    return null;
  }
}

app.get('/', (req, res) => {
  res.send('Poker Server is running');
});

// מאחסן את כל החדרים
const rooms = new Map();

// יצירת קוד חדר ייחודי
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Global Stats Schema
const GlobalStatsSchema = new mongoose.Schema({
  totalRoomsCreated: { type: Number, default: 0 }
});
const GlobalStats = mongoose.model('GlobalStats', GlobalStatsSchema);

let totalRoomsCreated = 0;

// Initialize stats from DB
async function initStats() {
  try {
    let stats = await GlobalStats.findOne();
    if (!stats) {
      stats = new GlobalStats({ totalRoomsCreated: 0 });
      await stats.save();
    }
    totalRoomsCreated = stats.totalRoomsCreated;
    console.log('Stats initialized. Total rooms created:', totalRoomsCreated);
  } catch (err) {
    console.error('Error initializing stats:', err);
  }
}
initStats();

io.on('connection', (socket) => {
  console.log('שחקן התחבר:', socket.id);

  // Send initial stats
  socket.emit('stats-update', {
    activeRooms: rooms.size,
    totalRoomsCreated
  });

  const handleLoginSuccess = async (user, socket) => {
    // Generate new session token
    const sessionToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const sessionExpires = new Date();
    sessionExpires.setHours(sessionExpires.getHours() + 6); // 6 hours expiration

    user.sessionToken = sessionToken;
    user.sessionExpires = sessionExpires;
    await user.save();

    // Tag socket with user info for later stats tracking
    socket.user = { _id: user._id, googleId: user.googleId, name: user.name };

    // Send back profile and stats
    const responseData = {
      _id: user._id,
      name: user.name,
      picture: user.picture,
      stats: user.stats,
      sessionToken: user.sessionToken
    };
    console.log('Sending login-success to socket:', socket.id);
    socket.emit('login-success', responseData);
  };

  // Session Login Handler
  socket.on('login-session', async (token) => {
    console.log('Received login-session event');
    try {
      const user = await User.findOne({
        sessionToken: token,
        sessionExpires: { $gt: new Date() } // Check if not expired
      });

      if (user) {
        console.log('Session verified for:', user.name);
        await handleLoginSuccess(user, socket);
      } else {
        console.log('Invalid or expired session token');
        socket.emit('session-expired');
      }
    } catch (err) {
      console.error('Database error during session login:', err);
    }
  });

  // Google Login Handler
  socket.on('login-google', async (token) => {
    console.log('Received login-google event');
    const payload = await verifyGoogleToken(token);

    if (payload) {
      console.log('Token verified for:', payload.name);
      const { sub: googleId, email, name, picture } = payload;

      try {
        let user = await User.findOne({ googleId });

        if (!user) {
          user = new User({ googleId, email, name, picture });
          await user.save();
          console.log('New user created:', name);
        } else {
          // Update picture/name if changed
          user.picture = picture;
          user.name = name;
          await user.save();
          console.log('User updated:', name);
        }

        await handleLoginSuccess(user, socket);

      } catch (err) {
        console.error('Database error during login:', err);
        socket.emit('error', 'Login failed: ' + err.message);
      }
    } else {
      console.error('Token verification failed');
      socket.emit('error', 'Invalid Google Token');
    }
  });

  // יצירת חדר חדש
  socket.on('create-room', (playerName) => {
    if (!socket.user) {
      socket.emit('error', 'חובה להתחבר כדי ליצור חדר');
      return;
    }

    const roomCode = generateRoomCode();
    const adminSecret = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2); // Secret token
    const googleId = socket.user.googleId;
    const name = socket.user.name; // Use verified name from Google

    const room = {
      code: roomCode,
      adminId: socket.id,
      adminSecret,
      players: [{
        id: socket.id,
        name: name,
        googleId, // Store Google ID
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

    // Persist Increment
    totalRoomsCreated++;
    GlobalStats.updateOne({}, { $inc: { totalRoomsCreated: 1 } }).exec()
      .catch(err => console.error('Failed to increment global room stats:', err));

    // Broadcast stats update to EVERYONE
    io.emit('stats-update', {
      activeRooms: rooms.size,
      totalRoomsCreated
    });

    // Send secret ONLY to the creator
    socket.emit('room-created', { roomCode, room, adminSecret });
    console.log(`חדר ${roomCode} נוצר על ידי ${name} (GoogleID: ${googleId})`);
  });

  // הצטרפות לחדר
  socket.on('join-room', ({ roomCode, playerName, adminSecret }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', 'חדר לא נמצא');
      return;
    }

    if (!socket.user) {
      // Allow re-join if adminSecret is provided (admin reclaiming room)
      // OR if we implement a specific re-join logic. But for now, enforce login.
      // Exception: If user is reconnecting with same session, they should be logged in via login-session
      socket.emit('error', 'חובה להתחבר כדי להצטרף לחדר');
      return;
    }

    const googleId = socket.user.googleId;
    const name = socket.user.name;

    // בדיקה אם השחקן כבר קיים
    const existingPlayer = room.players.find(p => p.googleId === googleId); // Robust check by GoogleID

    if (existingPlayer) {
      existingPlayer.id = socket.id;
      existingPlayer.name = name; // Update name just in case
    } else {
      room.players.push({
        id: socket.id,
        name: name,
        googleId, // Store Google ID
        buyIns: [],
        cashOut: undefined
      });
    }

    // בדיקה אם השחקן הוא האדמין
    if (adminSecret && room.adminSecret === adminSecret) {
      room.adminId = socket.id;
      console.log(`Admin reclaimed room ${roomCode} via secret`);
    }

    socket.join(roomCode);
    socket.roomCode = roomCode;

    io.to(roomCode).emit('room-updated', room);
    console.log(`${name} הצטרף לחדר ${roomCode} (GoogleID: ${googleId})`);
  });

  // עדכון שחקן
  socket.on('update-player', ({ roomCode, playerName, updates }) => {
    // Fallback to socket.roomCode if not provided (backwards compatibility)
    const code = roomCode || socket.roomCode;
    console.log(`Update player request: Room ${code}, Player ${playerName}`);

    const room = rooms.get(code);

    if (room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        Object.assign(player, updates);
        io.to(code).emit('room-updated', room);
        console.log(`Player ${playerName} updated in room ${code}`);
      } else {
        console.error(`Player ${playerName} not found in room ${code}`);
      }
    } else {
      console.error(`Room ${code} not found during update`);
      socket.emit('room-closed'); // Force client to leave zombie room
    }
  });

  // עדכון הגדרות משחק
  socket.on('update-game-settings', ({ roomCode, newSettings }) => {
    const code = roomCode || socket.roomCode;
    const room = rooms.get(code);

    if (room) {
      Object.assign(room.gameSettings, newSettings);
      io.to(code).emit('room-updated', room);
    } else {
      socket.emit('room-closed'); // Force client to leave zombie room
    }
  });

  // סגירת חדר (על ידי מנהל)
  socket.on('close-room', async () => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);

    if (room && room.adminId === socket.id) {
      // 1. Calculate and Save Stats for each player
      console.log(`Closing room ${roomCode}. Saving stats...`);

      for (const player of room.players) {
        if (player.googleId && player.cashOut !== undefined) {
          // Calculate Net Profit
          const totalBuyIn = player.buyIns.reduce((sum, bi) => sum + bi.amount, 0);
          const ratio = room.gameSettings.chipRatio.shekel / room.gameSettings.chipRatio.chips;
          const cashOutShekels = player.cashOut * ratio;
          const netProfit = cashOutShekels - totalBuyIn;

          try {
            await User.updateOne(
              { googleId: player.googleId },
              {
                $inc: {
                  "stats.totalProfit": netProfit,
                  "stats.gamesPlayed": 1
                },
                $set: {
                  "stats.lastPlayed": new Date()
                }
              }
            );
            console.log(`Stats saved for ${player.name}: Profit ${netProfit}`);
          } catch (err) {
            console.error(`Failed to save stats for ${player.name}:`, err);
          }
        }
      }

      // 2. Notify and Close
      io.to(roomCode).emit('room-closed');

      const clients = io.sockets.adapter.rooms.get(roomCode);
      if (clients) {
        for (const clientId of clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.leave(roomCode);
            clientSocket.roomCode = null;
          }
        }
      }

      rooms.delete(roomCode);
      console.log(`Room ${roomCode} closed by admin`);

      io.emit('stats-update', {
        activeRooms: rooms.size,
        totalRoomsCreated
      });
    }
  });

  // עזיבת שחקן (לא מנהל)
  socket.on('leave-room', () => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);

    if (room) {
      // Remove player
      room.players = room.players.filter(p => p.id !== socket.id);

      socket.leave(roomCode);
      socket.roomCode = null;

      if (room.players.length === 0) {
        rooms.delete(roomCode);
        io.emit('stats-update', {
          activeRooms: rooms.size,
          totalRoomsCreated
        });
      } else {
        io.to(roomCode).emit('room-updated', room);
      }
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