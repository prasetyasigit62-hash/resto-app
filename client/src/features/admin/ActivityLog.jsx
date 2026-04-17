import React, { useState, useEffect, useCallback } from 'react';

const ITEMS_PER_PAGE = 25;

const ACTION_META = {
  CREATE:       { bg: '#dcfce7', color: '#16a34a' },
  IMPORT:       { bg: '#dcfce7', color: '#16a34a' },
  CHECKOUT:     { bg: '#dcfce7', color: '#16a34a' },
  DELETE:       { bg: '#fee2e2', color: '#dc2626' },
  'DELETE-MANY':{ bg: '#fee2e2', color: '#dc2626' },
  CANCEL:       { bg: '#fee2e2', color: '#dc2626' },
  ALERT:        { bg: '#fee2e2', color: '#dc2626' },
  UPDATE:       { bg: '#fef3c7', color: '#d97706' },
  'UPDATE-ORDER':   { bg: '#fef3c7', color: '#d97706' },
  'UPDATE-RESERVATION': { bg: '#fef3c7', color: '#d97706' },
  RESERVATION:  { bg: '#eff6ff', color: '#3b82f6' },
};

const getActionMeta = (action) => ACTION_META[action] || { bg: '#eff6ff', color: '#3b82f6' };

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/system/activity-log`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Gagal mengambil log aktivitas', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLogs();
  };

  const hasActiveFilter = serviceFilter !== 'all' || actionFilter !== 'all' || searchText || startDate || endDate;

  const filteredLogs = logs.filter(log => {
    if (serviceFilter !== 'all' && (log.service || '').toLowerCase() !== serviceFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchText && !(log.details || '').toLowerCase().includes(searchText.toLowerCase())) return false;
    const ts = new Date(log.timestamp);
    if (startDate && new Date(startDate) > ts) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (end < ts) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

  const resetFilters = () => {
    setServiceFilter('all');
    setActionFilter('all');
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + 6);
    if (end - start < 6) start = Math.max(1, end - 6);
    for (let p = start; p <= end; p++) pages.push(p);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#475569' }}>
          ← Prev
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => setCurrentPage(p)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === p ? '#3b82f6' : 'white', color: currentPage === p ? 'white' : '#475569', cursor: 'pointer', fontWeight: currentPage === p ? '700' : 'normal', minWidth: '36px' }}>
            {p}
          </button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#475569' }}>
          Next →
        </button>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '8px' }}>
          Hal {currentPage} / {totalPages}
        </span>
      </div>
    );
  };

  return (
    <div className="service-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>📋 Log Aktivitas Sistem</h2>
          <p style={{ color: '#64748b' }}>
            Rekam jejak audit trail seluruh aktivitas user dan sistem.
            {lastRefresh && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}</span>}
          </p>
        </div>
        <button onClick={handleRefresh}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Cari detail aktivitas..."
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)' }}
          />
          <select value={serviceFilter} onChange={e => { setServiceFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)', cursor: 'pointer' }}>
            <option value="all">Semua Layanan</option>
            <option value="system">System</option>
            <option value="restoran">Restoran</option>
            <option value="orders">Orders</option>
            <option value="kasir">Kasir / Shift</option>
            <option value="inventori">Inventori</option>
            <option value="pengguna">Pengguna</option>
          </select>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)', cursor: 'pointer' }}>
            <option value="all">Semua Aksi</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>s/d</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)' }} />
          </div>
          {hasActiveFilter && (
            <button onClick={resetFilters}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
              ✕ Reset
            </button>
          )}
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            {filteredLogs.length} dari {logs.length} entri
          </span>
        </div>
      </div>

      {/* Log List */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data log...</p>
        ) : paginatedLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada aktivitas untuk filter ini.</p>
          </div>
        ) : (
          paginatedLogs.map((log, idx) => {
            const meta = getActionMeta(log.action);
            return (
              <div key={log.id || idx} style={{ display: 'flex', gap: '15px', padding: '14px 20px', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '7px', backgroundColor: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: meta.bg, color: meta.color, padding: '2px 9px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#888', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        {log.service}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-color-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>{log.details}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {renderPagination()}
    </div>
  );
};

export default ActivityLog;
