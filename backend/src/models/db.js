const mysql = require('mysql2');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'game_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    decimalNumbers: true
}).promise();

// ==================== 测试连接 ====================
async function testConnection() {
    try {
        const [result] = await pool.query('SELECT 1');
        console.log('✅ 数据库连接成功');
        return true;
    } catch (err) {
        console.error('❌ 数据库连接失败:', err.message);
        return false;
    }
}

// ==================== 游戏指标相关 ====================
async function saveMetrics(metrics) {
    const sql = `INSERT INTO game_metrics (online_players, revenue, active_servers, avg_latency) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
        metrics.onlinePlayers || 0,
        metrics.revenue || 0,
        metrics.activeServers || 0,
        metrics.latency || 0
    ]);
    return result.insertId;
}

async function getLatestMetrics() {
    const [rows] = await pool.execute('SELECT * FROM game_metrics ORDER BY record_time DESC LIMIT 1');
    return rows[0] || null;
}

async function getHistoryMetrics(days = 7) {
    const sql = `SELECT * FROM game_metrics WHERE record_time >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY record_time ASC`;
    const [rows] = await pool.execute(sql, [days]);
    return rows;
}

// ==================== 服务器相关 ====================
async function getAllServers() {
    const [rows] = await pool.execute('SELECT * FROM servers ORDER BY name');
    return rows;
}

async function saveServerStatus(servers) {
    for (const server of servers) {
        const upsertSql = `INSERT INTO servers (id, name, region, status, players, cpu, memory, latency, last_update)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                           ON DUPLICATE KEY UPDATE
                           name = VALUES(name), region = VALUES(region), status = VALUES(status),
                           players = VALUES(players), cpu = VALUES(cpu), memory = VALUES(memory),
                           latency = VALUES(latency), last_update = NOW()`;
        await pool.execute(upsertSql, [
            server.id, server.name, server.region,
            server.status, server.players,
            server.cpu, server.memory, server.latency
        ]);
    }
}

// ==================== 告警相关 ====================
async function saveAlert(alert) {
    const sql = `INSERT INTO alerts (level, type, message, value, threshold, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`;
    const [result] = await pool.execute(sql, [
        alert.level, alert.type, alert.message,
        alert.value, alert.threshold
    ]);
    return result.insertId;
}

async function getAlerts(limit = 10, offset = 0, level = null) {
    // 安全转换：使用 parseInt 并检查
    let safeLimit = parseInt(limit, 10);
    let safeOffset = parseInt(offset, 10);
    if (isNaN(safeLimit) || safeLimit < 1) safeLimit = 10;
    if (isNaN(safeOffset) || safeOffset < 0) safeOffset = 0;

    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, safeOffset);

    console.log('[getAlerts] SQL:', sql);
    console.log('[getAlerts] params:', params);

    // 注意改为 pool.query（参数化查询同样安全）
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getAlertsCount(level = null) {
    let sql = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
    const params = [];
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }
    const [rows] = await pool.execute(sql, params);
    return rows[0].total;
}

async function resolveAlert(alertId) {
    const id = parseInt(alertId);
    if (isNaN(id)) throw new Error('无效的告警ID');
    const sql = 'UPDATE alerts SET status = "resolved", resolve_time = NOW() WHERE id = ?';
    await pool.execute(sql, [id]);
}

async function batchResolveAlerts(alertIds) {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) return;
    const ids = alertIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE alerts SET status = "resolved", resolve_time = NOW() WHERE id IN (${placeholders})`;
    await pool.execute(sql, ids);
}

async function deleteAlert(alertId) {
    const id = parseInt(alertId);
    if (isNaN(id)) throw new Error('无效的告警ID');
    await pool.execute('DELETE FROM alerts WHERE id = ?', [id]);
}

async function batchDeleteAlerts(alertIds) {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) return;
    const ids = alertIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM alerts WHERE id IN (${placeholders})`;
    await pool.execute(sql, ids);
}

// ==================== 指标统计 ====================
async function getMetricsStats() {
    // 游戏指标统计
    const [metricRows] = await pool.execute(
        `SELECT COUNT(*) as totalRecords, AVG(online_players) as avgOnlinePlayers,
                AVG(revenue) as avgRevenue, AVG(avg_latency) as avgLatency
         FROM game_metrics`
    );
    // 服务器最高CPU
    const [serverRows] = await pool.execute(`SELECT MAX(cpu) as maxCpu FROM servers WHERE status = 'online'`);
    // 告警统计
    const [alertRows] = await pool.execute(`SELECT COUNT(*) as totalAlerts FROM alerts`);
    const [pendingRows] = await pool.execute(`SELECT COUNT(*) as pendingAlerts FROM alerts WHERE status = 'pending'`);

    return {
        totalRecords: metricRows[0].totalRecords || 0,
        avgOnlinePlayers: parseFloat(metricRows[0].avgOnlinePlayers) || 0,
        avgRevenue: parseFloat(metricRows[0].avgRevenue) || 0,
        avgLatency: parseFloat(metricRows[0].avgLatency) || 0,
        maxCpu: serverRows[0].maxCpu || 0,
        totalAlerts: alertRows[0].totalAlerts || 0,
        pendingAlerts: pendingRows[0].pendingAlerts || 0,
    };
}

// ==================== 用户相关（可选，用于登录） ====================
async function findUserByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
}

async function updateUserLoginTime(userId) {
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
}

// ==================== 服务器历史快照 ====================
async function saveServerHistory(servers) {
    for (const server of servers) {
        const sql = `INSERT INTO server_history (server_id, name, region, status, players, cpu, memory, latency)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await pool.execute(sql, [
            server.id, server.name, server.region,
            server.status, server.players,
            server.cpu, server.memory, server.latency
        ]);
    }
}

