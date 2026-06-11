const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', async (req, res) => {
    try {
        const servers = await db.getAllServers();
        res.json(servers);
    } catch (err) {
        console.error('查询服务器列表失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const servers = await db.getAllServers()
        const online = servers.filter(s => s.status === 'online')
        res.json({
            total: servers.length,
            online: online.length,
            offline: servers.length - online.length,
            avgCpu: Math.round(online.reduce((s, a) => s + a.cpu, 0) / (online.length || 1))
        })
    } catch (err) {
        console.error('查询服务器统计失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取指定服务器的历史快照
router.get('/:id/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 60;
        const history = await db.getServerHistory(req.params.id, limit);
        res.json(history);
    } catch (err) {
        console.error('查询服务器历史失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router
