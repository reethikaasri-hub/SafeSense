const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/sensors/latest - Get latest sensor reading
router.get('/latest', authenticateToken, (req, res) => {
  const db = getDb();
  const reading = db.prepare(`
    SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1
  `).get();

  if (!reading) {
    return res.json({ reading: null });
  }
  res.json({ reading });
});

// GET /api/sensors/history - Get sensor reading history
router.get('/history', authenticateToken, (req, res) => {
  const db = getDb();
  const {
    limit = 50,
    offset = 0,
    classification,
    from_date,
    to_date,
    device_id
  } = req.query;

  let query = 'SELECT * FROM sensor_readings WHERE 1=1';
  const params = [];

  if (classification) {
    query += ' AND ai_classification = ?';
    params.push(classification);
  }

  if (from_date) {
    query += ' AND timestamp >= ?';
    params.push(from_date);
  }

  if (to_date) {
    query += ' AND timestamp <= ?';
    params.push(to_date);
  }

  if (device_id) {
    query += ' AND device_id = ?';
    params.push(device_id);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countQuery).get(...params).total;

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const readings = db.prepare(query).all(...params);

  res.json({
    readings,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// GET /api/sensors/chart - Get chart data (last N readings)
router.get('/chart', authenticateToken, (req, res) => {
  const db = getDb();
  const { points = 50 } = req.query;

  const readings = db.prepare(`
    SELECT gas_value, temperature, humidity, ai_classification, timestamp
    FROM sensor_readings
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(parseInt(points));

  res.json({ data: readings.reverse() });
});

// GET /api/sensors/stats - Get aggregated statistics
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_readings,
      AVG(gas_value) as avg_gas,
      MAX(gas_value) as max_gas,
      MIN(gas_value) as min_gas,
      AVG(temperature) as avg_temp,
      MAX(temperature) as max_temp,
      MIN(temperature) as min_temp,
      AVG(humidity) as avg_humidity,
      MAX(humidity) as max_humidity,
      MIN(humidity) as min_humidity
    FROM sensor_readings
    WHERE timestamp >= datetime('now', '-24 hours')
  `).get();

  const classificationCounts = db.prepare(`
    SELECT ai_classification, COUNT(*) as count
    FROM sensor_readings
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY ai_classification
  `).all();

  const hourlyAvg = db.prepare(`
    SELECT
      strftime('%H:00', timestamp) as hour,
      AVG(gas_value) as avg_gas,
      AVG(temperature) as avg_temp,
      AVG(humidity) as avg_humidity
    FROM sensor_readings
    WHERE timestamp >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', timestamp)
    ORDER BY timestamp
  `).all();

  res.json({
    stats,
    classifications: classificationCounts,
    hourly: hourlyAvg
  });
});

module.exports = router;
