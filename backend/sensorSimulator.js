const { getDb } = require('./database');
const { predict, THRESHOLDS } = require('./dnnModel');

/**
 * Sensor Simulator for SafeSense
 * Simulates ESP32 with MQ-6 gas sensor and DHT22 temperature/humidity sensor
 * Generates realistic sensor readings with occasional anomalies
 */

let currentState = {
  gasBase: 120,
  tempBase: 26,
  humBase: 50,
  trend: 'normal',       // normal, rising, anomaly
  trendCounter: 0,
  anomalyCountdown: randomInt(30, 80)
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateReading() {
  currentState.anomalyCountdown--;

  // Simulate occasional anomalies
  if (currentState.anomalyCountdown <= 0 && currentState.trend === 'normal') {
    currentState.trend = 'rising';
    currentState.trendCounter = randomInt(5, 15);
  }

  let gas, temp, humidity;

  switch (currentState.trend) {
    case 'normal':
      // Normal fluctuation around base values
      currentState.gasBase += randomFloat(-5, 5);
      currentState.gasBase = Math.max(50, Math.min(250, currentState.gasBase));
      currentState.tempBase += randomFloat(-0.3, 0.3);
      currentState.tempBase = Math.max(18, Math.min(35, currentState.tempBase));
      currentState.humBase += randomFloat(-1, 1);
      currentState.humBase = Math.max(35, Math.min(65, currentState.humBase));

      gas = currentState.gasBase + randomFloat(-10, 10);
      temp = currentState.tempBase + randomFloat(-0.5, 0.5);
      humidity = currentState.humBase + randomFloat(-2, 2);
      break;

    case 'rising':
      // Values rising toward anomaly
      currentState.gasBase += randomFloat(10, 30);
      currentState.tempBase += randomFloat(0.5, 2);
      currentState.humBase += randomFloat(1, 3);
      currentState.trendCounter--;

      gas = currentState.gasBase + randomFloat(-5, 15);
      temp = currentState.tempBase + randomFloat(-0.3, 1);
      humidity = currentState.humBase + randomFloat(-1, 2);

      if (currentState.trendCounter <= 0) {
        currentState.trend = 'anomaly';
        currentState.trendCounter = randomInt(3, 8);
      }
      break;

    case 'anomaly':
      // Sustained high values
      gas = currentState.gasBase + randomFloat(-20, 50);
      temp = currentState.tempBase + randomFloat(-1, 3);
      humidity = currentState.humBase + randomFloat(-2, 5);
      currentState.trendCounter--;

      if (currentState.trendCounter <= 0) {
        // Return to normal gradually
        currentState.trend = 'normal';
        currentState.gasBase = 120 + randomFloat(-20, 20);
        currentState.tempBase = 26 + randomFloat(-3, 3);
        currentState.humBase = 50 + randomFloat(-5, 5);
        currentState.anomalyCountdown = randomInt(30, 80);
      }
      break;
  }

  gas = Math.max(0, parseFloat(gas.toFixed(1)));
  temp = parseFloat(temp.toFixed(1));
  humidity = Math.max(0, Math.min(100, parseFloat(humidity.toFixed(1))));

  return { gas, temperature: temp, humidity };
}

async function processReading(io) {
  const reading = generateReading();
  const db = getDb();

  // Run DNN prediction
  const prediction = await predict(reading.gas, reading.temperature, reading.humidity);

  // Store reading
  const stmt = db.prepare(`
    INSERT INTO sensor_readings (device_id, gas_value, temperature, humidity, ai_classification, ai_confidence)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    'ESP32-001',
    reading.gas,
    reading.temperature,
    reading.humidity,
    prediction.classification,
    prediction.confidence
  );

  // Update device last communication
  db.prepare('UPDATE devices SET last_communication = CURRENT_TIMESTAMP WHERE id = ?')
    .run('ESP32-001');

  // Check for alert conditions
  const alerts = checkAlertConditions(reading, prediction, db);

  const sensorData = {
    id: result.lastInsertRowid,
    device_id: 'ESP32-001',
    gas_value: reading.gas,
    temperature: reading.temperature,
    humidity: reading.humidity,
    ai_classification: prediction.classification,
    ai_confidence: prediction.confidence,
    prediction: prediction,
    timestamp: new Date().toISOString(),
    alerts: alerts
  };

  // Emit to all connected clients via WebSocket
  if (io) {
    io.emit('sensor_data', sensorData);
    if (alerts.length > 0) {
      io.emit('new_alerts', alerts);
    }
  }

  return sensorData;
}

function checkAlertConditions(reading, prediction, db) {
  const alerts = [];
  const now = new Date().toISOString();

  // Gas level alerts
  if (reading.gas > THRESHOLDS.gas.abnormal) {
    alerts.push(createAlert(db, {
      type: 'gas_critical',
      severity: 'critical',
      message: `Critical gas level detected: ${reading.gas} ppm`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  } else if (reading.gas > THRESHOLDS.gas.warning) {
    alerts.push(createAlert(db, {
      type: 'gas_warning',
      severity: 'high',
      message: `Elevated gas level: ${reading.gas} ppm`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  }

  // Temperature alerts
  if (reading.temperature > THRESHOLDS.temperature.abnormalHigh) {
    alerts.push(createAlert(db, {
      type: 'temperature_critical',
      severity: 'critical',
      message: `Critical temperature: ${reading.temperature}°C`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  } else if (reading.temperature > THRESHOLDS.temperature.warningHigh) {
    alerts.push(createAlert(db, {
      type: 'temperature_warning',
      severity: 'medium',
      message: `High temperature: ${reading.temperature}°C`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  }

  // AI prediction alerts
  if (prediction.classification === 'Abnormal') {
    alerts.push(createAlert(db, {
      type: 'ai_anomaly',
      severity: 'critical',
      message: `AI detected anomaly (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  } else if (prediction.classification === 'Warning') {
    alerts.push(createAlert(db, {
      type: 'ai_warning',
      severity: 'medium',
      message: `AI warning state (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
      gas_value: reading.gas,
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  }

  return alerts;
}

function createAlert(db, alertData) {
  const stmt = db.prepare(`
    INSERT INTO alerts (device_id, type, severity, message, gas_value, temperature, humidity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    'ESP32-001',
    alertData.type,
    alertData.severity,
    alertData.message,
    alertData.gas_value,
    alertData.temperature,
    alertData.humidity
  );

  return {
    id: result.lastInsertRowid,
    ...alertData,
    device_id: 'ESP32-001',
    status: 'active',
    created_at: new Date().toISOString()
  };
}

let simulationInterval = null;

function startSimulation(io, intervalMs = 5000) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  console.log(`[Simulator] Starting sensor simulation (interval: ${intervalMs}ms)`);

  // Initial reading
  processReading(io);

  simulationInterval = setInterval(() => {
    processReading(io);
  }, intervalMs);

  return simulationInterval;
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('[Simulator] Sensor simulation stopped');
  }
}

module.exports = { startSimulation, stopSimulation, processReading };
