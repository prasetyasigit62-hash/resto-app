import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelfOrder } from './useSelfOrder';
import SelfOrderTracker from './SelfOrderTracker';
import SelfOrderCartModal from './SelfOrderCartModal';
import { styles, injectSelfOrderKeyframes } from './selfOrderStyles';

const SelfOrder = ({ tableId }) => {
  useEffect(() => {
    injectSelfOrderKeyframes();
  }, []);

  const { 
    menu, cart, loading, error, showCart, setShowCart, 
    activeOrderId, orderStatus, displayLocation, categories, 
    addToCart, updateQuantity, cartTotal, submitOrder 
  } = useSelfOrder(tableId);

  if (error) return <div style={styles.container}>{error}</div>;

  return (
    <div style={styles.container}>
      <ToastContainer position="top-center" autoClose={3000} theme="light" />
      <header style={styles.header}>
        <h1 style={styles.title}>🍽️ Resto-app</h1>
        <p style={styles.subtitle}>Pesan menu favorit Anda untuk <span style={styles.tableNumber}>{displayLocation}</span></p>
      </header>

      <SelfOrderTracker activeOrderId={activeOrderId} orderStatus={orderStatus} />

      {loading && !menu.length ? (
        <p>Memuat menu...</p>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => {}} style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {menu.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '3rem' }}>🍽️</span>}
                </div>
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '700' }}>{item.name}</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#64748b', flex: 1, lineHeight: 1.5 }}>{item.description || `Hidangan khas ${item.cuisine || 'spesial'} dengan bahan premium.`}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#c0392b' }}>{item.price}</span>
                    <button onClick={() => addToCart(item)} disabled={item.stock === 0} style={{ background: item.stock === 0 ? '#cbd5e1' : '#2c3e50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: item.stock === 0 ? 'not-allowed' : 'pointer' }}>
                      {item.stock === 0 ? 'Habis' : '+ Tambah'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div style={styles.cartFab} onClick={() => setShowCart(true)}>
          <span>🛒</span>
          <span style={styles.cartBadge}>{cart.reduce((acc, item) => acc + item.qty, 0)}</span>
        </div>
      )}

      {showCart && (
        <SelfOrderCartModal cart={cart} updateQuantity={updateQuantity} cartTotal={cartTotal} setShowCart={setShowCart} submitOrder={submitOrder} loading={loading} />
      )}
    </div>
  );
};

export default SelfOrder;