import React, { useState } from 'react';
import { useOrders } from './useOrders';
import { handleExportCSV, getStatusPill } from './orderUtils';
import OrderDetailsModal from './OrderDetailsModal';

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null); // For modal
  const { orders, filteredOrders, loading, filters, setFilters, handleStatusChange } = useOrders();

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Lacak & Manajemen Pesanan</h2>
          <p>Lacak nota operasional (Tracking) berdasarkan ID Kategori Menu untuk Audit.</p>
        </div>
        <button onClick={() => handleExportCSV(orders)} className="btn-success-sm" style={{ background: '#27ae60', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          📤 Export CSV
        </button>
      </div>

      {/* Area Filter Baru */}
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Lacak No. Nota (Contoh: ORD-...-DAGING) atau Pelanggan..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
          style={{ flex: 1, minWidth: '200px' }}
        />
        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="search-input" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="search-input" />
        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="search-input"
          style={{ minWidth: '150px' }}
        >
          <option value="all">Semua Status</option>
          <option value="Pending">Pending</option>
          <option value="Cooking">Cooking (Dapur)</option>
          <option value="Ready">Ready (Siap Saji)</option>
          <option value="Processed">Processed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <p>Memuat data pesanan...</p> : (
        <div className="table-responsive" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>Nomor Nota (Tracking ID)</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>Pelanggan</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>Tanggal</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>Total</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>Status</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                   <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
                   Tidak ada pesanan yang cocok dengan filter.
                </td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '15px 20px', fontWeight: '900', color: '#4f46e5' }}>{order.trackingNumber || `#${String(order.id).slice(0, 8)}`}</td>
                    <td style={{ padding: '15px 20px', color: '#1e293b', fontWeight: '600' }}>{order.customerName}</td>
                    <td style={{ padding: '15px 20px', color: '#64748b', fontSize: '0.9rem' }}>{new Date(order.date).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#0f172a' }}>Rp {order.total.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '15px 20px' }}>{getStatusPill(order.status)}</td>
                    <td style={{ padding: '15px 20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.transform = 'translateY(-1px)' }} 
                        onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = 'none' }}
                      >
                        <span>👁️</span> Detail
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none', fontSize: '0.85rem', background: 'white', color: '#334155', fontWeight: '600' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processed">Processed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default Orders;