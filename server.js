const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load .env file if exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tahaeth-pro-secret-key-change-in-production';
const DB_PATH = path.join(__dirname, 'data.db');

let db;

// Database helpers
function dbRun(sql, params = []) {
  try { db.run(sql, params); saveDB(); return { changes: db.getRowsModified(), lastId: getLastInsertId() }; }
  catch (e) { throw e; }
}
function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
  stmt.free(); return null;
}
function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free(); return rows;
}
function getLastInsertId() {
  const r = dbGet('SELECT last_insert_rowid() as id');
  return r ? r.id : 0;
}
function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coin TEXT NOT NULL,
      dir TEXT NOT NULL,
      entry REAL,
      sl REAL,
      tp REAL,
      exit_price REAL,
      size TEXT,
      result TEXT,
      setup TEXT,
      tf TEXT,
      session TEXT,
      note TEXT,
      tvlink TEXT,
      ss TEXT,
      pnl REAL DEFAULT 0,
      rr TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  try { db.prepare(`ALTER TABLE trades ADD COLUMN date TEXT`).run(); } catch(e) {}
  saveDB();
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = dbGet('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")', [token]);
    if (!session) return res.status(401).json({ error: 'Session expired' });
    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// AUTH ROUTES
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است' });
  if (password.length < 4) return res.status(400).json({ error: 'رمز عبور باید حداقل 4 کاراکتر باشه' });

  const existing = dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return res.status(400).json({ error: 'این ایمیل قبلا ثبت‌نام شده' });

  const hash = bcrypt.hashSync(password, 10);
  dbRun('INSERT INTO users (email, password) VALUES (?, ?)', [email.toLowerCase(), hash]);
  const userId = getLastInsertId();

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  dbRun('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, token, expiresAt]);

  res.json({ token, email: email.toLowerCase(), userId });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی است' });

  const user = dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return res.status(400).json({ error: 'حسابی با این ایمیل وجود نداره' });

  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'رمز عبور اشتباهه' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  dbRun('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expiresAt]);

  res.json({ token, email: user.email, userId: user.id, displayName: user.display_name });
});

app.post('/api/logout', authMiddleware, (req, res) => {
  dbRun('DELETE FROM sessions WHERE token = ?', [req.token]);
  res.json({ ok: true });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = dbGet('SELECT id, email, display_name, avatar_color, created_at FROM users WHERE id = ?', [req.userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const { display_name, avatar_color } = req.body;
  dbRun('UPDATE users SET display_name = COALESCE(?, display_name), avatar_color = COALESCE(?, avatar_color) WHERE id = ?',
    [display_name || null, avatar_color || null, req.userId]);
  res.json({ ok: true });
});

// USER DATA ROUTES
app.get('/api/data/:key', authMiddleware, (req, res) => {
  const row = dbGet('SELECT value FROM user_data WHERE user_id = ? AND key = ?', [req.userId, req.params.key]);
  res.json({ value: row ? JSON.parse(row.value) : null });
});

app.put('/api/data/:key', authMiddleware, (req, res) => {
  const value = JSON.stringify(req.body.value);
  const existing = dbGet('SELECT id FROM user_data WHERE user_id = ? AND key = ?', [req.userId, req.params.key]);
  if (existing) {
    dbRun('UPDATE user_data SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND key = ?', [value, req.userId, req.params.key]);
  } else {
    dbRun('INSERT INTO user_data (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [req.userId, req.params.key, value]);
  }
  res.json({ ok: true });
});

app.get('/api/data', authMiddleware, (req, res) => {
  const rows = dbAll('SELECT key, value FROM user_data WHERE user_id = ?', [req.userId]);
  const data = {};
  rows.forEach(r => { data[r.key] = JSON.parse(r.value); });
  res.json(data);
});

// TRADES ROUTES
app.get('/api/trades', authMiddleware, (req, res) => {
  const trades = dbAll('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
  res.json(trades.map(t => ({ ...t, ss: t.ss || null, pnl: t.pnl || 0, rr: t.rr || '—' })));
});

app.post('/api/trades', authMiddleware, (req, res) => {
  const t = req.body;
  dbRun(`INSERT INTO trades (user_id, coin, dir, entry, sl, tp, exit_price, size, result, setup, tf, session, note, tvlink, ss, pnl, rr, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, t.coin, t.dir, t.entry, t.sl, t.tp, t.exit, t.size, t.result, t.setup, t.tf, t.session, t.note, t.tvlink, t.ss, t.pnl, t.rr, t.date || null]);
  res.json({ id: getLastInsertId() });
});

app.delete('/api/trades/:id', authMiddleware, (req, res) => {
  dbRun('DELETE FROM trades WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
  res.json({ ok: true });
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 TahaEth Pro running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
