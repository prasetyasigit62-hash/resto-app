import React, { useState, useEffect } from 'react';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/system/activity-log`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {
        console.error("Gagal mengambil log aktivitas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.service.toLowerCase() === filter.toLowerCase());

  const getActionColor = (action) => {
    if (action === 'CREATE' || action === 'IMPORT' || action === 'CHECKOUT') return '#2ecc71';
    if (action === 'DELETE' || action === 'DELETE-MANY' || action === 'CANCEL' || action === 'ALERT') return '#e74c3c';
    if (action === 'UPDATE' || action === 'UPDATE-ORDER') return '#f39c12';
    return '#3498db';
  };

  return (
    <div className="service-view">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
            <h2>Log Aktivitas Sistem</h2>
            <p>Rekam jejak audit trail seluruh aktivitas user dan sistem.</p>
        </div>
        <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer'}}
        >
            <option value="all">Semua Layanan</option>
            <option value="system">System</option>
            <option value="properti">Properti</option>
            <option value="hotel">Hotel</option>
            <option value="mall">Mall</option>
            <option value="ecommerce">Ecommerce</option>
            <option value="restoran">Restoran</option>
            <option value="orders">Orders</option>
        </select>
      </div>

      <div className="activity-timeline" style={{background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
        {loading ? (
            <p>Memuat data log...</p>
        ) : filteredLogs.length === 0 ? (
            <p style={{color: '#888', fontStyle: 'italic'}}>Tidak ada aktivitas tercatat untuk filter ini.</p>
          ) : (
            filteredLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: '12px', height: '12px', borderRadius: '50%', marginTop: '6px', backgroundColor: getActionColor(log.action) }}></div>
                    <div style={{flex: 1}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                            <span style={{fontWeight: 'bold', color: 'var(--text-color)'}}>
                                {log.action} 
                                <span style={{fontWeight: 'normal', color: '#888', marginLeft: '8px', fontSize: '0.85rem', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
                                    {log.service}
                                </span>
                            </span>
                            <span style={{fontSize: '0.8rem', color: '#888'}}>
                                {new Date(log.timestamp).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <p style={{margin: 0, color: 'var(--text-color-secondary)', fontSize: '0.95rem'}}>{log.details}</p>
                    </div>
                </div>
            ))
          )}
      </div>
    </div>
  );
};

export default ActivityLog;