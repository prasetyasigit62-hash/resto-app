import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Inventory = ({ setConfirmModal, onDataUpdated, onEdit }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [isClosing, setIsClosing] = useState(false); // ✨ State untuk animasi tutup
    const [showWasteModal, setShowWasteModal] = useState(false); // ✨ State Modal Waste
    const [wasteForm, setWasteForm] = useState({ ingredientId: '', qty: '', reason: 'Busuk/Kadaluarsa' });
    const [showRestockModal, setShowRestockModal] = useState(false); // ✨ State Modal Restock
    const [restockForm, setRestockForm] = useState({ ingredientId: '', qty: '', cost: '', supplier: '' });
    const [formData, setFormData] = useState({ name: '', stock: '', unit: '', min_stock: '', cost: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'low'
    const [suppliers, setSuppliers] = useState([]); // ✨ Data Supplier untuk Dropdown
    const [activeTab, setActiveTab] = useState('ingredients'); // ✨ NEW: 'ingredients' | 'products'
    const [products, setProducts] = useState([]); // ✨ NEW: Data Menu/Produk
    const [showProductStockModal, setShowProductStockModal] = useState(false);
    const [productStockForm, setProductStockForm] = useState({ id: '', name: '', stock: '' });

    const fetchItems = async () => {
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/ingredients`, { // Endpoint generic
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setItems(await res.json());
        } catch (err) { toast.error("Gagal memuat inventori."); }
        finally { setLoading(false); }
    };

    // ✨ Fetch Suppliers
    const fetchSuppliers = async () => {
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSuppliers(await res.json());
        } catch (e) { console.error("Gagal load suppliers"); }
    };

    // ✨ Fetch Products (Menu)
    const fetchProducts = async () => {
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/restoran`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setProducts(await res.json());
        } catch (e) { console.error("Gagal load produk"); }
    };

    useEffect(() => { 
        fetchItems(); 
        fetchSuppliers(); // Load suppliers saat mount
        fetchProducts(); // Load products
    }, []);

    const handleSave = async () => {
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        const url = editItem
            ? `${backendUrl}/api/ingredients/${editItem.id}`
            : `${backendUrl}/api/ingredients`;

        try {
            const res = await fetch(url, {
                method: editItem ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(editItem ? 'Stok diperbarui!' : 'Bahan baru ditambahkan!');
                closeModal();
                fetchItems();
            } else { toast.error(result.error || "Gagal menyimpan data."); }
        } catch (e) { toast.error("Error koneksi."); }
    };

    const handleDelete = (item) => {
        if (setConfirmModal) {
            setConfirmModal({
                show: true,
                title: 'Hapus Bahan Baku',
                message: `Yakin ingin menghapus "${item.name}" dari daftar? Ini tidak bisa dibatalkan.`,
                onConfirm: async () => {
                    const token = localStorage.getItem('resto_token');
                const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
                    try {
                    const res = await fetch(`${backendUrl}/api/ingredients/${item.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            toast.success(`"${item.name}" berhasil dihapus.`);
                            fetchItems();
                        } else { toast.error("Gagal menghapus."); }
                    } catch(e) { toast.error("Koneksi error."); }
                    setConfirmModal(prev => ({...prev, show: false}));
                }
            });
        }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setFormData(item ? { ...item } : { name: '', stock: '', unit: 'kg', min_stock: 5, cost: 0 });
        setShowModal(true);
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setIsClosing(false); // Reset untuk pembukaan modal berikutnya
        }, 300); // Durasi harus cocok dengan animasi CSS
    };
    
    // ✨ Handle Submit Waste
    const handleSubmitWaste = async () => {
        if (!wasteForm.ingredientId || !wasteForm.qty) return toast.warn("Pilih bahan dan masukkan jumlah.");
        
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/inventory/waste`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(wasteForm)
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(`Waste tercatat! Kerugian: Stok berkurang.`);
                setShowWasteModal(false);
                setWasteForm({ ingredientId: '', qty: '', reason: 'Busuk/Kadaluarsa' });
                fetchItems(); // Refresh stok
            } else {
                toast.error(data.error || "Gagal mencatat waste.");
            }
        } catch (err) { toast.error("Koneksi error."); }
    };

    // ✨ Handle Submit Restock
    const handleSubmitRestock = async () => {
        if (!restockForm.ingredientId || !restockForm.qty) return toast.warn("Pilih bahan dan masukkan jumlah.");
        
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/inventory/restock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(restockForm)
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(`Restock berhasil! Stok bertambah.`);
                setShowRestockModal(false);
                setRestockForm({ ingredientId: '', qty: '', cost: '', supplier: '' });
                fetchItems(); // Refresh stok
            } else {
                toast.error(data.error || "Gagal mencatat restock.");
            }
        } catch (err) { toast.error("Koneksi error."); }
    };

    // ✨ NEW: Export Data ke CSV (Untuk Stock Opname)
    const handleExportCSV = () => {
        // Gunakan data hasil filter agar sesuai tampilan tabel
        const dataToExport = filteredItems;
        if (dataToExport.length === 0) {
            toast.warn('Tidak ada data untuk diexport.');
            return;
        }
        
        // Helper: Escape CSV (menangani koma dan kutip dalam data)
        const escapeCsv = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const currentDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });

        // 1. Header Metadata Laporan
        let csvContent = `LAPORAN STOK OPNAME\n`;
        csvContent += `Restoran:,Superapp Resto\n`;
        csvContent += `Tanggal Cetak:,${escapeCsv(currentDate)}\n`;
        csvContent += `Total Item:,${dataToExport.length}\n`;
        csvContent += `\n`; // Baris kosong pemisah
        
        // 2. Header Tabel
        const headers = ['No', 'ID Sistem', 'Nama Bahan', 'Stok Fisik', 'Satuan', 'Min. Stok', 'Status', 'Harga Beli (Rp)', 'Total Aset (Rp)'];
        csvContent += headers.join(',') + '\n';
        
        let grandTotalAsset = 0;

        // 3. Baris Data
        dataToExport.forEach((item, index) => {
            const totalAsset = (item.stock || 0) * (item.cost || 0);
            grandTotalAsset += totalAsset;
            
            const status = Number(item.stock) <= Number(item.min_stock) ? '⚠️ LOW' : 'OK';
            
            const row = [
                index + 1,
            item.id,
            escapeCsv(item.name),
            item.stock,
            escapeCsv(item.unit),
            item.min_stock,
            escapeCsv(status),
            item.cost || 0,
            totalAsset
            ];
            csvContent += row.join(',') + '\n';
        });

        // 4. Footer Total
        csvContent += `\n,,,,,,,TOTAL NILAI ASET:,${grandTotalAsset}\n`;

        // 5. Buat File dengan BOM (\uFEFF) agar Excel membaca UTF-8 dengan benar
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Laporan stok (Excel) berhasil didownload!");
    };

    // ✨ NEW: Export PDF Laporan Resmi (Modern Template)
    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // 1. Kop Surat / Header Modern
        doc.setFillColor(59, 130, 246); // Warna Biru Modern
        doc.rect(0, 0, 210, 40, 'F'); // Kotak Header Full
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text("LAPORAN STOK OPNAME", 105, 20, null, "center");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Superapp Resto & Inventory System", 105, 28, null, "center");
        doc.text(`Per Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 35, null, "center");

        // 2. Ringkasan Aset
        const totalItems = filteredItems.length;
        const totalAssetValue = filteredItems.reduce((acc, item) => acc + ((item.stock || 0) * (item.cost || 0)), 0);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Total Item: ${totalItems}`, 14, 50);
        doc.text(`Total Nilai Aset: Rp ${totalAssetValue.toLocaleString('id-ID')}`, 14, 55);

        // 3. Tabel Data
        const tableColumn = ["No", "Nama Bahan", "Status", "Stok Sistem", "Fisik", "Satuan", "Nilai Aset (Rp)"];
        const tableRows = [];

        filteredItems.forEach((item, index) => {
            const assetVal = (item.stock || 0) * (item.cost || 0);
            const rowData = [
                index + 1,
                item.name,
                Number(item.stock) <= Number(item.min_stock) ? 'LOW' : 'Aman',
                item.stock,
                '', // Kolom Kosong untuk Cek Fisik Manual
                item.unit,
                assetVal.toLocaleString('id-ID')
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 60,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                2: { fontStyle: 'bold', textColor: [100, 100, 100] },
                3: { halign: 'center', fontStyle: 'bold' },
                4: { cellWidth: 25 }, // Kolom cek fisik lebar untuk tulis tangan
                6: { halign: 'right' }
            },
            alternateRowStyles: { fillColor: [239, 246, 255] } // Baris selang-seling biru muda
        });

        // 4. Footer Tanda Tangan
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.text("Dibuat Oleh,", 40, finalY, null, "center");
        doc.text("( ........................... )", 40, finalY + 25, null, "center");
        doc.text("Disetujui Oleh,", 170, finalY, null, "center");
        doc.text("( ........................... )", 170, finalY + 25, null, "center");

        doc.save(`Laporan_Stok_Resmi_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success("Laporan PDF resmi berhasil didownload!");
    };

    // ✨ NEW: Generator Daftar Belanja Otomatis (Hanya Item Low Stock)
    const handleShoppingList = () => {
        const lowStockItems = items.filter(i => Number(i.stock) <= Number(i.min_stock));
        if (lowStockItems.length === 0) {
            toast.info('Stok aman. Tidak ada barang yang perlu dibeli saat ini.');
            return;
        }

        let textContent = `📋 DAFTAR BELANJA RESTORAN\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n---------------------------\n\n`;
        let totalEstCost = 0;

        lowStockItems.forEach((item, idx) => {
            // Logika sederhana: Beli secukupnya untuk mencapai 2x Minimum Stok (Safety Stock)
            const targetStock = Number(item.min_stock) * 2; 
            const buyQty = Math.max(0, targetStock - item.stock);
            const estCost = buyQty * (item.cost || 0);
            totalEstCost += estCost;

            textContent += `${idx + 1}. ${item.name}\n   Sisa: ${item.stock} ${item.unit}\n   Saran Beli: ${buyQty} ${item.unit}\n   Est. Biaya: Rp ${estCost.toLocaleString('id-ID')}\n\n`;
        });
        
        textContent += `---------------------------\nTotal Estimasi Anggaran: Rp ${totalEstCost.toLocaleString('id-ID')}\n\nGenerated by Superapp POS`;

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Daftar_Belanja_${new Date().toISOString().slice(0, 10)}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Daftar belanja (${lowStockItems.length} item) didownload!`);
    };

    // ✨ Fitur Pencarian & Filter
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'low' ? Number(item.stock) <= Number(item.min_stock) : true;
            return matchesSearch && matchesFilter;
        });
    }, [items, searchTerm, filterType]);

    // ✨ Filter Products
    const filteredProducts = useMemo(() => {
        return products.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [products, searchTerm]);

    // Styles Modern (Inline untuk isolasi)
    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
        title: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-color)', margin: 0 },
        controls: { display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' },
        searchInput: { padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '250px', outline: 'none', background: 'var(--card-bg)', color: 'var(--text-color)' },
        filterBtn: (active) => ({
            padding: '8px 16px', borderRadius: '20px', border: active ? '1px solid #ef4444' : '1px solid var(--border-color)', 
            background: active ? '#fef2f2' : 'var(--card-bg)', color: active ? '#ef4444' : 'var(--text-muted)', 
            cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s'
        }),
        card: { background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
        stockBadge: (isLow) => ({
            background: isLow ? '#fef2f2' : '#f0fdf4', color: isLow ? '#ef4444' : '#16a34a',
            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
        }),
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
    };

    return (
        <div style={styles.container}>
            {/* Header & Controls */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>📦 Inventori Bahan</h2>
                    <p style={{ margin: '5px 0 0', color: 'var(--text-muted)' }}>Kelola stok bahan baku restoran.</p>
                </div>
                <div style={styles.controls}>
                    <input 
                        type="text" 
                        placeholder="🔍 Cari bahan..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        style={styles.searchInput}
                    />
                    {/* Tombol Utilities Baru */}
                    <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={handleShoppingList} title="Download Daftar Belanja (TXT)" style={{...styles.filterBtn(false), padding: '8px 12px', background:'white', color:'#f59e0b', borderColor:'#f59e0b'}}>
                            🛒 Belanja
                        </button>
                        <button onClick={() => setShowRestockModal(true)} title="Catat Barang Masuk/Pembelian" style={{...styles.filterBtn(false), padding: '8px 12px', background:'white', color:'#3b82f6', borderColor:'#3b82f6'}}>
                            📥 Restock
                        </button>
                        <button onClick={() => setShowWasteModal(true)} title="Catat Barang Rusak/Terbuang" style={{...styles.filterBtn(false), padding: '8px 12px', background:'white', color:'#64748b', borderColor:'#64748b'}}>
                            🗑️ Waste
                        </button>
                        {/* Tombol PDF Baru */}
                        <button onClick={handleExportPDF} title="Download Laporan PDF Resmi" style={{...styles.filterBtn(false), padding: '8px 12px', background:'white', color:'#ef4444', borderColor:'#ef4444'}}>
                            📑 Laporan PDF
                        </button>
                        <button onClick={handleExportCSV} title="Download Data Excel (CSV)" style={{...styles.filterBtn(false), padding: '8px 12px', background:'white', color:'#10b981', borderColor:'#10b981'}}>
                            📊 Data Excel
                        </button>
                    </div>
                    <button onClick={() => openModal()} className="profile-save-btn" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>+</span> Tambah
                    </button>
                </div>
            </div>

            {/* ✨ NEW: Tabs Bahan Baku vs Menu Jadi */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
                <button onClick={() => setActiveTab('ingredients')} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: activeTab === 'ingredients' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'ingredients' ? '3px solid var(--primary-color)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Bahan Baku (Raw)</button>
                <button onClick={() => setActiveTab('products')} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: activeTab === 'products' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'products' ? '3px solid var(--primary-color)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Katalog Menu (Porsi Siap Saji)</button>
            </div>

            {activeTab === 'ingredients' && (
            <>
            {/* Filter Tabs */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => setFilterType('all')} style={styles.filterBtn(filterType === 'all')}>Semua Bahan</button>
                <button onClick={() => setFilterType('low')} style={styles.filterBtn(filterType === 'low')}>⚠️ Stok Menipis</button>
            </div>

            {/* Grid Items */}
            {loading ? <p>Memuat...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredItems.length === 0 ? <p style={{color:'#999', gridColumn:'1/-1', textAlign:'center', padding:'40px'}}>Tidak ada bahan yang ditemukan.</p> : 
                    filteredItems.map(item => {
                        const isLow = Number(item.stock) <= Number(item.min_stock);
                        return (
                        <div key={item.id} style={styles.card}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:'15px'}}>
                                <div>
                                    <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '700', color: '#1e293b'}}>{item.name}</h3>
                                    <span style={{fontSize: '0.85rem', color: '#64748b'}}>Cost: Rp {(item.cost || 0).toLocaleString('id-ID')} / {item.unit}</span>
                                </div>
                                <span style={styles.stockBadge(isLow)}>{isLow ? 'Low Stock' : 'Aman'}</span>
                            </div>

                            <div style={{margin: '10px 0'}}>
                                <div style={{fontSize: '2.5rem', fontWeight: '800', color: isLow ? '#ef4444' : '#0f172a', lineHeight: 1}}>
                                    {item.stock} <span style={{fontSize: '1rem', fontWeight: '500', color: '#94a3b8'}}>{item.unit}</span>
                                </div>
                                {isLow && <p style={{margin: '5px 0 0', fontSize: '0.85rem', color: '#ef4444'}}>Min. Stok: {item.min_stock}</p>}
                            </div>

                            <div style={{marginTop: 'auto', paddingTop: '15px', borderTop: '1px dashed #e2e8f0'}}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => openModal(item)} style={{flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'all 0.2s'}}>
                                        📝 Edit
                                    </button>
                                    <button onClick={() => handleDelete(item)} style={{flex: 0.5, padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#ef4444', transition: 'all 0.2s'}}>
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
            </>
            )}

            {/* ✨ NEW: Grid Menu Siap Saji */}
            {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredProducts.length === 0 ? <p style={{color:'#999', gridColumn:'1/-1', textAlign:'center', padding:'40px'}}>Tidak ada menu yang ditemukan.</p> : 
                    filteredProducts.map(item => (
                        <div key={item.id} style={styles.card}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom:'15px'}}>
                                <div>
                                    <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '700', color: '#1e293b'}}>{item.name}</h3>
                                    <span style={{fontSize: '0.85rem', color: '#64748b'}}>Kategori: {item.cuisine || 'Umum'}</span>
                                </div>
                                <span style={styles.stockBadge((item.stock || 0) <= 5)}>{(item.stock || 0) <= 5 ? 'Low Stock' : 'Aman'}</span>
                            </div>

                            <div style={{margin: '10px 0'}}>
                                <div style={{fontSize: '2.5rem', fontWeight: '800', color: (item.stock || 0) <= 5 ? '#ef4444' : '#0f172a', lineHeight: 1}}>
                                    {item.stock || 0} <span style={{fontSize: '1rem', fontWeight: '500', color: '#94a3b8'}}>Porsi</span>
                                </div>
                                <p style={{margin: '5px 0 0', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold'}}>Rp {parseInt(String(item.price).replace(/\D/g,'') || 0).toLocaleString('id-ID')}</p>
                            </div>

                            <div style={{marginTop: 'auto', paddingTop: '15px', borderTop: '1px dashed #e2e8f0'}}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => {
                                        setProductStockForm({ id: item.id, name: item.name, stock: item.stock || 0 });
                                        setShowProductStockModal(true);
                                    }} style={{flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#3b82f6', transition: 'all 0.2s'}}>
                                        📦 Stok Porsi
                                    </button>
                                    <button onClick={() => {
                                        if (onEdit) onEdit(item);
                                    }} style={{flex: 1, padding: '10px', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#ca8a04', transition: 'all 0.2s'}}>
                                        ✏️ Edit Menu
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM */}
            {showModal && (
        <div className={`modal-overlay-animated ${isClosing ? 'closing' : ''}`} style={styles.modalOverlay}>
          <div className={`modal-content-animated ${isClosing ? 'closing' : ''}`} style={{...styles.modalContent, display: 'flex', flexDirection: 'column'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3 style={{margin: 0, fontSize: '1.25rem', color:'#1e293b'}}>{editItem ? 'Update Stok' : 'Bahan Baru'}</h3>
                <button onClick={closeModal} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8'}}>&times;</button>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Nama Bahan</label>
            <input className="profile-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Beras" />

            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'15px'}}>
              <div>
                <label style={{display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem', color:'#475569'}}>Stok Saat Ini</label>
                <input className="profile-input" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
              <div>
                <label style={{display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem', color:'#475569'}}>Satuan</label>
                <input className="profile-input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="kg, liter" />
              </div>
            </div>

            <label style={{display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem', marginTop:'15px', color:'#475569'}}>Harga Beli per Satuan (Rp)</label>
            <input className="profile-input" type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} placeholder="0" />

            <label style={{display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem', marginTop: '15px', color:'#475569'}}>Batas Minimum (Alert)</label>
            <input className="profile-input" type="number" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})} />

            <div style={{display:'flex', gap:'10px', marginTop:'25px', justifyContent:'flex-end'}}>
              <button onClick={closeModal} style={{padding:'10px 20px', borderRadius:'8px', border:'1px solid #cbd5e1', background:'white', color:'#475569', fontWeight:'600', cursor:'pointer'}}>
                Batal
              </button>
              <button onClick={handleSave} className="profile-save-btn" style={{width:'auto'}}>
                Simpan Perubahan
              </button>
            </div>
          </div>
                </div>
            )}

            {/* ✨ MODAL WASTE (BARANG RUSAK) */}
            {showWasteModal && (
                <div className="modal-overlay-animated" style={styles.modalOverlay}>
                    <div className="modal-content-animated" style={{...styles.modalContent, display: 'flex', flexDirection: 'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3 style={{margin: 0, fontSize: '1.25rem', color:'#ef4444'}}>🗑️ Catat Barang Rusak (Waste)</h3>
                            <button onClick={() => setShowWasteModal(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8'}}>&times;</button>
                        </div>
                        <p style={{marginTop:0, marginBottom:'20px', color:'#64748b', fontSize:'0.9rem'}}>Barang yang dicatat di sini akan mengurangi stok secara permanen dan dihitung sebagai kerugian.</p>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Pilih Bahan</label>
                        <select 
                            className="profile-input" 
                            value={wasteForm.ingredientId} 
                            onChange={e => setWasteForm({...wasteForm, ingredientId: e.target.value})}
                        >
                            <option value="">-- Pilih Bahan --</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>
                            ))}
                        </select>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px'}}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Jumlah Terbuang</label>
                                <input type="number" className="profile-input" value={wasteForm.qty} onChange={e => setWasteForm({...wasteForm, qty: e.target.value})} placeholder="0" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Alasan</label>
                                <select className="profile-input" value={wasteForm.reason} onChange={e => setWasteForm({...wasteForm, reason: e.target.value})}>
                                    <option value="Busuk/Kadaluarsa">Busuk/Kadaluarsa</option>
                                    <option value="Jatuh/Tumpah">Jatuh/Tumpah</option>
                                    <option value="Kesalahan Masak">Kesalahan Masak</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleSubmitWaste} className="profile-save-btn" style={{marginTop:'25px', background:'#ef4444'}}>
                            Simpan Data Waste
                        </button>
                    </div>
                </div>
            )}

            {/* ✨ MODAL RESTOCK (STOK MASUK) */}
            {showRestockModal && (
                <div className="modal-overlay-animated" style={styles.modalOverlay}>
                    <div className="modal-content-animated" style={{...styles.modalContent, display: 'flex', flexDirection: 'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3 style={{margin: 0, fontSize: '1.25rem', color:'#3b82f6'}}>📥 Restock / Pembelian</h3>
                            <button onClick={() => setShowRestockModal(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8'}}>&times;</button>
                        </div>
                        
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Pilih Bahan</label>
                        <select 
                            className="profile-input" 
                            value={restockForm.ingredientId} 
                            onChange={e => {
                                const item = items.find(i => i.id == e.target.value);
                                setRestockForm({
                                    ...restockForm, 
                                    ingredientId: e.target.value,
                                    cost: item ? item.cost : '' // Auto-fill harga lama
                                });
                            }}
                        >
                            <option value="">-- Pilih Bahan --</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Sisa: {i.stock} {i.unit})</option>
                            ))}
                        </select>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px'}}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Jumlah Masuk</label>
                                <input type="number" className="profile-input" value={restockForm.qty} onChange={e => setRestockForm({...restockForm, qty: e.target.value})} placeholder="0" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Harga Beli Baru</label>
                                <input type="number" className="profile-input" value={restockForm.cost} onChange={e => setRestockForm({...restockForm, cost: e.target.value})} placeholder="Update Harga" />
                            </div>
                        </div>

                        <div style={{marginTop:'15px'}}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Pilih Supplier</label>
                            <select className="profile-input" value={restockForm.supplier} onChange={e => setRestockForm({...restockForm, supplier: e.target.value})}>
                                <option value="">-- Umum / Tanpa Supplier --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.name}>{s.name} ({s.contactPerson})</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleSubmitRestock} className="profile-save-btn" style={{marginTop:'25px', background:'#3b82f6'}}>
                            Simpan Restock
                        </button>
                    </div>
                </div>
            )}

            {/* ✨ MODAL UPDATE STOK MENU */}
            {showProductStockModal && (
                <div className="modal-overlay-animated" style={styles.modalOverlay}>
                    <div className="modal-content-animated" style={{...styles.modalContent, display: 'flex', flexDirection: 'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3 style={{margin: 0, fontSize: '1.25rem', color:'#1e293b'}}>📦 Update Stok Porsi Menu</h3>
                            <button onClick={() => setShowProductStockModal(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8'}}>&times;</button>
                        </div>
                        <p style={{marginTop:0, marginBottom:'20px', color:'#64748b', fontSize:'0.9rem'}}>Atur stok langsung untuk menu atau barang jadi (seperti Minuman Botol, Snack, dll) yang tidak menggunakan resep bahan baku.</p>
                        
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color:'#475569' }}>Nama Menu</label>
                        <input className="profile-input" value={productStockForm.name} disabled style={{background: '#f1f5f9'}} />

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', marginTop:'15px', color:'#475569' }}>Stok Saat Ini (Porsi / Pcs)</label>
                        <input type="number" className="profile-input" value={productStockForm.stock} onChange={e => setProductStockForm({...productStockForm, stock: e.target.value})} />

                        <div style={{display:'flex', gap:'10px', marginTop:'25px', justifyContent:'flex-end'}}>
                            <button onClick={() => setShowProductStockModal(false)} style={{padding:'10px 20px', borderRadius:'8px', border:'1px solid #cbd5e1', background:'white', color:'#475569', fontWeight:'600', cursor:'pointer'}}>
                                Batal
                            </button>
                            <button onClick={async () => {
                            const token = localStorage.getItem('resto_token');
                        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
                                try {
                                const res = await fetch(`${backendUrl}/api/products/${productStockForm.id}/stock`, {
                                        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ stock: productStockForm.stock })
                                    });
                                    const resultData = await res.json();
                                    if (res.ok) { 
                                        toast.success('Stok menu berhasil diperbarui!'); setShowProductStockModal(false); fetchProducts(); 
                                        // ✨ FIX: Beritahu App.jsx agar Katalog Menu update otomatis tanpa refresh
                                        if (onDataUpdated && resultData.data && resultData.data.service_name) onDataUpdated(resultData.data.service_name, resultData.data);
                                    } 
                                    else { toast.error(resultData.error || 'Gagal memperbarui stok.'); }
                                } catch(e) { toast.error('Koneksi error'); }
                            }} className="profile-save-btn" style={{width:'auto', background: '#3b82f6'}}>
                                Simpan Stok
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
