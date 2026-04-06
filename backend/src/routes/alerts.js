const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 100
    const alerts = await db.getAlerts(limit)
    res.json(alerts)
})

router.put('/:id/resolve', async (req, res) => {
    await db.resolveAlert(req.params.id)
    res.json({ success: true })
})

module.exports = router