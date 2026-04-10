const WebSocket = require('ws')
const db = require('../models/db')

let wss = null

function generateMockData() {
    return {
        onlinePlayers: Math.floor(Math.random() * 5000 + 1000),
        revenue: Math.floor(Math.random() * 50000 + 10000),
        activeServers: Math.floor(Math.random() * 5 + 3),
        avgLatency: Math.floor(Math.random() * 150 + 30)
    }
}

function generateServers() {
    return [
        { id: 's1', name: '游戏服务器-华北1', region: '华北', status: 'online', players: 1234, cpu: 45, memory: 52, latency: 32 },
        { id: 's2', name: '游戏服务器-华东1', region: '华东', status: 'online', players: 2345, cpu: 68, memory: 61, latency: 45 },
        { id: 's3', name: '游戏服务器-华南1', region: '华南', status: 'online', players: 3456, cpu: 82, memory: 75, latency: 89 },
        { id: 's4', name: '游戏服务器-西南1', region: '西南', status: 'offline', players: 0, cpu: 0, memory: 0, latency: 0 },
        { id: 's5', name: '游戏服务器-海外1', region: '海外', status: 'online', players: 567, cpu: 34, memory: 41, latency: 156 }
    ]
}

function start() {
    const PORT = process.env.WS_PORT || 3002
    wss = new WebSocket.Server({ port: PORT })
    console.log(`🔌 WebSocket 启动: ws://localhost:${PORT}`)

    wss.on('connection', (ws) => {
        console.log('✅ 客户端已连接')
        let isAlive = true
    ws.on('pong', () => {
        isAlive = true
    })
    
    const heartbeatInterval = setInterval(() => {
        if (isAlive === false) {
            console.log('客户端心跳超时，断开连接')
            return ws.terminate()
        }
        isAlive = false
        ws.ping()
    }, 30000)
        
        const interval = setInterval(async () => {
            const metrics = generateMockData()
            const servers = generateServers()
            
            await db.saveMetrics(metrics)
            await db.saveServerStatus(servers)
            
            const message = JSON.stringify({ type: 'gameData', payload: metrics, servers })
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) client.send(message)
            })
        }, 3000)

        ws.on('close', () => {
            clearInterval(interval)
            console.log('❌ 客户端断开')
        })
    })
}

function stop() {
    if (wss) wss.close()
}

module.exports = { start, stop }