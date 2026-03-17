import { io } from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.handlers = new Map()
  }

  connect() {
    const wsUrl = import.meta.env.VITE_APP_WS_URL
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    this.socket.on('connect', () => {
      console.log('WebSocket连接成功')
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket连接断开')
    })

    this.socket.on('gameData', (data) => {
      this._handleMessage('gameData', data)
    })

    this.socket.on('alert', (data) => {
      this._handleMessage('alert', data)
    })

    return this.socket
  }

  _handleMessage(type, data) {
    if (this.handlers.has(type)) {
      this.handlers.get(type).forEach(callback => callback(data))
    }
  }

  on(type, callback) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type).push(callback)
  }

  off(type, callback) {
    if (this.handlers.has(type)) {
      const callbacks = this.handlers.get(type).filter(cb => cb !== callback)
      this.handlers.set(type, callbacks)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export default new WebSocketService()