const mysql = require('mysql2')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'game_monitor',
    waitForConnections: true,
    connectionLimit: 10
}).promise()

// 测试数据库连接
async function testConnection() {
    try {
        const [result] = await pool.query('SELECT 1')
        console.log('✅ 数据库连接成功')
        return true
    } catch (err) {
        console.error('❌ 数据库连接失败:', err.message)
        return false
    }
}

async function saveMetrics(metrics) {
    const sql = `INSERT INTO game_metrics (online_players, revenue, active_servers, avg_latency) VALUES (?, ?, ?, ?)`
    const [result] = await pool.execute(sql, [
        metrics.onlinePlayers || 0,
        metrics.revenue || 0,
        metrics.activeServers || 0,
        metrics.avgLatency || 0
    ])
    return result.insertId
}

async function getLatestMetrics() {
    const [rows] = await pool.execute(`SELECT * FROM game_metrics ORDER BY record_time DESC LIMIT 1`)
    return rows[0] || null
}

async function getHistoryMetrics(days = 7) {
    const [rows] = await pool.execute(
        `SELECT * FROM game_metrics WHERE record_time >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY record_time`,
        [days]
    )
    return rows
}

async function getAllServers() {
    const [rows] = await pool.execute(`SELECT * FROM servers ORDER BY name`)
    return rows
}

async function saveServerStatus(servers) {
    for (const server of servers) {
        await pool.execute(
            `INSERT INTO servers (id, name, region, status, players, cpu, memory, latency, last_update)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
             name=VALUES(name), region=VALUES(region), status=VALUES(status),
             players=VALUES(players), cpu=VALUES(cpu), memory=VALUES(memory),
             latency=VALUES(latency), last_update=NOW()`,
            [server.id, server.name, server.region, server.status, server.players, server.cpu, server.memory, server.latency]
        )
    }
}

async function saveAlert(alert) {
    const sql = `INSERT INTO alerts (level, type, message, value, threshold) VALUES (?, ?, ?, ?, ?)`
    const [result] = await pool.execute(sql, [alert.level, alert.type, alert.message, alert.value, alert.threshold])
    return result.insertId
}

async function getAlerts(limit = 100) {
    const [rows] = await pool.execute(`SELECT * FROM alerts ORDER BY create_time DESC LIMIT ?`, [limit])
    return rows
}

module.exports = {
    pool,
    testConnection,        
    saveMetrics,
    getLatestMetrics,
    getHistoryMetrics,
    getAllServers,
    saveServerStatus,
    saveAlert,
    getAlerts
}