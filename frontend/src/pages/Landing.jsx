import { useNavigate } from 'react-router-dom';
import {
  Shield, Activity, Brain, Bell, Wifi,
  ArrowRight, ChevronRight, Zap, Eye, BarChart3
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      desc: 'Track gas levels, temperature, and humidity from ESP32-connected sensors with live data streaming and instant updates.',
      color: 'green'
    },
    {
      icon: Brain,
      title: 'Intelligent Anomaly Detection',
      desc: 'Deep Neural Network analyzes sensor patterns to classify conditions as Normal, Warning, or Abnormal in real time.',
      color: 'navy'
    },
    {
      icon: Bell,
      title: 'Instant Alerts',
      desc: 'Receive immediate notifications when dangerous conditions are detected. Severity-based alerting with full audit trail.',
      color: 'amber'
    },
    {
      icon: Wifi,
      title: 'IoT Connectivity',
      desc: 'Seamless integration with ESP32 microcontrollers, MQ-6 gas sensors, and DHT22 temperature/humidity modules via Wi-Fi.',
      color: 'navy'
    }
  ];

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container landing-header-inner">
          <div className="landing-logo">
            <Shield size={24} />
            <span>SafeSense</span>
          </div>
          <nav className="landing-nav">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={14} />
              Real-Time Safety Anomaly Detection System
            </div>
            <h1 className="hero-title">
              Detect. Monitor.<br />Respond.
            </h1>
            <p className="hero-desc">
              SafeSense combines IoT sensor technology with deep learning to provide
              real-time safety monitoring, intelligent anomaly detection, and instant
              alerting for industrial and environmental safety.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                Get Started
                <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                View Demo
                <Eye size={18} />
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">3</span>
                <span className="hero-stat-label">Sensor Types</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">DNN</span>
                <span className="hero-stat-label">AI Model</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">5s</span>
                <span className="hero-stat-label">Update Interval</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-header">
                <div className="visual-dot green" />
                <span>System Status: Operational</span>
              </div>
              <div className="visual-metrics">
                <div className="visual-metric">
                  <span className="vm-label">Gas Level</span>
                  <span className="vm-value">142 ppm</span>
                  <div className="vm-bar">
                    <div className="vm-bar-fill green" style={{ width: '14%' }} />
                  </div>
                </div>
                <div className="visual-metric">
                  <span className="vm-label">Temperature</span>
                  <span className="vm-value">28.3°C</span>
                  <div className="vm-bar">
                    <div className="vm-bar-fill blue" style={{ width: '35%' }} />
                  </div>
                </div>
                <div className="visual-metric">
                  <span className="vm-label">Humidity</span>
                  <span className="vm-value">52%</span>
                  <div className="vm-bar">
                    <div className="vm-bar-fill teal" style={{ width: '52%' }} />
                  </div>
                </div>
              </div>
              <div className="visual-footer">
                <Brain size={14} />
                <span>AI Classification: Normal</span>
                <span className="badge badge-normal" style={{ marginLeft: 'auto' }}>Safe</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="visual-glow" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Capabilities</h2>
            <p className="section-desc">
              End-to-end safety monitoring powered by IoT sensors and artificial intelligence
            </p>
          </div>
          <div className="features-grid">
            {features.map((feat, i) => (
              <div key={i} className="feature-card">
                <div className={`feature-icon feature-icon-${feat.color}`}>
                  <feat.icon size={22} />
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
                <div className="feature-link">
                  Learn more <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How SafeSense Works</h2>
            <p className="section-desc">
              From sensor data collection to intelligent decision making
            </p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">01</div>
              <h3>Sensor Data Collection</h3>
              <p>ESP32 microcontroller reads gas (MQ-6), temperature and humidity (DHT22) sensors every 5 seconds.</p>
            </div>
            <div className="how-connector" />
            <div className="how-step">
              <div className="how-step-num">02</div>
              <h3>DNN Analysis</h3>
              <p>A trained Deep Neural Network processes the readings and classifies conditions into Normal, Warning, or Abnormal.</p>
            </div>
            <div className="how-connector" />
            <div className="how-step">
              <div className="how-step-num">03</div>
              <h3>Alert & Response</h3>
              <p>Alerts are generated based on AI classification and threshold breaches, enabling rapid safety response.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Ready to enhance your safety monitoring?</h2>
          <p>Start monitoring your environment in minutes with SafeSense.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
            Get Started Now
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="footer-brand">
            <Shield size={18} />
            <span>SafeSense</span>
          </div>
          <p className="footer-copy">Real-Time Safety Anomaly Detection System</p>
        </div>
      </footer>
    </div>
  );
}
