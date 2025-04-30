const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Store rooms and their clients
const rooms = new Map();

// Helper function for logging with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Heartbeat mechanism to detect disconnected clients
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws, req) => {
  // Extract room ID from URL query parameters
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('room');

  if (!roomId) {
    log('Connection rejected: No room ID provided');
    ws.close(1008, 'Room ID is required');
    return;
  }

  // Set up the client
  ws.isAlive = true;
  ws.roomId = roomId;
  ws.on('pong', heartbeat);

  // Add client to the room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    log(`Created new room: ${roomId}`);
  }
  rooms.get(roomId).add(ws);

  log(`Client connected to room ${roomId} - Total clients in room: ${rooms.get(roomId).size}`);

  ws.on('message', (message) => {
    try {
      // Parse message to ensure it's valid JSON
      const parsedMessage = JSON.parse(message);

      // Log message type for debugging
      log(`Received ${parsedMessage.type || 'unknown'} message in room ${roomId}`);

      // Forward the message to all other clients in the same room
      rooms.get(roomId).forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    } catch (error) {
      log(`Error processing message: ${error.message}`);
    }
  });

  ws.on('close', () => {
    // Remove client from the room
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(ws);
      log(`Client disconnected from room ${roomId} - Remaining clients: ${rooms.get(roomId).size}`);

      // Clean up empty rooms
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
        log(`Room ${roomId} deleted (empty)`);
      }
    }
  });

  ws.on('error', (error) => {
    log(`WebSocket error: ${error.message}`);
  });
});

// Implement ping-pong mechanism to detect disconnected clients
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      log('Terminating inactive connection');
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

wss.on('close', () => {
  clearInterval(interval);
});

log(`Signaling server is running on ws://localhost:${PORT}`);