// src/lib/socket.js
import io from 'socket.io-client'

// 🔧 URL Render de ton back
const PROD_WS = 'https://fast-type-back.onrender.com' // TODO: remplace

export const socket = io(
  import.meta.env.PROD ? PROD_WS : 'http://localhost:3001',
  {
    transports: ['websocket'],
    withCredentials: true,
  }
)
