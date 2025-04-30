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
  styles/           # CSS styles
public/
  cards/            # Card images (to be used in final version)
```

## Adding Assets

When the core game functionality is complete, real assets should be integrated by:

1. Updating the Card interface to require imagePath
2. Modifying the CardDisplay component to use real images
3. Adding audio and other media assets as needed
