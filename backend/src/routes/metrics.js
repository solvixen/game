const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 获取最新指标
router.get('/latest', async (req, res) => {
    try {
        const metrics = await db.getLatestMetrics();
        res.json(metrics || { onlinePlayers: 0, revenue: 0, activeServers: 0, avgLatency: 0 });
    } catch (err) {
        console.error('获取最新指标失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取历史指标（JSON 数组）
router.get('/history', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = await db.getHistoryMetrics(days);
        res.json(data);
    } catch (err) {
        console.error('获取历史指标失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取趋势数据（用于前端图表）
router.get('/trend', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const history = await db.getHistoryMetrics(days);

        // 如果 history 为空，返回空数组
        if (!history || history.length === 0) {
            return res.json({ labels: [], dauData: [], revenueData: [] });
        }

        // 格式化标签：显示 MM/DD HH:MM
        const labels = history.map(item => {
            if (!item.record_time) return '未知';
            const date = new Date(item.record_time);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${month}/${day} ${hours}:${minutes}`;
        });

        const dauData = history.map(item => item.online_players || 0);
        const revenueData = history.map(item => item.revenue || 0);

        res.json({ labels, dauData, revenueData });
    } catch (err) {
        console.error('获取趋势数据失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 指标统计（可选）
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getMetricsStats();
        res.json(stats);
    } catch (err) {
        console.error('获取指标统计失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;