const tf = require('@tensorflow/tfjs');

let model = null;

/**
 * SafeSense DNN Anomaly Detection Model
 * 
 * Architecture: 3-layer Deep Neural Network
 * Input: [gas_value, temperature, humidity] (normalized)
 * Output: [normal_probability, anomaly_probability]
 * 
 * The model classifies sensor readings into:
 * - Normal: Safe operating conditions
 * - Warning: Elevated but not critical readings  
 * - Abnormal: Dangerous conditions requiring immediate action
 */

// Normalization constants based on expected sensor ranges
const SENSOR_RANGES = {
  gas: { min: 0, max: 1000 },       // MQ-6 gas sensor (ppm)
  temperature: { min: -10, max: 80 }, // DHT22 temperature (°C)
  humidity: { min: 0, max: 100 }      // DHT22 humidity (%)
};

// Thresholds for classification
const THRESHOLDS = {
  gas: { warning: 300, abnormal: 500 },
  temperature: { warningHigh: 40, abnormalHigh: 55, warningLow: 5, abnormalLow: -5 },
  humidity: { warningHigh: 75, abnormalHigh: 90, warningLow: 25, abnormalLow: 10 }
};

function normalize(value, min, max) {
  return (value - min) / (max - min);
}

async function buildModel() {
  model = tf.sequential();

  // Input layer + first hidden layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: [3],
    kernelInitializer: 'glorotUniform'
  }));

  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Second hidden layer
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    kernelInitializer: 'glorotUniform'
  }));

  // Third hidden layer
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu',
    kernelInitializer: 'glorotUniform'
  }));

  // Output layer - 3 classes: Normal, Warning, Abnormal
  model.add(tf.layers.dense({
    units: 3,
    activation: 'softmax'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  // Train with synthetic labeled data
  await trainModel();

  console.log('[DNN] SafeSense anomaly detection model ready');
  return model;
}

async function trainModel() {
  // Generate training data with clear patterns
  const trainingData = [];
  const labels = [];

  // Normal conditions (class 0)
  for (let i = 0; i < 200; i++) {
    const gas = 50 + Math.random() * 200;       // 50-250 ppm
    const temp = 18 + Math.random() * 17;        // 18-35°C
    const hum = 35 + Math.random() * 30;         // 35-65%
    trainingData.push([
      normalize(gas, SENSOR_RANGES.gas.min, SENSOR_RANGES.gas.max),
      normalize(temp, SENSOR_RANGES.temperature.min, SENSOR_RANGES.temperature.max),
      normalize(hum, SENSOR_RANGES.humidity.min, SENSOR_RANGES.humidity.max)
    ]);
    labels.push([1, 0, 0]);
  }

  // Warning conditions (class 1)
  for (let i = 0; i < 150; i++) {
    const gas = 280 + Math.random() * 200;       // 280-480 ppm
    const temp = 36 + Math.random() * 15;         // 36-51°C
    const hum = 70 + Math.random() * 18;          // 70-88%
    trainingData.push([
      normalize(gas, SENSOR_RANGES.gas.min, SENSOR_RANGES.gas.max),
      normalize(temp, SENSOR_RANGES.temperature.min, SENSOR_RANGES.temperature.max),
      normalize(hum, SENSOR_RANGES.humidity.min, SENSOR_RANGES.humidity.max)
    ]);
    labels.push([0, 1, 0]);
  }

  // Abnormal conditions (class 2)
  for (let i = 0; i < 150; i++) {
    const gas = 480 + Math.random() * 500;       // 480-980 ppm
    const temp = 50 + Math.random() * 25;         // 50-75°C
    const hum = 85 + Math.random() * 15;          // 85-100%
    trainingData.push([
      normalize(gas, SENSOR_RANGES.gas.min, SENSOR_RANGES.gas.max),
      normalize(temp, SENSOR_RANGES.temperature.min, SENSOR_RANGES.temperature.max),
      normalize(hum, SENSOR_RANGES.humidity.min, SENSOR_RANGES.humidity.max)
    ]);
    labels.push([0, 0, 1]);
  }

  const xs = tf.tensor2d(trainingData);
  const ys = tf.tensor2d(labels);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();
}

/**
 * Predict anomaly classification for given sensor readings
 * @param {number} gasValue - Gas sensor value in ppm
 * @param {number} temperature - Temperature in °C
 * @param {number} humidity - Humidity in %
 * @returns {Object} Classification result with class and confidence
 */
async function predict(gasValue, temperature, humidity) {
  if (!model) {
    await buildModel();
  }

  const input = tf.tensor2d([[
    normalize(gasValue, SENSOR_RANGES.gas.min, SENSOR_RANGES.gas.max),
    normalize(temperature, SENSOR_RANGES.temperature.min, SENSOR_RANGES.temperature.max),
    normalize(humidity, SENSOR_RANGES.humidity.min, SENSOR_RANGES.humidity.max)
  ]]);

  const prediction = model.predict(input);
  const probabilities = await prediction.data();
  const classIndex = probabilities.indexOf(Math.max(...probabilities));

  const classes = ['Normal', 'Warning', 'Abnormal'];
  const confidence = probabilities[classIndex];

  input.dispose();
  prediction.dispose();

  return {
    classification: classes[classIndex],
    confidence: parseFloat(confidence.toFixed(4)),
    probabilities: {
      normal: parseFloat(probabilities[0].toFixed(4)),
      warning: parseFloat(probabilities[1].toFixed(4)),
      abnormal: parseFloat(probabilities[2].toFixed(4))
    },
    inputs: {
      gas: gasValue,
      temperature: temperature,
      humidity: humidity
    },
    model_info: {
      type: 'Deep Neural Network (DNN)',
      layers: 4,
      task: 'Multi-class Anomaly Classification',
      classes: ['Normal', 'Warning', 'Abnormal']
    }
  };
}

async function initModel() {
  if (!model) {
    await buildModel();
  }
}

module.exports = { predict, initModel, THRESHOLDS };
