// server.js — EduTrack Backend Server
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://YOUR-APP-NAME.vercel.app'
  ]
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize DB on startup
initDb();

// API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/teachers',   require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/leaves',     require('./routes/leaves'));
app.use('/api/reports',    require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve frontend for all non-API routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏫 EduTrack Server running at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`\nRun "npm run seed" first if this is your first time!\n`);
});
