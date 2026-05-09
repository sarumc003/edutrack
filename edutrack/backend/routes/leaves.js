// routes/leaves.js
const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware, notTeacher } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/leaves — get all leave records
router.get('/', (req, res) => {
  const db = getDb();
  const { teacher_id, month } = req.query;

  let query = `
    SELECT lr.*, t.name as teacher_name, t.subject
    FROM leave_records lr JOIN teachers t ON lr.teacher_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (teacher_id) { query += ' AND lr.teacher_id=?'; params.push(teacher_id); }
  if (month) { query += ' AND lr.date LIKE ?'; params.push(month + '%'); }

  query += ' ORDER BY lr.date DESC';

  const records = db.prepare(query).all(...params);
  db.close();
  res.json(records);
});

// POST /api/leaves — create leave record
router.post('/', notTeacher, (req, res) => {
  const { teacher_id, date, leave_type, reason } = req.body;
  if (!teacher_id || !date || !leave_type) {
    return res.status(400).json({ error: 'teacher_id, date, leave_type required' });
  }
  if (!['Medical','Casual','Duty','Annual','No Pay'].includes(leave_type)) {
    return res.status(400).json({ error: 'Invalid leave_type' });
  }

  const db = getDb();
  try {
    const id = db.prepare(`
      INSERT INTO leave_records (teacher_id, date, leave_type, reason, approved_by)
      VALUES (?,?,?,?,?)
    `).run(teacher_id, date, leave_type, reason||'', req.user.username).lastInsertRowid;

    // Also update attendance record to 'L'
    db.prepare(`
      INSERT INTO attendance (teacher_id, date, status, marked_by)
      VALUES (?,'${date}','L',?)
      ON CONFLICT(teacher_id, date) DO UPDATE SET status='L', marked_by=excluded.marked_by
    `).run(teacher_id, req.user.username);

    db.close();
    res.status(201).json({ id, message: 'Leave recorded' });
  } catch (e) {
    db.close();
    res.status(400).json({ error: e.message });
  }
});

// GET /api/leaves/balance/:teacher_id — leave balance for a teacher
router.get('/balance/:teacher_id', (req, res) => {
  const db = getDb();
  const year = new Date().getFullYear();

  const balance = db.prepare(`
    SELECT
      leave_type,
      COUNT(*) as days_taken
    FROM leave_records
    WHERE teacher_id=? AND date LIKE '${year}%'
    GROUP BY leave_type
  `).all(req.params.teacher_id);

  const maxLeave = { Medical: 21, Casual: 7, Duty: 30, Annual: 14, 'No Pay': 0 };
  const result = {};
  Object.keys(maxLeave).forEach(type => {
    const taken = balance.find(b => b.leave_type === type)?.days_taken || 0;
    result[type] = { taken, max: maxLeave[type], remaining: Math.max(0, maxLeave[type] - taken) };
  });

  db.close();
  res.json(result);
});

// DELETE /api/leaves/:id — delete leave record
router.delete('/:id', notTeacher, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM leave_records WHERE id=?').run(req.params.id);
  db.close();
  res.json({ message: 'Deleted' });
});

module.exports = router;
