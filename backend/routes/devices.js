const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/devices - Get all devices
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const devices = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all();
  res.json({ devices });
});

// GET /api/devices/:id - Get device by ID
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  // Get latest reading for this device
  const latestReading = db.prepare(`
    SELECT * FROM sensor_readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1
  `).get(req.params.id);

  // Get reading count
  const readingCount = db.prepare(
    'SELECT COUNT(*) as count FROM sensor_readings WHERE device_id = ?'
  ).get(req.params.id);

  res.json({
    device,
    latestReading,
    totalReadings: readingCount.count
  });
});

module.exports = router;
