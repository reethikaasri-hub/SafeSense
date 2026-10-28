const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/settings - Get user settings
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);

  if (!settings) {
    // Create default settings
    db.prepare('INSERT OR IGNORE INTO settings (user_id) VALUES (?)').run(req.user.id);
    const defaults = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
    return res.json({ settings: defaults });
  }

  res.json({ settings });
});

// PUT /api/settings - Update user settings
router.put('/', authenticateToken, (req, res) => {
  const db = getDb();
  const {
    notifications_enabled,
    email_alerts,
    push_alerts,
    sms_alerts,
    gas_threshold,
    temp_threshold_high,
    temp_threshold_low,
    humidity_threshold_high,
    humidity_threshold_low,
    theme,
    reading_interval
  } = req.body;

  // Ensure settings row exists
  db.prepare('INSERT OR IGNORE INTO settings (user_id) VALUES (?)').run(req.user.id);

  const updates = [];
  const params = [];

  if (notifications_enabled !== undefined) { updates.push('notifications_enabled = ?'); params.push(notifications_enabled ? 1 : 0); }
  if (email_alerts !== undefined) { updates.push('email_alerts = ?'); params.push(email_alerts ? 1 : 0); }
  if (push_alerts !== undefined) { updates.push('push_alerts = ?'); params.push(push_alerts ? 1 : 0); }
  if (sms_alerts !== undefined) { updates.push('sms_alerts = ?'); params.push(sms_alerts ? 1 : 0); }
  if (gas_threshold !== undefined) { updates.push('gas_threshold = ?'); params.push(gas_threshold); }
  if (temp_threshold_high !== undefined) { updates.push('temp_threshold_high = ?'); params.push(temp_threshold_high); }
  if (temp_threshold_low !== undefined) { updates.push('temp_threshold_low = ?'); params.push(temp_threshold_low); }
  if (humidity_threshold_high !== undefined) { updates.push('humidity_threshold_high = ?'); params.push(humidity_threshold_high); }
  if (humidity_threshold_low !== undefined) { updates.push('humidity_threshold_low = ?'); params.push(humidity_threshold_low); }
  if (theme !== undefined) { updates.push('theme = ?'); params.push(theme); }
  if (reading_interval !== undefined) { updates.push('reading_interval = ?'); params.push(reading_interval); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No settings to update' });
  }

  params.push(req.user.id);
  db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Settings updated', settings: updated });
});

// PUT /api/settings/profile - Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  const db = getDb();
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({ error: 'Name or email required' });
  }

  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    updates.push('email = ?');
    params.push(email);
  }

  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: 'Profile updated', user });
});

module.exports = router;
