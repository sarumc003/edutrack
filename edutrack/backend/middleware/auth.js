// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secret_2024_change_in_production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function principalOnly(req, res, next) {
  if (req.user.role !== 'principal') return res.status(403).json({ error: 'Principal only' });
  next();
}

function notTeacher(req, res, next) {
  if (req.user.role === 'teacher') return res.status(403).json({ error: 'Not allowed for teachers' });
  next();
}

module.exports = { authMiddleware, principalOnly, notTeacher, JWT_SECRET };