async function getServerHistory(serverId, limit = 60) {
    let sql = 'SELECT * FROM server_history WHERE 1=1';
    const params = [];
    if (serverId) {
        sql += ' AND server_id = ?';
        params.push(serverId);
    }
    sql += ' ORDER BY snapshot_time DESC LIMIT ?';
    params.push(parseInt(limit) || 60);
    const [rows] = await pool.query(sql, params);
    return rows;
}

// ==================== 用户管理 CRUD ====================
async function getAllUsers() {
    const [rows] = await pool.execute(
        'SELECT id, username, role, last_login, created_at FROM users ORDER BY id ASC'
    );
    return rows;
}

async function createUser(username, password, role = 'viewer') {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const [result] = await pool.execute(sql, [username, hashedPassword, role]);
    return result.insertId;
}

async function updateUser(userId, updates) {
    const fields = [];
    const params = [];
    if (updates.password !== undefined) {
        const bcrypt = require('bcryptjs');
        fields.push('password = ?');
        params.push(bcrypt.hashSync(updates.password, 10));
    }
    if (updates.role !== undefined) {
        fields.push('role = ?');
        params.push(updates.role);
    }
    if (fields.length === 0) return;
    params.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(sql, params);
}

async function deleteUser(userId) {
    const id = parseInt(userId);
    if (isNaN(id)) throw new Error('无效的用户ID');
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
}

// ==================== 导出所有方法 ====================
module.exports = {
    pool,
    // 连接测试
    testConnection,
    // 指标
    saveMetrics,
    getLatestMetrics,
    getHistoryMetrics,
    getMetricsStats,
    // 服务器
    getAllServers,
    saveServerStatus,
    // 告警
    saveAlert,
    getAlerts,
    getAlertsCount,
    resolveAlert,
    batchResolveAlerts,
    deleteAlert,
    batchDeleteAlerts,
    // 服务器历史
    saveServerHistory,
    getServerHistory,
    // 用户（登录）
    findUserByUsername,
    updateUserLoginTime,
    // 用户（管理）
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
};