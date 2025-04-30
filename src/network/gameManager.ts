import { GameContext, Category, GameState, Player } from '../game/types';
import {
  addMessageHandler,
  removeMessageHandler,
  NetworkMessage,
  sendCategorySelection,
  isConnected,
  disconnect
} from './webrtc';
import {
  initializeGame,
  selectCategory,
  compareValues,
  drawTopCards,
  resolveWinner,
  handleTie,
  checkGameEnd
} from '../game/gameEngine';
import { NetworkMessageHandler, MessageHandlerCallbacks } from './messageHandler';
import { GameStateSync } from './stateSync';

// Game event callbacks
export interface GameEvents {
  onGameUpdate?: (game: GameContext) => void;
  onConnectionStatus?: (connected: boolean) => void;
  onError?: (error: string) => void;
  onDisconnect?: () => void; // New callback for handling disconnection
}

// P2P game session manager
export class P2PGameManager {
  private game: GameContext | null = null;
  private events: GameEvents;
  private networkHandler: NetworkMessageHandler;
  private messageHandlerFn: (message: NetworkMessage) => void;
  private playerName: string;
  private remoteName: string = 'Remote Player';
  private processingTurn: boolean = false; // Turn lock to prevent race conditions
  private waitingForRemoteState: boolean = false;
  private isInitiator: boolean = false;

  constructor(playerName: string, events: GameEvents = {}) {
    this.playerName = playerName;
    this.events = events;

    // Create message handler with callbacks
    const callbacks: MessageHandlerCallbacks = {
      onCategorySelect: this.handleRemoteCategorySelect.bind(this),
      onGameStateUpdate: this.handleRemoteGameState.bind(this),
      onPlayerInfo: this.handleRemotePlayerInfo.bind(this),
      onError: (error) => {
        if (this.events.onError) this.events.onError(error);
      }
    };

    this.networkHandler = new NetworkMessageHandler(playerName, callbacks);
    this.messageHandlerFn = this.handleNetworkMessage.bind(this);
    addMessageHandler(this.messageHandlerFn);
  }

  // Initialize a new P2P game
  public initGame(remoteName: string = 'Remote Player', isInitiator: boolean = false): void {
    this.remoteName = remoteName;
    this.isInitiator = isInitiator;

    // Only the initiator should initialize the game state
    // The other peer should wait to receive the state
    if (this.isInitiator) {
      console.log("Initializing game as initiator");
      const initialGame = initializeGame(this.playerName, this.remoteName);

      // Override AI flag for remote player (player2)
      initialGame.player2.isAI = false;

      this.game = initialGame;
      this.updateGame(this.game);

      if (isConnected()) {
        GameStateSync.sendGameState(this.game);
      }
    } else {
      console.log("Waiting for game state from initiator");
      this.waitingForRemoteState = true;

      // Set a timeout to handle cases where we don't receive state
      setTimeout(() => {
        if (this.waitingForRemoteState && !this.game) {
          console.warn("Did not receive game state, initializing locally");
          const initialGame = initializeGame(this.playerName, this.remoteName);
          initialGame.player2.isAI = false;
          this.game = initialGame;
          this.updateGame(this.game);
          this.waitingForRemoteState = false;
        }
      }, 5000); // 5 second timeout
    }
  }

  // Update our local game state and notify listeners
  private updateGame(game: GameContext): void {
    this.game = game;
    if (this.events.onGameUpdate) {
      this.events.onGameUpdate(game);
    }
  }

  // Handle a category selection from the local player
  public handleCategorySelect(category: Category): void {
    if (!this.game) return;

    // Only process the selection if it's our turn
    const isOurTurn = this.game.activePlayer.name === this.playerName;
    if (!isOurTurn || this.processingTurn) return;

    // Set turn lock
    this.processingTurn = true;

    try {
      // Log selection for analytics/debugging
      console.log(`Player selected category: ${category}`);

      // Make local update
      let updatedGame = selectCategory(this.game, category);
      this.updateGame(updatedGame);

      // Notify peer
      if (isConnected()) {
        sendCategorySelection(category);
      }

      // Move to comparison phase
      setTimeout(() => {
        try {
          updatedGame = compareValues(updatedGame);
          this.updateGame(updatedGame);
        } catch (error) {
          console.error("Error comparing values:", error);
          if (this.events.onError) {
            this.events.onError(`Error comparing values: ${error}`);
          }
        } finally {
          this.processingTurn = false; // Release turn lock
        }
      }, 500);
    } catch (error) {
      console.error("Error selecting category:", error);
      if (this.events.onError) {
        this.events.onError(`Error selecting category: ${error}`);
      }
      this.processingTurn = false; // Release turn lock
    }
  }

