// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../db/init');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  db.close();

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = { id: user.id, username: user.username, role: user.role };

  // If teacher, attach teacher record
  const db2 = getDb();
  let teacher = null;
  if (user.role === 'teacher') {
    teacher = db2.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
  }
  db2.close();

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { ...payload, teacher } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  let data = { ...req.user };
  if (req.user.role === 'teacher') {
    data.teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(req.user.id);
  }
  db.close();
  res.json(data);
});

module.exports = router;
