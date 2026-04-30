const WebSocket = require('ws');
const db = require('../models/db');

let wss = null;

// 生成动态模拟游戏指标
function generateMockData() {
    return {
        onlinePlayers: Math.floor(Math.random() * 5000 + 1000),
        revenue: Math.floor(Math.random() * 50000 + 10000),
        activeServers: Math.floor(Math.random() * 5 + 3),
        avgLatency: Math.floor(Math.random() * 150 + 30)
    };
}

// 生成动态服务器状态（随机变化，便于触发告警）
function generateServers() {
    const baseServers = [
        { id: 's1', name: '游戏服务器-华北1', region: '华北' },
        { id: 's2', name: '游戏服务器-华东1', region: '华东' },
        { id: 's3', name: '游戏服务器-华南1', region: '华南' },
        { id: 's4', name: '游戏服务器-西南1', region: '西南' },
        { id: 's5', name: '游戏服务器-海外1', region: '海外' }
    ];
    return baseServers.map(server => {
        // 西南1固定离线，其他在线，但指标随机变化
        const isOnline = server.id !== 's4';
        return {
            ...server,
            status: isOnline ? 'online' : 'offline',
            players: isOnline ? Math.floor(Math.random() * 2000 + 200) : 0,
            cpu: isOnline ? Math.floor(Math.random() * 100) : 0,      // 0~99，可触发高负载
            memory: isOnline ? Math.floor(Math.random() * 100) : 0,
            latency: isOnline ? Math.floor(Math.random() * 150 + 20) : 0
        };
    });
}

function start() {
    const PORT = process.env.WS_PORT || 3002;
    wss = new WebSocket.Server({ port: PORT });
    console.log(`🔌 WebSocket 启动: ws://localhost:${PORT}`);

    wss.on('connection', (ws) => {
        console.log('✅ 客户端已连接');
        let isAlive = true;

        // 心跳：监听 pong 响应
        ws.on('pong', () => {
            isAlive = true;
        });

        // 心跳检测定时器（30秒）
        const heartbeatInterval = setInterval(() => {
            if (isAlive === false) {
                console.log('客户端心跳超时，断开连接');
                return ws.terminate();
            }
            isAlive = false;
            ws.ping(); // 发送 ping 帧，浏览器会自动回复 pong
        }, 30000);

        // 数据推送定时器（3秒）
        const dataInterval = setInterval(async () => {
            try {
                const metrics = generateMockData();
                const servers = generateServers();

                // 保存到数据库
                await db.saveMetrics(metrics);
                await db.saveServerStatus(servers);

                // 生成告警
                const alerts = [];
                for (const server of servers) {
                    if (server.status !== 'online') continue;
                    if (server.cpu > 80) {
                        alerts.push({
                            level: 'critical',
                            type: 'CPU过载',
                            message: `${server.name} CPU使用率 ${server.cpu}%`,
                            value: `${server.cpu}%`,
                            threshold: '80%'
                        });
                    } else if (server.memory > 85) {
                        alerts.push({
                            level: 'warning',
                            type: '内存不足',
                            message: `${server.name} 内存使用率 ${server.memory}%`,
                            value: `${server.memory}%`,
                            threshold: '85%'
                        });
                    }
                }

                // 保存告警并广播
                for (const alert of alerts) {
                    await db.saveAlert(alert);
                    const alertMsg = JSON.stringify({ type: 'alert', payload: alert });
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) client.send(alertMsg);
                    });
                }

                // 广播游戏数据
                const gameMsg = JSON.stringify({ type: 'gameData', payload: metrics, servers });
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) client.send(gameMsg);
                });

            } catch (err) {
                console.error('推送数据或保存时出错:', err);
            }
        }, 3000);

        ws.on('close', () => {
            clearInterval(dataInterval);
            clearInterval(heartbeatInterval);
            console.log('❌ 客户端断开');
        });

        ws.on('error', (err) => {
            console.error('WebSocket 错误:', err);
            clearInterval(dataInterval);
            clearInterval(heartbeatInterval);
            ws.terminate();
        });
    });
}

function stop() {
    if (wss) {
        wss.close();
        wss = null;
    }
}

module.exports = { start, stop };