import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { initDb } from './db/schema.js';
import { authRequired, requireRole, signToken } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

const db = initDb();

// File uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${uuid().slice(0, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== AUTH ==========
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, model_id, avatar_color FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ========== MODELS ==========
app.get('/api/models', authRequired, (req, res) => {
  const models = db.prepare('SELECT * FROM models ORDER BY stage_name').all();
  res.json(models);
});

app.post('/api/models', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const { stage_name, real_name, platforms, notes, email, password } = req.body;
  if (!stage_name) return res.status(400).json({ error: 'Stage name required' });

  const modelId = 'mdl_' + uuid().slice(0, 8);
  db.prepare(`INSERT INTO models (id, stage_name, real_name, platforms, notes) VALUES (?, ?, ?, ?, ?)`)
    .run(modelId, stage_name, real_name || stage_name, platforms || 'OnlyFans', notes || '');

  if (email && password) {
    const userId = 'usr_' + uuid().slice(0, 8);
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`INSERT INTO users (id, email, password, name, role, model_id, avatar_color) VALUES (?, ?, ?, ?, 'model', ?, ?)`)
      .run(userId, email.toLowerCase(), hash, stage_name, modelId, '#ec4899');
  }

  logActivity(req.user, `Created model ${stage_name}`, 'model', modelId);
  res.json({ id: modelId, stage_name });
});

app.patch('/api/models/:id/live', authRequired, (req, res) => {
  const modelId = req.params.id;
  // Models can only toggle their own, staff/admin can toggle any
  if (req.user.role === 'model' && req.user.model_id !== modelId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const model = db.prepare('SELECT * FROM models WHERE id = ?').get(modelId);
  if (!model) return res.status(404).json({ error: 'Model not found' });

  const newLive = model.is_live ? 0 : 1;
  const liveSince = newLive ? new Date().toISOString() : null;
  db.prepare('UPDATE models SET is_live = ?, live_since = ? WHERE id = ?').run(newLive, liveSince, modelId);

  // Notify staff/admin
  const title = newLive ? `🔴 ${model.stage_name} is now LIVE` : `${model.stage_name} ended live`;
  notifyStaff(title, `${model.stage_name} toggled live status`, 'live', `/models/${modelId}`);
  broadcast({ type: 'live_status', model: model.stage_name, is_live: !!newLive, title });

  logActivity(req.user, title, 'model', modelId);
  res.json({ is_live: !!newLive, live_since: liveSince });
});app.delete('/api/models/:id', authRequired, requireRole('admin'), (req, res) => {
  const modelId = req.params.id;
  const model = db.prepare('SELECT * FROM models WHERE id = ?').get(modelId);
  if (!model) return res.status(404).json({ error: 'Model not found' });

  // Delete related data
  db.prepare('DELETE FROM users WHERE model_id = ?').run(modelId);
  db.prepare('DELETE FROM requests WHERE model_id = ?').run(modelId);
  db.prepare('DELETE FROM content_uploads WHERE model_id = ?').run(modelId);
  db.prepare('DELETE FROM voice_notes WHERE model_id = ?').run(modelId);
  db.prepare('DELETE FROM invoices WHERE model_id = ?').run(modelId);
  db.prepare('DELETE FROM models WHERE id = ?').run(modelId);

  logActivity(req.user, ⁠ Deleted model ${model.stage_name} ⁠, 'model', modelId);
  res.json({ ok: true });
});

// ========== REQUESTS ==========
app.get('/api/requests', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare(`
      SELECT r.*, m.stage_name as model_name 
      FROM requests r JOIN models m ON r.model_id = m.id 
      WHERE r.model_id = ? ORDER BY r.created_at DESC
    `).all(req.user.model_id);
  } else {
    rows = db.prepare(`
      SELECT r.*, m.stage_name as model_name 
      FROM requests r JOIN models m ON r.model_id = m.id 
      ORDER BY r.created_at DESC
    `).all();
  }
  res.json(rows);
});

