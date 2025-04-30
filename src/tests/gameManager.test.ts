import { P2PGameManager } from '../network/gameManager';
import { GameContext, Category, GameState } from '../game/types';
import * as webrtc from '../network/webrtc';

// Mock the webrtc module
jest.mock('../network/webrtc', () => ({
  addMessageHandler: jest.fn(),
  removeMessageHandler: jest.fn(),
  isConnected: jest.fn(),
  sendCategorySelection: jest.fn(),
  localPlayerId: 'test-player-id',
  disconnect: jest.fn(),
  MessageType: {
    GAME_ACTION: 'GAME_ACTION',
    CATEGORY_SELECT: 'CATEGORY_SELECT',
    GAME_STATE: 'GAME_STATE',
    PLAYER_INFO: 'PLAYER_INFO',
    CHAT: 'CHAT',
    PING: 'PING',
  }
}));

describe('P2PGameManager', () => {
  let gameManager: P2PGameManager;
  let mockHandlerFn: Function;
  let mockGame: GameContext | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a test game manager with event tracking
    gameManager = new P2PGameManager('TestPlayer', {
      onGameUpdate: (game) => {
        mockGame = game;
      }
    });

    // Capture the registered message handler
    mockHandlerFn = (webrtc.addMessageHandler as jest.Mock).mock.calls[0][0];
  });

  afterEach(() => {
    gameManager.dispose();
  });

  test('should initialize a game correctly', () => {
    gameManager.initGame('RemotePlayer');
    const game = gameManager.getGame();

    expect(game).not.toBeNull();
    expect(game?.player1.name).toBe('TestPlayer');
    expect(game?.player2.name).toBe('RemotePlayer');
    expect(game?.player2.isAI).toBe(false);
    expect(game?.state).toBe(GameState.SETUP);
  });

  test('should handle category selection correctly', () => {
    // Initialize game
    gameManager.initGame('RemotePlayer');
    let game = gameManager.getGame()!;

    // Set up the test game state for category selection
    game.state = GameState.CATEGORY_SELECTION;
    game.activePlayer = game.player1; // Set active player to player1

    // Simulate handling category selection
    gameManager.handleCategorySelect(Category.CHARISMA);

    // Verify category was selected
    game = gameManager.getGame()!;
    expect(game.selectedCategory).toBe(Category.CHARISMA);
    expect(webrtc.sendCategorySelection).toHaveBeenCalledWith(Category.CHARISMA);
  });

  test('should ignore category selection when not player\'s turn', () => {
    // Initialize game
    gameManager.initGame('RemotePlayer');
    let game = gameManager.getGame()!;

    // Set up the test game state for category selection
    game.state = GameState.CATEGORY_SELECTION;
    game.activePlayer = game.player2; // Set active player to player2

    // Capture current game state
    const initialState = { ...game };

    // Try to handle category selection when it's not player's turn
    gameManager.handleCategorySelect(Category.CHARISMA);

    // Verify nothing changed
    game = gameManager.getGame()!;
    expect(game.state).toBe(initialState.state);
    expect(game.selectedCategory).toBe(initialState.selectedCategory);
    expect(webrtc.sendCategorySelection).not.toHaveBeenCalled();
  });

  test('should handle remote player info correctly', () => {
    // Initialize game
    gameManager.initGame('InitialRemote');

    // Simulate receiving player info message
    mockHandlerFn({
      type: webrtc.MessageType.PLAYER_INFO,
      data: {
        name: 'UpdatedRemote',
        deck: [],
        isAI: false
      },
      senderId: 'remote-id',
      timestamp: Date.now()
    });

    const game = gameManager.getGame()!;
    expect(game.player2.name).toBe('UpdatedRemote');
  });

  test('should clean up resources on dispose', () => {
    gameManager.dispose();
    expect(webrtc.removeMessageHandler).toHaveBeenCalled();
    expect(webrtc.disconnect).toHaveBeenCalled();
  });
});