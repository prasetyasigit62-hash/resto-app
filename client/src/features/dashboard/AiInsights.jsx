import React, { useState, useEffect } from 'react';

const AiInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeData = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/v2/analytics/smart-insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setInsights([{
            type: 'info', 
            icon: '✨', 
            title: `Laporan Eksekutif (${data.source})`, 
            message: data.analysis.replace(/\n/g, '<br />')
          }]);
        } else {
          setInsights([{ type: 'danger', icon: '⚠️', title: 'Gagal Memuat AI', message: 'Gagal mengambil analisa dari server.' }]);
        }
      } catch (e) { } finally { setLoading(false); }
    };
    analyzeData();
  }, []);

  return (
    <div className="service-view">
      <div style={{ marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px #3b82f6)' }}>🧠</div>
        <div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smart Operational Insight</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.1rem' }}>Asisten bisnis cerdas Anda sedang menganalisis data jutaan titik...</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          <div className="loading-spinner" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent', width: '40px', height: '40px', marginBottom: '20px' }}></div>
          <div>AI sedang memproses algoritma...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {insights.map((ins, idx) => {
            const colors = {
              success: { bg: '#f0fdf4', border: '#bbf7d0', title: '#16a34a' },
              danger: { bg: '#fef2f2', border: '#fecaca', title: '#dc2626' },
              warning: { bg: '#fffbeb', border: '#fde68a', title: '#d97706' },
              info: { bg: '#eff6ff', border: '#bfdbfe', title: '#2563eb' }
            };
            const theme = colors[ins.type];
            return (
              <div key={idx} style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: '25px', borderRadius: '12px', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '2.5rem' }}>{ins.icon}</div>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: theme.title }}>{ins.title}</h3>
                  <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: ins.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AiInsights;