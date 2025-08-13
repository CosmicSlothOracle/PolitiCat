# POL Project - POLITI CAT Game

## Project Overview

This is the POL project, a web application for a political card game called POLITI CAT. The game is built using React, TypeScript, and Vite.

## Development Approach

The project follows a "function-first" approach where we:

1. Prioritize implementing game logic and functionality before integrating assets
2. Use placeholder representations for cards instead of real images during development
3. Will add real assets (card images, sounds, etc.) only when the core gameplay is complete and stable
4. Focus on modularity and separation of concerns

This approach allows us to:

- Develop and test game mechanics faster
- Make structural changes without worrying about asset management
- Ensure a clean, maintainable codebase

## New P2P Multiplayer Feature

The game now supports peer-to-peer multiplayer using WebRTC technology:

- Players can create or join game rooms with unique codes
- Direct peer-to-peer communication with no game state on the server
- Minimal signaling server only used for connection establishment
- Real-time gameplay between two players over the internet

### Signaling Server

The P2P functionality requires a simple signaling server for establishing connections.

Two options are included in the repo:

1. `signaling/index.js` — minimal WS-only server (Render-friendly)

2. `server.js` — Express + WS with health endpoint (Render-friendly)

Run locally (option 2):

```bash
npm run server
```

Deployment example (Render): set Start Command to `node server.js` and expose env `PORT`.

Default client URL: `wss://politicat-signaling.onrender.com`.

### Configuring the Signaling Server URL

The game connects to the deployed signaling server by default. To change this:

1. Create a `.env` file in the project root with:

   ```
   VITE_SIGNALING_URL=wss://politicat-signaling.onrender.com
   ```

2. For local development, use:
   ```
    VITE_SIGNALING_URL=ws://localhost:3001?room=DEV
   ```

## Installation

```bash
npm install
```

## Running the Development Server

```bash
npm run dev
```

## Building the Project

```bash
npm run build
```

## Project Structure

```
src/
  components/       # UI components
  game/             # Game logic and data
  network/          # WebRTC and P2P communication
  styles/           # CSS styles
public/
  cards/            # Card images (to be used in final version)
server.js           # WebRTC signaling server
```

## Adding Assets

When the core game functionality is complete, real assets should be integrated by:

1. Updating the Card interface to require imagePath
2. Modifying the CardDisplay component to use real images
3. Adding audio and other media assets as needed
