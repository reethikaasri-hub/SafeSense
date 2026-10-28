const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/alerts - Get all alerts
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { status, severity, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = db.prepare(countQuery).get(...params).total;

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const alerts = db.prepare(query).all(...params);

  res.json({
    alerts,
    pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
  });
});

// GET /api/alerts/summary - Get alert summary counts
router.get('/summary', authenticateToken, (req, res) => {
  const db = getDb();

  const active = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('active');
  const resolved = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('resolved');
  const critical = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'active' AND severity = ?").get('critical');
  const high = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'active' AND severity = ?").get('high');

  res.json({
    active: active.count,
    resolved: resolved.count,
    critical: critical.count,
    high: high.count
  });
});

// PUT /api/alerts/:id/resolve - Resolve an alert
router.put('/:id/resolve', authenticateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

  res.json({ message: 'Alert resolved', alert_id: id });
});

// PUT /api/alerts/resolve-all - Resolve all active alerts
router.put('/resolve-all', authenticateToken, (req, res) => {
  const db = getDb();
  const result = db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE status = 'active'").run();
  res.json({ message: 'All alerts resolved', count: result.changes });
});

module.exports = router;
