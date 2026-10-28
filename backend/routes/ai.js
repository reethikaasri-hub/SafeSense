const express = require('express');
const { getDb } = require('../database');
const { predict } = require('../dnnModel');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/ai/predict - Get prediction for latest sensor data
router.get('/predict', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const latest = db.prepare(`
      SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1
    `).get();

    if (!latest) {
      return res.json({ prediction: null, message: 'No sensor data available' });
    }

    const prediction = await predict(latest.gas_value, latest.temperature, latest.humidity);

    res.json({
      prediction,
      timestamp: latest.timestamp,
      reading_id: latest.id
    });
  } catch (err) {
    console.error('AI prediction error:', err);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// POST /api/ai/analyze - Analyze custom sensor values
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { gas_value, temperature, humidity } = req.body;

    if (gas_value == null || temperature == null || humidity == null) {
      return res.status(400).json({ error: 'gas_value, temperature, and humidity are required' });
    }

    const prediction = await predict(
      parseFloat(gas_value),
      parseFloat(temperature),
      parseFloat(humidity)
    );

    res.json({ prediction });
  } catch (err) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// GET /api/ai/stats - Get AI classification statistics
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get();
  const classifications = db.prepare(`
    SELECT ai_classification, COUNT(*) as count, AVG(ai_confidence) as avg_confidence
    FROM sensor_readings
    GROUP BY ai_classification
  `).all();

  const recent = db.prepare(`
    SELECT ai_classification, COUNT(*) as count
    FROM sensor_readings
    WHERE timestamp >= datetime('now', '-1 hour')
    GROUP BY ai_classification
  `).all();

  res.json({
    total_predictions: total.count,
    all_time: classifications,
    last_hour: recent
  });
});

module.exports = router;
