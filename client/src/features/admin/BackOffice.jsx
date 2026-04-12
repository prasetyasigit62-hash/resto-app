import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const BackOffice = ({ onDataAdded, editingItem, onDataUpdated, onCancel, initialService }) => {
  const [serviceType, setServiceType] = useState(initialService || 'restoran');
  const [formData, setFormData] = useState({ name: '', detail: '', stock: '', recipe: [], price: '' });
  const [imageFiles, setImageFiles] = useState([]); // ✨ State untuk BANYAK file gambar
  const [fileKey, setFileKey] = useState(Date.now()); // Key untuk reset input file
  const [isSubmitting, setIsSubmitting] = useState(false); // Status loading tombol
  const [ingredients, setIngredients] = useState([]); // State untuk daftar bahan baku
  const [previewUrls, setPreviewUrls] = useState([]); // ✨ State untuk preview gambar
  const [zoomedImage, setZoomedImage] = useState(null); // ✨ State untuk Modal Zoom Gambar

  // ✨ Helper Format Rupiah Otomatis
  const formatRupiah = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // ✨ Efek untuk membuat URL preview dari file gambar yang dipilih
  useEffect(() => {
    if (imageFiles.length === 0 && !editingItem) {
        setPreviewUrls([]);
        return;
    }
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup untuk mencegah memory leak
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [imageFiles, editingItem]);

  // Efek untuk mengisi form jika sedang mode Edit
  useEffect(() => {
    setImageFiles([]); // Reset file saat ganti mode
    if (editingItem) {
      setServiceType(editingItem.service.toLowerCase());
      const item = editingItem.item;
      let detailValue = item.cuisine || '';

      setFormData({ 
        name: item.name, 
        detail: detailValue, 
        stock: item.stock || '',
        recipe: item.recipe || [],
        price: formatRupiah(item.price),
      });
      // ✨ Tampilkan gambar yang sudah ada
      try {
        if (item.image_urls) {
          const existingImages = JSON.parse(item.image_urls);
          setPreviewUrls(Array.isArray(existingImages) ? existingImages : []);
        } else if (item.image) {
          setPreviewUrls([item.image]);
        } else {
          setPreviewUrls([]);
        }
      } catch(e) { setPreviewUrls(item.image ? [item.image] : []); }
    } else {
      // Reset jika mode tambah baru
      setFormData({ name: '', detail: '', stock: '', recipe: [], price: '' });
      setServiceType(initialService || 'restoran');
      setFileKey(Date.now());
    }
  }, [editingItem, initialService]);

  // Fetch daftar bahan baku untuk dropdown resep
  useEffect(() => {
    const fetchIngredients = async () => {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/ingredients`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setIngredients(await res.json());
      } catch (err) { console.error("Gagal memuat bahan baku", err); }
    };
    fetchIngredients();
  }, []);

  const handleServiceTypeChange = (e) => {
    const newServiceType = e.target.value;
    setServiceType(newServiceType);
    // PENTING: Reset field saat ganti layanan agar tidak membawa nilai lama
    setFormData(prev => ({ ...prev, detail: '', stock: '', price: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Mulai loading
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    
    // --- UPLOAD BANYAK GAMBAR (Jika ada) ---
    let imageUrls = editingItem?.item?.image_urls || '[]';
    let singleImageUrl = editingItem?.item?.image || null;

    if (imageFiles.length > 0) {
        const uploadedUrls = [];
        for (const file of imageFiles) {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            try {
                const uploadRes = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: uploadFormData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedUrls.push(uploadData.imageUrl);
                } else { throw new Error('Upload failed'); }
            } catch (err) {
                toast.error(`Gagal upload gambar: ${file.name}`);
                setIsSubmitting(false);
                return;
            }
        }
        imageUrls = JSON.stringify(uploadedUrls);
        singleImageUrl = uploadedUrls[0];
    }

    // Menyesuaikan nama field berdasarkan service agar sesuai dengan backend
    let payload = { name: formData.name, stock: parseInt(formData.stock) || 0 };
    
      payload.cuisine = formData.detail;
      payload.price = String(formData.price).replace(/\./g, ''); // ✨ HILANGKAN TITIK SEBELUM DIKIRIM KE DB
      // ✨ Tambahkan resep ke payload jika ada
      payload.recipe = formData.recipe.filter(r => r.ingredientId && r.qty > 0);
      payload.image = singleImageUrl; // Gunakan singleImageUrl yang sudah aman

    try {
      const token = localStorage.getItem('resto_token');
      const url = editingItem 
        ? `${backendUrl}/api/update/${serviceType}/${editingItem.item.id}`
        : `${backendUrl}/api/add/${serviceType}`;
        
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Data berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}!`);
        setFormData({ name: '', detail: '', stock: '', recipe: [], price: '' });
        setImageFiles([]);
        setFileKey(Date.now()); // Reset input file visual
        if (editingItem) {
          onDataUpdated(serviceType, result.data);
        } else {
          onDataAdded(serviceType, result.data);
        }
      } else {
        toast.error(`Gagal: ${result.error || 'Server error'}`);
      }
    } catch (error) {
      toast.error('Error koneksi: ' + error.message);
    }
    
    setIsSubmitting(false); // Selesai loading
  };

  // --- Recipe Handlers ---
  const handleRecipeChange = (index, field, value) => {
    const newRecipe = [...formData.recipe];
    newRecipe[index][field] = value;
    setFormData({ ...formData, recipe: newRecipe });
  };

  const addRecipeRow = () => {
    setFormData({
      ...formData,
      recipe: [...formData.recipe, { ingredientId: '', qty: 0 }]
    });
  };

  const removeRecipeRow = (index) => {
    const newRecipe = formData.recipe.filter((_, i) => i !== index);
    setFormData({ ...formData, recipe: newRecipe });
  };
  // -------------------------

  // Render Input Detail yang Cerdas sesuai Tipe Layanan
  const renderDetailInput = () => {
    let placeholder = 'Jenis Masakan / Kategori';

    return (
      <input 
        type="text" 
        placeholder={placeholder}
        value={formData.detail}
        onChange={(e) => setFormData({...formData, detail: e.target.value})}
        disabled={isSubmitting}
        required
        style={{ padding: '10px' }}
      />
    );
  };

  // Label dinamis untuk Stok
  const getStockLabel = () => {
    return 'Porsi Harian / Stok';
  };

  return (
    <div className="service-view" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
          {editingItem ? 'Edit Data' : 'Back Office'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
          {editingItem ? `Mengedit data untuk layanan ${editingItem.service}` : 'Tambah data baru ke dalam sistem.'}
        </p>
      </div>
      
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '30px' }}>
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
              {/* Kolom Kiri */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block', width: '100%' }}>Layanan</label>
                  <select value={serviceType} onChange={handleServiceTypeChange} className="profile-input" disabled={!!editingItem || isSubmitting || !!initialService}>
                    <option value="restoran">Restoran</option>
                  </select>
                </div>
                <div>
                  <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block', width: '100%' }}>Nama Item</label>
                  <input type="text" placeholder="Contoh: Nasi Goreng Spesial" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isSubmitting} required className="profile-input" />
                </div>
                <div>
                  <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block' }}>Detail</label>
                  {renderDetailInput()}
                </div>
                
                  <div>
                    <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block' }}>Harga Menu</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 25.000" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: formatRupiah(e.target.value)})} 
                      disabled={isSubmitting} 
                      className="profile-input" 
                      required 
                    />
                  </div>

                <div>
                  <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block' }}>{getStockLabel()}</label>
                  <input type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} disabled={isSubmitting} className="profile-input" />
                </div>
              </div>

              {/* Kolom Kanan (Resep & Gambar) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block' }}>Resep (Pengurangan Stok Otomatis)</label>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
                      {formData.recipe.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', marginBottom: '15px' }}>Belum ada bahan baku.</p>}
                      {formData.recipe.map((recipeItem, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                          <select value={recipeItem.ingredientId} onChange={(e) => handleRecipeChange(index, 'ingredientId', e.target.value)} className="profile-input" style={{ flex: 3, padding: '10px' }}>
                            <option value="">-- Pilih Bahan --</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                          <input type="number" placeholder="Qty" value={recipeItem.qty} onChange={(e) => handleRecipeChange(index, 'qty', parseFloat(e.target.value) || 0)} className="profile-input" style={{ flex: 1, padding: '10px' }} />
                          <button type="button" onClick={() => removeRecipeRow(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '42px', height: '42px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Hapus Bahan">
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addRecipeRow} style={{ width: '100%', padding: '12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '5px' }}>
                        <span>+</span> Tambah Bahan
                      </button>
                    </div>
                  </div>

                <div>
                  <label className="profile-form-group label" style={{ marginBottom: '8px', display: 'block' }}>Gambar (Opsional)</label>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden' }} onClick={() => document.getElementById('file-upload').click()}>
                    <input id="file-upload" key={fileKey} type="file" accept="image/*" disabled={isSubmitting} onChange={(e) => setImageFiles(e.target.files.length > 0 ? [e.target.files[0]] : [])} style={{ display: 'none' }} />
                    
                    {/* ✨ FIX: Preview Gambar dan Fitur Klik untuk Zoom */}
                    {previewUrls.length > 0 ? (
                      <div style={{ position: 'relative' }}>
                        <img src={previewUrls[0]} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'contain', cursor: 'zoom-in', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); setZoomedImage(previewUrls[0]); }} />
                        <p style={{ margin: '12px 0 0 0', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 'bold' }}>🔍 Klik gambar untuk memperbesar, atau klik area ini untuk mengganti</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Klik untuk upload gambar produk</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </>
          </div>

          <div className="profile-form-actions">
            {editingItem && (
              <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary" style={{ marginRight: '10px' }}>
                Batal
              </button>
            )}
            <button type="submit" className="profile-save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Data Baru')}
            </button>
          </div>
        </form>
      </div>

      {/* ✨ FIX: Modal Zoom Gambar Layar Penuh */}
      {zoomedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setZoomedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', padding: '20px' }}>
            <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>&times;</button>
            <img src={zoomedImage} alt="Zoomed Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', objectFit: 'contain', border: '4px solid white' }} onClick={(e) => e.stopPropagation()} />
            <p style={{ color: 'white', textAlign: 'center', marginTop: '15px', fontWeight: 'bold', fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Mode Pratinjau Gambar</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default BackOffice;