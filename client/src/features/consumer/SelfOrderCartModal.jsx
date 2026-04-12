import React from 'react';
import { styles } from './selfOrderStyles';

const SelfOrderCartModal = ({ cart, updateQuantity, cartTotal, setShowCart, submitOrder, loading }) => {
  return (
    <div style={styles.modalOverlay}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', color: '#1e293b', fontSize: '1.5rem' }}>Keranjang Pesanan</h2>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginBottom: '20px' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1rem' }}>{item.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{item.price}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px' }}>
                <button style={{ background: 'white', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQuantity(item.id, -1)}>-</button>
                <span style={{ fontWeight: 'bold', color: '#1e293b', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                <button style={{ background: 'white', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQuantity(item.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px' }}>
            <span>Total</span><span>Rp {cartTotal.toLocaleString('id-ID')}</span>
          </div>
          <button onClick={() => setShowCart(false)} style={{ background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', fontSize: '1rem', transition: 'all 0.2s' }}>
            ➕ Pilih Menu Lainnya
          </button>
          <button onClick={submitOrder} disabled={loading} style={{ background: '#16a34a', color: 'white', padding: '15px', width: '100%', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.1rem', transition: 'all 0.2s' }}>
            {loading ? 'Mengirim...' : 'Kirim Pesanan ke Kasir'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SelfOrderCartModal;