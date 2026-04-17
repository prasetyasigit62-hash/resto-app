import React from 'react';
import { handlePrintInvoice, getStatusPill } from './orderUtils';

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detail Pesanan {order.trackingNumber || `#${String(order.id).slice(0, 8)}`}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>🔍 Informasi Tracking Nota Ops</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem' }}>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>No. Nota (Kategori)</label><strong style={{ color: '#4f46e5', fontSize: '1.05rem' }}>{order.trackingNumber || `#${String(order.id).slice(0, 8)}`}</strong></div>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Pelanggan</label><strong>{order.customerName}</strong></div>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Waktu Transaksi</label><strong>{new Date(order.date).toLocaleString('id-ID')}</strong></div>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Kasir / PIC</label><strong>{order.seller_name || order.processedBy || 'Sistem'}</strong></div>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Metode Bayar</label><strong>{order.paymentMethod}</strong></div>
                <div><label style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Lokasi / Meja</label><strong>{order.address}</strong></div>
              </div>
          </div>
          <h4 style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>Item Pesanan:</h4>
          <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 8px', color: '#475569', textAlign: 'left' }}>Produk</th>
                <th style={{ padding: '10px 8px', color: '#475569', textAlign: 'left' }}>Layanan</th>
                <th style={{ padding: '10px 8px', color: '#475569', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 8px', color: '#475569', textAlign: 'right' }}>Harga</th>
                <th style={{ padding: '10px 8px', color: '#475569', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => {
                const priceNum = item.price ? Number(String(item.price).replace(/[^0-9]/g, '')) : 0;
                const qty = item.qty || 1;
                return (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: item.note ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                      <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.service}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: '#4f46e5' }}>{qty}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {priceNum > 0 ? `Rp ${priceNum.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700' }}>
                        {priceNum > 0 ? `Rp ${(priceNum * qty).toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                    {item.note && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td colSpan="5" style={{ padding: '4px 8px 10px 8px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#854d0e', background: '#fefce8', border: '1px solid #fde047', borderRadius: '6px', padding: '3px 8px' }}>
                            📝 {item.note}
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '15px', fontWeight: '900', fontSize: '1.1rem', background: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', color: '#16a34a', border: '1px solid #bbf7d0' }}>
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