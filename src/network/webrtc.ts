import { GameContext, Player, Category, GameState } from '../game/types';

// Network message types
export enum MessageType {
  GAME_ACTION = 'GAME_ACTION',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  GAME_STATE = 'GAME_STATE',
  PLAYER_INFO = 'PLAYER_INFO',
  CHAT = 'CHAT',
  PING = 'PING',
}

export interface NetworkMessage {
  type: MessageType;
  data: any;
  senderId: string;
  timestamp: number;
}

// Connection state
export let peerConnection: RTCPeerConnection | null = null;
export let dataChannel: RTCDataChannel | null = null;
let socket: WebSocket | null = null;
export let localPlayerId = Math.random().toString(36).substring(2);
let messageHandlers: ((message: NetworkMessage) => void)[] = [];

// Default ICE servers with optional TURN from env
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Optional TURN (configure in environment)
const TURN_URL = (import.meta as any).env?.VITE_TURN_URL as string | undefined;
const TURN_USERNAME = (import.meta as any).env?.VITE_TURN_USERNAME as string | undefined;
const TURN_CREDENTIAL = (import.meta as any).env?.VITE_TURN_CREDENTIAL as string | undefined;

if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
  ICE_SERVERS.push({
    urls: TURN_URL,
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL
  });
}

const config: RTCConfiguration = {
  iceServers: ICE_SERVERS
};

// Initialize WebRTC connection
export async function connectToPeer(signalingServerUrl: string, isInitiator: boolean = false): Promise<boolean> {
  try {
    // Connect to signaling server
    // The signalingServerUrl should already include the room parameter
    // e.g., "wss://example.com?room=ABC123"
    socket = new WebSocket(signalingServerUrl);

    // Log connection attempt
    console.log(`Connecting to signaling server: ${signalingServerUrl}`);

    // Create RTCPeerConnection
    peerConnection = new RTCPeerConnection(config);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: "candidate",
          candidate: event.candidate,
          id: localPlayerId
        });
      }
    };

    // Only the initiator creates the data channel
    if (isInitiator) {
      dataChannel = peerConnection.createDataChannel("game");
      setupDataChannel(dataChannel);
    }

    // Handle incoming data channels (non-initiator path)
    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      // Store globally so isConnected() and send* functions work for guests
      dataChannel = receiveChannel;
      setupDataChannel(receiveChannel);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state: ${peerConnection?.connectionState}`);
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerConnection?.iceConnectionState}`);
    };

    // Handle signaling messages
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        // Ignore messages from self
        if (message.id === localPlayerId) return;

        if (message.type === "offer" && peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendSignalingMessage({
            type: "answer",
            answer,
            id: localPlayerId
          });
        }

        if (message.type === "answer" && peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        }

        if (message.type === "candidate" && peerConnection) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      } catch (error) {
        console.error("Error handling signaling message:", error);
      }
    };

    // Handle signaling connection open
    return new Promise((resolve) => {
      if (!socket) {
        resolve(false);
        return;
      }

      socket.onopen = async () => {
        try {
          // Only initiator starts offer
          if (peerConnection && isInitiator) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            sendSignalingMessage({
              type: "offer",
              offer,
              id: localPlayerId
            });
          }
          resolve(true);
        } catch (error) {
          console.error("Error creating offer:", error);
          resolve(false);
        }
      };

      socket.onerror = () => {
        resolve(false);
      };
    });
  } catch (error) {
    console.error("Error connecting to peer:", error);
    return false;
  }
}

// Send a message through the signaling server
function sendSignalingMessage(message: any): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

// Set up data channel handlers
function setupDataChannel(channel: RTCDataChannel): void {
  // Ensure global reference is kept in sync for both initiator and guest
  dataChannel = channel;
  channel.onopen = () => {
    console.log(`Data channel ${channel.label} is open`);
  };

  channel.onclose = () => {
    console.log(`Data channel ${channel.label} is closed`);
  };

  channel.onerror = (error) => {
    console.error(`Data channel error:`, error);
  };

  channel.onmessage = (event) => {
    try {
      const message: NetworkMessage = JSON.parse(event.data);
      // Notify all message handlers
      messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };
}

// Send a game action to the peer
export function sendGameAction(action: any): void {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn("Data channel not open, can't send message");
    return;
  }

  const message: NetworkMessage = {
    type: MessageType.GAME_ACTION,
    data: action,
    senderId: localPlayerId,
    timestamp: Date.now()
  };

  dataChannel.send(JSON.stringify(message));
}

// Send a category selection to the peer
export function sendCategorySelection(category: Category): void {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn("Data channel not open, can't send category selection");
    return;
  }

  const message: NetworkMessage = {
    type: MessageType.CATEGORY_SELECT,
    data: category,
    senderId: localPlayerId,
    timestamp: Date.now()
  };

  dataChannel.send(JSON.stringify(message));
}

// Send the current game state to the peer
export function sendGameState(gameState: GameContext): void {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn("Data channel not open, can't send game state");
    return;
  }

  const message: NetworkMessage = {
    type: MessageType.GAME_STATE,
    data: gameState,
    senderId: localPlayerId,
    timestamp: Date.now()
  };

  dataChannel.send(JSON.stringify(message));
}

// Send player information to the peer
export function sendPlayerInfo(player: Player): void {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn("Data channel not open, can't send player info");
    return;
  }

  const message: NetworkMessage = {
    type: MessageType.PLAYER_INFO,
    data: player,
    senderId: localPlayerId,
    timestamp: Date.now()
  };

  dataChannel.send(JSON.stringify(message));
}

// Register a message handler
export function addMessageHandler(handler: (message: NetworkMessage) => void): void {
  messageHandlers.push(handler);
}

// Remove a message handler
export function removeMessageHandler(handler: (message: NetworkMessage) => void): void {
  messageHandlers = messageHandlers.filter(h => h !== handler);
}

// Check if peer connection is established
export function isConnected(): boolean {
  return peerConnection !== null &&
         dataChannel !== null &&
         dataChannel.readyState === 'open';
}

// Disconnect from peer
export function disconnect(): void {
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}