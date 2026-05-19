class WebSocketService {
    constructor() {
        this.socket = null
        this.handlers = new Map()
        this.reconnectTimer = null
        this.url = import.meta.env.VITE_APP_WS_URL
        this._statusListeners = []
    }

connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (!this.url) return;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
        console.log(`✅ WebSocket 连接成功: ${this.url}`);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this._notifyStatus(true);
    };

    this.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const { type, payload, servers } = data;
            if (type === 'ping') return; 
            if (type === 'gameData' && this.handlers.has('gameData')) {
                this.handlers.get('gameData').forEach(cb => cb(payload, servers));
            }
            if (type === 'alert' && this.handlers.has('alert')) {
                this.handlers.get('alert').forEach(cb => cb(payload));
            }
        } catch (err) {
            console.error('解析消息失败:', err);
        }
    };

    this.socket.onclose = () => {
        console.warn('WebSocket 断开，5秒后重连');
        this._notifyStatus(false);
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };
}

    on(type, callback) {
        if (!this.handlers.has(type)) this.handlers.set(type, [])
        this.handlers.get(type).push(callback)
    }

    off(type, callback) {
        if (this.handlers.has(type)) {
            this.handlers.set(type, this.handlers.get(type).filter(cb => cb !== callback))
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
        this._statusListeners.forEach(cb => cb(connected))
    }

    onStatus(callback) {
        this._statusListeners.push(callback)
        return () => {
            this._statusListeners = this._statusListeners.filter(cb => cb !== callback)
        }
    }

    get connected() {
        return this.socket?.readyState === WebSocket.OPEN
    }
}

export default new WebSocketService()