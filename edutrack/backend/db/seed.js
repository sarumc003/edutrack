// db/seed.js
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('./init');

const TEACHERS = [
  { id: 'T001', name: 'Mrs. Kamala Perera',      subject: 'Mathematics', email: 'kamala@school.lk',    phone: '071-2345678', joined_date: '2018-01-15', color: '#0f1f3d', username: 'kamala'   },
  { id: 'T002', name: 'Mr. Suresh Silva',         subject: 'Science',     email: 'suresh@school.lk',    phone: '077-3456789', joined_date: '2016-03-20', color: '#1e3a6e', username: 'suresh'   },
  { id: 'T003', name: 'Mrs. Nimal Jayasinghe',    subject: 'English',     email: 'nimal@school.lk',     phone: '070-4567890', joined_date: '2019-06-01', color: '#2d5a27', username: 'nimal'    },
  { id: 'T004', name: 'Mr. Ranjith Fernando',     subject: 'History',     email: 'ranjith@school.lk',   phone: '076-5678901', joined_date: '2015-08-10', color: '#5c2d0a', username: 'ranjith'  },
  { id: 'T005', name: 'Mrs. Priya Mendis',        subject: 'Biology',     email: 'priya@school.lk',     phone: '072-6789012', joined_date: '2020-01-05', color: '#1e4570', username: 'priya'    },
  { id: 'T006', name: 'Mr. Asanka Wijeratne',     subject: 'Physics',     email: 'asanka@school.lk',    phone: '071-7890123', joined_date: '2017-11-12', color: '#3d1a6e', username: 'asanka'   },
  { id: 'T007', name: 'Mrs. Dilini Rathnayake',   subject: 'Chemistry',   email: 'dilini@school.lk',    phone: '078-8901234', joined_date: '2021-03-15', color: '#6e1a3d', username: 'dilini'   },
  { id: 'T008', name: 'Mr. Chaminda Dissanayake', subject: 'Commerce',    email: 'chaminda@school.lk',  phone: '075-9012345', joined_date: '2014-09-01', color: '#1a6e4b', username: 'chaminda' },
  { id: 'T009', name: 'Mrs. Sandya Kumari',       subject: 'Sinhala',     email: 'sandya@school.lk',    phone: '076-0123456', joined_date: '2022-01-10', color: '#6e4b1a', username: 'sandya'   },
  { id: 'T010', name: 'Mr. Tharanga Bandara',     subject: 'Tamil',       email: 'tharanga@school.lk',  phone: '071-1234567', joined_date: '2019-09-01', color: '#1a4b6e', username: 'tharanga' },
];

// All classrooms: Grade 6-11 A/B/C + Grade 12-13 streams
const CLASSROOMS = [
  ...['A','B','C'].flatMap(div =>
    [6,7,8,9,10,11].map(grade => ({
      id: `G${grade}${div}`,
      name: `Grade ${grade} - ${div}`,
      grade,
      division: div,
      stream: null
    }))
  ),
  ...['BioMaths','Technology','Arts','Commerce'].flatMap(stream =>
    [12,13].map(grade => ({
      id: `G${grade}${stream.slice(0,3).toUpperCase()}`,
      name: `Grade ${grade} - ${stream}`,
      grade,
      division: null,
      stream
    }))
  )
];

async function seed() {
  initDb();
  const db = getDb();

  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM leave_records;
    DELETE FROM class_logs;
    DELETE FROM attendance;
    DELETE FROM classrooms;
    DELETE FROM teachers;
    DELETE FROM users;
  `);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Insert system users
  const insertUser = db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`);
  const principalId = insertUser.run('principal', hash('admin123'), 'principal').lastInsertRowid;
  const attenderId  = insertUser.run('attender',  hash('att123'),   'attender').lastInsertRowid;

  // Insert teachers with their own user accounts
  const insertTeacherUser = db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`);
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (id, user_id, name, subject, email, phone, joined_date, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of TEACHERS) {
    const uid = insertTeacherUser.run(t.username, hash('teach123'), 'teacher').lastInsertRowid;
    insertTeacher.run(t.id, uid, t.name, t.subject, t.email, t.phone, t.joined_date, t.color);
  }

  // Insert classrooms
  const insertClass = db.prepare(`
    INSERT INTO classrooms (id, name, grade, division, stream) VALUES (?, ?, ?, ?, ?)
  `);
  for (const c of CLASSROOMS) {
    insertClass.run(c.id, c.name, c.grade, c.division, c.stream);
  }

  // Seed 60 days of attendance history
  const insertAtt = db.prepare(`
    INSERT OR IGNORE INTO attendance (teacher_id, date, status, marked_by)
    VALUES (?, ?, ?, 'system')
  `);
  const statuses = ['P','P','P','P','P','A','L'];
  const today = new Date();

  for (const t of TEACHERS) {
    for (let i = 60; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const status = (dow === 0 || dow === 6) ? 'H'
        : i === 0 ? (Math.random() > 0.1 ? 'P' : 'A')
        : statuses[Math.floor(Math.random() * statuses.length)];
      insertAtt.run(t.id, ds, status);
    }
  }

  // Seed some class logs for today
  const todayStr = today.toISOString().split('T')[0];
  const insertLog = db.prepare(`
    INSERT INTO class_logs (teacher_id, classroom_id, date, arrive_time, depart_time, subject)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const hours = [7,7,8,8,8,9,9,10,10,11];
  CLASSROOMS.slice(0, 10).forEach((cls, i) => {
    if (Math.random() > 0.3 && i < TEACHERS.length) {
      const t = TEACHERS[i];
      const h = hours[i];
      const arrMin = Math.floor(Math.random() * 50);
      const arr = `${h}:${String(arrMin).padStart(2,'0')}`;
      const dep = Math.random() > 0.4
        ? `${h+1}:${String(Math.floor(Math.random()*50)).padStart(2,'0')}`
        : null;
      insertLog.run(t.id, cls.id, todayStr, arr, dep, t.subject);
    }
  });

  // Seed some leave records
  const insertLeave = db.prepare(`
    INSERT INTO leave_records (teacher_id, date, leave_type, reason, approved_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  const leaveTypes = ['Medical','Casual','Duty','Annual','No Pay'];
  const reasons = [
    'Fever and cold', 'Family function', 'Educational conference',
    'Medical appointment', 'Personal matter', 'Official duty'
  ];
  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(Math.random() * 30));
    const t = TEACHERS[Math.floor(Math.random() * TEACHERS.length)];
    insertLeave.run(
      t.id, d.toISOString().split('T')[0],
      leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
      reasons[Math.floor(Math.random() * reasons.length)],
      'Dr. A.B. Gamage'
    );
  }

  db.close();
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Principal : principal / admin123');
  console.log('  Attender  : attender  / att123');
  console.log('  Teachers  : kamala / suresh / nimal / ranjith / priya / asanka / dilini / chaminda');
  console.log('             (all teachers use password: teach123)');
}

seed().catch(console.error);
