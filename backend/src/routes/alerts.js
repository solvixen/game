const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 获取告警列表（支持分页和级别筛选）
router.get('/', async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 10;
        let offset = parseInt(req.query.offset) || 0;
        const level = req.query.level || null;

        // 确保数字有效
        if (isNaN(limit) || limit < 1) limit = 10;
        if (isNaN(offset) || offset < 0) offset = 0;

        const [data, total] = await Promise.all([
            db.getAlerts(limit, offset, level),
            db.getAlertsCount(level)
        ]);

        res.json({ data, total });
    } catch (err) {
        console.error('获取告警列表失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 处理单个告警
router.put('/:id/resolve', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: '无效ID' });
        await db.resolveAlert(id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 批量处理
router.put('/batch/resolve', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: '参数错误' });
        }
        await db.batchResolveAlerts(ids);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;