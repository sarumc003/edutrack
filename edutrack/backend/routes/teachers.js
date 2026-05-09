// routes/teachers.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const { getDb } = require('../db/init');
const { authMiddleware, principalOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/teachers — list all teachers with attendance summary
router.get('/', (req, res) => {
  const db = getDb();
  const teachers = db.prepare('SELECT * FROM teachers WHERE active = 1 ORDER BY name').all();
  const today = new Date().toISOString().split('T')[0];

  const result = teachers.map(t => {
    const todayAtt = db.prepare(`SELECT status FROM attendance WHERE teacher_id=? AND date=?`).get(t.id, today);
    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status='P' THEN 1 END) as present_days,
        COUNT(CASE WHEN status='A' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status='L' THEN 1 END) as leave_days,
        COUNT(CASE WHEN status != 'H' THEN 1 END) as total_work_days
      FROM attendance WHERE teacher_id=?
    `).get(t.id);

    const pct = stats.total_work_days > 0
      ? Math.round((stats.present_days / stats.total_work_days) * 100) : 0;

    const activeLog = db.prepare(`
      SELECT cl.*, c.name as class_name FROM class_logs cl
      JOIN classrooms c ON cl.classroom_id = c.id
      WHERE cl.teacher_id=? AND cl.date=? AND cl.depart_time IS NULL
      ORDER BY cl.id DESC LIMIT 1
    `).get(t.id, today);

    return {
      ...t,
      today_status: todayAtt?.status || null,
      attendance_pct: pct,
      stats,
      active_log: activeLog || null
    };
  });

  db.close();
  res.json(result);
});

// GET /api/teachers/:id — single teacher with full details
router.get('/:id', (req, res) => {
  const db = getDb();
  const t = db.prepare('SELECT * FROM teachers WHERE id=?').get(req.params.id);
  if (!t) { db.close(); return res.status(404).json({ error: 'Teacher not found' }); }

  const today = new Date().toISOString().split('T')[0];

  // 60 day attendance records
  const attRecords = db.prepare(`
    SELECT date, status FROM attendance WHERE teacher_id=?
    ORDER BY date DESC LIMIT 60
  `).all(t.id);

  // Stats
  const stats = db.prepare(`
    SELECT
      COUNT(CASE WHEN status='P' THEN 1 END) as present_days,
      COUNT(CASE WHEN status='A' THEN 1 END) as absent_days,
      COUNT(CASE WHEN status='L' THEN 1 END) as leave_days,
      COUNT(CASE WHEN status != 'H' THEN 1 END) as total_work_days
    FROM attendance WHERE teacher_id=?
  `).get(t.id);

  const pct = stats.total_work_days > 0
    ? Math.round((stats.present_days / stats.total_work_days) * 100) : 0;

  // Today's class logs
  const classLogs = db.prepare(`
    SELECT cl.*, c.name as class_name, c.grade, c.division, c.stream
    FROM class_logs cl JOIN classrooms c ON cl.classroom_id = c.id
    WHERE cl.teacher_id=? AND cl.date=?
    ORDER BY cl.arrive_time
  `).all(t.id, today);

  // Leave records
  const leaveRecords = db.prepare(`
    SELECT * FROM leave_records WHERE teacher_id=? ORDER BY date DESC LIMIT 20
  `).all(t.id);

  db.close();
  res.json({ ...t, attendance_pct: pct, stats, att_records: attRecords, class_logs: classLogs, leave_records: leaveRecords });
});

// POST /api/teachers — add new teacher (principal only)
router.post('/', principalOnly, (req, res) => {
  const { name, subject, email, phone, joined_date, color, username, password } = req.body;
  if (!name || !subject || !username || !password) {
    return res.status(400).json({ error: 'name, subject, username, password required' });
  }

  const db = getDb();
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const uid = db.prepare(`INSERT INTO users (username, password, role) VALUES (?,?,'teacher')`).run(username, hashed).lastInsertRowid;

    // Generate next teacher ID
    const last = db.prepare(`SELECT id FROM teachers ORDER BY id DESC LIMIT 1`).get();
    const nextNum = last ? parseInt(last.id.slice(1)) + 1 : 1;
    const id = 'T' + String(nextNum).padStart(3, '0');

    db.prepare(`
      INSERT INTO teachers (id, user_id, name, subject, email, phone, joined_date, color)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(id, uid, name, subject, email||null, phone||null, joined_date||new Date().toISOString().split('T')[0], color||'#0f1f3d');

    db.close();
    res.status(201).json({ id, message: 'Teacher created' });
  } catch (e) {
    db.close();
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/teachers/:id — update teacher
router.put('/:id', principalOnly, (req, res) => {
  const { name, subject, email, phone, color } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE teachers SET name=COALESCE(?,name), subject=COALESCE(?,subject),
    email=COALESCE(?,email), phone=COALESCE(?,phone), color=COALESCE(?,color)
    WHERE id=?
  `).run(name, subject, email, phone, color, req.params.id);
  db.close();
  res.json({ message: 'Updated' });
});

// DELETE /api/teachers/:id — deactivate teacher
router.delete('/:id', principalOnly, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE teachers SET active=0 WHERE id=?').run(req.params.id);
  db.close();
  res.json({ message: 'Deactivated' });
});

module.exports = router;
