// routes/attendance.js
const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware, notTeacher } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/attendance?date=YYYY-MM-DD — get all attendance for a date
router.get('/', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const db = getDb();
  const records = db.prepare(`
    SELECT a.*, t.name as teacher_name, t.subject
    FROM attendance a JOIN teachers t ON a.teacher_id = t.id
    WHERE a.date=? AND t.active=1
    ORDER BY t.name
  `).all(date);
  db.close();
  res.json(records);
});

// GET /api/attendance/summary — summary stats for today
router.get('/summary', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const db = getDb();
  const summary = db.prepare(`
    SELECT
      COUNT(CASE WHEN a.status='P' THEN 1 END) as present,
      COUNT(CASE WHEN a.status='A' THEN 1 END) as absent,
      COUNT(CASE WHEN a.status='L' THEN 1 END) as on_leave,
      COUNT(*) as total
    FROM attendance a
    JOIN teachers t ON a.teacher_id = t.id
    WHERE a.date=? AND t.active=1
  `).get(date);
  db.close();
  res.json(summary);
});

// POST /api/attendance — mark/update attendance
router.post('/', notTeacher, (req, res) => {
  const { teacher_id, date, status } = req.body;
  if (!teacher_id || !date || !status) return res.status(400).json({ error: 'teacher_id, date, status required' });
  if (!['P','A','L','H'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDb();
  db.prepare(`
    INSERT INTO attendance (teacher_id, date, status, marked_by)
    VALUES (?,?,?,?)
    ON CONFLICT(teacher_id, date) DO UPDATE SET status=excluded.status, marked_by=excluded.marked_by
  `).run(teacher_id, date, status, req.user.username);
  db.close();
  res.json({ message: 'Attendance recorded' });
});

// POST /api/attendance/bulk — mark multiple at once
router.post('/bulk', notTeacher, (req, res) => {
  const { records, date } = req.body;
  if (!records || !Array.isArray(records)) return res.status(400).json({ error: 'records array required' });

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO attendance (teacher_id, date, status, marked_by)
    VALUES (?,?,?,?)
    ON CONFLICT(teacher_id, date) DO UPDATE SET status=excluded.status, marked_by=excluded.marked_by
  `);

  const insertMany = db.transaction((recs) => {
    for (const r of recs) stmt.run(r.teacher_id, date || r.date, r.status, req.user.username);
  });
  insertMany(records);
  db.close();
  res.json({ message: `${records.length} records saved` });
});

// GET /api/attendance/teacher/:id — teacher's own attendance history
router.get('/teacher/:id', (req, res) => {
  // Teachers can only see their own
  if (req.user.role === 'teacher') {
    const db = getDb();
    const myTeacher = db.prepare('SELECT id FROM teachers WHERE user_id=?').get(req.user.id);
    db.close();
    if (!myTeacher || myTeacher.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const db = getDb();
  const records = db.prepare(`
    SELECT date, status FROM attendance WHERE teacher_id=? ORDER BY date DESC LIMIT 90
  `).all(req.params.id);

  const stats = db.prepare(`
    SELECT
      COUNT(CASE WHEN status='P' THEN 1 END) as present_days,
      COUNT(CASE WHEN status='A' THEN 1 END) as absent_days,
      COUNT(CASE WHEN status='L' THEN 1 END) as leave_days,
      COUNT(CASE WHEN status != 'H' THEN 1 END) as total_work_days
    FROM attendance WHERE teacher_id=?
  `).get(req.params.id);

  db.close();
  const pct = stats.total_work_days > 0
    ? Math.round((stats.present_days / stats.total_work_days) * 100) : 0;
  res.json({ records, stats, attendance_pct: pct });
});

module.exports = router;
