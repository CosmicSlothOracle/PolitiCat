import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { GameLogger } from '../ui/GameLogger';
import { DebugPanel } from './DebugPanel';
import { Category, GameContext } from '../game/types';
import { P2PGameManager } from '../network/gameManager';
import { connectToPeer, isConnected, sendPlayerInfo, localPlayerId, disconnect } from '../network/webrtc';

// Default URL for the signaling server (should be set in environment)
const DEFAULT_SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://politicat-signaling.onrender.com';

export const P2PGamePage: React.FC = () => {
  // State
  const [game, setGame] = useState<GameContext | null>(null);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [remoteName, setRemoteName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gameManager, setGameManager] = useState<P2PGameManager | null>(null);
  const [signalingUrl, setSignalingUrl] = useState<string>(DEFAULT_SIGNALING_URL);

  const navigate = useNavigate();

  // Initialize game manager
  useEffect(() => {
    const manager = new P2PGameManager(playerName, {
      onGameUpdate: (updatedGame) => {
        setGame(updatedGame);
      },
      onConnectionStatus: (connected) => {
        setConnectionStatus(connected ? 'connected' : 'disconnected');
      },
      onError: (error) => {
        setConnectionError(error);
      }
    });

    setGameManager(manager);

    return () => {
      manager.dispose();
      disconnect();
    };
  }, [playerName]);

  // Handle room creation (as host)
  const handleCreateRoom = useCallback(async () => {
    if (!gameManager) return;

    // Generate a room ID from our peer ID
    const newRoomId = localPlayerId.substring(0, 6).toUpperCase();
    setRoomId(newRoomId);
    setIsHost(true);

    // Connect to signaling server with room ID
    setConnectionStatus('connecting');

    // Ensure the room parameter is properly added to the URL
    const signalingUrlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${newRoomId}`;
    console.log(`Connecting to signaling server as host: ${signalingUrlWithRoom}`);

    try {
      const success = await connectToPeer(signalingUrlWithRoom, true);

      if (success) {
        // Initialize game as host once connected
        gameManager.initGame(remoteName || 'Opponent', true); // Set as initiator
        setConnectionStatus('connected');
      } else {
        setConnectionError('Failed to connect to signaling server');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('disconnected');
    }
  }, [gameManager, remoteName, signalingUrl]);

  // Handle joining an existing room
  const handleJoinRoom = useCallback(async () => {
    if (!gameManager || !roomId) return;

    setIsHost(false);
    setConnectionStatus('connecting');

    // Connect to signaling server with provided room ID
    const signalingUrlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${roomId}`;
    console.log(`Connecting to signaling server as guest: ${signalingUrlWithRoom}`);

    try {
      const success = await connectToPeer(signalingUrlWithRoom, false);

      if (success) {
        // Send our player info to the host
        sendPlayerInfo({
          name: playerName,
          deck: [],
          isAI: false
        });

        // Initialize as non-initiator (will wait for game state)
        gameManager.initGame(remoteName || 'Host', false);

        setConnectionStatus('connected');
      } else {
        setConnectionError('Failed to connect to room');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('disconnected');
    }
  }, [gameManager, roomId, playerName, signalingUrl, remoteName]);

  // Category selection handler
  const handleCategorySelect = useCallback((category: Category) => {
    if (!gameManager) return;
    gameManager.handleCategorySelect(category);
  }, [gameManager]);

  // Next phase handler
  const handleNextPhase = useCallback(() => {
    if (!gameManager) return;
    gameManager.handleNextPhase();
  }, [gameManager]);

  // Handle returning to menu
  const handleReturnToMenu = useCallback(() => {
    disconnect();
    navigate('/');
  }, [navigate]);

  // Connect to signaling server with room ID
  useEffect(() => {
    const cleanupResources = () => {
      if (gameManager) gameManager.dispose();
      disconnect();
    };

    return () => {
      cleanupResources();
    };
  }, []);

  // Setup / connection form UI
  if (connectionStatus !== 'connected') {
    return (
      <div className="setup-screen">
        <div className="setup-form">
          <h2>Multiplayer Setup</h2>

          <div className="setup-field">
            <label>Your Name:
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </label>
          </div>

          <div className="setup-options">
            <div className="option-group">
              <h3>Create New Game</h3>
              <button
                className="play-button"
                onClick={handleCreateRoom}
                disabled={connectionStatus === 'connecting'}
              >
                Create Room
              </button>
            </div>

            <div className="option-separator">OR</div>

            <div className="option-group">
              <h3>Join Existing Game</h3>
              <div className="setup-field">
                <label>Room Code:
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </label>
              </div>
              <button
                className="play-button"
                onClick={handleJoinRoom}
                disabled={!roomId || connectionStatus === 'connecting'}
              >
                Join Room
              </button>
            </div>
          </div>

          {connectionStatus === 'connecting' && (
            <div className="connection-status">
              Connecting...
            </div>
          )}

          {connectionError && (
            <div className="connection-error">
              {connectionError}
            </div>
          )}

          {isHost && roomId && (
            <div className="room-info">
              Your Room Code: <span className="room-code">{roomId}</span>
              <p className="room-instructions">Share this code with your friend to join</p>
            </div>
          )}

          <button className="return-button" onClick={handleReturnToMenu}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // Game view
  return (
    <div className="game-container">
      <div className="connection-indicator">
        {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {game && (
        <>
          <GameBoard
            game={game}
            onCategorySelect={handleCategorySelect}
            onNextPhase={handleNextPhase}
          />
          {process.env.NODE_ENV !== 'production' && (
            <>
              <GameLogger game={game} />
              <DebugPanel game={game} />
            </>
          )}
        </>
      )}

      {!game && (
        <div className="loading">Waiting for game to start...</div>
      )}
    </div>
  );
};