app.post('/api/requests', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const { model_id, type, title, details, client_name, price, priority, due_date } = req.body;
  if (!model_id || !type || !title) return res.status(400).json({ error: 'model_id, type, title required' });

  const id = 'req_' + uuid().slice(0, 8);
  db.prepare(`
    INSERT INTO requests (id, model_id, type, title, details, client_name, price, priority, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, model_id, type, title, details || '', client_name || '', price || 0, priority || 'normal', due_date || null, req.user.id);

  // Notify model
  const modelUser = db.prepare('SELECT id FROM users WHERE model_id = ?').get(model_id);
  if (modelUser) {
    createNotification(modelUser.id, null, `New ${type} request`, title, 'request', `/requests`);
  }

  logActivity(req.user, `Created ${type} request: ${title}`, 'request', id);
  res.json({ id });
});

app.patch('/api/requests/:id/status', authRequired, (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Not found' });

  // Models can only complete their own, staff can do anything
  if (req.user.role === 'model' && req.user.model_id !== reqRow.model_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  db.prepare('UPDATE requests SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, req.params.id);

  logActivity(req.user, `Marked request as ${status}: ${reqRow.title}`, 'request', req.params.id);
  res.json({ ok: true });
});

// ========== CONTENT UPLOADS ==========
app.get('/api/content', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare('SELECT * FROM content_uploads WHERE model_id = ? ORDER BY created_at DESC').all(req.user.model_id);
  } else {
    rows = db.prepare(`
      SELECT c.*, m.stage_name as model_name 
      FROM content_uploads c JOIN models m ON c.model_id = m.id 
      ORDER BY c.created_at DESC
    `).all();
  }
  res.json(rows);
});

app.post('/api/content', authRequired, upload.single('file'), (req, res) => {
  const { title, description, release_notes, scheduled_release, model_id } = req.body;
  let mid = model_id;
  if (req.user.role === 'model') mid = req.user.model_id;
  if (!mid || !title) return res.status(400).json({ error: 'model_id and title required' });

  const id = 'cnt_' + uuid().slice(0, 8);
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  const fileType = req.file ? req.file.mimetype : null;

  db.prepare(`
    INSERT INTO content_uploads (id, model_id, title, description, file_path, file_type, release_notes, scheduled_release, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, mid, title, description || '', filePath, fileType, release_notes || '', scheduled_release || null, req.user.id);

  notifyStaff(`New content uploaded by model`, title, 'content', '/content');
  logActivity(req.user, `Uploaded content: ${title}`, 'content', id);
  res.json({ id, file_path: filePath });
});

app.patch('/api/content/:id/status', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE content_uploads SET status = ?, reviewed_by = ? WHERE id = ?')
    .run(status, req.user.id, req.params.id);
  res.json({ ok: true });
});

// ========== VOICE NOTES ==========
app.get('/api/voice-notes', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare('SELECT * FROM voice_notes WHERE model_id = ? ORDER BY created_at DESC').all(req.user.model_id);
  } else {
    rows = db.prepare(`
      SELECT v.*, m.stage_name as model_name 
      FROM voice_notes v JOIN models m ON v.model_id = m.id 
      ORDER BY v.created_at DESC
    `).all();
  }
  res.json(rows);
});

app.post('/api/voice-notes', authRequired, upload.single('audio'), (req, res) => {
  const { request_id, title, notes, model_id } = req.body;
  let mid = model_id;
  if (req.user.role === 'model') mid = req.user.model_id;
  if (!mid) return res.status(400).json({ error: 'model_id required' });

  const id = 'vn_' + uuid().slice(0, 8);
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO voice_notes (id, request_id, model_id, title, file_path, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted')
  `).run(id, request_id || null, mid, title || 'Voice note', filePath, notes || '');

  // Mark linked request complete if exists
  if (request_id) {
    db.prepare(`UPDATE requests SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(request_id);
  }

  notifyStaff(`Voice note submitted`, title || 'New voice note', 'voice', '/voice-notes');
  logActivity(req.user, `Submitted voice note`, 'voice_note', id);
  res.json({ id, file_path: filePath });
});

// ========== INVOICES ==========
app.get('/api/invoices', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare('SELECT * FROM invoices WHERE model_id = ? ORDER BY created_at DESC').all(req.user.model_id);
  } else {
    rows = db.prepare(`
      SELECT i.*, m.stage_name as model_name 
      FROM invoices i JOIN models m ON i.model_id = m.id 
      ORDER BY i.created_at DESC
    `).all();
  }
  res.json(rows);
});

