# SafeSense – Real-Time Safety Anomaly Detection System

📌 About the Project

SafeSense is an IoT and AI-based safety monitoring prototype designed to monitor environmental conditions and identify potentially unsafe situations in real time.

The system aims to combine sensor data, anomaly detection, and a web dashboard to support safety monitoring and alert management.

🎯 Objectives

- Monitor environmental sensor readings.
- Identify unusual or potentially unsafe conditions.
- Display sensor information through a web dashboard.
- Manage alerts and connected devices.
- Explore AI-based anomaly detection for safety monitoring.

 🛠️ Technology Stack

**Frontend**
- React
- JavaScript / JSX
- Vite
- CSS

**Backend**
- Node.js
- Express.js (verify against the actual backend dependencies)
- SQLite (planned or implemented database functionality)
- REST API

**IoT Hardware – Planned Integration**
- ESP32
- MQ-6 gas sensor
- DHT22 temperature and humidity sensor

## 🏗️ System Architecture

```text
Environmental Sensors
        ↓
      ESP32
        ↓
   Backend API
        ↓
Data Processing and
Anomaly Detection
        ↓
    Web Dashboard
        ↓
   Alerts and Status
```

*The architecture illustrates the intended workflow. Hardware integration and individual features should be verified against the current implementation.*

## 📂 Project Structure

```text
SafeSense/
├── backend/
│   ├── routes/
│   │   ├── ai.js
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── devices.js
│   │   ├── sensors.js
│   │   └── settings.js
│   ├── database.js
│   ├── dnnModel.js
│   ├── sensorSimulator.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── index.html
│   └── package.json
└── README.md
```

 ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- Git
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/reethikaasri-hub/SafeSense.git
cd SafeSense
```

### 2. Start the Backend

```bash
cd backend
npm install
```

Check `backend/package.json` for the configured start script, then run the appropriate command, commonly:

```bash
npm start
```

### 3. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Check `frontend/package.json` for the configured development script, then run:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

🔍 Key Components

- **Sensor Monitoring:** Supports environmental data monitoring through the project's sensor-data components.
- **Anomaly Detection:** Includes an AI-related backend module for anomaly detection.
- **Alert Management:** Provides backend routes for alert-related operations.
- **Device Management:** Includes routes for managing device information.
- **Dashboard:** Provides a frontend interface for presenting monitoring information.

*The exact capabilities depend on the current implementation and configuration.*

#🚀 Future Enhancements

- Integrate ESP32 with physical sensors.
- Validate sensor readings and calibrate measurements.
- Improve anomaly detection using verified sensor datasets.
- Add real-time alerts and monitoring.
- Test system reliability under controlled, safe conditions.

## ⚠️ Disclaimer

SafeSense is an educational prototype and is not a certified gas detection or life-safety system. Do not rely on it as a replacement for certified safety equipment. Sensor readings require appropriate
