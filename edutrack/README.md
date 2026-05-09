# 🏫 EduTrack — School Teacher Attendance System

A complete school teacher attendance and classroom management system.

---

## 📦 What's Included

```
edutrack/
├── backend/
│   ├── server.js              ← Express server (entry point)
│   ├── package.json           ← Node dependencies
│   ├── db/
│   │   ├── init.js            ← Database schema
│   │   └── seed.js            ← Sample data seeder
│   ├── middleware/
│   │   └── auth.js            ← JWT authentication
│   └── routes/
│       ├── auth.js            ← Login / me
│       ├── teachers.js        ← Teacher CRUD
│       ├── attendance.js      ← Attendance marking
│       ├── classrooms.js      ← Classrooms + QR scan
│       ├── leaves.js          ← Leave management
│       └── reports.js         ← Analytics
└── frontend/
    ├── index.html             ← Single page app
    ├── css/style.css          ← All styles
    └── js/
        ├── api.js             ← API client
        ├── utils.js           ← Helpers
        ├── components.js      ← Shared UI
        ├── app.js             ← Router
        └── pages/             ← All pages
```

---

## ⚙️ SETUP GUIDE

### Step 1 — Install Node.js
Download from: https://nodejs.org  
Choose **LTS version** (18 or 20). Install normally.

Verify installation:
```bash
node --version
npm --version
```

### Step 2 — Extract the ZIP
Extract `edutrack.zip` anywhere on your computer, e.g.:
- Windows: `C:\edutrack\`
- Mac/Linux: `~/edutrack/`

### Step 3 — Install Dependencies
Open a terminal (Command Prompt on Windows, Terminal on Mac/Linux):

```bash
cd edutrack/backend
npm install
```

This downloads all required packages (~30 seconds).

### Step 4 — Seed the Database
```bash
npm run seed
```

This creates the SQLite database with:
- All classrooms (Grade 6–11 A/B/C + Grade 12–13 streams)
- 10 sample teachers with 60 days of attendance history
- Sample leave records and class logs

### Step 5 — Start the Server
```bash
npm start
```

You should see:
```
🏫 EduTrack Server running at http://localhost:3000
```

### Step 6 — Open in Browser
Go to: **http://localhost:3000**

---

## 🔑 Login Credentials

| Role      | Username    | Password  |
|-----------|-------------|-----------|
| Principal | `principal` | `admin123`|
| Attender  | `attender`  | `att123`  |
| Teacher   | `kamala`    | `teach123`|
| Teacher   | `suresh`    | `teach123`|
| Teacher   | `nimal`     | `teach123`|
| Teacher   | `ranjith`   | `teach123`|
| Teacher   | `priya`     | `teach123`|
| Teacher   | `asanka`    | `teach123`|
| Teacher   | `dilini`    | `teach123`|
| Teacher   | `chaminda`  | `teach123`|

---

## 🏫 School Structure

**Grades 6–11:** Divisions A, B, C  
**Grades 12–13:** BioMaths, Technology, Arts, Commerce

Total: **54 classrooms**

---

## 📱 Features

### Principal Panel
- **Dashboard** — Live overview: present/absent, occupied classrooms
- **Classrooms** — Real-time status of all 54 rooms
- **Teachers** — Full directory, profiles, attendance history
- **Attendance** — Mark/edit daily attendance for all teachers
- **Leave Records** — Record Medical / Casual / Duty / Annual / No Pay
- **Analytics** — Attendance % bars, monthly trend, below-80% alerts
- **Print QR Codes** — Generate and print QR codes for every classroom

### Teacher Panel
- **Dashboard** — Personal attendance stats and calendar
- **QR Scan** — Simulate scanning in/out of classrooms
- **My Profile** — Attendance calendar, leave balance, class logs
- **My Attendance** — Full 60-day history

### Attender Panel
- **Mark Attendance** — Mark present/absent/leave for all teachers
- **Leave Records** — Add and view leave records

---

## 🖨️ Setting Up QR Scanning (Physical Setup)

1. Login as Principal → go to **"Print QR Codes"**
2. Click **"Print All QR Codes"** — your browser will open print dialog
3. Print and laminate each QR code
4. Stick each QR code at the door of its classroom
5. Teachers can scan using:
   - **Option A:** Login to EduTrack on a wall-mounted tablet at each door
   - **Option B:** Use any QR scanner app that sends the payload to your server
   - **Option C:** Log into EduTrack on their phone → QR Scan page

---

## 🔒 Security for Production

Before deploying publicly, edit `backend/middleware/auth.js`:

```js
const JWT_SECRET = 'CHANGE_THIS_TO_A_LONG_RANDOM_STRING_abc123xyz';
```

Also consider:
- Using HTTPS (get a free SSL cert from Let's Encrypt)
- Running behind nginx as a reverse proxy
- Regular database backups (copy `backend/db/edutrack.db`)

---

## 💾 Database Backup

The entire database is one file:
```
backend/db/edutrack.db
```

Copy this file to backup all data. To restore, replace the file.

---

## 🔄 Resetting Data

To wipe and re-seed:
```bash
cd backend
rm db/edutrack.db
npm run seed
```

---

## 🌐 Running on a School Network

To let other computers on the same WiFi access the system:

1. Find your computer's IP address:
   - Windows: `ipconfig` → look for IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`

2. Edit `backend/server.js`, change:
   ```js
   app.listen(PORT, () => {
   ```
   to:
   ```js
   app.listen(PORT, '0.0.0.0', () => {
   ```

3. Restart the server

4. Other computers access it at: `http://YOUR_IP:3000`
   (e.g., `http://192.168.1.100:3000`)

---

## 📞 Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** SQLite (via better-sqlite3) — no separate DB server needed
- **Auth:** JWT tokens (12-hour expiry)
- **QR:** qrcode npm package
- **Frontend:** Vanilla HTML + CSS + JS (no framework needed)
- **Icons:** Tabler Icons (CDN)
- **Fonts:** DM Sans (CDN)

---

Built for schools. Simple to run, easy to maintain.
