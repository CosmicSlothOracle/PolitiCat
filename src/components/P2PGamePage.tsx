import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { GameLogger } from '../ui/GameLogger';
import { DebugPanel } from './DebugPanel';
import { Category, GameContext } from '../game/types';
import { P2PGameManager } from '../network/gameManager';
import { connectToPeer, isConnected, sendPlayerInfo, localPlayerId, disconnect } from '../network/webrtc';
import MatchmakingModal, { MatchmakingSlot } from './MatchmakingModal';

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
  const [isMMOpen, setIsMMOpen] = useState<boolean>(false);
  const [slotsCount, setSlotsCount] = useState<number>(3);
  const [slots, setSlots] = useState<MatchmakingSlot[]>([
    { name: playerName, connected: true, isAI: false },
    { name: remoteName || 'Waiting…', connected: false, isAI: false },
    { name: '—', connected: false, isAI: false },
    { name: '—', connected: false, isAI: false },
  ]);

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
      },
      onRemotePlayerInfo: (remote)=>{
        // Mark slot 1/2 as connected appropriately on remote info arrival
        setSlots(prev=>{
          const next=[...prev];
          if(isHost){
            next[1] = { name: remote.name || 'Player 2', connected: true, isAI: false };
            next[0] = { ...next[0], connected: true, isAI: false };
          } else {
            next[0] = { name: remote.name || 'Host', connected: true, isAI: false };
            next[1] = { ...next[1], connected: true, isAI: false };
          }
          return next;
        });
      }
    });

    setGameManager(manager);

    return () => {
      manager.dispose();
      disconnect();
    };
  }, [playerName]);

  // Keep slot[0] name in sync
  useEffect(() => {
    setSlots(prev => {
      const next = [...prev];
      next[0] = { ...next[0], name: playerName, connected: connectionStatus === 'connected', isAI: false };
      return next;
    });
  }, [playerName, connectionStatus]);

  // Announce ourselves once the data channel is open
  const trySendSelfInfo = useCallback(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      try {
        if (isConnected()) {
          sendPlayerInfo({ name: playerName, deck: [], isAI: false } as any);
          clearInterval(timer);
        }
      } catch {}
      if (tries >= 40) { // ~6s max
        clearInterval(timer);
      }
    }, 150);
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

    // Open matchmaking immediately so status is visible during connect
    setIsMMOpen(true);
    setSlots(prev => {
      const next = [...prev];
      next[0] = { name: playerName, connected: false, isAI: false };
      next[1] = { name: remoteName || 'Waiting…', connected: false, isAI: false };
      return next;
    });

    // Ensure the room parameter is properly added to the URL
    const signalingUrlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${newRoomId}`;
    console.log(`Connecting to signaling server as host: ${signalingUrlWithRoom}`);

    try {
      const success = await connectToPeer(signalingUrlWithRoom, true);

      if (success) {
        // Initialize game as host once connected
        gameManager.initGame(remoteName || 'Opponent', true); // Set as initiator
        setConnectionStatus('connected');
        setIsMMOpen(true);
        setSlots(prev => {
          const next = [...prev];
          next[0] = { name: playerName, connected: true, isAI: false };
          next[1] = { name: remoteName || 'Waiting…', connected: false, isAI: false };
          return next;
        });
        // Announce self when channel is ready so guest marks host connected
        trySendSelfInfo();
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

    // Open matchmaking immediately while connecting
    setIsMMOpen(true);
    setSlots(prev => {
      const next = [...prev];
      next[0] = { name: remoteName || 'Host', connected: false, isAI: false };
      next[1] = { name: playerName, connected: false, isAI: false };
      return next;
    });

    // Connect to signaling server with provided room ID
    const signalingUrlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${roomId}`;
    console.log(`Connecting to signaling server as guest: ${signalingUrlWithRoom}`);

    try {
      const success = await connectToPeer(signalingUrlWithRoom, false);

      if (success) {
        // Send our player info (after channel is open)
        trySendSelfInfo();

        // Initialize as non-initiator (will wait for game state)
        gameManager.initGame(remoteName || 'Host', false);

        setConnectionStatus('connected');
        setIsMMOpen(true);
        setSlots(prev => {
          const next = [...prev];
          next[1] = { name: playerName, connected: true, isAI: false };
          next[0] = { name: remoteName || 'Host', connected: true, isAI: false };
          return next;
        });
      } else {
        setConnectionError('Failed to connect to room');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('disconnected');
    }
  }, [gameManager, roomId, playerName, signalingUrl, remoteName, trySendSelfInfo]);

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
      <MatchmakingModal
        isOpen={isMMOpen}
        isHost={isHost}
        roomId={roomId}
        slotsCount={slotsCount}
        allowedCounts={[3,4]}
        slots={slots}
        onChangeSlotsCount={(n)=> { if(isHost) setSlotsCount(n); }}
        onFillAI={(idx)=> setSlots(prev=>{ const next=[...prev]; next[idx] = { name: `AI ${idx+1}`, connected: true, isAI: true }; return next; })}
        onKickAI={(idx)=> setSlots(prev=>{ const next=[...prev]; next[idx] = { name: '—', connected: false, isAI: false }; return next; })}
        onStart={()=>{
          if(!isHost) return; // only host can start the game
          setIsMMOpen(false);
          // Risiko-Phase: Setze initial direkt in DRAW_PHASE, dann CATEGORY_SELECTION_BOTH
          setTimeout(()=>{
            setGame(prev=> prev ? { ...prev, state: 1 as any } : prev);
          }, 50);
        }}
        onClose={()=> setIsMMOpen(false)}
      />

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