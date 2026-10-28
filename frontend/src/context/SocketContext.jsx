import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [sensorData, setSensorData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [newAlerts, setNewAlerts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sensor_data', (data) => {
      setSensorData(data);
    });

    socket.on('new_alerts', (alerts) => {
      setNewAlerts(prev => [...alerts, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function clearAlertNotifications() {
    setNewAlerts([]);
  }

  return (
    <SocketContext.Provider value={{ sensorData, connected, newAlerts, clearAlertNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
