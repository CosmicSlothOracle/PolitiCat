// Signaling server for POLITI CAT P2P
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const url = require('url');
const cors = require('cors');

// Create express app
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Room management
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', rooms: rooms.size });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('POLITI CAT Signaling Server');
});

// Initialize connection
wss.on('connection', (ws, req) => {
  // Parse URL for room ID
  const parameters = url.parse(req.url, true);
  let roomId = parameters.query.room;

  // Generate a new room ID if none provided
  if (!roomId) {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`Generated new room: ${roomId}`);
  }

  // Join or create room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    console.log(`Room created: ${roomId}`);
  }

  // Add client to room
  rooms.get(roomId).add(ws);
  console.log(`Client joined room: ${roomId}, total clients: ${rooms.get(roomId).size}`);

  // Handle messages
  ws.on('message', (message) => {
    // Broadcast to all clients in the same room
    rooms.get(roomId).forEach(client => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // Handle disconnection
  ws.on('close', () => {
    // Remove client from room
    rooms.get(roomId).delete(ws);
    console.log(`Client left room: ${roomId}, remaining clients: ${rooms.get(roomId).size}`);

    // Remove room if empty
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
      console.log(`Room deleted: ${roomId}`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});