  // Handle a category selection from the remote player
  private handleRemoteCategorySelect(category: Category): void {
    if (!this.game) return;

    // Only process if it's remote player's turn and we're not already processing a turn
    if (this.game.activePlayer.name !== this.playerName && !this.processingTurn) {
      this.processingTurn = true; // Lock to prevent race conditions

      try {
        // Log for debugging
        console.log(`Remote player selected category: ${category}`);

        let updatedGame = selectCategory(this.game, category);
        updatedGame = compareValues(updatedGame);
        this.updateGame(updatedGame);
      } catch (error) {
        console.error("Error handling remote category selection:", error);
        if (this.events.onError) {
          this.events.onError(`Error handling remote selection: ${error}`);
        }
      } finally {
        this.processingTurn = false; // Release turn lock
      }
    }
  }

  // Handle game state update from the remote player
  private handleRemoteGameState(receivedGame: GameContext): void {
    // If waiting for initial state, accept it directly
    if (this.waitingForRemoteState && !this.game) {
      console.log("Received initial game state from peer");
      this.game = receivedGame;
      this.updateGame(this.game);
      this.waitingForRemoteState = false;
      return;
    }

    // If we have a local game, validate the received state
    if (this.game) {
      console.log("Validating received game state");

      // Validate the state transition is allowable
      if (GameStateSync.isValidStateTransition(this.game, receivedGame)) {
        console.log("Applying validated game state from peer");
        // Only merge specific properties we trust
        const validatedGame = GameStateSync.validateAndMergeGameState(this.game, receivedGame);
        this.updateGame(validatedGame);
      } else {
        console.warn("Received invalid game state transition, ignoring");
        if (this.events.onError) {
          this.events.onError("Invalid game state transition received");
        }
      }
    }
  }

  // Handle remote player information
  private handleRemotePlayerInfo(remotePlayer: Player): void {
    this.remoteName = remotePlayer.name;
    console.log(`Remote player info received: ${remotePlayer.name}`);

    if (this.game) {
      // Update player2 with the remote player info
      this.game.player2.name = remotePlayer.name;
      this.updateGame(this.game);
    }
  }

  // Handle the next phase button click
  public handleNextPhase(): void {
    if (!this.game) return;

    try {
      switch (this.game.state) {
        case GameState.VALUE_COMPARISON:
        case GameState.RESOLVE_WINNER:
          const resolvedGame = resolveWinner(this.game);
          this.updateGame(resolvedGame);
          break;

        case GameState.HANDLE_TIE:
          const tieGame = handleTie(this.game);
          this.updateGame(tieGame);
          break;

        case GameState.CHECK_END:
          const nextGame = checkGameEnd(this.game);
          this.updateGame(nextGame);

          // If we move to the draw phase, automatically draw cards
          if (nextGame.state === GameState.DRAW_PHASE) {
            setTimeout(() => {
              try {
                const drawGame = drawTopCards(nextGame);
                this.updateGame(drawGame);
              } catch (error) {
                console.error("Error drawing cards:", error);
                if (this.events.onError) {
                  this.events.onError(`Error drawing cards: ${error}`);
                }
              }
            }, 500);
          }
          break;

        default:
          break;
      }

      // Send updated game state to peer
      if (isConnected() && this.game) {
        GameStateSync.sendGameState(this.game);
      }
    } catch (error) {
      console.error("Error handling next phase:", error);
      if (this.events.onError) {
        this.events.onError(`Error in game flow: ${error}`);
      }
    }
  }

  // Handle incoming network messages
  private handleNetworkMessage(message: NetworkMessage): void {
    this.networkHandler.handleMessage(message, this.game);
  }

  // Clean up resources
  public dispose(): void {
    removeMessageHandler(this.messageHandlerFn);
    disconnect(); // Fully clean up by disconnecting WebRTC

    // Notify about disconnection
    if (this.events.onDisconnect) {
      this.events.onDisconnect();
    }
  }

  // Get the current game
  public getGame(): GameContext | null {
    return this.game;
  }

  // Set whether this peer is the initiator
  public setAsInitiator(isInitiator: boolean): void {
    this.isInitiator = isInitiator;
  }
}