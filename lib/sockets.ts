import { io, type Socket } from 'socket.io-client';

function getWsUrl(): string {
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

  // If the API URL is explicitly configured to a remote server, we should NOT
  // connect to localhost for WebSockets, even if we are on localhost ourselves
  // or if NEXT_PUBLIC_WS_URL is left at its default localhost value.
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    if (!envWsUrl || envWsUrl.includes('localhost') || envWsUrl.includes('127.0.0.1')) {
      return envApiUrl.replace(/\/v\d+\/?$/, '');
    }
  }

  if (envWsUrl) return envWsUrl;
  if (envApiUrl) return envApiUrl.replace(/\/v\d+\/?$/, '');

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  // In production, NEXT_PUBLIC_WS_URL must be set as a Vercel environment
  // variable. Returning '' causes an obvious connection failure rather than
  // silently using a stale hardcoded URL that breaks if the backend moves.
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.error(
      '[Steward] CRITICAL: NEXT_PUBLIC_WS_URL is not set. ' +
      'Socket connections will fail. ' +
      'Set this variable in Vercel (Settings → Environment Variables) and redeploy.'
    );
  }
  return '';
}

const WS_URL = getWsUrl();

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
  // Update the auth token used on the next handshake.
  // Do NOT disconnect an active connection — the backend only verifies the
  // JWT on initial connect, so an active socket stays valid until the server
  // closes it. Disconnecting here would cause kitchen staff to miss new-order
  // events during the ~2-3 s reconnect window that fires every 15 min.
  (socket as any).auth = { token };
  // Only reconnect if currently disconnected (e.g. token expired mid-backoff
  // and we now have a fresh one to retry with).
  if (!socket.connected) {
    socket.connect();
  }
}
