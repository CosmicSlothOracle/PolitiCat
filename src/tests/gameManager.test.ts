import { P2PGameManager } from '../network/gameManager';
import { GameContext, Category, GameState } from '../game/types';
import * as webrtc from '../network/webrtc';

// Mock the webrtc module
jest.mock('../network/webrtc', () => ({
  addMessageHandler: jest.fn(),
  removeMessageHandler: jest.fn(),
  isConnected: jest.fn(),
  sendCategorySelection: jest.fn(),
  sendGameState: jest.fn(),
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
    jest.resetAllMocks();

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
    // Initiator initialisiert den Game-State lokal
    gameManager.initGame('RemotePlayer', true);
    const game = gameManager.getGame();

    expect(game).not.toBeNull();
    expect(game?.player1.name).toBe('TestPlayer');
    expect(game?.player2.name).toBe('RemotePlayer');
    expect(game?.player2.isAI).toBe(false);
    expect(game?.state).toBe(GameState.SETUP);
  });

  test('should handle category selection correctly', () => {
    // Initialize game as initiator
    gameManager.initGame('RemotePlayer', true);
    let game = gameManager.getGame()!;

    // Multiplayer nutzt CATEGORY_SELECTION_BOTH und getrennte Felder pro Spieler
    game.state = GameState.CATEGORY_SELECTION_BOTH;

    // Netzwerkverbindung simulieren
    (webrtc.isConnected as jest.Mock).mockReturnValue(true);

    // Simulate handling category selection for player1
    gameManager.handleCategorySelect(Category.CHARISMA);

    // Verify category was selected on player1 side
    game = gameManager.getGame()!;
    expect(game.selectedCategory1).toBe(Category.CHARISMA);
    expect(webrtc.sendCategorySelection).toHaveBeenCalledWith(Category.CHARISMA);
  });

  test('should ignore category selection outside selection phase', () => {
    // Initialize game as initiator
    gameManager.initGame('RemotePlayer', true);
    let game = gameManager.getGame()!;

    // Outside selection phase
    game.state = GameState.VALUE_COMPARISON;

    const initialState = { ...game };

    gameManager.handleCategorySelect(Category.CHARISMA);

    game = gameManager.getGame()!;
    expect(game.state).toBe(initialState.state);
    expect(game.selectedCategory1).toBe(initialState.selectedCategory1);
    expect(game.selectedCategory2).toBe(initialState.selectedCategory2);
    expect(webrtc.sendCategorySelection).not.toHaveBeenCalled();
  });

  test('should handle remote player info correctly', () => {
    // Initialize game as initiator
    gameManager.initGame('InitialRemote', true);

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