import { GameContext, GameState } from '../game/types';
import {
  sendGameState as sendGameStateToNetwork
} from './webrtc';

/**
 * GameStateSync handles validation and synchronization of game state
 * between peers, ensuring state consistency and security
 */
export class GameStateSync {
  /**
   * Validate that a state transition is allowed
   */
  public static isValidStateTransition(currentGame: GameContext, receivedGame: GameContext): boolean {
    // Allow state transition during these phases
    const allowableSyncStates = [
      GameState.SETUP,
      GameState.DRAW_PHASE,
      GameState.CATEGORY_SELECTION,
      GameState.VALUE_COMPARISON
    ];

    // Always allow initial game state
    if (currentGame.state === GameState.SETUP) {
      return true;
    }

    // Only allow sync during specific game states
    return allowableSyncStates.includes(currentGame.state);
  }

  /**
   * Safely merge the received game state with the current game state
   * Only trusting specific properties to avoid security issues
   */
  public static validateAndMergeGameState(currentGame: GameContext, receivedGame: GameContext): GameContext {
    // Create a new object to avoid mutation
    const result = { ...currentGame };

    // Only copy specific properties we trust
    if (receivedGame.state) result.state = receivedGame.state;
    if (receivedGame.selectedCategory) result.selectedCategory = receivedGame.selectedCategory;
    if (receivedGame.roundWinner) result.roundWinner = receivedGame.roundWinner;

    // Copy top cards if they exist
    if (receivedGame.topCard1) result.topCard1 = receivedGame.topCard1;
    if (receivedGame.topCard2) result.topCard2 = receivedGame.topCard2;

    // Carefully update deck sizes (don't trust deck contents)
    if (receivedGame.player1 && receivedGame.player2) {
      result.player1.deck.length = receivedGame.player1.deck.length;
      result.player2.deck.length = receivedGame.player2.deck.length;
    }

    // Update tie pile cautiously
    if (receivedGame.tiePile) {
      result.tiePile = Array(receivedGame.tiePile.length).fill(null);
    }

    // For safety, determine active player locally based on game state
    if (receivedGame.activePlayer) {
      result.activePlayer = receivedGame.activePlayer.name === result.player1.name
        ? result.player1
        : result.player2;
    }

    return result;
  }

  /**
   * Send game state to peer
   */
  public static sendGameState(gameState: GameContext): void {
    sendGameStateToNetwork(gameState);
  }
}