import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { dashboardAPI, sensorAPI } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Shield, Flame, Thermometer, Droplets, Wifi,
  Clock, Brain, Bell, AlertTriangle, CheckCircle
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { sensorData, connected } = useSocket();
  const [dashData, setDashData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadChart();
  }, []);

  useEffect(() => {
    if (sensorData) {
      setChartData(prev => {
        const updated = [...prev, {
          time: new Date(sensorData.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          gas: sensorData.gas_value,
          temp: sensorData.temperature,
          humidity: sensorData.humidity
        }];
        return updated.slice(-30);
      });
    }
  }, [sensorData]);

  async function loadDashboard() {
    try {
      const data = await dashboardAPI.getSummary();
      setDashData(data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadChart() {
    try {
      const data = await sensorAPI.getChart(30);
      setChartData(data.data.map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        gas: r.gas_value,
        temp: r.temperature,
        humidity: r.humidity
      })));
    } catch (err) {
      console.error('Chart load error:', err);
    }
  }

  const latest = sensorData || dashData?.latestReading;
  const classification = latest?.ai_classification || 'Normal';
  const statusColor = classification === 'Normal' ? 'green' : classification === 'Warning' ? 'amber' : 'red';

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time safety monitoring overview</p>
      </div>

      {/* Status Banner */}
      <div className={`status-banner status-banner-${statusColor}`}>
        <div className="status-banner-left">
          <Shield size={20} />
          <div>
            <div className="status-banner-title">
              Overall Safety Status: {classification}
            </div>
            <div className="status-banner-sub">
              {classification === 'Normal' ? 'All readings within safe parameters' :
               classification === 'Warning' ? 'Elevated readings detected — monitor closely' :
               'Dangerous conditions detected — take immediate action'}
            </div>
          </div>
        </div>
        <span className={`badge badge-${classification.toLowerCase()}`}>
          {classification}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 dash-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--amber-100)', color: 'var(--amber-600)' }}>
            <Flame size={20} />
          </div>
          <div>
            <div className="stat-value">{latest?.gas_value?.toFixed(1) || '—'}</div>
            <div className="stat-label">Gas Level (ppm)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--red-100)', color: 'var(--red-600)' }}>
            <Thermometer size={20} />
          </div>
          <div>
            <div className="stat-value">{latest?.temperature?.toFixed(1) || '—'}°C</div>
            <div className="stat-label">Temperature</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--navy-50)', color: 'var(--navy-600)' }}>
            <Droplets size={20} />
          </div>
          <div>
            <div className="stat-value">{latest?.humidity?.toFixed(1) || '—'}%</div>
            <div className="stat-label">Humidity</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: connected ? 'var(--green-100)' : 'var(--red-100)', color: connected ? 'var(--green-600)' : 'var(--red-600)' }}>
            <Wifi size={20} />
          </div>
          <div>
            <div className="stat-value">{connected ? 'Connected' : 'Offline'}</div>
            <div className="stat-label">Device Status</div>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="dash-info-row">
        <div className="dash-info-item">
          <Clock size={14} />
          <span>Last Updated: {latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : 'N/A'}</span>
        </div>
        <div className="dash-info-item">
          <Brain size={14} />
          <span>AI Status: {classification}</span>
          <span className={`status-dot status-dot-${classification.toLowerCase()}`} />
        </div>
      </div>

      {/* Charts + Alerts */}
      <div className="dash-grid">
        <div className="card dash-chart-card">
          <div className="card-header">
            <h3 className="card-title">Live Sensor Readings</h3>
            <span className="badge badge-info">Last 30 readings</span>
          </div>
          <div className="dash-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
                <Line type="monotone" dataKey="gas" stroke="#d97706" strokeWidth={2} dot={false} name="Gas (ppm)" />
                <Line type="monotone" dataKey="temp" stroke="#dc2626" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#1e3a5f" strokeWidth={2} dot={false} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-side-cards">
          {/* Recent Alerts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Alerts</h3>
              <span className="badge badge-red">{dashData?.activeAlerts || 0} active</span>
            </div>
            <div className="dash-alerts-list">
              {dashData?.recentAlerts?.length > 0 ? (
                dashData.recentAlerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className="dash-alert-item">
                    <AlertTriangle size={14} className={`alert-icon-${alert.severity}`} />
                    <div className="dash-alert-content">
                      <div className="dash-alert-msg">{alert.message}</div>
                      <div className="dash-alert-time">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    {alert.status === 'resolved' && <CheckCircle size={14} style={{ color: 'var(--green-500)' }} />}
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Readings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Readings</h3>
            </div>
            <div className="dash-readings-list">
              {dashData?.recentReadings?.slice(0, 5).map(r => (
                <div key={r.id} className="dash-reading-item">
                  <div className="dash-reading-values">
                    <span title="Gas"><Flame size={12} /> {r.gas_value?.toFixed(1)}</span>
                    <span title="Temp"><Thermometer size={12} /> {r.temperature?.toFixed(1)}°</span>
                    <span title="Humidity"><Droplets size={12} /> {r.humidity?.toFixed(1)}%</span>
                  </div>
                  <span className={`badge badge-${r.ai_classification?.toLowerCase()}`}>
                    {r.ai_classification}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
