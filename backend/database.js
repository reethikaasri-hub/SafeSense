const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'safesense.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL DEFAULT 'ESP32-001',
      gas_value REAL NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      ai_classification TEXT DEFAULT 'Normal',
      ai_confidence REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL DEFAULT 'ESP32-001',
      type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      message TEXT NOT NULL,
      gas_value REAL,
      temperature REAL,
      humidity REAL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      esp32_status TEXT DEFAULT 'online',
      mq6_status TEXT DEFAULT 'operational',
      dht22_status TEXT DEFAULT 'operational',
      wifi_status TEXT DEFAULT 'connected',
      wifi_strength INTEGER DEFAULT -45,
      firmware_version TEXT DEFAULT 'v2.1.3',
      last_communication DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      notifications_enabled INTEGER DEFAULT 1,
      email_alerts INTEGER DEFAULT 1,
      push_alerts INTEGER DEFAULT 1,
      sms_alerts INTEGER DEFAULT 0,
      gas_threshold REAL DEFAULT 400,
      temp_threshold_high REAL DEFAULT 50,
      temp_threshold_low REAL DEFAULT 0,
      humidity_threshold_high REAL DEFAULT 80,
      humidity_threshold_low REAL DEFAULT 20,
      theme TEXT DEFAULT 'light',
      reading_interval INTEGER DEFAULT 5,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON sensor_readings(timestamp);
    CREATE INDEX IF NOT EXISTS idx_readings_device ON sensor_readings(device_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(created_at);
  `);

  // Seed default device if not exists
  const device = db.prepare('SELECT id FROM devices WHERE id = ?').get('ESP32-001');
  if (!device) {
    db.prepare(`
      INSERT INTO devices (id, name, esp32_status, mq6_status, dht22_status, wifi_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('ESP32-001', 'Main Safety Monitor', 'online', 'operational', 'operational', 'connected');
  }
}

module.exports = { getDb };
