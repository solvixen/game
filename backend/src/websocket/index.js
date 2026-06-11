const WebSocket = require('ws');
const db = require('../models/db');

let wss = null;
let _msgSeq = 0;  // 消息序号，用于去重
const _serverHistory = {};  // 同比动态阈值：记录上一周期各服务器指标

// 生成动态模拟游戏指标
function generateMockData() {
    return {
        onlinePlayers: Math.floor(Math.random() * 5000 + 1000),
        newPlayers: Math.floor(Math.random() * 200 + 20),
        revenue: Math.floor(Math.random() * 50000 + 10000),
        activeServers: Math.floor(Math.random() * 5 + 3),
        latency: Math.floor(Math.random() * 150 + 30)
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
                // 写入服务器历史快照（论文第5张表）
                db.saveServerHistory(servers).catch(err => console.error('保存服务器历史失败:', err));

                // 生成告警（静态阈值 + 同比动态阈值双重判定）
                const alerts = [];
                for (const server of servers) {
                    if (server.status !== 'online') continue;

                    // --- 静态阈值 ---
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

                    // --- 同比动态阈值（偏差 > 50%，每服务器最多1条）---
                    const prev = _serverHistory[server.id];
                    if (prev) {
                        const DYNAMIC_PCT = 50;  // 同比偏差阈值 50%（避免模拟数据频繁波动触发）
                        const checks = [
                            { key: 'cpu', label: 'CPU使用率', unit: '%' },
                            { key: 'memory', label: '内存使用率', unit: '%' },
                            { key: 'latency', label: '延迟', unit: 'ms' },
                            { key: 'players', label: '在线玩家', unit: '人' },
                        ];
                        // 只取偏差最大的一个指标告警（每服务器每周期最多1条）
                        let maxDev = 0, maxInfo = null;
                        for (const { key, label, unit } of checks) {
                            const prevVal = prev[key] || 0;
                            const currVal = server[key] || 0;
                            if (prevVal === 0) continue;
                            const deviation = Math.abs(currVal - prevVal) / prevVal * 100;
                            if (deviation > DYNAMIC_PCT && deviation > maxDev) {
                                maxDev = deviation;
                                maxInfo = { label, unit, prevVal, currVal, deviation };
                            }
                        }
                        if (maxInfo) {
                            const direction = maxInfo.currVal > maxInfo.prevVal ? '↑上升' : '↓下降';
                            alerts.push({
                                level: 'warning',
                                type: '同比异常',
                                message: `${server.name} ${maxInfo.label} ${direction} ${maxInfo.deviation.toFixed(0)}%（${maxInfo.prevVal}→${maxInfo.currVal}${maxInfo.unit}）`,
                                value: `${maxInfo.deviation.toFixed(0)}%`,
                                threshold: `${DYNAMIC_PCT}%`
                            });
                        }
                    }
                    // 更新历史记录
                    _serverHistory[server.id] = {
                        cpu: server.cpu, memory: server.memory,
                        latency: server.latency, players: server.players
                    };
                }

                // 保存告警并广播（带消息ID去重 + 时间戳）
                for (const alert of alerts) {
                    await db.saveAlert(alert);
                    const alertMsg = JSON.stringify({ type: 'alert', payload: alert, msgId: ++_msgSeq, serverTime: Date.now() });
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) client.send(alertMsg);
                    });
                }

                // 广播游戏数据（带消息ID去重 + 时间戳）
                const gameMsg = JSON.stringify({ type: 'gameData', payload: metrics, servers, msgId: ++_msgSeq, serverTime: Date.now() });
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