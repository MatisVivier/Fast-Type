import { io } from 'socket.io-client';

export const socket = io('https://fast-type-back.onrender.com', {
  withCredentials: true,
  // laissez le polling possible pour établir la connexion puis upgrade en WS
  transports: ['polling', 'websocket'],
  // explicite mais optionnel (c’est la valeur par défaut)
  path: '/socket.io',
  // plus tolérant aux réseaux “capricieux”
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 10000,
});
