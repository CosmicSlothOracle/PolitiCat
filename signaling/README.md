# PolitiCat WebRTC Signaling Server

This is a signaling server for PolitiCat's WebRTC multiplayer functionality. It facilitates the initial connection between players by relaying signaling messages.

## Features

- Room-based communication for secure peer connections
- Heartbeat mechanism to detect disconnected clients
- Robust error handling and logging
- WebSocket implementation for low-latency communication

## Local Development

1. Install dependencies:

   ```
   npm install
   ```

2. Start the server:
   ```
   npm run dev
   ```

The server will be available at `ws://localhost:3000`.

## Deployment

### Deploying to Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the deployment:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Set `PORT` to `10000` (or your preferred port)

### Deploying to Heroku

1. Create a new Heroku app
2. Push your code to Heroku:
   ```
   heroku create politicat-signaling
   git subtree push --prefix signaling heroku main
   ```

## Usage in the PolitiCat Client

Configure the client to connect to the signaling server:

```javascript
// Development
const signalingUrl = "ws://localhost:3000?room=ROOM_ID";

// Production
const signalingUrl = "wss://your-server-url.com?room=ROOM_ID";
```

## Architecture

The signaling server maintains a map of rooms, each containing a set of connected WebSocket clients. When a client sends a message, it's forwarded to all other clients in the same room, enabling WebRTC offer/answer exchange.

```
rooms {
  "room1": [client1, client2],
  "room2": [client3, client4]
}
```

## Monitoring

The server logs various events with timestamps, including:

- Room creation and deletion
- Client connections and disconnections
- Message types being processed
- Errors encountered
