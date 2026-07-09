import { io, type Socket } from 'socket.io-client';
import { WS_URL } from "./config/env";

let socket: Socket | null = null;
let activeConsumers = 0;

export function getSocket(accessToken?: string): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 20_000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: accessToken ? { token: accessToken } : {},
    });
  } else if (accessToken) {
    (socket as any).auth = { token: accessToken };
  }
  return socket;
}

export function acquireSocket(accessToken: string): Socket {
  activeConsumers += 1;
  return getSocket(accessToken);
}

export function releaseSocket(): void {
  activeConsumers = Math.max(0, activeConsumers - 1);
  if (activeConsumers === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    activeConsumers = 0;
  }
}

export function updateSocketAuth(token: string): void {
  if (!socket) return;
  
  const previousToken = (socket as any).auth?.token;
  (socket as any).auth = { token };

  // If the token changed (e.g. branch switched, login, token refresh),
  // we MUST disconnect and reconnect so the server re-validates the handshake
  // and binds the socket to the new branch room.
  if (previousToken && previousToken !== token) {
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  } else if (!socket.connected) {
    socket.connect();
  }
}
