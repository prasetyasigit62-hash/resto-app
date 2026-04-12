import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

const MenuCosting = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const [resMenu, resIng] = await Promise.all([
          fetch(`${backendUrl}/api/v2/menus`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${backendUrl}/api/v2/materials`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resMenu.ok && resIng.ok) {
          setMenuItems(await resMenu.json());
          setIngredients(await resIng.json());
        } else {
          toast.error("Gagal mengambil data untuk kalkulasi.");
        }
      } catch (err) {
        toast.error("Koneksi error.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Kalkulasi HPP dan Margin
  const costingData = useMemo(() => {
    return menuItems.map(item => {
      const sellPrice = Number(item.price || 0); // V2 uses clean numbers
      
      let cogs = 0; // Cost of Goods Sold (Modal Bahan)
      const recipeDetails = [];

      const recipeArr = item.recipes || [];
      if (recipeArr.length > 0) {
        recipeArr.forEach(r => {
          const ing = ingredients.find(i => i.id === r.materialId);
          if (ing) {
            const cost = Number(ing.lastPrice || 0) * Number(r.qtyNeeded || 0);
            cogs += cost;
            recipeDetails.push(`${ing.name} (${r.qtyNeeded} ${ing.unit})`);
          }
        });
      }

      const profit = sellPrice - cogs;
      const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

      return {
        ...item,
        sellPrice,
        cogs,
        profit,
        margin,
        recipeDetails: recipeDetails.join(', ')
      };
    }).sort((a, b) => b.margin - a.margin); // Urutkan dari margin terbesar
  }, [menuItems, ingredients]);

  const getMarginBadge = (margin) => {
    if (margin >= 50) return <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{margin.toFixed(1)}% (Aman)</span>;
    if (margin >= 30) return <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{margin.toFixed(1)}% (Standar)</span>;
    return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{margin.toFixed(1)}% (Rendah)</span>;
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>🍲 Analisis Margin Menu</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Pantau Harga Pokok Penjualan (HPP) dan persentase keuntungan tiap menu.</p>
        </div>
      </div>

      {loading ? <p>Memuat data kalkulasi...</p> : (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Nama Menu</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Komposisi Resep</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Harga Jual</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Modal (HPP)</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Laba Kotor</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>% Margin</th>
                </tr>
              </thead>
              <tbody>
                {costingData.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada data menu.</td></tr>
                ) : (
                  costingData.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.cuisine || 'Umum'}</div>
                      </td>
                      <td style={{ padding: '15px 20px', fontSize: '0.85rem', color: '#475569', maxWidth: '250px' }}>
                        {item.recipeDetails ? item.recipeDetails : <span style={{fontStyle:'italic', color:'#cbd5e1'}}>Tidak ada resep</span>}
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>
                        Rp {item.sellPrice.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right', color: '#ef4444' }}>
                        Rp {item.cogs.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: item.profit >= 0 ? '#10b981' : '#dc2626' }}>
                        {item.profit >= 0 ? '+' : ''}Rp {item.profit.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                        {item.cogs > 0 ? (
                           getMarginBadge(item.margin)
                        ) : (
                           <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Set resep/harga</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCosting;