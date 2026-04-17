import React, { useState } from 'react';

const Restoran = ({ data, onDelete, onEdit, onView, selectedIds, onSelectionChange, onSelectAll, sortConfig, onSort, user }) => {
  const [viewMode, setViewMode] = useState('grid');
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };

  // Style Modern
  const styles = {
    card: { background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden', transition: 'all 0.3s ease' },
    header: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' },
    title: { fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' },
    controls: { display: 'flex', gap: '10px', alignItems: 'center' },
    toggleBtn: (active) => ({ padding: '10px 16px', borderRadius: '12px', border: active ? '1px solid #fecaca' : '1px solid transparent', background: active ? '#fef2f2' : 'transparent', cursor: 'pointer', color: active ? '#dc2626' : '#64748b', transition: 'all 0.2s', fontWeight: '600', fontSize: '0.9rem' }),
    tableHeader: { background: '#fef2f2', color: '#b91c1c', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '18px 24px', fontWeight: '700', borderBottom: '1px solid #fecaca' },
    tableRow: { borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s ease' },
    cell: { padding: '20px 24px', fontSize: '0.95rem', color: '#334155' },
    badge: (stock) => ({ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: stock > 0 ? '#dcfce7' : '#fee2e2', color: stock > 0 ? '#166534' : '#991b1b', display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    // Grid Styles
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px', padding: '32px' },
    gridCard: { background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative', display: 'flex', flexDirection: 'column' },
    gridImageWrapper: { position: 'relative', paddingTop: '65%', overflow: 'hidden', background: '#fef2f2' },
    gridImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' },
    gridContent: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' },
    gridTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px', lineHeight: '1.4', letterSpacing: '-0.01em' },
    gridMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: 'auto' },
    gridActions: { display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f8fafc' }
  };

  return (
    <div style={styles.card}>
      <style>{`
        .grid-card:hover { transform: translateY(-10px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; border-color: transparent !important; }
        .grid-card:hover .grid-image-zoom { transform: scale(1.1); }
        .action-btn-grid { flex: 1; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-view { background: #f8fafc; color: #475569; } .btn-view:hover { background: #e2e8f0; color: #1e293b; }
        .btn-edit { background: #fff7ed; color: #ea580c; } .btn-edit:hover { background: #ffedd5; color: #c2410c; }
        .btn-del { background: #fef2f2; color: #ef4444; } .btn-del:hover { background: #fee2e2; color: #b91c1c; }
      `}</style>

      <div style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <h3 style={styles.title}><span style={{background:'#fee2e2', color:'#dc2626', padding:'10px', borderRadius:'14px', fontSize:'1.5rem'}}>🍽️</span> Restoran</h3>
          <span style={{ background: '#fef2f2', padding: '8px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700', color: '#991b1b' }}>{data.length} Menu</span>
        </div>
        <div style={styles.controls}>
          <button onClick={() => setViewMode('grid')} style={styles.toggleBtn(viewMode === 'grid')} title="Grid View">⊞</button>
          <button onClick={() => setViewMode('list')} style={styles.toggleBtn(viewMode === 'list')} title="List View">≣</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={styles.gridContainer}>
          {data.map(item => (
            <div key={item.id} className="grid-card" style={styles.gridCard}>
              <div style={{position:'absolute', top:'12px', left:'12px', zIndex:10}}>
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onSelectionChange(item.id)} style={{width:'18px', height:'18px', cursor:'pointer'}} />
              </div>
              <div style={styles.gridImageWrapper}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={styles.gridImage} className="grid-image-zoom" />
                ) : (
                  <div style={{...styles.gridImage, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', background:'#fef2f2', color:'#fca5a5'}}>🍽️</div>
                )}
              </div>
              <div style={styles.gridContent}>
                <h4 style={styles.gridTitle}>{item.name}</h4>
                <div style={styles.gridMeta}>
                  <span style={{background:'#f3f4f6', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem', color:'#4b5563'}}>{item.cuisine || '-'}</span>
                  <span style={styles.badge(item.stock !== undefined ? item.stock : 50)}>{item.stock > 0 ? `● ${item.stock} Porsi` : '● Habis'}</span>
                </div>
                <div style={styles.gridActions}>
                  <button className="action-btn-grid btn-view" onClick={() => onView(item)}>👁️ Detail</button>
                  {['admin', 'ADMIN', 'OWNER', 'SUPERADMIN', 'superadmin'].includes(user?.role) && <button className="action-btn-grid btn-edit" onClick={() => onEdit(item)}>✏️</button>}
                  {['admin', 'ADMIN', 'OWNER', 'SUPERADMIN', 'superadmin'].includes(user?.role) && <button className="action-btn-grid btn-del" onClick={() => onDelete(item.id)}>🗑️</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  onChange={onSelectAll} 
                  checked={data.length > 0 && data.every(item => selectedIds.includes(item.id))}
                />
              </th>
              <th style={styles.tableHeader}>Menu</th>
              <th onClick={() => onSort('name')} style={{ ...styles.tableHeader, cursor: 'pointer' }}>
                Nama Restoran {getSortIcon('name')}
              </th>
              <th onClick={() => onSort('cuisine')} style={{ ...styles.tableHeader, cursor: 'pointer', textAlign: 'left' }}>
                Jenis Masakan {getSortIcon('cuisine')}
              </th>
              <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Porsi Harian</th>
              <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🍲</div>
                  Belum ada data restoran.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} style={{ ...styles.tableRow, background: selectedIds.includes(item.id) ? '#fef2f2' : 'white' }}>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(item.id)} 
                      onChange={() => onSelectionChange(item.id)}
                    />
                  </td>
                  <td style={{ ...styles.cell, width: '80px' }}>
                    {item.image ? (
                      <img src={item.image} alt="thumb" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍽️</div>
                    )}
                  </td>
                  <td style={{ ...styles.cell, fontWeight: '700', color: '#1e293b' }}>{item.name}</td>
                  <td style={{ ...styles.cell }}>
                    <span style={{background:'#f3f4f6', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem', color:'#4b5563'}}>{item.cuisine || '-'}</span>
                  </td>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>
                    <span style={styles.badge(item.stock !== undefined ? item.stock : 50)}>
                      {item.stock > 0 ? `● ${item.stock} Porsi` : '● Habis'}
                    </span>
                  </td>
                  <td style={{ ...styles.cell, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button className="view-btn" onClick={() => onView(item)} title="Lihat Detail" style={{background:'#eff6ff', color:'#3b82f6', border:'none', width:'32px', height:'32px', borderRadius:'6px', cursor:'pointer'}}>👁️</button>
                      {['OWNER', 'ADMIN', 'SUPERADMIN', 'admin', 'superadmin'].includes(user?.role) && <button className="edit-btn" onClick={() => onEdit(item)} title="Edit Data" style={{background:'#fef3c7', color:'#d97706', border:'none', width:'32px', height:'32px', borderRadius:'6px', cursor:'pointer'}}>✏️</button>}
                      {['OWNER', 'ADMIN', 'SUPERADMIN', 'admin', 'superadmin'].includes(user?.role) && <button className="delete-btn" onClick={() => onDelete(item.id)} title="Hapus Data" style={{background:'#fee2e2', color:'#ef4444', border:'none', width:'32px', height:'32px', borderRadius:'6px', cursor:'pointer'}}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default Restoran;