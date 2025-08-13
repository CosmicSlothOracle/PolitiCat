import { MessageType, NetworkMessage } from './webrtc';
import { GameContext, Category, Player } from '../game/types';

/**
 * Interface for message handler callbacks
 */
export interface MessageHandlerCallbacks {
  onCategorySelect?: (category: Category) => void;
  onGameStateUpdate?: (gameState: GameContext) => void;
  onPlayerInfo?: (player: Player) => void;
  onError?: (error: string) => void;
  onSyncRequest?: () => void;
}

/**
 * NetworkMessageHandler processes WebRTC messages and delegates to appropriate handlers
 */
export class NetworkMessageHandler {
  private callbacks: MessageHandlerCallbacks;
  private playerName: string;

  constructor(playerName: string, callbacks: MessageHandlerCallbacks) {
    this.playerName = playerName;
    this.callbacks = callbacks;
  }

  /**
   * Process an incoming network message
   */
  public handleMessage(message: NetworkMessage, currentGame: GameContext | null): void {
    // Allow PLAYER_INFO and GAME_STATE even if we don't have a local game yet
    if (!currentGame && message.type !== MessageType.PLAYER_INFO && message.type !== MessageType.GAME_STATE) {
      console.log('Ignoring message: No current game and not an allowed bootstrap message');
      return; // No current game, ignore other messages
    }

    try {
      switch (message.type) {
        case MessageType.CATEGORY_SELECT:
          if (this.callbacks.onCategorySelect) {
            const category = message.data as Category;
            // Category is a string enum in this codebase; basic validation
            if (typeof category !== 'string') {
              throw new Error('Invalid category data received');
            }
            console.log(`Processing category selection message: ${Category[category] || category}`);
            this.callbacks.onCategorySelect(category);
          }
          break;
        case MessageType.SYNC_REQUEST:
          if (this.callbacks.onSyncRequest) {
            console.log('Processing sync request message');
            this.callbacks.onSyncRequest();
          }
          break;

        case MessageType.GAME_STATE:
          if (this.callbacks.onGameStateUpdate) {
            const gameState = message.data as GameContext;
            if (!gameState || typeof gameState !== 'object') {
              throw new Error('Invalid game state data received');
            }
            console.log(`Processing game state update message`);
            this.callbacks.onGameStateUpdate(gameState);
          }
          break;

        case MessageType.PLAYER_INFO:
          if (this.callbacks.onPlayerInfo) {
            const player = message.data as Player;
            if (!player || !player.name) {
              throw new Error('Invalid player info received');
            }
            console.log(`Processing player info message: ${player.name}`);
            this.callbacks.onPlayerInfo(player);
          }
          break;

        case MessageType.CHAT:
          // Chat handling could be added here
          console.log('Chat message received (not implemented)');
          break;

        case MessageType.PING:
          // Ping handling could be added here
          console.log('Ping message received (not implemented)');
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error handling message type ${message.type}: ${errorMessage}`);
      if (this.callbacks.onError) {
        this.callbacks.onError(`Error processing message: ${errorMessage}`);
      }
    }
  }
}