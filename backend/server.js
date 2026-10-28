require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { getDb } = require('./database');
const { initModel } = require('./dnnModel');
const { startSimulation } = require('./sensorSimulator');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/health')) {
      console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
const { router: authRouter } = require('./routes/auth');
const sensorRouter = require('./routes/sensors');
const alertRouter = require('./routes/alerts');
const deviceRouter = require('./routes/devices');
const aiRouter = require('./routes/ai');
const settingsRouter = require('./routes/settings');

app.use('/api/auth', authRouter);
app.use('/api/sensors', sensorRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SafeSense API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Dashboard summary
app.get('/api/dashboard', (req, res) => {
  try {
    const db = getDb();

    const latestReading = db.prepare(`
      SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1
    `).get();

    const activeAlerts = db.prepare(
      "SELECT COUNT(*) as count FROM alerts WHERE status = 'active'"
    ).get();

    const recentAlerts = db.prepare(`
      SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5
    `).all();

    const recentReadings = db.prepare(`
      SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 10
    `).all();

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get('ESP32-001');

    const totalReadings = db.prepare('SELECT COUNT(*) as count FROM sensor_readings').get();

    res.json({
      latestReading,
      activeAlerts: activeAlerts.count,
      recentAlerts,
      recentReadings,
      device,
      totalReadings: totalReadings.count
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Send latest data to newly connected client
  try {
    const db = getDb();
    const latest = db.prepare('SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1').get();
    if (latest) {
      socket.emit('sensor_data', latest);
    }
  } catch (err) {
    console.error('Error sending initial data:', err);
  }

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Initialize database
    console.log('[DB] Initializing database...');
    getDb();
    console.log('[DB] Database ready');

    // Initialize DNN model
    console.log('[DNN] Training anomaly detection model...');
    await initModel();
    console.log('[DNN] Model ready');

    // Start server
    server.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  SafeSense API Server`);
      console.log(`  Port: ${PORT}`);
      console.log(`  WebSocket: Enabled`);
      console.log(`  Database: SQLite`);
      console.log(`  DNN: TensorFlow.js`);
      console.log(`========================================\n`);

      // Start sensor simulation
      startSimulation(io, 5000);
      console.log('[Simulator] Sensor simulation active (5s interval)');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
