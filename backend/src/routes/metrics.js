const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/latest', async (req, res) => {
    const metrics = await db.getLatestMetrics()
    res.json(metrics || { onlinePlayers: 0, revenue: 0, activeServers: 0, avgLatency: 0 })
})

router.get('/history', async (req, res) => {
    const days = parseInt(req.query.days) || 7
    const data = await db.getHistoryMetrics(days)
    res.json(data)
})

router.get('/trend', async (req, res) => {
    const days = parseInt(req.query.days) || 7
    const history = await db.getHistoryMetrics(days)
    res.json({
        labels: history.map(h => new Date(h.record_time).toLocaleDateString()),
        dauData: history.map(h => h.online_players),
        revenueData: history.map(h => h.revenue)
    })
})

module.exports = router