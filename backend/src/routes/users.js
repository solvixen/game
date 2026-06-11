const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcryptjs');

// 获取所有用户列表（不含密码）
router.get('/', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 新增用户
router.post('/', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 检查用户名是否已存在
        const existing = await db.findUserByUsername(username);
        if (existing) {
            return res.status(409).json({ error: '用户名已存在' });
        }

        const validRoles = ['admin', 'operator', 'developer', 'viewer'];
        const userRole = validRoles.includes(role) ? role : 'viewer';

        const newId = await db.createUser(username, password, userRole);
        res.json({ message: '用户创建成功', id: newId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新用户（修改密码或角色）
router.put('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: '无效的用户ID' });
        }

        const { password, role } = req.body;
        const updates = {};

        if (password !== undefined && password !== '') {
            updates.password = password;
        }

        if (role !== undefined) {
            const validRoles = ['admin', 'operator', 'developer', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: '无效的角色' });
            }
            // 不能把自己降级为 non-admin
            if (req.user.userId === userId && role !== 'admin') {
                return res.status(403).json({ error: '不能修改自己的管理员角色' });
            }
            updates.role = role;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: '没有需要更新的内容' });
        }

        await db.updateUser(userId, updates);
        res.json({ message: '用户更新成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除用户
router.delete('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: '无效的用户ID' });
        }

        // 不能删除自己
        if (req.user.userId === userId) {
            return res.status(403).json({ error: '不能删除自己的账号' });
        }

        await db.deleteUser(userId);
        res.json({ message: '用户删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
