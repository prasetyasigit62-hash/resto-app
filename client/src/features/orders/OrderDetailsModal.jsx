import React from 'react';
import { handlePrintInvoice, getStatusPill } from './orderUtils';

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detail Pesanan #{order.id}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-info-grid">
            <div className="info-item"><label>Pelanggan</label><span>{order.customerName}</span></div>
            <div className="info-item"><label>Tanggal</label><span>{new Date(order.date).toLocaleString('id-ID')}</span></div>
            <div className="info-item"><label>Metode Bayar</label><span>{order.paymentMethod}</span></div>
            <div className="info-item"><label>Status</label><span>{getStatusPill(order.status)}</span></div>
            <div className="info-item" style={{ gridColumn: '1 / -1' }}><label>Alamat</label><span>{order.address}</span></div>
          </div>
          <h4 style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>Item Pesanan:</h4>
          <table style={{ width: '100%', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Produk</th>
                <th style={{ padding: '8px' }}>Layanan</th>
                <th style={{ padding: '8px' }}>Harga</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ padding: '8px' }}>{item.service}</td>
                  <td style={{ padding: '8px' }}>{item.price || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '15px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Total: Rp {order.total.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-success-sm" onClick={() => handlePrintInvoice(order)} style={{ background: '#2c3e50', marginRight: 'auto' }}>
            🖨️ Cetak Invoice
          </button>
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;