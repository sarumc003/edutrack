// routes/reports.js
const express = require('express');
const { getDb } = require('../db/init');
const { authMiddleware, principalOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, principalOnly);

// GET /api/reports/overview — full school overview
router.get('/overview', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();

  const todayStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN a.status='P' THEN 1 END) as present,
      COUNT(CASE WHEN a.status='A' THEN 1 END) as absent,
      COUNT(CASE WHEN a.status='L' THEN 1 END) as on_leave,
      COUNT(*) as total
    FROM attendance a JOIN teachers t ON a.teacher_id=t.id
    WHERE a.date=? AND t.active=1
  `).get(today);

  const classroomStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN cl.depart_time IS NULL THEN 1 END) as occupied
    FROM classrooms c
    LEFT JOIN class_logs cl ON c.id=cl.classroom_id AND cl.date=? AND cl.depart_time IS NULL
  `).get(today);

  const teacherAttPct = db.prepare(`
    SELECT t.id, t.name, t.subject,
      ROUND(100.0 * COUNT(CASE WHEN a.status='P' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN a.status != 'H' THEN 1 END), 0)) as pct
    FROM teachers t
    LEFT JOIN attendance a ON t.id=a.teacher_id
    WHERE t.active=1
    GROUP BY t.id
    ORDER BY pct ASC
  `).all();

  const monthlyTrend = db.prepare(`
    SELECT
      substr(date, 1, 7) as month,
      ROUND(100.0 * COUNT(CASE WHEN status='P' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN status != 'H' THEN 1 END), 0)) as avg_pct
    FROM attendance
    WHERE date >= date('now', '-6 months')
    GROUP BY month ORDER BY month
  `).all();

  const subjectCoverage = db.prepare(`
    SELECT t.subject, COUNT(cl.id) as classes_today
    FROM teachers t
    LEFT JOIN class_logs cl ON t.id=cl.teacher_id AND cl.date=?
    WHERE t.active=1
    GROUP BY t.subject
    ORDER BY classes_today DESC
  `).all(today);

  db.close();
  res.json({ today: todayStats, classrooms: classroomStats, teacher_attendance: teacherAttPct, monthly_trend: monthlyTrend, subject_coverage: subjectCoverage });
});

// GET /api/reports/low-attendance — teachers below threshold
router.get('/low-attendance', (req, res) => {
  const threshold = parseInt(req.query.threshold) || 80;
  const db = getDb();
  const result = db.prepare(`
    SELECT t.id, t.name, t.subject, t.email, t.phone,
      COUNT(CASE WHEN a.status='P' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status='A' THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status='L' THEN 1 END) as leave_days,
      COUNT(CASE WHEN a.status != 'H' THEN 1 END) as total_work_days,
      ROUND(100.0 * COUNT(CASE WHEN a.status='P' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN a.status != 'H' THEN 1 END), 0)) as pct
    FROM teachers t LEFT JOIN attendance a ON t.id=a.teacher_id
    WHERE t.active=1
    GROUP BY t.id
    HAVING pct < ? OR pct IS NULL
    ORDER BY pct ASC
  `).all(threshold);
  db.close();
  res.json(result);
});

module.exports = router;