app.post('/api/invoices', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const { model_id, period_start, period_end, amount, agency_cut, notes } = req.body;
  if (!model_id || amount == null) return res.status(400).json({ error: 'model_id and amount required' });

  const id = 'inv_' + uuid().slice(0, 8);
  const cut = agency_cut || 0;
  const payout = amount - cut;

  db.prepare(`
    INSERT INTO invoices (id, model_id, period_start, period_end, amount, agency_cut, model_payout, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent')
  `).run(id, model_id, period_start, period_end, amount, cut, payout, notes || '');

  const modelUser = db.prepare('SELECT id FROM users WHERE model_id = ?').get(model_id);
  if (modelUser) createNotification(modelUser.id, null, 'New invoice available', `$${amount.toFixed(2)}`, 'invoice', '/invoices');

  logActivity(req.user, `Created invoice for model`, 'invoice', id);
  res.json({ id });
});

// ========== CHATTER AUDITS ==========
app.get('/api/audits', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, m.stage_name as model_name, u.name as staff_name
    FROM chatter_audits a
    LEFT JOIN models m ON a.model_id = m.id
    LEFT JOIN users u ON a.staff_id = u.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/audits', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const { model_id, chatter_name, shift_date, score, notes, flags } = req.body;
  const id = 'aud_' + uuid().slice(0, 8);
  db.prepare(`
    INSERT INTO chatter_audits (id, model_id, staff_id, chatter_name, shift_date, score, notes, flags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, model_id || null, req.user.id, chatter_name, shift_date, score || 0, notes || '', flags || '');
  logActivity(req.user, `Logged chatter audit for ${chatter_name}`, 'audit', id);
  res.json({ id });
});

// ========== NOTIFICATIONS ==========
app.get('/api/notifications', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  } else {
    rows = db.prepare(`
      SELECT * FROM notifications 
      WHERE role_target IN ('admin', 'staff') OR user_id = ?
      ORDER BY created_at DESC LIMIT 50
    `).all(req.user.id);
  }
  res.json(rows);
});

app.patch('/api/notifications/:id/read', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== DASHBOARD STATS ==========
app.get('/api/stats', authRequired, (req, res) => {
  if (req.user.role === 'model') {
    const mid = req.user.model_id;
    const pending = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE model_id = ? AND status IN ('pending','in_progress')`).get(mid).c;
    const completed = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE model_id = ? AND status = 'completed'`).get(mid).c;
    const content = db.prepare(`SELECT COUNT(*) as c FROM content_uploads WHERE model_id = ?`).get(mid).c;
    const live = db.prepare(`SELECT is_live FROM models WHERE id = ?`).get(mid)?.is_live || 0;
    return res.json({ pending_requests: pending, completed_requests: completed, content_count: content, is_live: !!live });
  }

  // Staff/admin overview
  const models = db.prepare(`SELECT COUNT(*) as c FROM models`).get().c;
  const liveNow = db.prepare(`SELECT COUNT(*) as c FROM models WHERE is_live = 1`).get().c;
  const pendingReqs = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status IN ('pending','in_progress')`).get().c;
  const pendingContent = db.prepare(`SELECT COUNT(*) as c FROM content_uploads WHERE status = 'pending_review'`).get().c;
  const openAudits = db.prepare(`SELECT COUNT(*) as c FROM chatter_audits`).get().c;

  res.json({
    total_models: models,
    live_now: liveNow,
    pending_requests: pendingReqs,
    pending_content: pendingContent,
    total_audits: openAudits
  });
});

// ========== ACTIVITY ==========
app.get('/api/activity', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const rows = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 40').all();
  res.json(rows);
});

// ========== STAFF ==========
app.get('/api/staff', authRequired, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`SELECT id, email, name, role, avatar_color, created_at FROM users WHERE role IN ('admin','staff')`).all();
  res.json(rows);
});

app.post('/api/staff', authRequired, requireRole('admin'), (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const id = 'usr_' + uuid().slice(0, 8);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO users (id, email, password, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, email.toLowerCase(), hash, name, role || 'staff', '#db2777');
  res.json({ id });
});

