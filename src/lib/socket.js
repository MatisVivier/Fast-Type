import io from 'socket.io-client';

export const socket = io('https://fast-type-back.onrender.com', {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 10000,
});
