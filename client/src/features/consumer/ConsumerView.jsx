// ✨ FINAL V2: Isolasi Keranjang SuperMarket & SuperResto (Shopee/Tokopedia Style)
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import OrderHistory from './OrderHistory'; // Import komponen baru

// ✨ KOMPONEN GAMBAR ANTI-GAGAL (PURE HTML/REACT)
const ImageWithFallback = ({ src, category, alt, style, ...rest }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let newSrc = src;
    if (typeof src === 'string' && src.startsWith('[')) {
      try { const parsed = JSON.parse(src); newSrc = parsed.length > 0 ? parsed[0] : null; } catch (e) { }
    }
    if (!newSrc || String(newSrc).includes('null') || String(newSrc).includes('undefined') || newSrc === '[]') {
      setHasError(true);
    } else {
      setImgSrc(newSrc);
      setHasError(false);
    }
  }, [src]);

  if (hasError || !imgSrc) {
    const getIcon = () => {
      if (category === 'Restoran') return '🍔';
      if (category === 'Hotel') return '🏨';
      if (category === 'Properti') return '🏠';
      if (category === 'Mall') return '🏬';
      if (alt) {
        const a = String(alt).toLowerCase();
        if (a.includes('sepatu')) return '👟';
        if (a.includes('tv') || a.includes('headset') || a.includes('jam')) return '📺';
        if (a.includes('kaos') || a.includes('kemeja')) return '👕';
        if (a.includes('skincare') || a.includes('lipstik')) return '✨';
        if (a.includes('tas')) return '👜';
      }
      return '🛒';
    };
    return (
      <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{getIcon()}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '8px', color: '#94a3b8', padding: '4px 10px', background: '#e2e8f0', borderRadius: '12px' }}>Produk Dummy</span>
      </div>
    );
  }

  return <img src={imgSrc} alt={alt} style={style} {...rest} onError={() => setHasError(true)} />;
};