// ========== SHIFTS (Sign in / Sign out) ==========
app.get('/api/shifts', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, u.name as staff_name, m.stage_name as model_name
    FROM shifts s
    JOIN users u ON s.staff_id = u.id
    LEFT JOIN models m ON s.model_id = m.id
    ORDER BY s.started_at DESC LIMIT 100
  `).all();
  res.json(rows);
});

app.get('/api/shifts/active', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const mine = db.prepare(`SELECT * FROM shifts WHERE staff_id = ? AND status = 'active'`).get(req.user.id);
  res.json(mine || null);
});

app.post('/api/shifts/start', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const existing = db.prepare(`SELECT id FROM shifts WHERE staff_id = ? AND status = 'active'`).get(req.user.id);
  if (existing) return res.status(400).json({ error: 'Already on shift' });

  const id = 'shf_' + uuid().slice(0, 8);
  const { model_id, notes } = req.body;
  db.prepare(`INSERT INTO shifts (id, staff_id, model_id, started_at, notes, status) VALUES (?, ?, ?, datetime('now'), ?, 'active')`)
    .run(id, req.user.id, model_id || null, notes || '');
  notifyStaff(`${req.user.name} signed in to shift`, notes || 'Shift started', 'shift', '/shifts');
  logActivity(req.user, 'Signed in to shift', 'shift', id);
  // Broadcast via SSE
  broadcast({ type: 'shift_start', staff: req.user.name, id });
  res.json({ id });
});

app.post('/api/shifts/end', authRequired, requireRole('admin', 'staff'), (req, res) => {
  const active = db.prepare(`SELECT * FROM shifts WHERE staff_id = ? AND status = 'active'`).get(req.user.id);
  if (!active) return res.status(400).json({ error: 'No active shift' });

  db.prepare(`UPDATE shifts SET status = 'completed', ended_at = datetime('now') WHERE id = ?`).run(active.id);
  notifyStaff(`${req.user.name} signed out of shift`, '', 'shift', '/shifts');
  logActivity(req.user, 'Signed out of shift', 'shift', active.id);
  broadcast({ type: 'shift_end', staff: req.user.name, id: active.id });
  res.json({ ok: true });
});

// ========== STAFF ↔ MODEL PERMISSIONS ==========
app.get('/api/permissions', authRequired, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT sma.*, u.name as staff_name, m.stage_name as model_name
    FROM staff_model_access sma
    JOIN users u ON sma.staff_id = u.id
    JOIN models m ON sma.model_id = m.id
  `).all();
  res.json(rows);
});

app.post('/api/permissions', authRequired, requireRole('admin'), (req, res) => {
  const { staff_id, model_id } = req.body;
  if (!staff_id || !model_id) return res.status(400).json({ error: 'staff_id and model_id required' });
  try {
    db.prepare(`INSERT OR IGNORE INTO staff_model_access (staff_id, model_id) VALUES (?, ?)`).run(staff_id, model_id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/permissions', authRequired, requireRole('admin'), (req, res) => {
  const { staff_id, model_id } = req.body;
  db.prepare(`DELETE FROM staff_model_access WHERE staff_id = ? AND model_id = ?`).run(staff_id, model_id);
  res.json({ ok: true });
});

// ========== CONTENT CALENDAR ==========
app.get('/api/calendar', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'model') {
    rows = db.prepare(`
      SELECT id, title, scheduled_release, status, model_id, 'content' as kind
      FROM content_uploads
      WHERE model_id = ? AND scheduled_release IS NOT NULL
      ORDER BY scheduled_release
    `).all(req.user.model_id);
  } else {
    rows = db.prepare(`
      SELECT c.id, c.title, c.scheduled_release, c.status, c.model_id, m.stage_name as model_name, 'content' as kind
      FROM content_uploads c
      JOIN models m ON c.model_id = m.id
      WHERE c.scheduled_release IS NOT NULL
      ORDER BY c.scheduled_release
    `).all();
  }
  res.json(rows);
});

// ========== SSE REAL-TIME ==========
const sseClients = new Set();

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

app.get('/api/events', authRequired, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// Hook live toggle to broadcast
const originalLiveHandler = null; // already handled via notifyStaff; we also broadcast below

// ========== HELPERS ==========
function createNotification(userId, roleTarget, title, message, type, link) {
  const id = 'ntf_' + uuid().slice(0, 8);
  db.prepare(`
    INSERT INTO notifications (id, user_id, role_target, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || null, roleTarget || null, title, message, type || 'info', link || null);
}

function notifyStaff(title, message, type, link) {
  createNotification(null, 'admin', title, message, type, link);
  createNotification(null, 'staff', title, message, type, link);
}

function logActivity(user, action, entityType, entityId) {
  const id = 'act_' + uuid().slice(0, 8);
  db.prepare(`
    INSERT INTO activity_log (id, actor_id, actor_name, action, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, user.id, user.name, action, entityType || null, entityId || null);
}

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', agency: 'House Of Her' }));

// Ensure uploads dir
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, () => {
  console.log(`\n🌹 House Of Her API running on http://localhost:${PORT}`);
  console.log(`   Login credentials are printed above on first run.\n`);
});
