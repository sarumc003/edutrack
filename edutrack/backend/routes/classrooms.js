// routes/classrooms.js
const express = require('express');
const QRCode  = require('qrcode');
const { getDb } = require('../db/init');
const { authMiddleware, principalOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/classrooms — all classrooms with current occupancy
router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();

  const classrooms = db.prepare('SELECT * FROM classrooms ORDER BY grade, division, stream').all();
  const activeLogs = db.prepare(`
    SELECT cl.*, t.name as teacher_name, t.subject
    FROM class_logs cl JOIN teachers t ON cl.teacher_id = t.id
    WHERE cl.date=? AND cl.depart_time IS NULL
  `).all(today);

  const logMap = {};
  activeLogs.forEach(l => { logMap[l.classroom_id] = l; });

  const result = classrooms.map(c => ({
    ...c,
    occupied: !!logMap[c.id],
    current_log: logMap[c.id] || null
  }));

  db.close();
  res.json(result);
});

// GET /api/classrooms/:id/qr — generate QR code for a classroom
router.get('/:id/qr', async (req, res) => {
  const db = getDb();
  const cls = db.prepare('SELECT * FROM classrooms WHERE id=?').get(req.params.id);
  db.close();

  if (!cls) return res.status(404).json({ error: 'Classroom not found' });

  // QR payload: JSON with classroom info for the scanner
  const payload = JSON.stringify({ classroom_id: cls.id, classroom_name: cls.name, action: 'scan' });

  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: '#0f1f3d', light: '#ffffff' }
    });
    res.json({ classroom: cls, qr: qrDataUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/classrooms/qr-all — generate QR for all classrooms (for printing)
router.get('/qr/all', principalOnly, async (req, res) => {
  const db = getDb();
  const classrooms = db.prepare('SELECT * FROM classrooms ORDER BY grade, division, stream').all();
  db.close();

  const results = await Promise.all(classrooms.map(async cls => {
    const payload = JSON.stringify({ classroom_id: cls.id, classroom_name: cls.name, action: 'scan' });
    const qr = await QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: '#0f1f3d', light: '#ffffff' } });
    return { ...cls, qr };
  }));

  res.json(results);
});

// POST /api/classrooms/scan — teacher scans QR (arrive or depart)
router.post('/scan', (req, res) => {
  const { classroom_id, scan_type } = req.body; // scan_type: 'arrive' | 'depart'
  if (!classroom_id || !scan_type) return res.status(400).json({ error: 'classroom_id and scan_type required' });

  // Get teacher from logged-in user
  const db = getDb();
  let teacher;

  if (req.user.role === 'teacher') {
    teacher = db.prepare('SELECT * FROM teachers WHERE user_id=?').get(req.user.id);
  } else {
    // Allow principal/attender to test scan on behalf of a teacher
    const { teacher_id } = req.body;
    if (!teacher_id) { db.close(); return res.status(400).json({ error: 'teacher_id required for non-teacher users' }); }
    teacher = db.prepare('SELECT * FROM teachers WHERE id=?').get(teacher_id);
  }

  if (!teacher) { db.close(); return res.status(404).json({ error: 'Teacher not found' }); }

  const classroom = db.prepare('SELECT * FROM classrooms WHERE id=?').get(classroom_id);
  if (!classroom) { db.close(); return res.status(404).json({ error: 'Classroom not found' }); }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

  if (scan_type === 'arrive') {
    // Check if already in another class
    const existing = db.prepare(`
      SELECT * FROM class_logs WHERE teacher_id=? AND date=? AND depart_time IS NULL
    `).get(teacher.id, today);

    if (existing) {
      db.close();
      return res.status(400).json({
        error: 'Already checked into a class. Please scan departure from current class first.',
        current_class: existing
      });
    }

    const log = db.prepare(`
      INSERT INTO class_logs (teacher_id, classroom_id, date, arrive_time, subject)
      VALUES (?,?,?,?,?)
    `).run(teacher.id, classroom_id, today, timeStr, teacher.subject);

    // Also mark attendance as Present
    db.prepare(`
      INSERT INTO attendance (teacher_id, date, status, marked_by)
      VALUES (?,?,?,'qr_scan')
      ON CONFLICT(teacher_id, date) DO UPDATE SET status='P', marked_by='qr_scan'
    `).run(teacher.id, today, 'P');

    db.close();
    res.json({
      message: 'Arrival recorded',
      log_id: log.lastInsertRowid,
      teacher: teacher.name,
      classroom: classroom.name,
      time: timeStr
    });

  } else if (scan_type === 'depart') {
    const log = db.prepare(`
      SELECT * FROM class_logs
      WHERE teacher_id=? AND date=? AND depart_time IS NULL
      ORDER BY id DESC LIMIT 1
    `).get(teacher.id, today);

    if (!log) { db.close(); return res.status(400).json({ error: 'No active arrival record found' }); }

    db.prepare(`UPDATE class_logs SET depart_time=? WHERE id=?`).run(timeStr, log.id);
    db.close();
    res.json({ message: 'Departure recorded', classroom: classroom.name, time: timeStr });
  } else {
    db.close();
    res.status(400).json({ error: 'scan_type must be arrive or depart' });
  }
});

// GET /api/classrooms/logs/today — all class logs for today
router.get('/logs/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();
  const logs = db.prepare(`
    SELECT cl.*, t.name as teacher_name, t.subject, c.name as class_name, c.grade, c.division, c.stream
    FROM class_logs cl
    JOIN teachers t ON cl.teacher_id = t.id
    JOIN classrooms c ON cl.classroom_id = c.id
    WHERE cl.date=?
    ORDER BY cl.arrive_time
  `).all(today);
  db.close();
  res.json(logs);
});

module.exports = router;
