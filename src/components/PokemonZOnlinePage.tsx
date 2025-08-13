import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectToPeer, disconnect, isConnected, localPlayerId, sendGameState, sendGameAction, sendPlayerInfo } from '../network/webrtc';
import MatchmakingModal, { MatchmakingSlot } from './MatchmakingModal';
// import { GameStateSync } from '../network/stateSync';

// This page hosts an iframe of the PokemonZ game and uses WebRTC signaling
// to sync state in a host-viewer setup. Host controls; guest follows.

const DEFAULT_SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://politicat-signaling.onrender.com';

type ConnStatus = 'disconnected' | 'connecting' | 'connected';

export const PokemonZOnlinePage: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState<string>('Player 1');
  // const [remoteName, setRemoteName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [signalingUrl] = useState<string>(DEFAULT_SIGNALING_URL);
  const [status, setStatus] = useState<ConnStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Matchmaking state
  const [isMMOpen, setIsMMOpen] = useState<boolean>(false);
  const [slotsCount, setSlotsCount] = useState<number>(3);
  const [slots, setSlots] = useState<MatchmakingSlot[]>([
    { name: playerName, connected: false, isAI: false },
    { name: 'Waiting…', connected: false, isAI: false },
    { name: '—', connected: false, isAI: false },
    { name: '—', connected: false, isAI: false },
  ]);

  // Send our player info once the data channel is open
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

  // Prefill room from URL param if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const rm = params.get('room');
      if (rm) setRoomId(rm.toUpperCase());
    } catch (_) {
      // ignore
    }
  }, []);

  // Send commands into iframe
  const postToIframe = useCallback((message: any) => {
    const iframe = iframeRef.current;
    if(iframe && iframe.contentWindow){
      iframe.contentWindow.postMessage(message, '*');
    }
  }, []);

  // Send state from iframe up to peer
  const handleIframeMessage = useCallback((ev: MessageEvent) => {
    const msg = ev.data;
    if(!msg || typeof msg !== 'object') return;
    if(msg.type === 'POKEMONZ_STATE' && isConnected()){
      try {
        // Relay snapshot to peer using existing game state channel
        // Reuse sendGameState to keep protocol consistent
        sendGameState(msg.payload);
      } catch (e) {
        // noop
      }
    } else if (msg.type === 'POKEMONZ_EMOTE' && isConnected()){
      try {
        sendGameAction({ kind: 'EMOTE', emoji: msg.payload });
        postToIframe({ type: 'POKEMONZ_EMOTE_SHOW', payload: msg.payload });
      } catch {}
    } else if (msg.type === 'POKEMONZ_RAISE_REQUEST' && isConnected()){
      try {
        sendGameAction({ kind: 'RAISE_REQUEST' });
      } catch {}
    } else if (msg.type === 'POKEMONZ_RAISE_RESPONSE' && isConnected()){
      try {
        sendGameAction({ kind: 'RAISE_RESPONSE', accepted: !!msg.payload?.accepted });
      } catch {}
    }
  }, [postToIframe]);

  useEffect(()=>{
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);



  // Host: create room
  const handleCreateRoom = useCallback(async () => {
    setIsHost(true);
    const newRoomId = localPlayerId.substring(0, 6).toUpperCase();
    setRoomId(newRoomId);
    setStatus('connecting');
    const urlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${newRoomId}`;
    try{
      const ok = await connectToPeer(urlWithRoom, true);
      if(ok){
        setStatus('connected');
        // Let iframe know it is the driver
        postToIframe({ type: 'POKEMONZ_VIEWER_MODE', payload: false });
        setIsMMOpen(true);
        setSlots(prev => { const next=[...prev]; next[0] = { name: playerName, connected: true, isAI: false }; return next; });
        // Announce self to guest when channel is ready
        trySendSelfInfo();
      }else{
        setStatus('disconnected'); setError('Failed to connect to signaling server');
      }
    }catch(e){ setStatus('disconnected'); setError(e instanceof Error ? e.message : 'Unknown error'); }
  }, [postToIframe, signalingUrl, trySendSelfInfo]);

  // Guest: join room
  const handleJoinRoom = useCallback(async () => {
    if(!roomId) return;
    setIsHost(false);
    setStatus('connecting');
    const urlWithRoom = `${signalingUrl}${signalingUrl.includes('?') ? '&' : '?'}room=${roomId}`;
    try{
      const ok = await connectToPeer(urlWithRoom, false);
      if(ok){
        setStatus('connected');
        // Set iframe into viewer mode
        postToIframe({ type: 'POKEMONZ_VIEWER_MODE', payload: true });
        setIsMMOpen(true);
        setSlots(prev => { const next=[...prev]; next[1] = { name: playerName, connected: true, isAI: false }; return next; });
        // Send our identity to host when channel is ready
        trySendSelfInfo();
      }else{
        setStatus('disconnected'); setError('Failed to connect to room');
      }
    }catch(e){ setStatus('disconnected'); setError(e instanceof Error ? e.message : 'Unknown error'); }
  }, [roomId, postToIframe, signalingUrl, trySendSelfInfo]);

  // Handle incoming peer messages: forward snapshots into iframe
  useEffect(()=>{
    // Hook directly into WebRTC datachannel by monkey-patching sendGameState usage
    // Network layer already pushes parsed messages to subscribers via messageHandlers
    // We will attach a temporary handler here.
    const handler = (_event: MessageEvent) => {
      // This effect does not subscribe via our network handler directly, but we rely on
      // PokemonZOnline to primarily receive state through the same sendGameState channel.
    };
    return () => {
      // cleanup placeholder if later extended
      window.removeEventListener('pokemonz-network', handler as any);
    };
  }, []);

  // Bridge: intercept native webrtc message pipeline by wrapping addMessageHandler
  // Simpler: poll dataChannel messages already handled in gameManager/stateSync.
  // We piggyback: GameStateSync.validateAndMergeGameState requires GameContext structure,
  // but our PokemonZ snapshots differ. So we directly forward messages in webrtc.onmessage.
  // Implementation detail: the webrtc layer already broadcasts parsed messages to handlers.
  // We add our own handler here by temporarily overriding addMessageHandler.
  useEffect(() => {
    // Dynamically import to avoid circular deps at load
    (async () => {
      const webrtc = await import('../network/webrtc');
      const { addMessageHandler, removeMessageHandler, MessageType } = webrtc as any;
      const fn = (netMsg: any) => {
        if(netMsg?.type === MessageType.GAME_STATE){
          const payload = netMsg.data;
          // Heuristic: PokemonZ snapshots have key 'G' and 'tour'
          if(payload && payload.G && payload.tour){
            postToIframe({ type:'POKEMONZ_APPLY_STATE', payload });
          }
        } else if (netMsg?.type === MessageType.GAME_ACTION){
          const action = netMsg.data || {};
          if(action.kind === 'EMOTE' && action.emoji){
            postToIframe({ type: 'POKEMONZ_EMOTE_SHOW', payload: action.emoji });
          } else if (action.kind === 'RAISE_REQUEST'){
            // Prompt local iframe to accept/decline
            postToIframe({ type: 'POKEMONZ_RAISE_PROMPT' });
          } else if (action.kind === 'RAISE_RESPONSE'){
            // Inform iframe about result
            postToIframe({ type: 'POKEMONZ_RAISE_RESULT', payload: { accepted: !!action.accepted } });
          }
        } else if (netMsg?.type === MessageType.PLAYER_INFO){
          const p = netMsg.data || { name: 'Remote' };
          // Update matchmaking slots to reflect both sides connected
          setSlots(prev => {
            const next=[...prev];
            if(isHost){
              next[0] = { ...next[0], connected: true, isAI: false };
              next[1] = { name: p.name || next[1].name || 'Player 2', connected: true, isAI: false };
            } else {
              next[1] = { ...next[1], connected: true, isAI: false };
              next[0] = { name: p.name || next[0].name || 'Player 1', connected: true, isAI: false };
            }
            return next;
          });
        }
      };
      addMessageHandler(fn);
      return () => removeMessageHandler(fn);
    })();
  }, [postToIframe, isHost]);

  const handleReturn = useCallback(()=>{
    disconnect();
    navigate('/');
  }, [navigate]);

  const inviteLink = useMemo(() => {
    if (!roomId) return '';
    try {
      const base = window.location.origin;
      return `${base}/pokemonz-online?room=${roomId}`;
    } catch {
      return '';
    }
  }, [roomId]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch {
      prompt('Copy this text:', text);
    }
  }, []);

  if(status !== 'connected'){
    return (
      <div className="setup-screen">
        <div className="setup-form">
          <h2>PokemonZ Online (Beta)</h2>
          <div className="setup-field">
            <label>Your Name:
              <input value={playerName} onChange={e=>setPlayerName(e.target.value)} />
            </label>
          </div>
          <div className="setup-options">
            <div className="option-group">
              <h3>Create New Room</h3>
              <button className="play-button" disabled={status==='connecting'} onClick={handleCreateRoom}>Create</button>
              {roomId && isHost && (
                <div className="room-info">
                  Room Code: <span className="room-code">{roomId}</span>
                  {inviteLink && (
                    <div className="invite">
                      Invite Link: <span className="invite-link">{inviteLink}</span>
                      <button className="play-button" onClick={()=>copyText(inviteLink)}>Copy</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="option-separator">OR</div>
            <div className="option-group">
              <h3>Join Room</h3>
              <div className="setup-field">
                <label>Room Code:
                  <input value={roomId} maxLength={6} onChange={e=>setRoomId(e.target.value.toUpperCase())} placeholder="Enter 6-digit code" />
                </label>
              </div>
              <button className="play-button" disabled={!roomId || status==='connecting'} onClick={handleJoinRoom}>Join</button>
            </div>
          </div>
          {status==='connecting' && (<div className="connection-status">Connecting...</div>)}
          {error && (<div className="connection-error">{error}</div>)}
          <button className="return-button" onClick={handleReturn}>Return to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container" style={{width:'100%', height:'100vh'}}>
      <div className="connection-indicator">
        {'🟢 Connected'}
        {roomId && (
          <span style={{marginLeft:12}}>
            Room: <b>{roomId}</b>
            {inviteLink && (
              <>
                <span style={{marginLeft:8}}>
                  <button className="play-button" onClick={()=>copyText(inviteLink)}>Copy Invite</button>
                </span>
              </>
            )}
          </span>
        )}
        <span style={{marginLeft:12}}>
          <button className="return-button" onClick={handleReturn}>Leave</button>
        </span>
      </div>
      <MatchmakingModal
        isOpen={isMMOpen}
        isHost={isHost}
        roomId={roomId}
        slotsCount={slotsCount}
        allowedCounts={[3,4]}
        slots={slots}
        onChangeSlotsCount={(n)=> setSlotsCount(n)}
        onFillAI={(idx)=> setSlots(prev=>{ const next=[...prev]; next[idx] = { name: `AI ${idx+1}`, connected: true, isAI: true }; return next; })}
        onKickAI={(idx)=> setSlots(prev=>{ const next=[...prev]; next[idx] = { name: '—', connected: false, isAI: false }; return next; })}
        onStart={()=>{
          setIsMMOpen(false);
          const names = slots.slice(0, slotsCount).map(s=>s.name);
          postToIframe({ type: 'POKEMONZ_MATCH_START', payload: { count: slotsCount, names } });
        }}
        onClose={()=> setIsMMOpen(false)}
      />
      {/* Provide names to iframe for scoreboard */}
      <div style={{display:'none'}} data-mm-names={JSON.stringify(slots.slice(0, slotsCount).map(s=>s.name))} id="mmNamesCarrier" />
      <iframe ref={iframeRef} title="PokemonZ" src="/pokemonz.html" style={{border:'2px solid #00ffff', boxShadow:'0 0 15px rgba(0,255,255,0.4)', width:'96%', height:'88vh', borderRadius: '8px'}} />
    </div>
  );
};

export default PokemonZOnlinePage;


