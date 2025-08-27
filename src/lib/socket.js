import io from 'socket.io-client';

export const socket = io('https://fast-type-back.onrender.com', {
  withCredentials: true,
  transports: ['polling'], // ← laisse polling en 1er, upgrade ensuite
  upgrade: true,                        // ← (valeur par défaut) on autorise l’upgrade
  path: '/socket.io',                   // ← défaut, mais on le fixe pour éviter surprises
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 10000,
});

// (facultatif) logs utiles
socket.on('connect', () => console.log('✅ connected via', socket.io.engine.transport.name));
socket.io.engine.on('upgrade', () =>
  console.log('🔁 upgraded to', socket.io.engine.transport.name)
);
socket.on('connect_error', (e) => console.log('❌ connect_error', e.message));
