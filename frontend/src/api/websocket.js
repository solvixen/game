class WebSocketService {
  constructor() {
    this.socket = null
    this.handlers = new Map()
    this.reconnectTimer = null
    this.url = import.meta.env.VITE_APP_WS_URL
    this._statusListeners = []
    this._retryCount = 0 // 指数退避计数
    this._retryBaseMs = 2000 // 初始重连间隔 2s
    this._retryMaxMs = 30000 // 重连上限 30s
    this._seenIds = new Set() // 消息去重（保留最近200条ID）
    this._latency = 0 // 消息延迟（ms）
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return
    if (!this.url) return

    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      console.log(`✅ WebSocket 连接成功: ${this.url}`)
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this._retryCount = 0 // 重置退避计数
      this._notifyStatus(true)
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const { type, payload, servers, msgId, serverTime } = data
        if (type === 'ping') return

        // 计算端到端消息延迟（毫秒）
        if (serverTime) {
          this._latency = Date.now() - serverTime
        }

        // 消息去重：已见过的 msgId 直接跳过
        if (msgId) {
          if (this._seenIds.has(msgId)) return
          this._seenIds.add(msgId)
          if (this._seenIds.size > 200) {
            // 保留最近200条，防止内存泄漏
            const it = this._seenIds.values()
            this._seenIds.delete(it.next().value)
          }
        }

        if (type === 'gameData' && this.handlers.has('gameData')) {
          this.handlers.get('gameData').forEach((cb) => cb(payload, servers))
        }
        if (type === 'alert' && this.handlers.has('alert')) {
          this.handlers.get('alert').forEach((cb) => cb(payload))
        }
      } catch (err) {
        console.error('解析消息失败:', err)
      }
    }

    this.socket.onclose = () => {
      this._retryCount++
      const delay = Math.min(
        this._retryBaseMs * Math.pow(2, this._retryCount - 1),
        this._retryMaxMs
      )
      console.warn(`WebSocket 断开，${(delay / 1000).toFixed(1)}s 后第${this._retryCount}次重连`)
      this._notifyStatus(false)
      this.reconnectTimer = setTimeout(() => this.connect(), delay)
    }
  }

  on(type, callback) {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type).push(callback)
  }

  off(type, callback) {
    if (this.handlers.has(type)) {
      this.handlers.set(
        type,
        this.handlers.get(type).filter((cb) => cb !== callback)
      )
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  _notifyStatus(connected) {
    this._statusListeners.forEach((cb) => cb(connected))
  }

  onStatus(callback) {
    this._statusListeners.push(callback)
    return () => {
      this._statusListeners = this._statusListeners.filter((cb) => cb !== callback)
    }
  }

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  get latency() {
    return this._latency
  }
}

export default new WebSocketService()
