export const styles = {
  container: { background: '#f8fafc', minHeight: '100vh', fontFamily: '"Inter", sans-serif', color: '#1e293b' },
  header: { textAlign: 'center', marginBottom: '40px', padding: '20px 0' },
  title: { fontSize: '2.2rem', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '10px', fontSize: '1.1rem' },
  tableNumber: { fontWeight: 'bold', color: '#1e293b', background: '#e2e8f0', padding: '4px 10px', borderRadius: '8px' },
  cartFab: { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 100 },
  cartBadge: { position: 'absolute', top: -5, right: -5, background: '#e74c3c', color: 'white', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '0', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '20px 24px', flexShrink: 0 },
  modalTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 700 },
  closeButton: { background: '#f1f5f9', border: 'none', fontSize: '1.2rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' },
  cartItems: { overflowY: 'auto', padding: '8px 24px', flex: 1 },
  cartItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f5f5f5' },
  cartItemName: { fontWeight: 600 },
  quantityControl: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', borderRadius: '8px', padding: '4px' },
  quantityButton: { width: '28px', height: '28px', border: 'none', background: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cartItemPrice: { fontWeight: 500, minWidth: '80px', textAlign: 'right' },
  modalFooter: { borderTop: '1px solid #eee', padding: '20px 24px', background: '#f8fafc', flexShrink: 0 },
  total: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '15px' },
  submitButton: { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
};

export const injectSelfOrderKeyframes = () => {
  if (!document.getElementById('selforder-keyframes')) {
    const keyframes = `
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = "selforder-keyframes";
    styleSheet.type = "text/css";
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
  }
};