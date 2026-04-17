import React from 'react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import { styles } from './posStyles';
import { usePos } from './usePos';

const PosMain = (props) => {
  const pos = usePos(props);
  const {
    menuItems, setMenuItems, chefs, setChefs, selectedChef, setSelectedChef, activeCart, setActiveCart, heldCarts, setHeldCarts, searchTerm, setSearchTerm, activeCategory, setActiveCategory, showPaymentModal, setShowPaymentModal, showHeldCarts, setShowHeldCarts, showTableModal, setShowTableModal, selectedTable, setSelectedTable, showPendingModal, setShowPendingModal, pendingOrders, setPendingOrders, orderToPay, setOrderToPay, selectedOrders, setSelectedOrders, discount, setDiscount, vouchers, setVouchers, voucherCode, setVoucherCode, appliedVoucher, setAppliedVoucher, discountInput, setDiscountInput, usePoints, setUsePoints, activeShift, setActiveShift, shiftLoading, setShiftLoading, startCashInput, setStartCashInput, endCashInput, setEndCashInput, showShiftEndModal, setShowShiftEndModal, showCashModal, setShowCashModal, cashType, setCashType, cashAmount, setCashAmount, cashNote, setCashNote, showHistoryModal, setShowHistoryModal, historyOrders, setHistoryOrders, showCustomModal, setShowCustomModal, customForm, setCustomForm, isSplitMode, setIsSplitMode, splitSelection, setSplitSelection, tables, setTables, tableViewMode, setTableViewMode, customers, setCustomers, showCustomerModal, setShowCustomerModal, selectedCustomer, setSelectedCustomer, newCustomerForm, setNewCustomerForm, storeSettings, setStoreSettings, showQrisModal, setShowQrisModal, qrisStatus, setQrisStatus, showNoteModal, setShowNoteModal, noteItem, setNoteItem, noteInput, setNoteInput, saveNote, categories, filteredMenu, addToCart, updateQuantity, removeFromCart, cartTotals, handleApplyVoucher, holdCart, resumeCart, fetchHistoryOrders, handleVoidOrder, handleSendWA, handleAddCustomer, handleAddCustomItem, handleSelectTable, fetchPendingOrders, handleSendToKitchen, handleConfirmOrder, handlePayPendingOrderClick, confirmPayPendingOrder, handleCompleteOrder, handlePrintReceipt, handlePrintChecker, handleSelectOrder, handleMergeOrMove, handleEditNote, applyDiscount, handleStartShift, handleSaveCashMovement, handleEndShift, handleQrisPayment, handleSimulatePaymentSuccess, finalizeOrder
  } = pos;

  // ✨ Local State untuk Input Manual Tag Varian
  const [manualTag, setManualTag] = React.useState('');
  const currentTags = noteInput ? noteInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  // ✨ STATE: Animasi Expand/Collapse 8 Fitur Atas
  const [isActionsExpanded, setIsActionsExpanded] = React.useState(true);

  React.useEffect(() => {
      // Otomatis sembunyikan (naik ke atas) jika ada pesanan masuk keranjang
      if (activeCart.length > 0) {
          setIsActionsExpanded(false);
      } else {
          setIsActionsExpanded(true);
      }
  }, [activeCart.length]);

  // ✨ MODAL ADD TO CART (POPUP PEMILIHAN & REVIEW MENU)
  const [showAddToCartModal, setShowAddToCartModal] = React.useState(false);
  const [cartModalItem, setCartModalItem] = React.useState(null);
  const [cartModalQty, setCartModalQty] = React.useState(1);
  const [cartModalNote, setCartModalNote] = React.useState('');
  const [cartModalManualTag, setCartModalManualTag] = React.useState('');
  const cartModalCurrentTags = cartModalNote ? cartModalNote.split(',').map(t => t.trim()).filter(Boolean) : [];

  const openAddToCartModal = (item) => {
      if (item.stock !== null && item.stock === 0) {
        toast.warn(`Stok untuk ${item.name} habis!`);
        return;
      }
      setCartModalItem(item);
      setCartModalQty(1);
      setCartModalNote('');
      setCartModalManualTag('');
      setShowAddToCartModal(true);
  };

  const confirmAddToCart = () => {
      let finalNote = cartModalNote;
      if (cartModalManualTag.trim()) {
          finalNote = cartModalNote ? `${cartModalNote}, ${cartModalManualTag.trim()}` : cartModalManualTag.trim();
      }

      const existingIndex = activeCart.findIndex(c => c.id === cartModalItem.id && c.note === finalNote);
      if (existingIndex >= 0) {
          const updatedCart = [...activeCart];
          updatedCart[existingIndex].qty += cartModalQty;
          setActiveCart(updatedCart);
      } else {
          setActiveCart([...activeCart, { ...cartModalItem, qty: cartModalQty, service: 'Restoran', note: finalNote }]);
      }

      setShowAddToCartModal(false);
      setCartModalItem(null);
      toast.success(`${cartModalQty}x ${cartModalItem.name} ditambahkan!`);
  };

  // ✨ SMART DYNAMIC VARIANTS: Otomatis mendeteksi varian yang cocok dengan jenis makanan/minuman
  const getDynamicVariantGroups = (item) => {
    if (!item) return [];
    const name = (item.name || '').toLowerCase();
    const category = (item.cuisine || '').toLowerCase();

    const isDrink = category.includes('minum') || name.includes('es ') || name.includes('kopi') || name.includes('teh') || name.includes('jus') || name.includes('ice') || name.includes('drink');
    const isSteakOrMeat = category.includes('steak') || category.includes('daging') || name.includes('steak') || name.includes('sirloin') || name.includes('tenderloin') || name.includes('ribeye') || name.includes('beef') || name.includes('wagyu');
    const isFood = !isDrink; // Anggap selain minuman adalah makanan

    const groups = [];

    if (isSteakOrMeat) {
      groups.push({ title: '🥩 Kematangan Daging', tags: ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done'] });
      groups.push({ title: '🥣 Pilihan Saus', tags: ['Saus BBQ', 'Blackpepper', 'Mushroom', 'Saus Keju', 'Saus Teriyaki'] });
    } else if (isDrink) {
      groups.push({ title: '🥤 Kustom Minuman', tags: ['Less Ice', 'No Ice', 'Less Sugar', 'No Sugar'] });
    } 
    
    if (isFood && !isSteakOrMeat) {
      groups.push({ title: '🌶️ Tingkat Kepedasan', tags: ['Tidak Pedas', 'Pedas Sedang', 'Sangat Pedas'] });
    }

    // Selalu tampilkan opsi umum di akhir
    groups.push({ title: '📝 Kustom Lainnya', tags: ['Tanpa Bawang', 'Karet Pisah', 'Dibungkus', 'Pisah Kuah'] });

    return groups;
  };

  return (
    <>
    {/* ✨ MODAL BUKA SHIFT (BLOCKER) */}
    {!shiftLoading && !activeShift && (
      <div className="modal-overlay" style={{zIndex: 2000, background: 'rgba(0,0,0,0.9)'}}>
        <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center'}}>
          <h2>🔐 Buka Shift Kasir</h2>
          <p>Silakan masukkan saldo modal awal di laci kasir untuk memulai operasional.</p>
          <input 
            type="text" 
            placeholder="Contoh: 200.000" 
            value={startCashInput} 
            onChange={e => setStartCashInput(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} 
            style={{...styles.discountInput, width: '100%', fontSize: '1.2rem', margin: '20px 0', padding: '15px', textAlign: 'center', boxSizing: 'border-box'}} 
          />
          <button onClick={handleStartShift} style={styles.posBtnPay}>Mulai Shift</button>
        </div>
      </div>
    )}

      {/* ✨ MODAL PEMILIHAN MEJA (Ditahan sampai Shift Kasir aktif) */}
      {(showTableModal && activeShift) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                <h3 style={{margin:0}}>Pilih Meja</h3>
                {/* ✨ TOMBOL GANTI TAMPILAN (GRID / DENAH) */}
                <div style={{display:'flex', background:'#f1f5f9', padding:'4px', borderRadius:'8px', gap:'5px'}}>
                    <button onClick={() => setTableViewMode('grid')} style={{padding:'6px 12px', border:'none', borderRadius:'6px', background: tableViewMode==='grid' ? 'white' : 'transparent', boxShadow: tableViewMode==='grid' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', color: tableViewMode==='grid' ? 'var(--primary-color)' : '#64748b'}}>
                        Grid
                    </button>
                    <button onClick={() => setTableViewMode('map')} style={{padding:'6px 12px', border:'none', borderRadius:'6px', background: tableViewMode==='map' ? 'white' : 'transparent', boxShadow: tableViewMode==='map' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', color: tableViewMode==='map' ? 'var(--primary-color)' : '#64748b'}}>
                        Denah
                    </button>
                </div>
            </div>
            </div>
            <div className="modal-body">
              {/* ✨ CONTAINER FLEXIBLE: BISA GRID ATAU RELATIVE (MAP) */}
              <div style={{ 
                  display: tableViewMode === 'grid' ? 'grid' : 'block',
                  gridTemplateColumns: tableViewMode === 'grid' ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'none',
                  gap: '15px', 
                  height: '400px', 
                  overflow: 'auto', 
                  padding: '10px',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  position: 'relative' // Penting untuk mode Map
              }}>
                {Array.isArray(tables) && tables.map((table, idx) => {
                  if (!table || typeof table !== 'object') return null;
                  const tableKey = table.id || `table-${idx}`;
                  return (
                  <button
                    key={tableKey}
                    onClick={() => handleSelectTable(table)}
                    disabled={table.status === 'occupied'}
                    style={{
                      // ✨ STYLE DINAMIS BERDASARKAN MODE
                      position: tableViewMode === 'map' ? 'absolute' : 'relative',
                      left: tableViewMode === 'map' ? (table.x || 0) : 'auto',
                      top: tableViewMode === 'map' ? (table.y || 0) : 'auto',
                      width: tableViewMode === 'map' ? '100px' : '100%',
                      height: tableViewMode === 'map' ? '100px' : '100px',
                      
                      border: `2px solid ${table.status === 'occupied' ? 'var(--danger-color)' : 'var(--success-color)'}`,
                      background: 'var(--card-bg)',
                      borderRadius: '8px',
                      cursor: table.status === 'occupied' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: tableViewMode === 'map' && selectedTable?.id === table.id ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : '0 2px 5px rgba(0,0,0,0.08)',
                      opacity: table.status === 'occupied' ? 0.6 : 1,
                      transition: 'all 0.2s',
                      zIndex: tableViewMode === 'map' ? 10 : 1,
                      padding: '4px' // ✨ FIX: Padding agar konten tidak nempel pinggir
                    }}
                  >
                    {/* ✨ FIX: Ukuran font dan margin diperkecil agar muat rapi */}
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍽️</div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '2px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{table.name}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: table.status === 'occupied' ? 'var(--danger-color)' : 'var(--success-color)' }}>{table.status === 'occupied' ? 'Terisi' : 'Kosong'}</div>
                  </button>
                  );
                })}
              </div>
              <button onClick={() => { setSelectedTable(null); setShowTableModal(false); toast.info('Mode Takeaway dipilih.'); }} style={{ width: '100%', marginTop: '20px', padding: '15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>🥡 Lanjutkan sebagai Takeaway</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.posLayout}>
        {/* Left Panel: Menu */}
        <div style={styles.posMenuPanel}>
          <h2 style={styles.posTitle}>Point of Sale (POS)</h2>
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ marginBottom: '15px', width: '100%' }}
          />
          <div style={styles.posCategoryList}>
            <button onClick={() => setShowCustomModal(true)} style={{...styles.categoryPill, background:'#2c3e50', color:'white', borderColor:'#2c3e50'}}>+ Manual</button>
            {categories.map(cat => {
              const pillStyle = { ...styles.categoryPill, ...(activeCategory === cat ? styles.categoryPillActive : {}) };
              return <button key={cat} onClick={() => setActiveCategory(cat)} style={pillStyle}>{cat}</button>
            })}
          </div>
          <div style={styles.posMenuGrid}>
            {filteredMenu.map((item, index) => (
              <div
                key={item.id}
                onClick={() => openAddToCartModal(item)}
                className="pos-item-anim"
                style={{
                  '--target-opacity': item.stock === 0 ? 0.5 : 1,
                  animationDelay: `${index * 0.04}s` // Delay dinamis yang lebih cepat
                }}
              >
                <div style={styles.posItemImageWrapper}>
                  {item.image ? <img src={item.image} alt={item.name} style={styles.posItemImage} /> : <div style={styles.posItemPlaceholderImage}>🍽️</div>}
                  {item.stock === 0 && <div style={styles.posItemStockOverlay}>Habis</div>}
                {item.stock !== null && item.stock === 0 && <div style={styles.posItemStockOverlay}>Habis</div>}
                </div>
                <p style={styles.posItemName}>{item.name}</p>
                <p style={styles.posItemPrice}>{item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Cart */}
        <div style={styles.posCartPanel}>
          <div style={styles.posCartHeader}>
            <div style={styles.posCartHeaderTop}>
                <div>
                    <h3 style={styles.posCartHeaderTitle}>{selectedTable ? selectedTable.name : 'Takeaway'}</h3>
                    {activeShift && activeShift.startTime && (
                        <div style={{fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '600', marginTop: '4px', display:'flex', alignItems:'center', gap:'5px'}}>
                            <span style={{width:8, height:8, background:'var(--success-color)', borderRadius:'50%', display:'inline-block'}}></span>
                            Shift Aktif ({
                                new Date(activeShift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) !== 'Invalid Date' 
                                ? new Date(activeShift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                : '--:--'
                            })
                        </div>
                    )}
                </div>
                <div style={{textAlign: 'right'}}>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                </div>
            </div>
            
            {/* ✨ FIX: Container 8 Fitur dengan Transisi Smooth (Naik/Turun) */}
            <div style={{ 
                overflow: isActionsExpanded ? 'visible' : 'hidden', 
                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin-bottom 0.3s ease', 
                maxHeight: isActionsExpanded ? '400px' : '0px',
                opacity: isActionsExpanded ? 1 : 0,
                marginBottom: isActionsExpanded ? '10px' : '0px'
            }}>
                <div style={styles.posCartHeaderActions}>
                    <button onClick={() => setShowTableModal(true)} style={styles.headerActionBtn} title="Ganti Meja">
                        <span style={{fontSize: '1.2rem'}}>🪑</span> Meja
                    </button>
                    <button onClick={fetchPendingOrders} style={styles.headerActionBtn} title="Pesanan Masuk">
                        <span style={{fontSize: '1.2rem'}}>📋</span> Order
                    </button>
                    <button onClick={() => setShowCustomerModal(true)} style={{...styles.headerActionBtn, border: selectedCustomer ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', background: selectedCustomer ? '#eff6ff' : 'var(--bg-color)'}} title="Pilih Pelanggan / Member">
                        <span style={{fontSize: '1.2rem'}}>👥</span> {selectedCustomer ? 'Member' : 'Pelanggan'}
                    </button>
                    <button onClick={() => setShowCashModal(true)} style={styles.headerActionBtn} title="Kelola Kas (Petty Cash)">
                        <span style={{fontSize: '1.2rem'}}>💸</span> Kas
                    </button>
                    <button onClick={fetchHistoryOrders} style={styles.headerActionBtn} title="Riwayat & Reprint">
                        <span style={{fontSize: '1.2rem'}}>📜</span> Riwayat
                    </button>
                    <button onClick={() => { setIsSplitMode(!isSplitMode); setSplitSelection({}); }} style={{...styles.headerActionBtn, background: isSplitMode ? 'var(--warning-color)' : 'var(--bg-color)', color: isSplitMode ? 'white' : 'var(--text-color)'}} title="Split Bill (Bayar Sebagian)">
                        <span style={{fontSize: '1.2rem'}}>✂️</span> Split
                    </button>
                    <div style={{ position: 'relative' }} onMouseEnter={() => setShowHeldCarts(true)} onMouseLeave={() => setShowHeldCarts(false)}>
                        <button 
                            onClick={() => {
                                if (activeCart.length > 0) holdCart();
                                else setShowHeldCarts(!showHeldCarts);
                            }}
                            style={styles.headerActionBtn}
                        >
                            <span style={{fontSize: '1.2rem'}}>✋</span> Tahan <span style={{fontSize:'0.7rem', background:'var(--primary-color)', color:'white', borderRadius:'10px', padding:'0 5px', position:'absolute', top:'5px', right:'5px'}}>{heldCarts.length || ''}</span>
                        </button>
                        {showHeldCarts && heldCarts.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                background: 'white',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 100,
                                minWidth: '200px',
                                overflow: 'hidden'
                            }}>
                            {heldCarts.map((cart, index) => (
                                <div 
                                    key={cart.id} 
                                    onClick={() => { resumeCart(cart.id); setShowHeldCarts(false); }} 
                                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: index === heldCarts.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '0.85rem', color: '#1e293b', fontWeight: '500' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseOut={e => e.currentTarget.style.background = 'white'}
                                >
                                ⏳ <strong>{cart.table?.name || cart.customer?.name || 'Takeaway'}</strong> <span style={{color: '#64748b'}}>({cart.items.length} item)</span>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowShiftEndModal(true)} style={{...styles.headerActionBtn, color: 'var(--danger-color)', borderColor: 'var(--danger-color)', background: '#fff1f2'}} title="Tutup Shift">
                        <span style={{fontSize: '1.2rem'}}>🔒</span> Shift
                    </button>
                </div>
            </div>

            {/* ✨ TOMBOL TOGGLE "OPSI LAINNYA" (Menempel di bawah layout fitur) */}
            {activeCart.length > 0 && (
                <button 
                    onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        color: 'var(--primary-color)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '10px',
                        transition: 'background 0.2s'
                    }}
                >
                    {isActionsExpanded ? '▲ Sembunyikan Opsi' : '▼ Tampilkan Opsi Lainnya'}
                </button>
            )}
          </div>
          <div style={styles.posCartList}>
            {activeCart.length === 0 ? (
              <div style={styles.posCartEmpty}>Keranjang kosong</div>
            ) : (
            <>
            {/* ✨ NEW: Pilih Koki / Chef (Disembunyikan saat Split Mode agar hemat ruang layar) */}
            {!isSplitMode && (
              <div style={{ marginBottom: '15px', background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>👨‍🍳 Chef Bertugas:</label>
                  <select value={selectedChef} onChange={e => setSelectedChef(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                      <option value="">-- Pilih Chef (Opsional) --</option>
                      {chefs.map(chef => (
                          <option key={chef.id} value={chef.id}>{chef.username}</option>
                      ))}
                  </select>
              </div>
            )}

              {activeCart.map(item => (
                <div key={item.id} style={{ ...styles.posCartItem, marginBottom: isSplitMode ? '8px' : '15px', padding: isSplitMode ? '8px' : '12px' }}>
                  <div style={styles.posCartItemDetails}>
                    <p style={styles.posCartItemName}>{item.name}</p>
                    {item.note && (
                      <p style={styles.posCartItemNote}>
                        📝 {item.note}
                      </p>
                    )}
                    <p style={styles.posCartItemPrice}>{item.price} {isSplitMode ? <span style={{color: '#b45309'}}>(Total Porsi: {item.qty})</span> : ''}</p>
                  </div>
                  {isSplitMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef9c3', padding: '4px 6px', borderRadius: '10px', border: '1px solid #fde047' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#b45309', marginLeft: '4px' }}>Bayar:</span>
                          <button onClick={() => setSplitSelection(prev => ({...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1)}))} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'white', color: '#b45309', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, lineHeight: 1 }}>−</button>
                          <span style={{ fontWeight: 'bold', color: '#b45309', minWidth: '20px', textAlign: 'center', fontSize: '0.95rem' }}>{splitSelection[item.id] || 0}</span>
                          <button onClick={() => setSplitSelection(prev => ({...prev, [item.id]: Math.min(item.qty, (prev[item.id] || 0) + 1)}))} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#eab308', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(234, 179, 8, 0.2)', padding: 0, lineHeight: 1 }}>+</button>
                      </div>
                  ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => handleEditNote(item)} style={styles.posEditNoteBtn} title="Tambah/Edit Catatan">🗒️</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '10px' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'white', color: '#64748b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, lineHeight: 1 }}>−</button>
                          <span style={{ fontWeight: 'bold', color: '#0f172a', minWidth: '20px', textAlign: 'center', fontSize: '0.95rem' }}>{item.qty}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--primary-color)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, lineHeight: 1 }}>+</button>
                        </div>
                      </div>
                  )}
                </div>
              ))}
            </>
            )}
          </div>
          <div style={styles.posCartSummary}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#64748b' }}>Total Akhir</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-color)' }}>Rp {cartTotals.total.toLocaleString('id-ID')}</span>
            </div>
            
            {!isSplitMode && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <button onClick={holdCart} style={{ flex: 1, padding: '10px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>✋ Tahan</button>
                    <button onClick={() => setActiveCart([])} style={{ flex: 1, padding: '10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>🗑️ Batal</button>
                </div>
            )}
            
            <button
                onClick={() => {
                    if (activeCart.length === 0) return toast.warn("Keranjang masih kosong!");
                    if (!activeShift) return toast.error("Silakan buka Shift Kasir terlebih dahulu!");
                    setShowPaymentModal(true);
                }}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--primary-color) 0%, #4338ca 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
                {isSplitMode ? 'Bayar Sebagian' : 'Selesaikan Pesanan 🚀'}
            </button>
          </div>
        </div>
      </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="modal-overlay" style={{ zIndex: 3500 }}>
            <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
              <div className="modal-header">
                <h3>{orderToPay ? `Pembayaran (${orderToPay.customerName})` : 'Review & Selesaikan Pesanan'}</h3>
                <button onClick={() => { setShowPaymentModal(false); setOrderToPay(null); }} className="modal-close">&times;</button>
              </div>
              <div className="modal-body" style={{ padding: '20px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* ✨ KOLOM KIRI: Review Pesanan & Total Tagihan */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📝</span> Rincian Pesanan
                    </h4>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', marginBottom: '15px', minHeight: '150px' }}>
                        {(orderToPay ? orderToPay.items : (isSplitMode ? activeCart.map(item => ({...item, qty: splitSelection[item.id] || 0})).filter(item => item.qty > 0) : activeCart)).map((item, idx) => {
                            const priceNum = parseInt(String(item.price).replace(/\D/g, '')) || 0;
                            return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #cbd5e1' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#334155' }}>{item.qty}x {item.name}</span>
                                        {item.note && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Catatan: {item.note}</span>}
                                    </div>
                                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Rp {(item.qty * priceNum).toLocaleString('id-ID')}</span>
                                </div>
                            );
                        })}
                        {(orderToPay ? orderToPay.items : activeCart).length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Tidak ada item untuk direview.</div>
                        )}
                    </div>
                    
                    {/* Rincian Total Tagihan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '15px', borderTop: '2px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}>
                            <span>Subtotal</span><span>Rp {cartTotals.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {cartTotals.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.9rem' }}><span>Diskon {appliedVoucher ? `(${appliedVoucher.code})` : ''}</span><span>- Rp {cartTotals.discountAmount.toLocaleString('id-ID')}</span></div>}
                        {cartTotals.memberDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.9rem' }}><span>Diskon Member</span><span>- Rp {cartTotals.memberDiscount.toLocaleString('id-ID')}</span></div>}
                        {cartTotals.pointsDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.9rem' }}><span>Tukar Poin</span><span>- Rp {cartTotals.pointsDiscount.toLocaleString('id-ID')}</span></div>}
                        {cartTotals.serviceCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}><span>Service ({storeSettings.serviceChargePercentage}%)</span><span>Rp {Math.round(cartTotals.serviceCharge).toLocaleString('id-ID')}</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}><span>Pajak ({storeSettings.taxPercentage}%)</span><span>Rp {Math.round(cartTotals.tax).toLocaleString('id-ID')}</span></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.3rem', color: 'var(--primary-color)', paddingTop: '12px', borderTop: '2px solid #cbd5e1', marginTop: '8px' }}>
                        <span>Total Akhir:</span>
                        <span>Rp {cartTotals.total.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* ✨ KOLOM KANAN: Diskon, Open Bill & Metode Pembayaran */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {!isSplitMode && (
                        <>
                            {/* Member Poin */}
                            {selectedCustomer && (
                                <div style={{ color: 'var(--primary-color)', fontWeight:'bold', display:'flex', flexDirection:'column', gap:'5px', background:'#eff6ff', padding:'10px 15px', borderRadius:'12px', border:'1px solid #bfdbfe' }}>
                                    <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                                        <span>👤 {selectedCustomer.name} (Poin: {selectedCustomer.points})</span>
                                        <button onClick={() => { setSelectedCustomer(null); setUsePoints(0); }} style={{background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'0.8rem'}}>❌</button>
                                    </div>
                                    {selectedCustomer.points > 0 && (
                                        <div style={{display:'flex', width:'100%', gap:'8px', marginTop:'5px'}}>
                                            <input type="text" value={usePoints ? String(usePoints).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''} onChange={e => { const val = Number(e.target.value.replace(/\D/g, '')); setUsePoints(Math.min(val, selectedCustomer.points)); }} style={{...styles.discountInput, flex:1, padding:'6px 10px', textAlign:'left', borderRadius:'6px', border: '1px solid #bfdbfe'}} placeholder="Tukar Poin..."/>
                                            <button onClick={() => setUsePoints(selectedCustomer.points)} style={{background:'var(--primary-color)', color:'white', border:'none', borderRadius:'6px', padding:'0 12px', fontSize:'0.8rem', cursor:'pointer'}}>Max</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Promo & Diskon */}
                            <div style={{ padding: '12px 15px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#1e293b' }}>🎟️ Promo & Diskon</h4>
                                <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
                                    <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Kode Promo (Ketik/Pilih ⬇)" 
                                            list="voucher-list"
                                            value={voucherCode}
                                            onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                            style={{width: '100%', boxSizing: 'border-box', padding: '8px', paddingRight: voucherCode ? '30px' : '8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', textTransform: 'uppercase', outline: 'none'}}
                                        />
                                        {voucherCode && (
                                            <button 
                                                onClick={() => {
                                                    setVoucherCode('');
                                                    setAppliedVoucher(null);
                                                    setDiscount({ type: 'percent', value: 0 });
                                                    setDiscountInput('');
                                                }}
                                                style={{ position: 'absolute', right: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', padding: 0, lineHeight: 1 }}
                                                title="Hapus Promo"
                                            >&times;</button>
                                        )}
                                    </div>
                                    <datalist id="voucher-list">
                                        {vouchers.filter(v => v.isActive !== false && v.is_active !== false && v.quota !== 0 && (!v.expiryDate || new Date(v.expiryDate) >= new Date(new Date().setHours(0,0,0,0)))).map(v => (
                                            <option key={v.id} value={v.code}>{v.name} ({v.type === 'percent' ? v.value + '%' : 'Rp ' + Number(v.value).toLocaleString('id-ID')})</option>
                                        ))}
                                    </datalist>
                                    <button onClick={handleApplyVoucher} style={{background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'}}>Pakai</button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                                    <span style={{fontSize: '0.85rem', color: '#64748b', fontWeight: '500'}}>Diskon Manual:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                                        <input type="text" value={discount.type === 'nominal' && discountInput ? String(discountInput).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : discountInput} onChange={e => { let val = e.target.value; if (discount.type === 'nominal') val = val.replace(/\D/g, ''); setDiscountInput(val); }} onBlur={applyDiscount} style={{...styles.discountInput, width: '100px', border: 'none', borderRadius: 0, padding: '6px 10px'}} placeholder="0" />
                                        <button onClick={() => {setDiscount({ type: 'percent', value: 0 }); setAppliedVoucher(null); setDiscountInput('');}} style={{ padding: '6px 10px', fontSize: '0.8rem', border: 'none', background: discount.type === 'percent' ? 'var(--primary-color)' : 'transparent', color: discount.type === 'percent' ? 'white' : '#1e293b', cursor: 'pointer' }}>%</button>
                                        <button onClick={() => {setDiscount({ type: 'nominal', value: 0 }); setAppliedVoucher(null); setDiscountInput('');}} style={{ padding: '6px 10px', fontSize: '0.8rem', border: 'none', background: discount.type === 'nominal' ? 'var(--primary-color)' : 'transparent', color: discount.type === 'nominal' ? 'white' : '#1e293b', cursor: 'pointer' }}>Rp</button>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Kirim Dapur (Bayar Nanti) */}
                            {!orderToPay && (
                                <button 
                                    onClick={() => { 
                                        handleSendToKitchen(); 
                                        setShowPaymentModal(false); 
                                    }} 
                                    style={{ width: '100%', padding: '12px', background: '#fffbeb', color: '#b45309', border: '2px solid #fde68a', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#fef3c7'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fffbeb'}
                                >
                                    👨‍🍳 Pesan & Bayar Nanti (Open Bill)
                                </button>
                            )}
                        </>
                    )}

                    {/* Pilihan Pembayaran */}
                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', textAlign: 'center' }}>
                            {(!orderToPay && !isSplitMode) ? 'Atau Bayar Sekarang' : 'Pilih Metode Pembayaran'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {['Tunai', 'Kartu', 'QRIS', 'Lainnya'].map(method => (
                          <button key={method} style={{...styles.paymentMethod, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}} 
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(79,70,229,0.15)'; e.currentTarget.style.background = 'white'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f8fafc'; }}
                            onClick={() => {
                              if (method === 'QRIS') handleQrisPayment();
                              else if (orderToPay) confirmPayPendingOrder(method);
                              else finalizeOrder(method);
                          }}>
                              <span style={{ fontSize: '1.6rem' }}>{method === 'Tunai' ? '💵' : method === 'Kartu' ? '💳' : method === 'QRIS' ? '📱' : '🧾'}</span>
                              <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>{method}</span>
                            </button>
                          ))}
                        </div>
                    </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL QRIS DINAMIS */}
        {showQrisModal && (
          <div className="modal-overlay" style={{zIndex: 3000, background: 'rgba(0,0,0,0.8)'}}>
            <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '30px'}}>
              <h2 style={{marginTop:0, color: '#1e293b'}}>Scan QRIS</h2>
              <p style={{color: '#64748b', marginBottom: '20px'}}>Buka aplikasi e-Wallet atau M-Banking Anda (Gopay, OVO, Dana, dll) untuk membayar.</p>
              
              <div style={{background: 'white', padding: '20px', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '20px', border: '2px solid var(--primary-color)'}}>
                 {/* Barcode dinamis berdasarkan nominal */}
                 <QRCodeCanvas value={`QRIS-PAYMENT-${Date.now()}-TOTAL-${cartTotals.total}`} size={220} level="H" />
              </div>
              
              <div style={{fontSize: '2.5rem', fontWeight: '900', color: '#1e293b', marginBottom: '20px'}}>
                Rp {cartTotals.total.toLocaleString('id-ID')}
              </div>

              {qrisStatus === 'waiting' ? (
                 <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
                    <div style={{color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span style={{display: 'inline-block'}}>⏳</span> Menunggu Pembayaran...
                    </div>
                    <button onClick={handleSimulatePaymentSuccess} style={{...styles.posBtnPay, width: '100%', padding: '12px', background: '#3b82f6'}}>🔄 Cek Status (Simulasikan Lunas)</button>
                    <button onClick={() => { setShowQrisModal(false); setShowPaymentModal(true); }} style={{...styles.posBtnSecondary, width: '100%', padding: '12px'}}>Batalkan</button>
                 </div>
              ) : (
                 <div style={{color: '#10b981', fontWeight: '900', fontSize: '1.5rem', padding: '15px', background: '#dcfce7', borderRadius: '12px', border: '2px solid #16a34a'}}>
                    ✅ LUNAS!
                 </div>
              )}
            </div>
          </div>
        )}

        {/* ✨ MODAL PESANAN MASUK (SELF ORDER) */}
        {showPendingModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Daftar Pesanan Masuk</h3>
                <button onClick={() => setShowPendingModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                {pendingOrders.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Tidak ada pesanan aktif saat ini.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {pendingOrders.map(order => (
                      <div key={order.id} style={{ border: selectedOrders.includes(order.id) ? '2px solid var(--primary-color)' : '1px solid #eee', borderRadius: '8px', padding: '15px', background: selectedOrders.includes(order.id) ? '#eff6ff' : '#f9f9f9', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => handleSelectOrder(order.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <strong>{order.customerName} ({order.trackingNumber || `#${String(order.id).slice(0,8)}`})</strong>
                          </div>
                          <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {order.status === 'Need_Confirmation' && (
                            <div style={{background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px', display: 'inline-block'}}>⚠️ Menunggu Konfirmasi Kasir</div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                          {order.items.map(i => `${i.name} x${i.qty}`).join(', ')}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                        {order.status === 'Need_Confirmation' || order.status === 'Pending' ? (
                            <button onClick={() => handleConfirmOrder(order)} style={{ ...styles.posBtnPay, marginTop: 0, padding: '8px', fontSize: '0.9rem', flex: 1, background: '#3b82f6' }}>👨‍🍳 Konfirmasi & Kirim Dapur</button>
                        ) : (
                          <>
                        <button onClick={() => handlePrintChecker({
                            table: order.customerName,
                            items: order.items,
                            orderId: order.trackingNumber || order.id
                        })} style={{ ...styles.posBtnSecondary, marginTop: 0, padding: '8px', fontSize: '0.9rem', flex: 1 }} title="Cetak Checker Dapur">
                          🖨️ Dapur
                        </button>
                        
                        {/* ✨ Kasir bisa membedakan mana yang BELUM bayar dan yang SUDAH bayar */}
                        {order.paymentMethod === 'Open Bill' ? (
                            <button onClick={() => handlePayPendingOrderClick(order)} style={{ ...styles.posBtnPay, marginTop: 0, padding: '8px', fontSize: '0.9rem', flex: 2 }}>
                              💰 Bayar
                            </button>
                        ) : (
                            <button onClick={() => handleCompleteOrder(order.id)} style={{ ...styles.posBtnPay, marginTop: 0, padding: '8px', fontSize: '0.9rem', flex: 2, background: 'var(--success-color)' }}>
                              ✅ Selesaikan
                          </button>
                        )}
                          </>
                        )}
                          {/* Tombol Gabung/Pindah hanya muncul jika ada order lain yang dipilih */}
                          {selectedOrders.length > 1 && selectedOrders.includes(order.id) && (
                            <button onClick={() => handleMergeOrMove(order.id)} style={{ ...styles.posBtnHold, marginTop: 0, padding: '8px', fontSize: '0.9rem', flex: 1 }}>
                              Gabung ke Sini
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL TUTUP SHIFT */}
        {showShiftEndModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>🔒 Tutup Shift Kasir</h3>
                <button onClick={() => setShowShiftEndModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                <p>Pastikan semua transaksi telah selesai. Masukkan jumlah uang tunai fisik yang ada di laci saat ini.</p>
                {/* ✨ FIX: Tambahkan null-check untuk mencegah crash jika data shift tidak ada (menyebabkan white screen) */}
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border-color)'}}>
                  <div style={{marginBottom: '5px', color: '#64748b'}}>Modal Awal: <strong>Rp {(activeShift?.startCash || 0).toLocaleString('id-ID')}</strong></div>
                  <div style={{color: '#64748b'}}>Waktu Mulai: <strong>
                    {activeShift?.startTime ? new Date(activeShift.startTime).toLocaleString('id-ID') : 'N/A'}
                  </strong></div>
                </div>
                <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>Total Uang Tunai di Laci (Hitung Manual)</label>
                <input 
                  type="text" 
                  value={endCashInput} 
                  onChange={e => setEndCashInput(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} 
                  style={{...styles.discountInput, width: '100%', padding: '12px', fontSize: '1.1rem', boxSizing: 'border-box'}} 
                  placeholder="Rp 0"
                />
                <button onClick={handleEndShift} style={{...styles.posBtnPay, marginTop: '20px', background: 'var(--danger-color)'}}>Akhiri Shift & Cetak Laporan</button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL CASH MANAGEMENT (KAS MASUK/KELUAR) */}
        {showCashModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3>💸 Kelola Kas Operasional</h3>
                <button onClick={() => setShowCashModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                  <button onClick={() => setCashType('out')} style={{flex:1, padding:'10px', border:'none', borderRadius:'6px', background: cashType === 'out' ? 'var(--danger-color)' : '#f1f5f9', color: cashType === 'out' ? 'white' : '#64748b', fontWeight:'bold', cursor:'pointer'}}>📤 Kas Keluar</button>
                  <button onClick={() => setCashType('in')} style={{flex:1, padding:'10px', border:'none', borderRadius:'6px', background: cashType === 'in' ? 'var(--success-color)' : '#f1f5f9', color: cashType === 'in' ? 'white' : '#64748b', fontWeight:'bold', cursor:'pointer'}}>📥 Kas Masuk</button>
                </div>
                
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Nominal (Rp)</label>
                <input 
                  type="text" 
                  placeholder="0" 
                  value={cashAmount} 
                  onChange={e => setCashAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} 
                  style={{...styles.discountInput, width:'100%', padding:'12px', fontSize:'1.1rem', marginBottom:'15px', boxSizing:'border-box'}} 
                />

                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Keterangan</label>
                <textarea 
                  placeholder={cashType === 'out' ? "Contoh: Beli Es Batu, Bensin, Galon..." : "Contoh: Tambahan Modal, Kembalian..."}
                  value={cashNote}
                  onChange={e => setCashNote(e.target.value)}
                  style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid var(--border-color)', minHeight:'80px', marginBottom:'20px', boxSizing:'border-box'}}
                />

                <button onClick={handleSaveCashMovement} style={{...styles.posBtnPay, marginTop:0}}>Simpan Transaksi</button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL RIWAYAT TRANSAKSI (HISTORY) */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', display:'flex', flexDirection:'column' }}>
              <div className="modal-header">
                <h3>📜 Riwayat Transaksi Hari Ini</h3>
                <button onClick={() => setShowHistoryModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body" style={{padding:0, overflowY:'auto'}}>
                {historyOrders.length === 0 ? (
                    <p style={{padding:'20px', textAlign:'center', color:'#888'}}>Belum ada transaksi hari ini.</p>
                ) : (
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead style={{background:'#f8fafc', position:'sticky', top:0}}>
                            <tr>
                                <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #eee'}}>ID / Jam</th>
                                <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #eee'}}>Total</th>
                                <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #eee'}}>Metode</th>
                                <th style={{padding:'12px', textAlign:'center', borderBottom:'1px solid #eee'}}>Status</th>
                                <th style={{padding:'12px', textAlign:'center', borderBottom:'1px solid #eee'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyOrders.map(order => (
                                <tr key={order.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                                    <td style={{padding:'12px'}}>
                                        <strong>{order.trackingNumber || `#${String(order.id).slice(0,8)}`}</strong><br/>
                                        <span style={{fontSize:'0.8rem', color:'#64748b'}}>{new Date(order.date).toLocaleTimeString('id-ID')}</span>
                                    </td>
                                    <td style={{padding:'12px', fontWeight:'bold'}}>Rp {order.total.toLocaleString('id-ID')}</td>
                                    <td style={{padding:'12px'}}>{order.paymentMethod}</td>
                                    <td style={{padding:'12px', textAlign:'center'}}>
                                        <span style={{padding:'4px 10px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'bold', background: order.status==='Cancelled' ? '#fee2e2' : '#dcfce7', color: order.status==='Cancelled' ? '#dc2626' : '#16a34a'}}>
                                            {order.status === 'Cancelled' ? 'VOID' : 'SUKSES'}
                                        </span>
                                    </td>
                                    <td style={{padding:'12px', textAlign:'center'}}>
                                        <div style={{display:'flex', justifyContent:'center', gap:'5px'}}>
                                            <button onClick={() => {
                                                // Recalculate totals based on items and current settings for accurate reprint
                                                const subtotal = (order.items || []).reduce((acc, item) => acc + (parseInt(String(item.price).replace(/\D/g, '')) * item.qty), 0);
                                                const serviceCharge = subtotal * (storeSettings.serviceChargePercentage / 100);
                                                const tax = (subtotal + serviceCharge) * (storeSettings.taxPercentage / 100);
                                                const total = subtotal + serviceCharge + tax;
                                                // Note: Discounts from original transaction are not stored, so they can't be reprinted.
                                                handlePrintReceipt({ ...order, subtotal, tax, serviceCharge, total, discountAmount: 0 });
                                            }} style={{padding:'6px 10px', border:'1px solid #cbd5e1', background:'white', borderRadius:'6px', cursor:'pointer'}} title="Cetak Ulang">🖨️</button>
                                            <button onClick={() => handleSendWA(order)} style={{padding:'6px 10px', border:'none', background:'#22c55e', color:'white', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}} title="Kirim WA">📱 WA</button>
                                        {order.status !== 'Cancelled' && (
                                            <button onClick={() => handleVoidOrder(order.id)} style={{padding:'6px 10px', border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', borderRadius:'6px', cursor:'pointer'}} title="Batalkan (Void)">🚫</button>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL CUSTOM ITEM */}
        {showCustomModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3>Tambah Item Manual</h3>
                <button onClick={() => setShowCustomModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Nama Item</label>
                <input 
                    type="text" 
                    value={customForm.name} 
                    onChange={e => setCustomForm({...customForm, name: e.target.value})} 
                    placeholder="Contoh: Cas Piring Pecah"
                    style={{...styles.discountInput, width:'100%', marginBottom:'15px', textAlign:'left'}}
                />
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Harga (Rp)</label>
                <input 
                    type="text" 
                    value={customForm.price} 
                    onChange={e => setCustomForm({...customForm, price: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})} 
                    placeholder="0"
                    style={{...styles.discountInput, width:'100%', marginBottom:'20px', fontSize:'1.2rem'}}
                />
                <button onClick={handleAddCustomItem} style={styles.posBtnPay}>Tambahkan ke Cart</button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL PILIH MEMBER / CUSTOMER */}
        {showCustomerModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3>Pilih Pelanggan / Member</h3>
                <button onClick={() => setShowCustomerModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                {/* Form Tambah Baru */}
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px dashed #cbd5e1'}}>
                    <h4 style={{margin:'0 0 10px 0', fontSize:'0.9rem'}}>Tambah Member Baru</h4>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input type="text" placeholder="Nama" value={newCustomerForm.name} onChange={e=>setNewCustomerForm({...newCustomerForm, name:e.target.value})} style={{...styles.discountInput, width:'100%', textAlign:'left'}} />
                        <input type="text" placeholder="No HP" value={newCustomerForm.phone} onChange={e=>setNewCustomerForm({...newCustomerForm, phone:e.target.value})} style={{...styles.discountInput, width:'100%', textAlign:'left'}} />
                        <button onClick={handleAddCustomer} style={{background:'var(--success-color)', color:'white', border:'none', borderRadius:'6px', padding:'0 15px', cursor:'pointer'}}>+</button>
                    </div>
                </div>

                {/* List Member */}
                <div style={{maxHeight:'300px', overflowY:'auto'}}>
                    {customers.length === 0 ? <p style={{textAlign:'center', color:'#999'}}>Belum ada data member.</p> : 
                        customers.map(c => (
                            <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); toast.info(`Member ${c.name} dipilih.`); }} 
                                style={{padding:'12px', borderBottom:'1px solid #eee', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background: selectedCustomer?.id===c.id ? '#eff6ff' : 'transparent'}}
                            >
                                <div>
                                    <div style={{fontWeight:'bold'}}>{c.name}</div>
                                    <div style={{fontSize:'0.8rem', color:'#666'}}>{c.phone}</div>
                                </div>
                                <div style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'bold', color:'var(--primary-color)'}}>{c.type || 'Member'}</div>
                            </div>
                        ))
                    }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL CATATAN & VARIAN CEPAT */}
        {showNoteModal && noteItem && (
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📝</span>
                    Varian: {noteItem.name}
                </h3>
                <button onClick={() => setShowNoteModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                 <div style={{ marginBottom: '20px', maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                    {getDynamicVariantGroups(noteItem).map((group, gIdx) => (
                        <div key={gIdx} style={{ marginBottom: '15px' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>{group.title}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                               {group.tags.map(tag => {
                                   const isSelected = currentTags.includes(tag);
                                   return (
                                       <button 
                                         key={tag} 
                                         type="button"
                                         onClick={() => {
                                             if (isSelected) {
                                                 setNoteInput(currentTags.filter(t => t !== tag).join(', '));
                                             } else {
                                                 setNoteInput(noteInput ? `${noteInput}, ${tag}` : tag);
                                             }
                                         }}
                                         style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`, background: isSelected ? '#4f46e5' : '#f8fafc', color: isSelected ? 'white' : '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                       >
                                         {isSelected ? '✓ ' : '+ '}{tag}
                                       </button>
                                   );
                               })}
                            </div>
                        </div>
                    ))}
                 </div>
                 <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569' }}>Catatan Kustom:</label>
                 
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px', boxSizing: 'border-box', background: 'white', alignItems: 'flex-start', alignContent: 'flex-start' }}>
                    {currentTags.map((tag, idx) => (
                        <div key={idx} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.1)' }}>
                            <span>{tag}</span>
                            <button 
                                onClick={() => setNoteInput(currentTags.filter((_, i) => i !== idx).join(', '))}
                                style={{ background: '#c7d2fe', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', padding: 0, lineHeight: 1 }}
                            >&times;</button>
                        </div>
                    ))}
                    
                    <input
                        type="text"
                        value={manualTag}
                        onChange={(e) => setManualTag(e.target.value)}
                        placeholder={currentTags.length === 0 ? "Ketik catatan lalu tekan Koma (,) atau Enter..." : "Ketik lagi..."}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val && !currentTags.includes(val)) {
                                    setNoteInput(noteInput ? `${noteInput}, ${val}` : val);
                                }
                                setManualTag('');
                            }
                        }}
                        style={{ flex: 1, border: 'none', outline: 'none', minWidth: '180px', fontSize: '0.95rem', background: 'transparent', padding: '6px 0', color: '#1e293b' }}
                    />
                 </div>
                 
                 <button onClick={() => {
                     let finalNote = noteInput;
                     if (manualTag.trim()) {
                         finalNote = noteInput ? `${noteInput}, ${manualTag.trim()}` : manualTag.trim();
                     }
                     saveNote(finalNote);
                     setManualTag('');
                 }} style={{ ...styles.posBtnPay, marginTop: '20px', width: '100%', padding: '14px', background: 'var(--primary-color)' }}>
                     Simpan Varian & Catatan
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ MODAL ADD TO CART (POPUP REVIEW MENU) */}
        {showAddToCartModal && cartModalItem && (
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h3 style={{ margin: 0 }}>Review Pesanan</h3>
                <button onClick={() => setShowAddToCartModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                   <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                      {cartModalItem.image ? <img src={cartModalItem.image} alt={cartModalItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🍽️</div>}
                   </div>
                   <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1e293b' }}>{cartModalItem.name}</h3>
                      <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.1rem' }}>{cartModalItem.price}</p>
                   </div>
                </div>

                {/* Stepper Jumlah Porsi Minimalis & Teks Jelas */}
                <div style={{ marginBottom: '15px', background: '#f8fafc', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '1rem' }}>Jumlah Porsi:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setCartModalQty(Math.max(1, cartModalQty - 1))} style={{ width: '34px', height: '30px', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#475569', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', padding: 0, lineHeight: 1 }}>−</button>
                        <span style={{ fontSize: '1rem', fontWeight: '900', color: '#0f172a', minWidth: '24px', textAlign: 'center' }}>{cartModalQty}</span>
                        <button onClick={() => setCartModalQty(cartModalQty + 1)} style={{ width: '34px', height: '30px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)', padding: 0, lineHeight: 1 }}>+</button>
                    </div>
                </div>

                {/* Varian Pilihan Cepat */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#475569' }}>Varian & Kustomisasi:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {getDynamicVariantGroups(cartModalItem).map((group, gIdx) => (
                            <div key={gIdx}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#64748b' }}>{group.title}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                   {group.tags.map(tag => {
                                       const isSelected = cartModalCurrentTags.includes(tag);
                                       return (
                                           <button 
                                             key={tag} 
                                             type="button"
                                             onClick={() => {
                                                 if (isSelected) setCartModalNote(cartModalCurrentTags.filter(t => t !== tag).join(', '));
                                                 else setCartModalNote(cartModalNote ? `${cartModalNote}, ${tag}` : tag);
                                             }}
                                             style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${isSelected ? 'var(--primary-color)' : '#cbd5e1'}`, background: isSelected ? 'var(--primary-color)' : '#f8fafc', color: isSelected ? 'white' : '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                           >
                                             {isSelected ? '✓ ' : '+ '}{tag}
                                           </button>
                                       );
                                   })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Catatan Kustom */}
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569' }}>Catatan Lainnya:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', boxSizing: 'border-box', background: 'white', alignContent: 'flex-start' }}>
                        {cartModalCurrentTags.map((tag, idx) => (
                            <div key={idx} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{tag}</span>
                                <button onClick={() => setCartModalNote(cartModalCurrentTags.filter((_, i) => i !== idx).join(', '))} style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                            </div>
                        ))}
                        <input
                            type="text"
                            value={cartModalManualTag}
                            onChange={(e) => setCartModalManualTag(e.target.value)}
                            placeholder={cartModalCurrentTags.length === 0 ? "Ketik catatan lalu Enter..." : "Ketik lagi..."}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const val = e.target.value.trim();
                                    if (val && !cartModalCurrentTags.includes(val)) {
                                        setCartModalNote(cartModalNote ? `${cartModalNote}, ${val}` : val);
                                    }
                                    setCartModalManualTag('');
                                }
                            }}
                            style={{ flex: 1, border: 'none', outline: 'none', minWidth: '150px', fontSize: '0.95rem', background: 'transparent', padding: '4px 0', color: '#1e293b' }}
                        />
                    </div>
                </div>
              </div>
              <div className="modal-footer" style={{ flexShrink: 0, background: '#f8fafc', padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                 <button onClick={() => setShowAddToCartModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                 <button onClick={confirmAddToCart} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>Tambahkan ({cartModalQty} Porsi)</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default PosMain;