const ConsumerView = ({ data, user, onBackToAdmin, onLogout, isolatedModule }) => {
  const [activeCategory, setActiveCategory] = useState(isolatedModule || 'Ecommerce');
  const [cart, setCart] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]); // ID item yang di-wishlist
  const [wishlistItems, setWishlistItems] = useState([]); // Data item wishlist
  const [showCartModal, setShowCartModal] = useState(false);
  const [page, setPage] = useState('shop'); // 'shop', 'history', 'wishlist'
  const [searchTerm, setSearchTerm] = useState(''); // State pencarian
  const [selectedItem, setSelectedItem] = useState(null); // State modal detail
  const [itemReviews, setItemReviews] = useState([]); // Review untuk item yg dipilih
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' }); // Form review
  const [address, setAddress] = useState(''); // Alamat pengiriman Meja Resto
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // State simulasi pembayaran
  const [currentBanner, setCurrentBanner] = useState(0); // State untuk carousel banner
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Menu dropdown profil

  // ✨ STATE FLASH SALE TIMER
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // ✨ STATE KHUSUS E-COMMERCE (Tokopedia Style)
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [ecoItem, setEcoItem] = useState(null); // Item e-commerce yg sedang dipilih
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [ecoQty, setEcoQty] = useState(1);
  const [ecoShipping, setEcoShipping] = useState({ courier: 'JNT', address: '' });

  // ✨ FULL FEATURE: ADDRESS BOOK & DYNAMIC SHIPPING ENGINE
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddressForm, setNewAddressForm] = useState({ label: '', city: '', detail: '' });
  const [dynamicShippingOptions, setDynamicShippingOptions] = useState([]); // Array opsi layanan
  const [selectedShippingService, setSelectedShippingService] = useState(null); // Pilihan user
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);

  // ✨ STATE SORTING & VOUCHER E-COMMERCE
  const [sortBy, setSortBy] = useState('default');
  const [filterCondition, setFilterCondition] = useState('Semua');
  const [vouchers, setVouchers] = useState([]);
  const [ecoVoucherCode, setEcoVoucherCode] = useState('');
  const [ecoAppliedVoucher, setEcoAppliedVoucher] = useState(null);

  // ✨ STATE KHUSUS PROPERTI (CRM LEAD)
  const [showPropertyLeadModal, setShowPropertyLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ customer_name: user?.username || '', customer_phone: '', schedule_date: '', time_slot: '09:00 - 10:00' });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  
  // ✨ STATE PENAWARAN (MAKE AN OFFER)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ offer_amount: '', message: '' });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // ✨ STATE TITIP PROPERTI
  const [showSubmitPropertyModal, setShowSubmitPropertyModal] = useState(false);
  const [submitPropForm, setSubmitPropForm] = useState({ name: '', price: '', type: 'Rumah', status: 'Jual', bedrooms: 2, bathrooms: 1, land_size: 100, building_size: 80, address: '', description: '' });
  const [isSubmittingProp, setIsSubmittingProp] = useState(false);
  // ✨ STATE KALKULATOR KPR
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);
  const [myProperties, setMyProperties] = useState([]);
  const [kprDp, setKprDp] = useState(20);
  const [kprInterest, setKprInterest] = useState(6.5);
  const [kprTenor, setKprTenor] = useState(15);
  
  // ✨ STATE SMART FILTER & COMPARE PROPERTI
  const [propFilter, setPropFilter] = useState({ search: '', type: 'Semua', status: 'Semua', maxPrice: '' });
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // ✨ STATE KHUSUS RESTORAN (SELF ORDER & PICKUP)
  const [restoOrderType, setRestoOrderType] = useState('Takeaway');
  const [myActiveOrders, setMyActiveOrders] = useState([]);

  // ✨ STATE KHUSUS MALL F&B TENANT
  const [fnbTenants, setFnbTenants] = useState([]);
  const [fnbMenus, setFnbMenus] = useState([]);
  const [activeFnbTenant, setActiveFnbTenant] = useState(null);

  // Data Banner Promo Umum
  const allBanners = [
    { id: 1, title: "Super Sale 12.12", subtitle: "Diskon hingga 80% untuk semua produk elektronik!", color: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" },
    { id: 2, title: "Liburan Impian", subtitle: "Booking hotel bintang 5 harga kaki lima.", color: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" },
    { id: 3, title: "Kuliner Nusantara", subtitle: "Gratis ongkir untuk pemesanan makanan hari ini.", color: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)" },
    { id: 4, title: "Hunian Nyaman", subtitle: "Temukan properti idaman untuk keluarga Anda.", color: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }
  ];

  // Data Banner Khusus E-Commerce
  const ecoBanners = [
    { id: 1, title: "SuperMarket Festival", subtitle: "Diskon E-Commerce hingga 80% untuk semua produk!", color: "linear-gradient(135deg, rgba(79, 70, 229, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)", bgImage: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1920&q=80" }, // Gambar tas belanja lebar
    { id: 2, title: "Gratis Ongkir se-Indonesia", subtitle: "Belanja puas tanpa pusing ongkos kirim.", color: "linear-gradient(135deg, rgba(14, 165, 233, 0.85) 0%, rgba(56, 189, 248, 0.85) 100%)", bgImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1920&q=80" } // Gambar etalase toko lebar
  ];

  // ✨ BANNER KULINER UNTUK RESTORAN (SLIDER)
  const restoBanners = [
    { id: 1, image: "https://images.unsplash.com/photo-1504674900247-087700f9cc8e?auto=format&fit=crop&w=1600&q=80" }, // Kuliner Nusantara/Daging
    { id: 2, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80" }, // BBQ / Sate
    { id: 3, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80" }, // Pizza / Makanan Barat
    { id: 4, image: "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1600&q=80" }  // Healthy Food / Pasta
  ];

  const banners = isolatedModule === 'Ecommerce' ? ecoBanners : (isolatedModule === 'Restoran' ? restoBanners : allBanners);

  // ✨ DUMMY DATA: Mencegah toko kosong saat user mengklik menu atau pencarian
  const dummyEcommerceItems = useMemo(() => [
    { id: 'dm1', name: 'Sepatu Sneakers Pria Original', price: 'Rp 250.000', discount_price: 'Rp 150.000', stock: 15, condition: 'Baru', weight: 800, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Fashion' },
    { id: 'dm2', name: 'Kaos Polos Cotton Combed 30s', price: 'Rp 50.000', discount_price: 'Rp 35.000', stock: 100, condition: 'Baru', weight: 200, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Fashion' },
    { id: 'dm3', name: 'Kemeja Pria Slim Fit', price: 'Rp 120.000', discount_price: 'Rp 85.000', stock: 50, condition: 'Baru', weight: 300, image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Fashion' },
    { id: 'dm4', name: 'Smart TV 32 Inch LED HD', price: 'Rp 2.500.000', discount_price: 'Rp 1.999.000', stock: 5, condition: 'Baru', weight: 5000, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Elektronik' },
    { id: 'dm5', name: 'Headset TWS Bluetooth 5.0', price: 'Rp 300.000', discount_price: 'Rp 125.000', stock: 50, condition: 'Baru', weight: 100, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Elektronik' },
    { id: 'dm6', name: 'Jam Tangan Pintar Smartwatch', price: 'Rp 450.000', discount_price: 'Rp 250.000', stock: 20, condition: 'Baru', weight: 250, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Elektronik' },
    { id: 'dm7', name: 'Skincare Serum Brightening', price: 'Rp 120.000', discount_price: null, stock: 25, condition: 'Baru', weight: 150, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Kecantikan' },
    { id: 'dm8', name: 'Lipstik Matte Tahan Lama', price: 'Rp 75.000', discount_price: 'Rp 50.000', stock: 40, condition: 'Baru', weight: 50, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Kecantikan' },
    { id: 'dm9', name: 'Tas Selempang Wanita Kulit', price: 'Rp 150.000', discount_price: 'Rp 99.000', stock: 10, condition: 'Bekas', weight: 400, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Fashion' },
    { id: 'dm10', name: 'Mainan Hobi Action Figure', price: 'Rp 500.000', discount_price: null, stock: 2, condition: 'Bekas', weight: 600, image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Hobi' },
    { id: 'dm11', name: 'Lampu Tidur Estetik', price: 'Rp 85.000', discount_price: 'Rp 60.000', stock: 30, condition: 'Baru', weight: 400, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=500', service: 'Ecommerce', categoryTag: 'Rumah' },
  ], []);

  // ✨ Quick Menus Khusus E-Commerce (Kategori Dinamis)
  const ecoQuickMenus = useMemo(() => {
    const sourceData = [...((data && data['Ecommerce']) || []), ...dummyEcommerceItems];
    const uniqueCats = new Set();
    sourceData.forEach(item => {
      if (item.category) uniqueCats.add(item.category);
      else if (item.categoryTag) uniqueCats.add(item.categoryTag);
    });

    const iconMap = { 'Fashion': '👕', 'Elektronik': '📱', 'Kecantikan': '💄', 'Makanan': '🍔', 'Kesehatan': '💊', 'Hobi & Koleksi': '🎮', 'Rumah': '🏠', 'Hobi': '🎮' };
    const dynamicCats = Array.from(uniqueCats).map((cat, idx) => ({
      id: idx + 10, icon: iconMap[cat] || '📦', label: cat, bg: '#f1f5f9', color: '#475569'
    }));

    return [
      { id: 1, icon: '🚚', label: 'Bebas Ongkir', bg: '#dcfce7', color: '#16a34a' },
      { id: 2, icon: '⚡', label: 'Flash Sale', bg: '#fee2e2', color: '#ef4444' },
      ...dynamicCats
    ];
  }, [data, dummyEcommerceItems]);

  // Fetch Wishlist IDs & Other Data saat mount
  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem('superapp_token');
      try {
        const res = await fetch(`http://${window.location.hostname}:3000/api/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setWishlistItems(data);
          setWishlistIds(data.map(item => item.id));
        }
      } catch (e) { }
    };
    fetchWishlist();

    // Fetch Data Vouchers dari API
    fetch(`http://${window.location.hostname}:3000/api/vouchers`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('superapp_token')}` } })
      .then(res => res.json())
      .then(data => setVouchers(Array.isArray(data) ? data : []))
      .catch(() => { });

    // ✨ Fetch Buku Alamat Pelanggan
    fetch(`http://${window.location.hostname}:3000/api/users/addresses`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('superapp_token')}` } })
      .then(res => res.json())
      .then(data => {
        setSavedAddresses(data);
        if (data.length > 0) setSelectedAddressId(data[0].id);
        else setSelectedAddressId('NEW');
      })
      .catch(() => { });

    // ✨ FETCH TENANT DAN MENU MALL F&B
    if (isolatedModule === 'MallFood') {
      fetch(`http://${window.location.hostname}:3000/api/public/mall/tenants`)
        .then(res => res.json())
        .then(data => setFnbTenants(data.filter(t => ['F&B', 'Food & Beverage', 'Makanan', 'Restoran', 'Cafe'].includes(t.category))));
      
      fetch(`http://${window.location.hostname}:3000/api/mall_resto`)
        .then(res => res.json())
        .then(data => setFnbMenus(data));
    }
  }, [page]); // Refresh saat ganti halaman

  // ✨ SOCKET IO UNTUK NOTIFIKASI PESANAN RESTO SIAP AMBIL
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const socket = io(backendUrl);
    socket.on('orderStatusUpdate', (statusData) => {
      setMyActiveOrders(prev => {
        if (prev.includes(String(statusData.orderId)) || prev.includes(Number(statusData.orderId))) {
          if (statusData.status === 'Pending') toast.info(`✅ Pesanan #${statusData.orderId} dikonfirmasi kasir.`);
          if (statusData.status === 'Processed') toast.info(`👨‍🍳 Pesanan #${statusData.orderId} sedang disiapkan dapur!`);
          if (statusData.status === 'Completed') {
            toast.success(`🛎️ PESANAN #${statusData.orderId} SIAP DIAMBIL! Silakan menuju tenant kasir untuk mengambil pesanan Anda tanpa antri.`, { autoClose: 10000, icon: '🏃‍♂️' });
            // Mainkan suara ting-tong
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
          }
        }
        return prev;
      });
    });
    return () => socket.disconnect();
  }, []);

  // ✨ TIMER HITUNG MUNDUR FLASH SALE (Berakhir Tengah Malam)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = endOfDay - now;
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto Slide Banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // ✨ FULL FEATURE: AUTO-CALCULATE SHIPPING WHEN ADDRESS/COURIER CHANGES
  useEffect(() => {
    const calculateOngkir = async () => {
      const ecoItems = cart.filter(i => i.service === 'Ecommerce');
      if (ecoItems.length === 0) return;
      const ecoWeight = ecoItems.reduce((acc, item) => acc + ((item.weight || 0) * item.qty), 0);

      let destination = '';
      if (selectedAddressId === 'NEW') destination = newAddressForm.city;
      else {
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        destination = addr ? addr.city : '';
      }

      if (!destination) return;

      setIsCalculatingOngkir(true);
      try {
        const res = await fetch(`http://${window.location.hostname}:3000/api/logistics/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('superapp_token')}` },
          body: JSON.stringify({ origin: 'Jakarta', destination, weight: ecoWeight, courier: ecoShipping.courier })
        });
        if (res.ok) {
            const data = await res.json();
            setDynamicShippingOptions(data.results || []);
            if (data.results && data.results.length > 0) setSelectedShippingService(data.results[0]);
        }
      } catch (e) { }
      finally { setIsCalculatingOngkir(false); }
    };

    const timeoutId = setTimeout(calculateOngkir, 600); // Debounce
    return () => clearTimeout(timeoutId);
  }, [cart, selectedAddressId, newAddressForm.city, ecoShipping.courier, savedAddresses]);

  const categories = [
    { id: 'Ecommerce', label: 'Belanja', icon: '🛒' },
    { id: 'Restoran', label: 'Makanan', icon: '🍔' },
    { id: 'Hotel', label: 'Hotel', icon: '🏨' },
    { id: 'Properti', label: 'Properti', icon: '🏠' },
    { id: 'Mall', label: 'Mall', icon: '🏬' },
  ];

  const handleAction = (item, category) => {
    if (category === 'Ecommerce' || category === 'Restoran' || category === 'MallFood') {
      // ECOMMERCE LOGIC: Cek apakah item punya varian
      if (category === 'Ecommerce') {
        let parsedVariants = [];
        try { parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []); } catch (e) { }
        if (parsedVariants.length > 0) {
          setEcoItem({ ...item, parsedVariants });
          setSelectedVariant(parsedVariants[0]);
          setEcoQty(1);
          setShowVariantModal(true);
          return; // Stop normal add to cart, buka modal varian
        }
      }

      const finalPrice = category === 'Ecommerce' && item.discount_price ? item.discount_price : item.price;
      setCart([...cart, { ...item, price: finalPrice, service: category, qty: 1 }]);
      toast.success(`"${item.name}" masuk keranjang!`);
    } else if (category === 'Hotel') {
      toast.success(`Booking hotel "${item.name}" berhasil!`);
    } else {
      setSelectedItem(item); // Buka modal detail
    }
  };

  const confirmAddVariantToCart = () => {
    if (!selectedVariant || selectedVariant.stock < ecoQty) return toast.warn("Stok varian tidak cukup!");

    const finalPriceStr = ecoItem.discount_price ? ecoItem.discount_price : ecoItem.price;
    const basePriceNum = parseInt(String(finalPriceStr).replace(/\D/g, '')) || 0;
    const variantPriceNum = basePriceNum + (Number(selectedVariant.priceDiff) || 0);

    setCart([...cart, { ...ecoItem, price: `Rp ${variantPriceNum.toLocaleString('id-ID')}`, service: 'Ecommerce', qty: ecoQty, variantName: selectedVariant.name }]);
    setShowVariantModal(false);
    toast.success(`${ecoItem.name} (${selectedVariant.name}) masuk keranjang!`);
  };

  const handleToggleWishlist = async (item, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('superapp_token');
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId: item.id })
      });
      const result = await res.json();
      if (result.active) {
        setWishlistIds([...wishlistIds, item.id]);
        toast.success('Ditambahkan ke Wishlist');
      } else {
        setWishlistIds(wishlistIds.filter(id => id !== item.id));
        toast.info('Dihapus dari Wishlist');
      }
    } catch (err) { toast.error('Gagal update wishlist'); }
  };

  useEffect(() => {
    if (selectedItem) {
      fetch(`http://${window.location.hostname}:3000/api/reviews/${selectedItem.id}`)
        .then(res => res.json())
        .then(data => setItemReviews(data))
        .catch(() => setItemReviews([]));
    }
  }, [selectedItem]);

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('superapp_token');
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId: selectedItem.id, ...newReview })
      });
      if (res.ok) {
        const savedReview = await res.json();
        setItemReviews([savedReview, ...itemReviews]);
        setNewReview({ rating: 5, comment: '' });
        toast.success('Ulasan terkirim!');
      }
    } catch (e) { toast.error('Gagal kirim ulasan'); }
  };

  const renderMeta = (item, category) => {
    if (category === 'Hotel') return <span style={{ color: '#f1c40f' }}>⭐ {item.rating}</span>;
    if (category === 'Restoran') return <span style={{ color: '#e67e22' }}>🍴 {item.cuisine}</span>;
    if (category === 'Mall') return <span style={{ color: '#9b59b6' }}>📍 {item.city}</span>;
    if (category === 'Properti') return <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>Rp {Number(item.price || 0).toLocaleString('id-ID')}</span>;
    return <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{item.price}</span>;
  };

  const calculateTotal = (itemsToCalc) => {
    return itemsToCalc.reduce((acc, item) => {
      const priceString = item.price ? String(item.price).replace(/[^0-9]/g, '') : '0';
      return acc + (parseInt(priceString || 0, 10) * (item.qty || 1));
    }, 0);
  };

  const handleCheckoutRestoran = async (restoItems) => {
    if (restoItems.length === 0) return;
    if (restoOrderType === 'Dine In' && !address.trim()) {
      toast.warn('Mohon isi Nomor Meja untuk pesanan Makan di Tempat!');
      return;
    }
    setIsProcessingPayment(true);
    const token = localStorage.getItem('superapp_token');
    try {
      const finalAddress = restoOrderType === 'Takeaway' ? 'Ambil Sendiri (Takeaway)' : `Meja ${address}`;
      const res = await fetch(`http://${window.location.hostname}:3000/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: restoItems, address: finalAddress, total: calculateTotal(restoItems), paymentMethod: 'QRIS'
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Pesanan berhasil dibuat! Anda akan menerima notifikasi saat pesanan siap diambil.');
        setMyActiveOrders(prev => [...prev, String(result.orderId)]);
        setCart(cart.filter(i => i.service !== 'Restoran'));
        if (cart.filter(i => i.service !== 'Restoran').length === 0) setShowCartModal(false);
        setPage('history');
      } else {
        toast.error('Gagal terhubung ke server.');
      }
    } catch (err) {
      toast.error('Kesalahan koneksi.');
    } finally { setIsProcessingPayment(false); }
  };

  // ✨ CHECKOUT KHUSUS E-COMMERCE
  const handleCheckoutEcommerce = async (ecoItems, finalEcoTotal, ecoWeight, ecoOngkir, appliedVoucherCode, finalAddressStr) => {
    if (ecoItems.length === 0) return;

    // Validasi Alamat
    if (selectedAddressId === 'NEW') {
      if (!newAddressForm.label || !newAddressForm.city || !newAddressForm.detail) return toast.warn("Mohon lengkapi Form Alamat Baru Anda!");
    } else {
      if (!selectedAddressId) return toast.warn("Pilih Alamat Pengiriman!");
    }

    setIsProcessingPayment(true);
    const token = localStorage.getItem('superapp_token');
    try {
      let actualAddress = finalAddressStr;
      // Save Address to Book if NEW
      if (selectedAddressId === 'NEW') {
        const resAddr = await fetch(`http://${window.location.hostname}:3000/api/users/addresses`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newAddressForm)
        });
        if (resAddr.ok) {
          const newlySaved = await resAddr.json();
          setSavedAddresses([...savedAddresses, newlySaved]);
        }
      }

      const res = await fetch(`http://${window.location.hostname}:3000/api/ecommerce/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: ecoItems, address: actualAddress, courier: ecoShipping.courier, totalWeight: ecoWeight, shippingCost: ecoOngkir, total: finalEcoTotal, voucherCode: appliedVoucherCode
        })
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      if (res.ok) {
        toast.success('Pesanan berhasil dibuat! Silakan selesaikan pembayaran.');
        setCart(cart.filter(i => i.service !== 'Ecommerce'));
        if (cart.filter(i => i.service !== 'Ecommerce').length === 0) setShowCartModal(false);
        setPage('history'); // Arahkan ke tab history untuk bayar
      } else {
        const err = await res.json().catch(() => ({ error: 'Gagal memproses ke server' }));
        toast.error(err.error || 'Gagal checkout E-commerce');
      }
    } catch (e) { toast.error("Koneksi Error. Pastikan server backend berjalan."); }
    finally { setIsProcessingPayment(false); }
  };

  // ✨ CHECKOUT KHUSUS MALL FOOD COURT
  const handleCheckoutMallFood = async (foodItems) => {
      if (foodItems.length === 0) return;
      setIsProcessingPayment(true);
      const token = localStorage.getItem('superapp_token');
      try {
          const res = await fetch(`http://${window.location.hostname}:3000/api/mallfood/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ items: foodItems, total: calculateTotal(foodItems), paymentMethod: 'QRIS', address: `Meja ${address}` || 'Takeaway' })
          });
          const result = await res.json();
          if (res.ok) {
              toast.success('Pesanan diteruskan ke tenant kasir masing-masing!');
              setCart(cart.filter(i => i.service !== 'MallFood'));
              setShowCartModal(false);
              setPage('history');
          } else { toast.error(result.error); }
      } catch(e) { toast.error("Koneksi error"); }
      finally { setIsProcessingPayment(false); }
  };

  const handleApplyEcoVoucher = (ecoItems) => {
    if (!ecoVoucherCode) return;
    const found = vouchers.find(v => v.code.toUpperCase() === ecoVoucherCode.toUpperCase());
    if (!found) return toast.error("Kupon tidak ditemukan atau tidak valid!");
    if (!found.isActive) return toast.error("Kupon ini sedang tidak aktif!");

    // ✨ CEK KUOTA DAN EXPIRED DATE
    if (found.quota !== undefined && found.quota <= 0) {
      return toast.error("Kupon ini sudah kehabisan kuota!");
    }
    if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
      return toast.error("Kupon ini sudah melewati masa berlaku (Expired)!");
    }

    const currentEcoSubtotal = calculateTotal(ecoItems);
    if (currentEcoSubtotal < found.minOrder) return toast.warn(`Minimal belanja Rp ${found.minOrder.toLocaleString('id-ID')} untuk menggunakan kupon ini.`);

    setEcoAppliedVoucher(found);
    toast.success(`Kupon "${found.name}" berhasil diterapkan!`);
  };

  // ✨ HANDLER KIRIM LEAD PROPERTI
  const handleSubmitPropertyLead = async (e) => {
    e.preventDefault();
    if (!leadForm.customer_name || !leadForm.customer_phone) return toast.warn('Nama dan Nomor HP wajib diisi.');
    
    setIsSubmittingLead(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/public/properties/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedItem.id, agent_id: selectedItem.agent_id, user_id: user?.id, ...leadForm })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowPropertyLeadModal(false);
        setSelectedItem(null); // Tutup modal detail
      } else { toast.error(data.error); }
    } catch (err) { toast.error('Koneksi Error.'); }
    finally { setIsSubmittingLead(false); }
  };

  // ✨ HANDLER SUBMIT PROPERTI DARI OWNER/PUBLIK
  const handleSubmitProperty = async (e) => {
      e.preventDefault();
      setIsSubmittingProp(true);
      try {
          const payload = {
              ...submitPropForm,
              price: Number(String(submitPropForm.price).replace(/\D/g, '')),
              owner_id: user?.id || null
          };
          const res = await fetch(`http://${window.location.hostname}:3000/api/public/properties/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
              toast.success(data.message);
              setShowSubmitPropertyModal(false);
              setSubmitPropForm({ name: '', price: '', type: 'Rumah', status: 'Jual', bedrooms: 2, bathrooms: 1, land_size: 100, building_size: 80, address: '', description: '' });
          } else { toast.error(data.error); }
      } catch (err) { toast.error('Koneksi Error.'); }
      finally { setIsSubmittingProp(false); }
  };

  // ✨ FETCH DATA DASHBOARD PEMILIK PROPERTI
  const openOwnerDashboard = async () => {
      if(!user) return toast.warn("Silakan login terlebih dahulu.");
      setShowOwnerDashboard(true);
      try {
          const res = await fetch(`http://${window.location.hostname}:3000/api/properties/owner/dashboard`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('superapp_token')}` }
          });
          if(res.ok) setMyProperties(await res.json());
      } catch(e) {
          toast.error("Gagal memuat data aset.");
      }
  };

  // ✨ EXTRAK DAFTAR TENANT RESTO
  const restoTenants = useMemo(() => {
    const sourceData = (data && data['Restoran']) || [];
    const uniqueCats = new Set();
    sourceData.forEach(item => {
      if (item.cuisine) uniqueCats.add(item.cuisine);
    });
    return Array.from(uniqueCats);
  }, [data]);

  const sourceEcommerceData = [...((data && data['Ecommerce']) || []), ...dummyEcommerceItems];
  const flashSaleItems = activeCategory === 'Ecommerce' ? sourceEcommerceData.filter(item => item.discount_price) : [];

  let processedData = (activeCategory === 'Ecommerce' ? sourceEcommerceData : ((data && data[activeCategory]) || [])).filter(item => {
    if (!item) return false;
    const st = searchTerm.toLowerCase().trim();
    if (!st) return true;

    const itemName = String(item.name || '').toLowerCase();
    const itemCat = String(item.category || item.categoryTag || item.cuisine || '').toLowerCase();

    if (itemName.includes(st)) return true;
    if (activeCategory === 'Ecommerce') {
      if (itemCat === st || itemCat.includes(st)) return true;
      if (st === 'bebas ongkir' || st === 'cashback') return true;
      if (st === 'flash sale' && item.discount_price) return true;
    }
    return false;
  });

  if (activeCategory === 'Ecommerce') {
    if (filterCondition !== 'Semua') {
      processedData = processedData.filter(item => item.condition === filterCondition);
    }
    if (sortBy === 'lowest') {
      processedData.sort((a, b) => (parseInt(String(a.discount_price || a.price).replace(/\D/g, '')) || 0) - (parseInt(String(b.discount_price || b.price).replace(/\D/g, '')) || 0));
    } else if (sortBy === 'highest') {
      processedData.sort((a, b) => (parseInt(String(b.discount_price || b.price).replace(/\D/g, '')) || 0) - (parseInt(String(a.discount_price || a.price).replace(/\D/g, '')) || 0));
    }
  } else if (activeCategory === 'Properti') {
    // ✨ FILTERING PROPERTI
    if (propFilter.search) {
        const query = propFilter.search.toLowerCase();
        processedData = processedData.filter(item => 
            String(item.name).toLowerCase().includes(query) || 
            String(item.description).toLowerCase().includes(query) ||
            String(item.address).toLowerCase().includes(query)
        );
    }
    if (propFilter.status !== 'Semua') {
      processedData = processedData.filter(item => item.status === propFilter.status);
    }
    if (propFilter.type !== 'Semua') {
      processedData = processedData.filter(item => item.type === propFilter.type);
    }
    if (propFilter.maxPrice) {
      processedData = processedData.filter(item => Number(item.price || 0) <= Number(propFilter.maxPrice));
    }
  }

  const currentData = processedData;

  const renderCard = (item, category) => {
    const hasVariants = category === 'Ecommerce' && typeof item.variants === 'string' && item.variants.length > 5;
    const isEcoMode = isolatedModule === 'Ecommerce' || category === 'Ecommerce';

    return (
      <div key={item.id} style={{ backgroundColor: 'white', borderRadius: isEcoMode ? '12px' : '16px', overflow: 'hidden', boxShadow: isEcoMode ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.3s ease-in-out', position: 'relative', border: isEcoMode ? '1px solid #e2e8f0' : '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = isEcoMode ? '0 12px 20px rgba(0,0,0,0.1)' : '0 20px 25px -5px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isEcoMode ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 6px -1px rgba(0,0,0,0.05)'; }}>
        <button
          onClick={(e) => handleToggleWishlist(item, e)}
          style={{ position: 'absolute', top: 10, right: 10, background: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 2, color: wishlistIds.includes(item.id) ? 'red' : '#ccc' }}
        >
          ♥
        </button>
        <div onClick={() => setSelectedItem(item)} style={{ width: '100%', aspectRatio: isEcoMode ? '1/1' : 'auto', height: isEcoMode ? 'auto' : '180px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
          <ImageWithFallback src={item.image} category={category} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          {category === 'Ecommerce' && item.condition === 'Bekas' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, background: '#8b5cf6', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderTopRightRadius: '8px', fontWeight: 'bold' }}>Pre-Loved</div>
          )}
        </div>
        <div style={{ padding: isEcoMode ? '12px' : '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: isEcoMode ? '0.95rem' : '1.05rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#1e293b', fontWeight: isEcoMode ? 'normal' : '700' }}>{item.name}</h4>
          <div style={{ marginTop: 'auto', marginBottom: isEcoMode ? '6px' : '15px' }}>
            {category === 'Ecommerce' && item.discount_price ? (
              <div>
                <div style={{ fontWeight: '800', color: '#ec4899', fontSize: '1.15rem' }}>{item.discount_price}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ background: '#fdf2f8', color: '#ec4899', padding: '1px 4px', fontSize: '0.65rem', borderRadius: '4px', fontWeight: 'bold' }}>Promo</span>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.75rem' }}>{item.price}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontWeight: '800', color: isEcoMode ? '#4f46e5' : '#2ecc71', fontSize: '1.15rem' }}>{item.price}</div>
            )}
            {/* ✨ Tampilan Harga Khusus Properti */}
            {category === 'Properti' && (
                <div style={{ fontWeight: '800', color: '#3b82f6', fontSize: '1.15rem' }}>
                    Rp {Number(item.price || 0).toLocaleString('id-ID')}
                </div>
            )}
          </div>
          {/* ✨ Tampilan Spek Singkat Properti */}
          {category === 'Properti' && (
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#64748b', margin: '8px 0' }}>
                <span>🛏️ {item.bedrooms}</span>
                <span>🛁 {item.bathrooms}</span>
                <span>↔️ {item.land_size}m²</span>
            </div>
          )}
          {/* ✨ TOMBOL BANDINGKAN (COMPARE) */}
          {category === 'Properti' && (
             <button onClick={(e) => {
                 e.stopPropagation();
                 if(compareList.find(c => c.id === item.id)) {
                     setCompareList(compareList.filter(c => c.id !== item.id));
                 } else {
                     if(compareList.length >= 3) return toast.warn("Maksimal membandingkan 3 properti!");
                     setCompareList([...compareList, item]);
                     toast.success("Masuk daftar perbandingan!");
                 }
             }} style={{ marginBottom: '12px', background: compareList.find(c => c.id === item.id) ? '#fef2f2' : '#f8fafc', color: compareList.find(c => c.id === item.id) ? '#ef4444' : '#475569', border: `1px solid ${compareList.find(c => c.id === item.id) ? '#fecaca' : '#e2e8f0'}`, padding: '6px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                 {compareList.find(c => c.id === item.id) ? '❌ Batal Bandingkan' : '⚖️ Bandingkan'}
             </button>
          )}
          {isEcoMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#16a34a', fontWeight: '600' }}>
                <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>Bebas Ongkir</span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>{item.category || item.categoryTag || item.cuisine || 'Umum'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                <span>⭐ 4.{item.id % 9 + 1}</span> <span>|</span> <span>{10 + (item.id % 500)} Terjual</span> <span>|</span> <span>Jkt Sel</span>
              </div>
            </div>
          )}
      {!isEcoMode && category === 'Restoran' && (
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
              🏬 Tenant: {item.cuisine || 'Umum'}
          </div>
      )}
          {!isEcoMode && item.stock !== undefined && (
            <div style={{ fontSize: '0.8rem', color: item.stock > 0 ? '#27ae60' : '#e74c3c', marginBottom: '10px', fontWeight: 'bold' }}>
              {item.stock > 0 ? `Stok: ${item.stock}` : 'Stok Habis'}
            </div>
          )}
          <button
            onClick={() => handleAction(item, category)}
            disabled={item.stock === 0}
            style={{
              width: '100%', padding: isEcoMode ? '8px' : '10px', border: isEcoMode ? '1px solid #4f46e5' : 'none', borderRadius: isEcoMode ? '6px' : '10px',
              backgroundColor: item.stock === 0 ? '#cbd5e1' : (isEcoMode ? 'white' : (category === 'Hotel' ? '#3b82f6' : '#ef4444')),
              color: item.stock === 0 ? 'white' : (isEcoMode ? '#4f46e5' : 'white'), fontWeight: 'bold', fontSize: isEcoMode ? '0.85rem' : '1rem', cursor: item.stock === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (!isEcoMode && item.stock > 0) ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={e => { if (item.stock > 0 && isEcoMode) { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.color = 'white'; } }}
            onMouseLeave={e => { if (item.stock > 0 && isEcoMode) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#4f46e5'; } }}
          >
            {item.stock === 0 ? 'Habis' : (category === 'Hotel' ? 'Booking' : (category === 'Properti' ? 'Lihat Detail' : (hasVariants ? 'Pilih Varian' : (isEcoMode ? 'Tambah Keranjang' : 'Beli'))))}
          </button>
        </div>
      </div>
    )
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* --- HEADER KONSUMEN --- */}
      <header style={isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood' ? {
        background: isolatedModule === 'Ecommerce' ? 'linear-gradient(to right, #4f46e5, #7c3aed)' : 'linear-gradient(to right, #e11d48, #be123c)', padding: '12px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: isolatedModule === 'Ecommerce' ? '0 4px 15px rgba(124, 58, 237, 0.2)' : '0 4px 15px rgba(225, 29, 72, 0.2)'
      } : {
        backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '15px 20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { setPage('shop'); setActiveFnbTenant(null); }}>
          <div style={{ width: '38px', height: '38px', background: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'white' : 'linear-gradient(135deg, #e74c3c, #c0392b)', color: isolatedModule === 'Ecommerce' ? '#4f46e5' : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '#e11d48' : 'white'), borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>{isolatedModule === 'Ecommerce' ? '🛍️' : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '🍔' : 'S')}</div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'white' : '#2c3e50', fontWeight: '900', letterSpacing: '0.5px', textShadow: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>{isolatedModule === 'Ecommerce' ? 'SuperMarket' : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'Food Court' : 'Superapp')}</h2>
        </div>

        {/* SEARCH BAR BARU */}
        <div style={{ flex: 1, margin: '0 30px', maxWidth: isolatedModule === 'Ecommerce' ? '700px' : '500px', position: 'relative' }}>
          <input
            type="text"
            placeholder={isolatedModule === 'Ecommerce' ? "Cari barang impianmu di sini..." : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? "Cari nama menu atau tenant cafe..." : `Cari di ${categories.find(c => c.id === activeCategory)?.label || 'sini'}...`)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '12px' : '30px', border: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'none' : '1px solid #e2e8f0', backgroundColor: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'white' : '#f8fafc', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '0 2px 6px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.95rem' }}
            onFocus={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.boxShadow = (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '0 0 0 3px rgba(255,255,255,0.3)' : '0 0 0 3px rgba(79, 70, 229, 0.1)'; }}
            onBlur={e => { e.currentTarget.style.backgroundColor = (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'white' : '#f8fafc'; e.currentTarget.style.boxShadow = (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
          />
          {(isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') && <button style={{ position: 'absolute', right: '5px', top: '5px', bottom: '5px', background: isolatedModule === 'Ecommerce' ? '#3730a3' : '#be123c', border: 'none', borderRadius: '8px', color: 'white', padding: '0 24px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>Cari</button>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* TOMBOL KERANJANG MODERN */}
          <div style={{ position: 'relative', cursor: 'pointer', background: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran') ? 'transparent' : '#f8fafc', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran') ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s' }} onClick={() => setShowCartModal(true)} onMouseEnter={e => { if (!isolatedModule) e.currentTarget.style.background = '#f1f5f9'; }} onMouseLeave={e => { if (!isolatedModule) e.currentTarget.style.background = '#f8fafc'; }}>
            <span style={{ fontSize: '1.6rem', color: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran') ? 'white' : 'inherit' }}>🛒</span>
            {cart.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, background: (isolatedModule === 'Ecommerce' || isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? 'white' : '#ef4444', color: isolatedModule === 'Ecommerce' ? '#4f46e5' : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '#e11d48' : 'white'), fontSize: '0.75rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', border: isolatedModule === 'Ecommerce' ? '2px solid #7c3aed' : ((isolatedModule === 'Restoran' || isolatedModule === 'MallFood') ? '2px solid #be123c' : '2px solid white') }}>{cart.length}</span>}
          </div>

          {/* DROPDOWN MENU PROFIL MODERN */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: isolatedModule === 'Ecommerce' ? 'transparent' : '#f8fafc', padding: '6px 16px', borderRadius: '30px', border: isolatedModule === 'Ecommerce' ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s' }}>
              <img src={user?.image || 'https://via.placeholder.com/30'} alt="user" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: isolatedModule === 'Ecommerce' ? '2px solid white' : 'none' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: isolatedModule === 'Ecommerce' ? 'white' : '#1e293b' }}>{user?.username}</span>
              <span style={{ fontSize: '0.8rem', color: isolatedModule === 'Ecommerce' ? 'rgba(255,255,255,0.8)' : '#64748b' }}>▼</span>
            </div>

            {showProfileMenu && (
              <div style={{ position: 'absolute', top: '50px', right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '230px', overflow: 'hidden', zIndex: 200, animation: 'fadeUp 0.2s ease-out' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center' }}>
                  <img src={user?.image || 'https://via.placeholder.com/50'} alt="user" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
                  <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem' }}>{user?.username}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user?.email || 'customer@superapp.com'}</div>
                </div>
                <button onClick={() => { setPage('shop'); setShowProfileMenu(false); }} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#334155', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <span>🏠</span> Beranda Utama
                </button>
                <button onClick={() => { setPage('history'); setShowProfileMenu(false); }} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#334155', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <span>📜</span> Riwayat Pesanan
                </button>
                <button onClick={() => { setPage('wishlist'); setShowProfileMenu(false); }} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#334155', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <span>❤️</span> Wishlist Saya
                </button>
                {onBackToAdmin && (
                  <button onClick={onBackToAdmin} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#0284c7', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <span>🔙</span> Kembali ke Admin
                  </button>
                )}
                {onLogout && (
                  <button onClick={onLogout} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fecaca'} onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                    <span>🚪</span> Keluar (Logout)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- KONTEN DINAMIS (SHOP atau HISTORY) --- */}
      {page === 'shop' ? (
        <>
          {/* BANNERS / HERO SECTION */}
          {isolatedModule === 'Ecommerce' ? (
            <div style={{ background: 'white', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
              {/* Carousel Banner E-commerce */}
              <div style={{ padding: '20px 5%', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 600px', height: '280px', borderRadius: '16px', overflow: 'hidden', position: 'relative', backgroundImage: `url(${ecoBanners[currentBanner].bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(30, 27, 75, 0.9) 0%, rgba(49, 46, 129, 0.6) 60%, rgba(79, 70, 229, 0.1) 100%)' }}></div>
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '40px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '2.5rem', margin: '0 0 10px', fontWeight: '900', textShadow: '0 4px 6px rgba(0,0,0,0.8)', lineHeight: '1.2', maxWidth: '75%' }}>{ecoBanners[currentBanner].title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.1rem', margin: 0, maxWidth: '65%', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{ecoBanners[currentBanner].subtitle}</p>
                  </div>
                </div>
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '16px', padding: '20px 25px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #bfdbfe', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎟️</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px', color: '#1e40af', fontSize: '1.2rem', fontWeight: '800' }}>Gratis Ongkir</h4>
                      <p style={{ margin: 0, color: '#2563eb', fontSize: '0.9rem' }}>Klaim kupon tiap jam 12</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '16px', padding: '20px 25px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #ddd6fe', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⚡</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px', color: '#5b21b6', fontSize: '1.2rem', fontWeight: '800' }}>Cashback Extra</h4>
                      <p style={{ margin: 0, color: '#7c3aed', fontSize: '0.9rem' }}>S/d 100Rb Pengguna Baru</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Menu Icons E-commerce */}
              <div style={{ padding: '25px 5%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px 45px', maxWidth: '1100px', margin: '0 auto' }}>
                {ecoQuickMenus.map(menu => {
                  const isActive = searchTerm.toLowerCase() === menu.label.toLowerCase();
                  return (
                    <div key={menu.id} onClick={() => {
                      setSearchTerm(isActive ? '' : menu.label);
                      setTimeout(() => {
                        document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '85px' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: isActive ? menu.color : menu.bg, color: isActive ? 'white' : menu.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: `1px solid ${menu.color}40`, boxShadow: isActive ? `0 8px 15px ${menu.color}40` : `0 4px 10px ${menu.color}20`, transition: 'all 0.3s' }}>
                        {menu.icon}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: isActive ? '#4f46e5' : '#334155', fontWeight: '600', textAlign: 'center', lineHeight: '1.2', transition: 'color 0.3s' }}>{menu.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* ✨ EXTRA FILLER: Banner Strip Penawaran Spesial (Bank & Partner) */}
              <div style={{ padding: '0 5%', margin: '15px auto 30px', maxWidth: '1400px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💳</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px', color: '#3730a3', fontSize: '1.1rem', fontWeight: '800' }}>Diskon Bank BCA</h4>
                      <p style={{ margin: 0, color: '#4338ca', fontSize: '0.9rem', fontWeight: '600' }}>Potongan s/d Rp 150.000</p>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>📦</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px', color: '#9d174d', fontSize: '1.1rem', fontWeight: '800' }}>Gratis Ongkir Extra</h4>
                      <p style={{ margin: 0, color: '#be185d', fontSize: '0.9rem', fontWeight: '600' }}>Minimal Belanja Rp 30.000</p>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🛡️</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px', color: '#0369a1', fontSize: '1.1rem', fontWeight: '800' }}>Garansi 100% Ori</h4>
                      <p style={{ margin: 0, color: '#0284c7', fontSize: '0.9rem', fontWeight: '600' }}>Uang Kembali Jika Palsu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        ) : isolatedModule === 'MallFood' ? (
          <div style={{ background: 'white', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
             <div style={{ position: 'relative', background: 'url(https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80) center/cover', padding: '60px 5%', textAlign: 'center', color: 'white' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20, 20, 20, 0.9) 0%, rgba(20, 20, 20, 0.4) 100%)' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 15px', fontWeight: '900', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Food Court & Cafe</h2>
                    <p style={{ fontSize: '1.2rem', margin: '0 auto 30px', maxWidth: '600px', opacity: 0.9, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Pesan dari tenant favorit Anda tanpa perlu antri panjang.</p>
                </div>
             </div>
             
             {activeFnbTenant ? (
                <div style={{ padding: '30px 5% 20px' }}>
                    <button onClick={() => setActiveFnbTenant(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>&larr; Kembali ke Daftar Tenant</button>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.8rem', color: '#1e293b' }}>Katalog Menu: {activeFnbTenant.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                        {fnbMenus.filter(m => m.cuisine === activeFnbTenant.name).map(item => renderCard(item, 'MallFood'))}
                        {fnbMenus.filter(m => m.cuisine === activeFnbTenant.name).length === 0 && <p style={{ color: '#94a3b8' }}>Tenant ini belum menambahkan menu.</p>}
                    </div>
                </div>
             ) : (
                 <div style={{ padding: '30px 5% 20px' }}>
                   <h3 style={{ margin: '0 0 20px', fontSize: '1.4rem', color: '#1e293b', fontWeight: '800' }}>🏪 Pilih Tenant Pilihan Anda</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                      {fnbTenants.map(t => {
                         return (
                           <div key={t.id} onClick={() => setActiveFnbTenant(t)} style={{ background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                              <div style={{ height: '120px', backgroundImage: `url(${t.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                              <div style={{ padding: '15px' }}>
                                  <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.2rem', marginBottom: '5px' }}>{t.name}</div>
                                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t.category} di {t.floor}</div>
                              </div>
                           </div>
                         )
                      })}
                   </div>
                 </div>
             )}
          </div>
        ) : isolatedModule === 'Restoran' ? (
          <div style={{ background: 'white', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
             {/* ✨ HERO BANNER BARU UNTUK RESTORAN (AUTO SLIDE) */}
             <div style={{ position: 'relative', padding: '60px 5%', textAlign: 'center', color: 'white', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Gambar Slide Berlapis */}
                {restoBanners.map((banner, idx) => (
                    <div key={banner.id} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: idx === (currentBanner % restoBanners.length) ? 1 : 0, transition: 'opacity 1s ease-in-out', zIndex: 0 }}></div>
                ))}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.3) 100%)', zIndex: 1 }}></div>
                
                {/* Indikator Titik Slider */}
                <div style={{ position: 'absolute', bottom: '25px', left: 0, right: 0, zIndex: 3, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {restoBanners.map((_, idx) => (
                        <div key={idx} onClick={() => setCurrentBanner(idx)} style={{ width: idx === (currentBanner % restoBanners.length) ? '28px' : '10px', height: '10px', borderRadius: '5px', background: 'white', opacity: idx === (currentBanner % restoBanners.length) ? 1 : 0.5, transition: 'all 0.4s ease', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}></div>
                    ))}
                </div>

                <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 15px', fontWeight: '900', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Pesan Makanan Favorit Anda</h2>
                    <p style={{ fontSize: '1.2rem', margin: '0 auto 30px', maxWidth: '600px', opacity: 0.9, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Jelajahi berbagai menu dari tenant terbaik kami, pesan langsung dari meja Anda tanpa perlu antri.</p>
                    <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Cari nama menu atau tenant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '18px 25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: 'white', fontSize: '1.1rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                        />
                        <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', opacity: 0.5 }}>🔍</span>
                    </div>
                </div>
             </div>
             
             {/* ✨ KARTU TENANT BARU YANG LEBIH VISUAL */}
             <div style={{ padding: '30px 5% 20px' }}>
               <h3 style={{ margin: '0 0 20px', fontSize: '1.4rem', color: '#1e293b', fontWeight: '800' }}>🏪 Pilih Tenant / Resto</h3>
               <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
                  <div onClick={() => setSearchTerm('')} style={{ flex: '0 0 150px', height: '100px', background: !searchTerm ? '#fff1f2' : '#f8fafc', border: `2px solid ${!searchTerm ? '#e11d48' : '#e2e8f0'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: !searchTerm ? '0 4px 10px rgba(225, 29, 72, 0.1)' : 'none' }}>
                      <div style={{ fontSize: '2rem' }}>🍽️</div>
                      <div style={{ fontWeight: 'bold', color: !searchTerm ? '#e11d48' : '#475569', fontSize: '0.9rem' }}>Semua Menu</div>
                  </div>
                  {restoTenants.map(t => {
                     const isActive = searchTerm.toLowerCase() === t.toLowerCase();
                     const iconMap = { 'Kopi': '☕', 'Jepang': '🍣', 'Barat': '🍕', 'Indonesia': '🍛' };
                     return (
                       <div key={t} onClick={() => setSearchTerm(isActive ? '' : t)} style={{ flex: '0 0 150px', height: '100px', background: isActive ? '#fff1f2' : '#f8fafc', border: `2px solid ${isActive ? '#e11d48' : '#e2e8f0'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 4px 10px rgba(225, 29, 72, 0.1)' : 'none' }}>
                          <div style={{ fontSize: '2rem' }}>{iconMap[t] || '🍴'}</div>
                          <div style={{ fontWeight: 'bold', color: isActive ? '#e11d48' : '#475569', fontSize: '0.9rem' }}>{t}</div>
                       </div>
                     )
                  })}
               </div>
             </div>
          </div>
          ) : (
            <div className="hero-section" style={{ position: 'relative', background: banners[currentBanner].color, backgroundImage: banners[currentBanner].bgImage ? `url(${banners[currentBanner].bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '0 0 32px 32px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: banners[currentBanner].bgImage ? banners[currentBanner].color : 'transparent' }}></div>
              <div className="hero-content" style={{ position: 'relative', zIndex: 1, padding: '40px 5%', textAlign: 'left', maxWidth: '800px' }}>
                <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)', marginBottom: '10px', lineHeight: 1.2 }}>{banners[currentBanner].title}</h1>
                <p className="hero-subtitle" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 5px rgba(0,0,0,0.3)', maxWidth: '600px' }}>{banners[currentBanner].subtitle}</p>
              </div>
              <div className="hero-dots" style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', zIndex: 2 }}>
                {banners.map((_, idx) => (
                  <div key={idx} className={`hero-dot ${idx === currentBanner ? 'active' : ''}`} onClick={() => setCurrentBanner(idx)}></div>
                ))}
              </div>
            </div>
          )}

          {/* --- MENU KATEGORI (Seperti Gojek/Grab) --- */}
          {!isolatedModule && (
            <div className="category-nav">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat.id); setSearchTerm(''); }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* ✨ SECTION FLASH SALE (SHOPEE STYLE) */}
          {activeCategory === 'Ecommerce' && flashSaleItems.length > 0 && (
            <div style={{ padding: '0 5%', margin: '40px 0', animation: 'fadeUp 0.5s ease' }}>
              <div style={{ background: 'linear-gradient(to right, #1e1b4b, #312e81)', borderRadius: '20px', padding: '25px', color: 'white', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.4)' }}>

                {/* Header Flash Sale */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontStyle: 'italic', fontWeight: '900', textShadow: '2px 2px 0px rgba(0,0,0,0.2)', letterSpacing: '1px' }}>⚡ FLASH SALE</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px 12px', borderRadius: '20px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Berakhir dalam:</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ background: '#1e293b', color: 'white', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1rem' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>:</span>
                        <span style={{ background: '#1e293b', color: 'white', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1rem' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>:</span>
                        <span style={{ background: '#1e293b', color: 'white', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1rem' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                  <button style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#312e81' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'white' }}>Lihat Semua &rarr;</button>
                </div>

                {/* List Produk Flash Sale */}
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                  {flashSaleItems.map(item => {
                    const normalPrice = parseInt(String(item.price).replace(/\D/g, '')) || 1;
                    const discPrice = parseInt(String(item.discount_price).replace(/\D/g, '')) || 0;
                    const percentOff = Math.round(((normalPrice - discPrice) / normalPrice) * 100);
                    // Simulasi progress bar
                    const soldPercent = (item.id % 40) + 50;

                    return (
                      <div key={`flash-${item.id}`} style={{ minWidth: '180px', width: '180px', background: 'white', borderRadius: '12px', overflow: 'hidden', color: '#1e293b', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, background: '#ec4899', color: 'white', padding: '4px 8px', fontSize: '0.8rem', fontWeight: '900', borderBottomLeftRadius: '8px', zIndex: 2 }}>{percentOff}% OFF</div>
                        <div onClick={() => setSelectedItem(item)} style={{ width: '100%', aspectRatio: '1/1', background: '#f1f5f9', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                          <ImageWithFallback src={item.image} category="Ecommerce" alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '15px' }}>
                          <div style={{ color: '#ec4899', fontWeight: '900', fontSize: '1.3rem', marginBottom: '2px' }}>{item.discount_price}</div>
                          <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '12px' }}>{item.price}</div>
                          <div style={{ background: '#fca5a5', borderRadius: '10px', height: '16px', width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)', width: `${soldPercent}%` }}></div>
                            <span style={{ position: 'relative', zIndex: 1, fontSize: '0.65rem', color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Segera Habis</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ✨ EXTRA FILLER: Pencarian Populer (Trending Searches) */}
          {activeCategory === 'Ecommerce' && isolatedModule === 'Ecommerce' && (
            <div style={{ padding: '0 5%', marginBottom: '30px', animation: 'fadeUp 0.6s ease' }}>
              <h3 style={{ margin: '0 0 15px', fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>🔥 Pencarian Populer</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Sepatu Sneakers', icon: '👟' },
                  { name: 'Kemeja Pria', icon: '👔' },
                  { name: 'Smart TV', icon: '📺' },
                  { name: 'Skincare', icon: '✨' },
                  { name: 'Tas Selempang', icon: '👜' },
                  { name: 'Headset TWS', icon: '🎧' },
                  { name: 'Jam Tangan Pintar', icon: '⌚' },
                  { name: 'Kaos Polos', icon: '👕' }
                ].map(trend => {
                  const isActive = searchTerm.toLowerCase() === trend.name.toLowerCase();
                  return (
                    <button key={trend.name} onClick={() => {
                      setSearchTerm(isActive ? '' : trend.name);
                      setTimeout(() => {
                        document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }} style={{ background: isActive ? '#eef2ff' : 'white', border: `1px solid ${isActive ? '#4f46e5' : '#e2e8f0'}`, padding: '8px 18px', borderRadius: '30px', fontSize: '0.95rem', color: isActive ? '#4f46e5' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }} onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? '#4f46e5' : '#e2e8f0'; e.currentTarget.style.color = isActive ? '#4f46e5' : '#475569' }}>
                      <span style={{ fontSize: '1.2rem', filter: isActive ? 'none' : 'grayscale(0.5)' }}>{trend.icon}</span> {trend.name} {isActive && <span style={{ color: '#4f46e5', fontSize: '1rem', marginLeft: '4px' }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ✨ BANNER TITIP PROPERTI KHUSUS KATEGORI PROPERTI */}
          {activeCategory === 'Properti' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', marginBottom: '25px', animation: 'fadeUp 0.6s ease' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: 'white', padding: '20px 30px', borderRadius: '16px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                  <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: '900' }}>Punya Aset Menganggur?</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Titip jual atau sewakan properti Anda dan jangkau ribuan calon pembeli potensial.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={openOwnerDashboard} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          📊 Kinerja Aset Saya
                      </button>
                      <button onClick={() => setShowSubmitPropertyModal(true)} style={{ background: 'white', color: '#3b82f6', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                          + Titip Properti
                      </button>
                  </div>
              </div>
            </div>
          )}

          {/* --- KONTEN UTAMA (GRID CARD) --- */}
          <div id="product-section" style={{ scrollMarginTop: '100px' }}>
            <div style={{ padding: '0 5%', margin: isolatedModule === 'Ecommerce' ? '0 0 20px 0' : '0 0 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {categories.find(c => c.id === activeCategory)?.label || 'Produk'} Pilihan
              </h3>
              <span style={{ color: '#64748b', fontSize: '0.9rem', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px' }}>{currentData.length} item ditemukan</span>
            </div>

            {/* ✨ FILTER & SORTING (SHOPEE STYLE) */}
            {activeCategory === 'Ecommerce' && (
              <div style={{ display: 'flex', gap: '15px', padding: '0 5%', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
                {isolatedModule === 'Ecommerce' && <div style={{ background: '#4f46e5', color: 'white', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', marginRight: '10px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}>Rekomendasi Untukmu</div>}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 20px', borderRadius: isolatedModule === 'Ecommerce' ? '8px' : '30px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <option value="default">Urutkan: Relevansi</option>
                  <option value="lowest">Harga Terendah</option>
                  <option value="highest">Harga Tertinggi</option>
                </select>
                <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} style={{ padding: '10px 20px', borderRadius: isolatedModule === 'Ecommerce' ? '8px' : '30px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                  <option value="Semua">Kondisi: Semua</option>
                  <option value="Baru">Kondisi: Baru</option>
                  <option value="Bekas">Kondisi: Bekas (Pre-Loved)</option>
                </select>
              </div>
            )}

            {/* ✨ SMART FILTER PROPERTI */}
            {activeCategory === 'Properti' && (
              <div style={{ display: 'flex', gap: '15px', padding: '0 5%', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', animation: 'fadeUp 0.6s ease' }}>
                <input type="text" placeholder="Cari nama properti, deskripsi, lokasi..." value={propFilter.search} onChange={e => setPropFilter({...propFilter, search: e.target.value})} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', minWidth: '250px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
                <select value={propFilter.status} onChange={e => setPropFilter({...propFilter, status: e.target.value})} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <option value="Semua">Semua Status</option><option value="Jual">Dijual</option><option value="Sewa">Disewakan</option>
                </select>
                <select value={propFilter.type} onChange={e => setPropFilter({...propFilter, type: e.target.value})} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <option value="Semua">Semua Tipe</option><option value="Rumah">Rumah</option><option value="Apartemen">Apartemen</option><option value="Ruko">Ruko</option><option value="Tanah">Tanah</option>
                </select>
                <input type="number" placeholder="Batas Harga (Rp)..." value={propFilter.maxPrice} onChange={e => setPropFilter({...propFilter, maxPrice: e.target.value})} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#475569', fontWeight: '500', minWidth: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
                
                {compareList.length > 0 && (
                  <button onClick={() => setShowCompareModal(true)} style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                    ⚖️ Bandingkan ({compareList.length}/3)
                  </button>
                )}
              </div>
            )}

            {currentData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                <p>Belum ada data untuk kategori ini.</p>
                <small>Silakan minta Admin menambah data di Back Office.</small>
              </div>
            ) : isolatedModule === 'Restoran' ? (
                // ✨ RENDER BARU DENGAN GROUPING PER TENANT
                <div style={{ padding: '0 5%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {restoTenants.filter(t => searchTerm ? t.toLowerCase().includes(searchTerm.toLowerCase()) : true).map(tenant => {
                        const tenantItems = currentData.filter(item => (item.cuisine || 'Umum') === tenant);
                        if (tenantItems.length === 0) return null;
                        return (
                            <div key={tenant}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                                    {tenant}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                                    {tenantItems.map(item => renderCard(item, activeCategory))}
                                </div>
                            </div>
                        )
                    })}
                    {/* Handle jika hasil search tidak cocok dengan tenant manapun */}
                    {restoTenants.filter(t => searchTerm ? t.toLowerCase().includes(searchTerm.toLowerCase()) : true).length === 0 && currentData.length > 0 && (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                            {currentData.map(item => renderCard(item, activeCategory))}
                        </div>
                    )}
                </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: (isolatedModule === 'Ecommerce' || activeCategory === 'Ecommerce') ? 'repeat(auto-fill, minmax(190px, 1fr))' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: (isolatedModule === 'Ecommerce' || activeCategory === 'Ecommerce') ? '15px' : '25px', padding: '0 5%' }}>
                {currentData.map(item => renderCard(item, activeCategory))}
              </div>
            )}
          </div>
        </>
      ) : page === 'history' ? (
        <OrderHistory onBack={() => setPage('shop')} />
      ) : (
        // --- HALAMAN WISHLIST ---
        <div style={{ padding: '40px 5%', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <button onClick={() => setPage('shop')} style={{ background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>&larr;</button>
            <h2 style={{ margin: 0 }}>Wishlist Saya ({wishlistItems.length})</h2>
          </div>
          {wishlistItems.length === 0 ? <p>Wishlist kosong.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: (isolatedModule === 'Ecommerce' || activeCategory === 'Ecommerce') ? 'repeat(auto-fill, minmax(190px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: (isolatedModule === 'Ecommerce' || activeCategory === 'Ecommerce') ? '15px' : '25px' }}>
              {wishlistItems.map(item => renderCard(item, item.service))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER MODERN UNTUK KONSUMEN */}
      <footer style={{ background: '#1e293b', color: '#94a3b8', padding: '60px 5% 40px', marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 15px', fontSize: '1.5rem', fontWeight: '800' }}>Superapp</h2>
            <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>Ekosistem aplikasi terintegrasi untuk penuhi segala kebutuhan gaya hidup, belanja, dan hunian Anda dalam satu genggaman.</p>
          </div>
          <div>
            <h3 style={{ color: 'white', margin: '0 0 15px', fontSize: '1.1rem' }}>Layanan Utama</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
              <span>🛒 SuperMarket (E-Commerce)</span>
              <span>🍔 SuperResto (Kuliner)</span>
              <span>🏨 SuperHotel (Akomodasi)</span>
              <span>🏠 SuperProperty (Real Estate)</span>
            </div>
          </div>
          <div>
            <h3 style={{ color: 'white', margin: '0 0 15px', fontSize: '1.1rem' }}>Bantuan & Dukungan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
              <span>Pusat Bantuan (FAQ)</span>
              <span>Syarat & Ketentuan</span>
              <span>Kebijakan Privasi</span>
              <span>Hubungi Kami</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #334155', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Superapp Ecosystem. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </footer>

      {/* --- MODAL KERANJANG BELANJA --- */}
      {showCartModal && (
        // ✨ ISOLASI KERANJANG BERDASARKAN SERVICE
        (() => {
          const ecoItems = cart.filter(i => i.service === 'Ecommerce');
          const restoItems = cart.filter(i => i.service === 'Restoran');

          const ecoSubtotal = calculateTotal(ecoItems);
          const ecoWeight = ecoItems.reduce((acc, item) => acc + ((item.weight || 0) * item.qty), 0);
          const ecoOngkir = selectedShippingService ? selectedShippingService.cost : 0;

          let ecoDiscount = 0;
          if (ecoAppliedVoucher) {
            ecoDiscount = ecoAppliedVoucher.type === 'percent' ? ecoSubtotal * (ecoAppliedVoucher.value / 100) : ecoAppliedVoucher.value;
            ecoDiscount = Math.min(ecoSubtotal, ecoDiscount); // Mencegah diskon lebih besar dari harga
          }
          const finalEcoTotal = ecoSubtotal - ecoDiscount + ecoOngkir;

          let finalAddressStr = '';
          if (selectedAddressId === 'NEW') finalAddressStr = `${newAddressForm.label} - ${newAddressForm.city}, ${newAddressForm.detail}`;
          else {
            const ad = savedAddresses.find(a => a.id === selectedAddressId);
            if (ad) finalAddressStr = `${ad.label} - ${ad.city}, ${ad.detail}`;
          }

          const restoSubtotal = calculateTotal(restoItems);
          const mallFoodSubtotal = calculateTotal(mallFoodItems);

          return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>🛒 Keranjang Terpadu</h2>
                  <button onClick={() => setShowCartModal(false)} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.2rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', color: '#64748b' }}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                  {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Keranjang masih kosong.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      {/* SEKSI E-COMMERCE */}
                      {ecoItems.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 15px', color: '#4f46e5', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📦</span> SuperMarket (E-Commerce)</h3>
                          {ecoItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.95rem' }}>{item.name} {item.variantName ? `(${item.variantName})` : ''}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.price} x {item.qty}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Berat: {(item.weight || 0) * item.qty}g</div>
                              </div>
                              <button onClick={() => setCart(cart.filter(i => i !== item))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>&times;</button>
                            </div>
                          ))}

                          <div style={{ marginTop: '15px', background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#b45309' }}>Alamat Tujuan (Buku Alamat)</label>
                            <select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d', marginBottom: '10px', outline: 'none', background: 'white' }}>
                              {savedAddresses.map(a => <option key={a.id} value={a.id}>{a.label} - {a.city}</option>)}
                              <option value="NEW" style={{ fontWeight: 'bold' }}>+ Tambah Alamat Baru</option>
                            </select>

                            {selectedAddressId === 'NEW' && (
                              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fcd34d', display: 'grid', gap: '8px' }}>
                                <input type="text" placeholder="Label (Cth: Kantor/Rumah)" value={newAddressForm.label} onChange={e => setNewAddressForm({ ...newAddressForm, label: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                                <input type="text" placeholder="Kota/Kabupaten" value={newAddressForm.city} onChange={e => setNewAddressForm({ ...newAddressForm, city: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                                <textarea placeholder="Detail Alamat Lengkap" value={newAddressForm.detail} onChange={e => setNewAddressForm({ ...newAddressForm, detail: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box', minHeight: '60px' }} />
                              </div>
                            )}

                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#b45309' }}>Pilih Kurir Pengiriman</label>
                            <select value={ecoShipping.courier} onChange={e => setEcoShipping({ ...ecoShipping, courier: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d', marginBottom: '10px', outline: 'none' }}>
                              <option value="JNT">J&T Express (Standard)</option>
                              <option value="JNE">JNE Reguler (Aman)</option>
                              <option value="SICEPAT">SiCepat (Cepat)</option>
                              <option value="GOSEND">GoSend (Sameday/Instant)</option>
                            </select>

                            {/* Pilihan Service Ongkir (RajaOngkir Style) */}
                            {dynamicShippingOptions.length > 0 && (
                                <div style={{ marginBottom: '15px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>Pilih Layanan</label>
                                    <select value={selectedShippingService?.service} onChange={e => setSelectedShippingService(dynamicShippingOptions.find(s => s.service === e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                        {dynamicShippingOptions.map(opt => <option key={opt.service} value={opt.service}>{opt.service} ({opt.eta}) - Rp {opt.cost.toLocaleString('id-ID')}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* ✨ FORM INPUT VOUCHER */}
                            <div style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
                              <input type="text" placeholder="Punya Kode Kupon?" value={ecoVoucherCode} onChange={e => setEcoVoucherCode(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', textTransform: 'uppercase', outline: 'none' }} />
                              <button type="button" onClick={() => handleApplyEcoVoucher(ecoItems)} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Pakai</button>
                            </div>

                            {ecoAppliedVoucher && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#16a34a', fontSize: '0.9rem', fontWeight: 'bold', background: '#dcfce7', padding: '10px', borderRadius: '8px' }}>
                                <span>Diskon ({ecoAppliedVoucher.code})</span>
                                <span>- Rp {ecoDiscount.toLocaleString('id-ID')}</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem', color: '#92400e' }}>
                              <span>Ongkos Kirim ({Math.max(1, Math.ceil(ecoWeight / 1000))} Kg) <br /><small style={{ color: '#d97706' }}>Estimasi Tiba: {selectedShippingService?.eta || '-'}</small></span>
                              <strong>{isCalculatingOngkir ? 'Menghitung...' : `Rp ${ecoOngkir.toLocaleString('id-ID')}`}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '1.1rem', color: '#b45309', fontWeight: '900', borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>
                              <span>Total Pembayaran</span>
                              <span>Rp {finalEcoTotal.toLocaleString('id-ID')}</span>
                            </div>
                            <button onClick={() => handleCheckoutEcommerce(ecoItems, finalEcoTotal, ecoWeight, ecoOngkir, ecoAppliedVoucher?.code, finalAddressStr)} disabled={isProcessingPayment || isCalculatingOngkir} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '15px', cursor: (isProcessingPayment || isCalculatingOngkir) ? 'wait' : 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>Checkout E-Commerce</button>
                          </div>
                        </div>
                      )}

                      {/* SEKSI RESTORAN */}
                      {restoItems.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 15px', color: '#e11d48', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🍔</span> SuperResto (Kuliner)</h3>
                          {restoItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <div>
                              <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.95rem' }}>{item.name} <span style={{fontSize:'0.75rem', background:'#f1f5f9', padding:'2px 6px', borderRadius:'6px', marginLeft:'5px'}}>{item.cuisine}</span></div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{item.price} x {item.qty}</div>
                              </div>
                              <button onClick={() => setCart(cart.filter(i => i !== item))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>&times;</button>
                            </div>
                          ))}

                          <div style={{ marginTop: '15px', background: '#fff1f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#be123c' }}>Tipe Pesanan</label>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                              <button onClick={() => setRestoOrderType('Takeaway')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: restoOrderType === 'Takeaway' ? '2px solid #e11d48' : '1px solid #fca5a5', background: restoOrderType === 'Takeaway' ? '#e11d48' : 'white', color: restoOrderType === 'Takeaway' ? 'white' : '#be123c', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>🛍️ Ambil Sendiri</button>
                              <button onClick={() => setRestoOrderType('Dine In')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: restoOrderType === 'Dine In' ? '2px solid #e11d48' : '1px solid #fca5a5', background: restoOrderType === 'Dine In' ? '#e11d48' : 'white', color: restoOrderType === 'Dine In' ? 'white' : '#be123c', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>🍽️ Makan di Tempat</button>
                          </div>

                          {restoOrderType === 'Dine In' && (
                              <>
                                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#be123c' }}>Nomor Meja</label>
                                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Contoh: 12" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box', outline: 'none' }} />
                              </>
                          )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '1.1rem', color: '#be123c', fontWeight: '900', borderTop: '1px dashed #fecaca', paddingTop: '10px' }}>
                              <span>Total Pesanan</span>
                              <span>Rp {restoSubtotal.toLocaleString('id-ID')}</span>
                            </div>
                          <button onClick={() => handleCheckoutRestoran(restoItems)} disabled={isProcessingPayment} style={{ width: '100%', padding: '12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '15px', cursor: isProcessingPayment ? 'wait' : 'pointer', boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)' }}>{isProcessingPayment ? 'Memproses...' : 'Pesan & Bayar (Tanpa Antri)'}</button>
                          </div>
                        </div>
                      )}

                      {/* SEKSI MALL FOOD COURT */}
                      {mallFoodItems.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 15px', color: '#e11d48', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🍔</span> Pesanan Tenant Mall</h3>
                          {mallFoodItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <div>
                              <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.95rem' }}>{item.name} <span style={{fontSize:'0.75rem', background:'#f1f5f9', padding:'2px 6px', borderRadius:'6px', marginLeft:'5px'}}>{item.cuisine}</span></div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{item.price} x {item.qty}</div>
                              </div>
                              <button onClick={() => setCart(cart.filter(i => i !== item))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>&times;</button>
                            </div>
                          ))}
                          <div style={{ marginTop: '15px', background: '#fff1f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#be123c' }}>Nomor Meja (Opsional)</label>
                              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Atau biarkan kosong untuk Takeaway" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca', boxSizing: 'border-box', outline: 'none' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '1.1rem', color: '#be123c', fontWeight: '900', borderTop: '1px dashed #fecaca', paddingTop: '10px' }}>
                              <span>Total Pesanan</span>
                              <span>Rp {mallFoodSubtotal.toLocaleString('id-ID')}</span>
                            </div>
                          <button onClick={() => handleCheckoutMallFood(mallFoodItems)} disabled={isProcessingPayment} style={{ width: '100%', padding: '12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '15px', cursor: isProcessingPayment ? 'wait' : 'pointer', boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)' }}>{isProcessingPayment ? 'Memproses...' : 'Pesan & Bayar'}</button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })() // End of IIFE
      )}

      {/* --- MODAL DETAIL ITEM (BARU) --- */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, overflowY: 'auto' }} onClick={() => setSelectedItem(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '500px', overflow: 'hidden', position: 'relative', margin: '20px 0' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10 }}>&times;</button>

            <div style={{ height: '250px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <ImageWithFallback src={selectedItem.image} category={activeCategory} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ padding: '20px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>{selectedItem.name}</h2>
              <div style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
                {renderMeta(selectedItem, activeCategory)}
              </div>

              <div style={{ color: '#666', lineHeight: '1.5', marginBottom: '20px', fontSize: '0.95rem' }}>
                {activeCategory === 'Properti' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                      <div><span style={{color: '#94a3b8', fontSize: '0.8rem', display: 'block'}}>Tipe</span><strong>{selectedItem.type || 'Rumah'} ({selectedItem.status})</strong></div>
                      <div><span style={{color: '#94a3b8', fontSize: '0.8rem', display: 'block'}}>Luas Tanah/Bgn</span><strong>{selectedItem.land_size}m² / {selectedItem.building_size}m²</strong></div>
                      <div><span style={{color: '#94a3b8', fontSize: '0.8rem', display: 'block'}}>Kamar Tidur</span><strong>🛏️ {selectedItem.bedrooms}</strong></div>
                      <div><span style={{color: '#94a3b8', fontSize: '0.8rem', display: 'block'}}>Kamar Mandi</span><strong>🛁 {selectedItem.bathrooms}</strong></div>
                    </div>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Alamat:</p>
                    <p style={{ marginTop: 0 }}>{selectedItem.address}</p>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Deskripsi:</p>
                    <p style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>{selectedItem.description || 'Tidak ada deskripsi.'}</p>
                    {selectedItem.virtual_tour_url && (
                        <a href={selectedItem.virtual_tour_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '8px 15px', background: '#8b5cf6', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '15px' }}>🕶️ Buka Virtual Tour 360°</a>
                    )}
                  </>
                ) : (
                  <p>Deskripsi lengkap produk atau layanan ini belum tersedia. Hubungi penjual untuk informasi lebih lanjut.</p>
                )}
              </div>
              
              {/* ✨ KALKULATOR KPR (KHUSUS PROPERTI DIJUAL) */}
              {activeCategory === 'Properti' && selectedItem.status === 'Jual' && (
                  <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>🧮 Simulasi KPR</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                          <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Uang Muka (DP) %</label>
                              <input type="number" value={kprDp} onChange={e => setKprDp(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Tenor (Tahun)</label>
                              <select value={kprTenor} onChange={e => setKprTenor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                                  <option value="5">5 Tahun</option><option value="10">10 Tahun</option><option value="15">15 Tahun</option><option value="20">20 Tahun</option>
                              </select>
                          </div>
                          <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Suku Bunga (%)</label>
                              <input type="number" step="0.1" value={kprInterest} onChange={e => setKprInterest(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                          </div>
                      </div>
                      <div style={{ background: '#eef2ff', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#4f46e5' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Estimasi Cicilan per Bulan</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: '900' }}>
                              Rp {(() => { const price = Number(selectedItem.price) || 0; const plafon = price - (price * (kprDp / 100)); const r = (kprInterest / 100) / 12; const n = kprTenor * 12; if (r === 0 || n === 0) return 0; const cicilan = (plafon * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1); return Math.round(cicilan).toLocaleString('id-ID'); })()}
                          </div>
                      </div>
                  </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { 
                    if (activeCategory === 'Properti') { setShowPropertyLeadModal(true); }
                    else { handleAction(selectedItem, activeCategory); }
                }} style={{ width: '100%', padding: '12px', backgroundColor: activeCategory === 'Properti' ? '#3b82f6' : '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  {activeCategory === 'Hotel' ? 'Booking Sekarang' : (activeCategory === 'Properti' ? 'Jadwalkan Survei' : 'Tambah ke Keranjang')}
                </button>
                {activeCategory === 'Properti' && user && (
                    <button onClick={() => setShowOfferModal(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                        Ajukan Penawaran
                    </button>
                )}
              </div>

              {/* BAGIAN REVIEW */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px' }}>Ulasan Pengguna</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                  {itemReviews.length === 0 ? <p style={{ color: '#999', fontSize: '0.9rem' }}>Belum ada ulasan.</p> : itemReviews.map(r => (
                    <div key={r.id} style={{ marginBottom: '10px', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{r.username}</strong>
                        <span style={{ color: '#f1c40f' }}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#555' }}>{r.comment}</p>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 10px' }}>Tulis Ulasan</h5>
                  <select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: e.target.value })} style={{ marginBottom: '10px', padding: '5px' }}><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select>
                  <textarea value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} placeholder="Bagaimana produk ini?" style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px' }} />
                  <button onClick={handleSubmitReview} style={{ padding: '8px 15px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Kirim</button>
                </div>
              </div>

            {/* ✨ ADVANCED: Recommendation Engine (Collaborative Filtering Mock) */}
            {activeCategory === 'Ecommerce' && (
              <div style={{ marginTop: '30px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px', color: '#1e293b' }}>✨ Mungkin Anda Suka (Produk Serupa)</h4>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
                  {currentData.filter(i => i.id !== selectedItem.id && (i.category === selectedItem.category || i.categoryTag === selectedItem.categoryTag)).slice(0, 4).map(relItem => (
                    <div key={relItem.id} onClick={() => setSelectedItem(relItem)} style={{ minWidth: '140px', width: '140px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ width: '100%', height: '120px' }}>
                        <ImageWithFallback src={relItem.image} category="Ecommerce" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{relItem.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#ec4899', fontWeight: '900', marginTop: '4px' }}>{relItem.discount_price || relItem.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL TITIP PROPERTI DARI OWNER */}
      {showSubmitPropertyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Titip Jual / Sewa Properti</h3>
              <button onClick={() => setShowSubmitPropertyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitProperty} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Judul Listing</label>
                    <input type="text" required value={submitPropForm.name} onChange={e => setSubmitPropForm({...submitPropForm, name: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="Rumah di Bintaro" /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Harga (Rp)</label>
                    <input type="text" required value={submitPropForm.price} onChange={e => setSubmitPropForm({...submitPropForm, price: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="1.500.000.000" /></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Tipe</label>
                    <select value={submitPropForm.type} onChange={e => setSubmitPropForm({...submitPropForm, type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="Rumah">Rumah</option><option value="Apartemen">Apartemen</option><option value="Ruko">Ruko</option><option value="Tanah">Tanah</option></select></div>
                    <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Status</label>
                    <select value={submitPropForm.status} onChange={e => setSubmitPropForm({...submitPropForm, status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}><option value="Jual">Dijual</option><option value="Sewa">Disewakan</option></select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Kamar</label><input type="number" value={submitPropForm.bedrooms} onChange={e => setSubmitPropForm({...submitPropForm, bedrooms: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>KM</label><input type="number" value={submitPropForm.bathrooms} onChange={e => setSubmitPropForm({...submitPropForm, bathrooms: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>L.Tanah</label><input type="number" value={submitPropForm.land_size} onChange={e => setSubmitPropForm({...submitPropForm, land_size: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>L.Bangun</label><input type="number" value={submitPropForm.building_size} onChange={e => setSubmitPropForm({...submitPropForm, building_size: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} /></div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Alamat Lokasi</label>
                    <textarea required value={submitPropForm.address} onChange={e => setSubmitPropForm({...submitPropForm, address: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', minHeight: '60px' }}></textarea>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Deskripsi Tambahan</label>
                    <textarea value={submitPropForm.description} onChange={e => setSubmitPropForm({...submitPropForm, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', minHeight: '60px' }}></textarea>
                </div>
              <button type="submit" disabled={isSubmittingProp} style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmittingProp ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                {isSubmittingProp ? 'Mengirim Data...' : 'Submit Properti'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL KINERJA ASET PEMILIK (PASSIVE INCOME DASHBOARD) */}
      {showOwnerDashboard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem' }}>📊 Kinerja Aset Saya</h3>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Pantau perkembangan properti yang Anda titipkan.</p>
              </div>
              <button onClick={() => setShowOwnerDashboard(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
                {myProperties.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Belum ada properti yang Anda titipkan.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myProperties.map(p => (
                            <div key={p.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem', marginBottom: '5px' }}>{p.name}</div>
                                    <div style={{ color: '#0284c7', fontWeight: '900' }}>Rp {Number(p.price).toLocaleString('id-ID')} <span style={{fontSize:'0.8rem', color:'#64748b', fontWeight:'normal'}}>({p.status})</span></div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                                    {p.listing_status === 'Rented' && p.total_revenue !== undefined && (
                                    <div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>Rp {Number(p.total_revenue).toLocaleString('id-ID')}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Pendapatan Sewa</div>
                                    </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>{p.total_leads}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Peminat</div>
                                    </div>
                                    <div>
                                        <div style={{ background: p.listing_status === 'Pending' ? '#fef3c7' : (p.listing_status === 'Available' ? '#e0f2fe' : '#dcfce7'), color: p.listing_status === 'Pending' ? '#d97706' : (p.listing_status === 'Available' ? '#0284c7' : '#16a34a'), padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {p.listing_status === 'Pending' ? 'Validasi Admin' : (p.listing_status === 'Available' ? 'Sedang Tayang' : (p.listing_status === 'Sold' ? 'Terjual' : 'Tersewa'))}
                                        </div>
                                        {p.listing_status === 'Rented' && (
                                            <button onClick={() => { setPage('history'); setShowOwnerDashboard(false); setTimeout(() => document.querySelector('.category-pill.active')?.click(), 100); }} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #4ade80', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                                                💰 Cek Pembayaran Sewa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL FORM LEAD (PROPERTI) */}
      {showPropertyLeadModal && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Jadwalkan Survei</h3>
              <button onClick={() => setShowPropertyLeadModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Tinggalkan kontak Anda, Agen kami akan segera menghubungi Anda untuk mengatur waktu survei ke lokasi.</p>
            
            <form onSubmit={handleSubmitPropertyLead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Nama Lengkap</label>
                <input type="text" required value={leadForm.customer_name} onChange={e => setLeadForm({...leadForm, customer_name: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#3b82f6', boxSizing: 'border-box' }} placeholder="Cth: Budi Santoso" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Nomor WhatsApp / HP</label>
                <input type="text" required value={leadForm.customer_phone} onChange={e => setLeadForm({...leadForm, customer_phone: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#3b82f6', boxSizing: 'border-box' }} placeholder="0812xxxxxx" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Tanggal Survei (Opsional)</label>
                <input type="date" value={leadForm.schedule_date} onChange={e => setLeadForm({...leadForm, schedule_date: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#3b82f6', boxSizing: 'border-box' }} min={new Date().toISOString().slice(0,10)} />
              </div>
              {leadForm.schedule_date && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Pilih Waktu</label>
                <select value={leadForm.time_slot} onChange={e => setLeadForm({...leadForm, time_slot: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#3b82f6', boxSizing: 'border-box' }}>
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                </select>
              </div>
              )}
              
              <button type="submit" disabled={isSubmittingLead} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmittingLead ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                {isSubmittingLead ? 'Mengirim...' : 'Kirim Permintaan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL PILIH VARIAN E-COMMERCE */}
      {showVariantModal && ecoItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden' }}>
                  <ImageWithFallback src={ecoItem.image} category="Ecommerce" alt={ecoItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '1.1rem', color: '#1e293b' }}>{ecoItem.name}</h3>
                  <div style={{ color: '#4f46e5', fontWeight: '900', fontSize: '1.2rem' }}>
                    Rp {(parseInt(String(ecoItem.discount_price || ecoItem.price).replace(/\D/g, '')) + (selectedVariant ? Number(selectedVariant.priceDiff) : 0)).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowVariantModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#475569' }}>Pilih Varian:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {ecoItem.parsedVariants.map(v => (
                <button key={v.name} disabled={v.stock === 0} onClick={() => setSelectedVariant(v)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${selectedVariant?.name === v.name ? '#4f46e5' : '#cbd5e1'}`, background: selectedVariant?.name === v.name ? '#eef2ff' : (v.stock === 0 ? '#f1f5f9' : 'white'), color: selectedVariant?.name === v.name ? '#4f46e5' : (v.stock === 0 ? '#cbd5e1' : '#334155'), fontWeight: '600', cursor: v.stock === 0 ? 'not-allowed' : 'pointer' }}>
                  {v.name} {v.stock === 0 && '(Habis)'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Jumlah</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px' }}>
                <button onClick={() => setEcoQty(Math.max(1, ecoQty - 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#475569', cursor: 'pointer', padding: '0 8px' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{ecoQty}</span>
                <button onClick={() => setEcoQty(Math.min(selectedVariant?.stock || 1, ecoQty + 1))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#475569', cursor: 'pointer', padding: '0 8px' }}>+</button>
              </div>
            </div>

            <button onClick={confirmAddVariantToCart} style={{ width: '100%', background: '#4f46e5', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>Masukkan Keranjang</button>
          </div>
        </div>
      )}

      {/* ✨ MODAL MAKE AN OFFER */}
      {showOfferModal && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Ajukan Penawaran Harga</h3>
              <button onClick={() => setShowOfferModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Berikan penawaran harga terbaik Anda untuk properti <strong>{selectedItem.name}</strong>.</p>
            
            <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingOffer(true);
                try {
                    const payload = { property_id: selectedItem.id, offer_amount: Number(String(offerForm.offer_amount).replace(/\D/g, '')), message: offerForm.message };
                const res = await fetch(`http://${window.location.hostname}:3000/api/public/properties/offers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('superapp_token')}` },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if(res.ok) { toast.success(data.message); setShowOfferModal(false); setOfferForm({ offer_amount: '', message: '' }); } else toast.error(data.error);
                } catch(e) { toast.error("Error koneksi."); }
                finally { setIsSubmittingOffer(false); }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Harga Penawaran (Rp)</label>
                <input type="text" required value={offerForm.offer_amount} onChange={e => setOfferForm({...offerForm, offer_amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#10b981', boxSizing: 'border-box', fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }} placeholder="Contoh: 1.200.000.000" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem' }}>Pesan Tambahan (Opsional)</label>
                <textarea value={offerForm.message} onChange={e => setOfferForm({...offerForm, message: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outlineColor: '#10b981', boxSizing: 'border-box', minHeight: '80px' }} placeholder="Sampaikan pesan ke pemilik/agen..." />
              </div>
              <button type="submit" disabled={isSubmittingOffer} style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmittingOffer ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                {isSubmittingOffer ? 'Mengirim...' : 'Kirim Penawaran'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL COMPARE PROPERTI (SIDE-BY-SIDE) */}
      {showCompareModal && compareList.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeUp 0.3s ease-out' }}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem' }}>⚖️ Perbandingan Properti</h2>
              <button onClick={() => setShowCompareModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px', width: '140px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>Spesifikasi</th>
                    {compareList.map(item => (
                      <th key={item.id} style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'center', width: `${100/compareList.length}%` }}>
                        <div style={{ position: 'relative', paddingBottom: '70%', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                           <ImageWithFallback src={item.image_urls} category="Properti" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px' }}>{item.name}</div>
                        <button onClick={() => setCompareList(compareList.filter(c => c.id !== item.id))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Hapus</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Harga', key: 'price', render: (val) => <strong style={{color: '#3b82f6', fontSize: '1.1rem'}}>Rp {Number(val || 0).toLocaleString('id-ID')}</strong> },
                    { label: 'Status', key: 'status', render: (val) => <span style={{ background: val === 'Jual' ? '#e0f2fe' : '#fef9c3', color: val === 'Jual' ? '#0284c7' : '#ca8a04', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>{val}</span> },
                    { label: 'Tipe Properti', key: 'type' },
                    { label: 'Kamar Tidur', key: 'bedrooms', render: (val) => `🛏️ ${val || 0} Kamar` },
                    { label: 'Kamar Mandi', key: 'bathrooms', render: (val) => `🛁 ${val || 0} Kamar` },
                    { label: 'Luas Tanah', key: 'land_size', render: (val) => `${val || 0} m²` },
                    { label: 'Luas Bangunan', key: 'building_size', render: (val) => `${val || 0} m²` },
                    { label: 'Alamat Lokasi', key: 'address', render: (val) => <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{val}</div> }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '15px 10px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>{row.label}</td>
                      {compareList.map(item => (
                        <td key={item.id} style={{ padding: '15px 10px', textAlign: 'center', color: '#1e293b' }}>
                          {row.render ? row.render(item[row.key]) : (item[row.key] || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setCompareList([])} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kosongkan Perbandingan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerView;
