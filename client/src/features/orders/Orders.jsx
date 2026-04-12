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
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Manajemen Pesanan</h2>
          <p>Kelola semua pesanan yang masuk dari pelanggan.</p>
        </div>
        <button onClick={() => handleExportCSV(orders)} className="btn-success-sm" style={{ background: '#27ae60', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          📤 Export CSV
        </button>
      </div>

      {/* Area Filter Baru */}
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Cari ID atau Nama Pelanggan..."
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
          <option value="Processed">Processed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <p>Memuat data pesanan...</p> : (
        <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Tidak ada pesanan yang cocok dengan filter.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.date).toLocaleString('id-ID')}</td>
                    <td>Rp {order.total.toLocaleString('id-ID')}</td>
                    <td>{getStatusPill(order.status)}</td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button className="btn-secondary-sm" onClick={() => setSelectedOrder(order)}>
                        Lihat Detail
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }}
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