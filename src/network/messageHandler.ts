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
    if (!currentGame && message.type !== MessageType.PLAYER_INFO) {
      return; // No current game, ignore most messages
    }

    try {
      switch (message.type) {
        case MessageType.CATEGORY_SELECT:
          if (this.callbacks.onCategorySelect) {
            this.callbacks.onCategorySelect(message.data as Category);
          }
          break;

        case MessageType.GAME_STATE:
          if (this.callbacks.onGameStateUpdate) {
            this.callbacks.onGameStateUpdate(message.data as GameContext);
          }
          break;

        case MessageType.PLAYER_INFO:
          if (this.callbacks.onPlayerInfo) {
            this.callbacks.onPlayerInfo(message.data as Player);
          }
          break;

        case MessageType.CHAT:
          // Chat handling could be added here
          break;

        case MessageType.PING:
          // Ping handling could be added here
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(`Error processing message: ${error}`);
      }
    }
  }
}