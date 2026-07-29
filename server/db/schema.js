import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'houseofher.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'model')),
      model_id TEXT,
      avatar_color TEXT DEFAULT '#ec4899',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      stage_name TEXT NOT NULL,
      real_name TEXT,
      platforms TEXT DEFAULT 'OnlyFans',
      status TEXT DEFAULT 'active',
      is_live INTEGER DEFAULT 0,
      live_since TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('custom', 'content', 'voice_note', 'other')),
      title TEXT NOT NULL,
      details TEXT,
      client_name TEXT,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      priority TEXT DEFAULT 'normal',
      due_date TEXT,
      created_by TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content_uploads (
      id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_type TEXT,
      release_notes TEXT,
      scheduled_release TEXT,
      status TEXT DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'scheduled', 'released', 'rejected')),
      uploaded_by TEXT,
      reviewed_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS voice_notes (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      model_id TEXT NOT NULL,
      title TEXT,
      file_path TEXT,
      duration_seconds INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      period_start TEXT,
      period_end TEXT,
      amount REAL NOT NULL,
      agency_cut REAL DEFAULT 0,
      model_payout REAL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS chatter_audits (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      staff_id TEXT,
      chatter_name TEXT,
      shift_date TEXT,
      score INTEGER,
      notes TEXT,
      flags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role_target TEXT,
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      model_id TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (staff_id) REFERENCES users(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS staff_model_access (
      staff_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      PRIMARY KEY (staff_id, model_id),
      FOREIGN KEY (staff_id) REFERENCES users(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    seed(db);
  }

  return db;
}

function seed(db) {
  const hash = bcrypt.hashSync('admin123', 10);
  const modelHash = bcrypt.hashSync('model123', 10);
  const staffHash = bcrypt.hashSync('staff123', 10);

  const adminId = 'usr_admin';
  const staffId = 'usr_staff1';
  const modelUserId = 'usr_model_barbie';
  const modelId = 'mdl_barbie';

  db.prepare(`INSERT INTO users (id, email, password, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`).run(
    adminId, 'admin@houseofher.com', hash, 'Agency Admin', 'admin', '#be185d'
  );
  db.prepare(`INSERT INTO users (id, email, password, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`).run(
    staffId, 'staff@houseofher.com', staffHash, 'Alex Rivera', 'staff', '#db2777'
  );
  db.prepare(`INSERT INTO users (id, email, password, name, role, model_id, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    modelUserId, 'barbie@houseofher.com', modelHash, 'Barbie', 'model', modelId, '#ec4899'
  );

  db.prepare(`INSERT INTO models (id, stage_name, real_name, platforms, notes) VALUES (?, ?, ?, ?, ?)`).run(
    modelId, 'Barbie', 'Barbie', 'OnlyFans, Fansly', 'Flagship model'
  );

  // Extra demo model
  const model2Id = 'mdl_luna';
  db.prepare(`INSERT INTO models (id, stage_name, real_name, platforms) VALUES (?, ?, ?, ?)`).run(
    model2Id, 'Luna', 'Luna Rose', 'OnlyFans'
  );
  db.prepare(`INSERT INTO users (id, email, password, name, role, model_id, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'usr_model_luna', 'luna@houseofher.com', modelHash, 'Luna', 'model', model2Id, '#f472b6'
  );

  // Sample requests
  db.prepare(`INSERT INTO requests (id, model_id, type, title, details, client_name, price, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'req_1', modelId, 'custom', 'Custom video – 10 min', 'Roleplay nurse outfit, soft lighting', 'Whale_John92', 150, 'pending', adminId
  );
  db.prepare(`INSERT INTO requests (id, model_id, type, title, details, client_name, price, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'req_2', modelId, 'content', 'New photo set – lingerie', 'Pink & black theme, 25 photos', null, 0, 'in_progress', staffId
  );
  db.prepare(`INSERT INTO requests (id, model_id, type, title, details, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    'req_3', modelId, 'voice_note', 'Voice note for fan birthday', 'Warm, flirty 60s message saying happy birthday to "Mike"', 'pending', adminId
  );

  console.log('✓ Database seeded');
  console.log('  Admin:  admin@houseofher.com / admin123');
  console.log('  Staff:  staff@houseofher.com / staff123');
  console.log('  Model:  barbie@houseofher.com / model123');
  console.log('  Model:  luna@houseofher.com / model123');
}

export default db;
