import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export const usePos = (props) => {
  const { setConfirmModal } = props;
  
  const [menuItems, setMenuItems] = useState([]);
  const [chefs, setChefs] = useState([]); 
  const [selectedChef, setSelectedChef] = useState(''); 
  const [activeCart, setActiveCart] = useState([]);
  const [heldCarts, setHeldCarts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHeldCarts, setShowHeldCarts] = useState(false);
  const [showTableModal, setShowTableModal] = useState(true); 
  const [selectedTable, setSelectedTable] = useState(null); 
  const [showPendingModal, setShowPendingModal] = useState(false); 
  const [pendingOrders, setPendingOrders] = useState([]); 
  const [orderToPay, setOrderToPay] = useState(null); 
  const [selectedOrders, setSelectedOrders] = useState([]); 
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
  const [vouchers, setVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountInput, setDiscountInput] = useState('');
  const [usePoints, setUsePoints] = useState(0);
  const [activeShift, setActiveShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [startCashInput, setStartCashInput] = useState('');
  const [endCashInput, setEndCashInput] = useState('');
  const [showShiftEndModal, setShowShiftEndModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashType, setCashType] = useState('out'); 
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '' });
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitSelection, setSplitSelection] = useState({}); 
  const [tables, setTables] = useState([]);
  const [tableViewMode, setTableViewMode] = useState('grid'); 
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });
  const [storeSettings, setStoreSettings] = useState({
    taxPercentage: 11,
    serviceChargePercentage: 0,
    storeName: 'Restoran Kita',
    storeAddress: '',
    storePhone: ''
  });
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisStatus, setQrisStatus] = useState('waiting'); 

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const socket = io(backendUrl);
    
    socket.on('newOrder', (data) => {
        fetchPendingOrders();
        toast.info("🔔 Ada pesanan baru masuk! Silakan cek antrean Order.");
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const [resMenu, resTables, resVouchers, resShift, resCustomers, resSettings, resUsers] = await Promise.all([
            fetch(`${backendUrl}/api/v2/menus`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/tables`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/shifts/active`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/crm`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/settings/store`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${backendUrl}/api/v2/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (resMenu.ok) {
          const v2Menus = await resMenu.json();
          setMenuItems(v2Menus.map(m => ({
              ...m,
              cuisine: m.category?.name || 'Umum',
              rawPrice: m.price,
              price: `Rp ${m.price.toLocaleString('id-ID')}`,
              stock: null 
          })));
        } else {
             const resV1 = await fetch(`${backendUrl}/api/restoran`, { headers: { 'Authorization': `Bearer ${token}` } });
           if (resV1.ok) setMenuItems(await resV1.json());
        }

        if (resTables.ok) {
          let tableData = await resTables.json();
          if (Array.isArray(tableData)) {
            tableData = tableData.map((t, i) => ({
                ...t,
                x: t.x !== undefined ? t.x : (i % 5) * 120 + 20, 
                y: t.y !== undefined ? t.y : Math.floor(i / 5) * 120 + 20
            }));
            setTables(tableData);
            const hasMapData = tableData.some(t => t.x > 0 || t.y > 0);
            setTableViewMode(hasMapData ? 'map' : 'grid');
          } else {
            setTables([]); 
          }
        }
        
        if (resVouchers.ok) setVouchers(await resVouchers.json());
        if (resShift.ok) {
          const shift = await resShift.json();
          setActiveShift(shift); 
        }
        if (resCustomers.ok) setCustomers(await resCustomers.json());
        if (resSettings.ok) setStoreSettings(await resSettings.json());
        if (resUsers && resUsers.ok) {
            const usersData = await resUsers.json();
            setChefs(usersData.filter(u => String(u.role).toUpperCase() === 'CHEF'));
        }
      } catch (err) {
        console.error("Gagal memuat data POS", err);
      }
      finally {
        setShiftLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => ['all', ...new Set(menuItems.map(item => item.cuisine || 'Lainnya'))], [menuItems]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || (item.cuisine || 'Lainnya') === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchTerm]);

  const addToCart = (item) => {
    if (item.stock !== null && item.stock === 0) {
      toast.warn(`Stok untuk ${item.name} habis!`);
      return;
    }
    const existingItem = activeCart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setActiveCart(activeCart.map(cartItem =>
        cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
      ));
    } else {
      setActiveCart([...activeCart, { ...item, qty: 1, service: 'Restoran', note: '' }]);
    }
  };

  const updateQuantity = (itemId, amount) => {
    const updatedCart = activeCart.map(item =>
      item.id === itemId ? { ...item, qty: Math.max(1, item.qty + amount) } : item
    ).filter(item => item.qty > 0);
    setActiveCart(updatedCart);
  };

  const removeFromCart = (itemId) => {
    setActiveCart(activeCart.filter(item => item.id !== itemId));
  };

  const cartTotals = useMemo(() => {
    const subtotal = activeCart.reduce((acc, item) => {
      const price = item.rawPrice || parseInt(String(item.price).replace(/[^0-9]/g, '') || '0');
      return acc + (price * item.qty);
    }, 0);

    let discountAmount = 0;
    if (discount.type === 'percent') {
      discountAmount = subtotal * (discount.value / 100);
    } else { 
      discountAmount = discount.value;
    }
    discountAmount = Math.min(subtotal, discountAmount);

    let memberDiscount = 0;
    if (selectedCustomer) {
      memberDiscount = subtotal * 0.10; 
    }

    const taxBase = Math.max(0, subtotal - discountAmount - memberDiscount);
    const serviceCharge = taxBase * (storeSettings.serviceChargePercentage / 100);
    const tax = (taxBase + serviceCharge) * (storeSettings.taxPercentage / 100);
    let finalTotal = taxBase + serviceCharge + tax;
    
    let pointsDiscount = 0;
    if (selectedCustomer && usePoints > 0) {
      pointsDiscount = Math.min(usePoints, finalTotal); 
      finalTotal -= pointsDiscount;
    }

    return { subtotal, tax, serviceCharge, discountAmount, memberDiscount, pointsDiscount, total: finalTotal };
  }, [activeCart, discount, isSplitMode, splitSelection, selectedCustomer, storeSettings, usePoints]);

  const handleApplyVoucher = () => {
    if (!voucherCode) return;
    const voucher = vouchers.find(v => v.code === voucherCode.toUpperCase().trim());
    if (!voucher) {
      toast.error('Kode voucher tidak ditemukan!');
      setAppliedVoucher(null);
      return;
    }
    if (!voucher.isActive) {
      toast.error('Voucher ini sudah tidak aktif.');
      return;
    }
    const currentSubtotal = activeCart.reduce((acc, item) => acc + (parseInt(String(item.price).replace(/\D/g,'')) * item.qty), 0);
    if (currentSubtotal < voucher.minOrder) {
      toast.warn(`Minimal belanja Rp ${voucher.minOrder.toLocaleString('id-ID')} untuk promo ini.`);
      return;
    }
    setDiscount({ type: voucher.type, value: voucher.value });
    setDiscountInput(voucher.value); 
    setAppliedVoucher(voucher);
    toast.success(`Promo "${voucher.name}" berhasil dipakai!`);
  };

  const holdCart = () => {
    if (activeCart.length === 0) return;
    const newHeldCart = { id: Date.now(), items: activeCart, time: new Date() };
    setHeldCarts([newHeldCart, ...heldCarts]);
    setActiveCart([]);
    toast.info(`Transaksi #${newHeldCart.id} ditahan.`);
  };

  const resumeCart = (cartId) => {
    if (activeCart.length > 0) {
      toast.warn('Selesaikan atau tahan transaksi aktif terlebih dahulu!');
      return;
    }
    const cartToResume = heldCarts.find(c => c.id === cartId);
    if (!cartToResume) { toast.error('Transaksi tidak ditemukan.'); return; }
    setActiveCart(cartToResume.items);
    setHeldCarts(heldCarts.filter(c => c.id !== cartId));
    toast.success(`Transaksi #${cartId} dilanjutkan.`);
  };

  const fetchHistoryOrders = async () => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const allOrders = await res.json();
        const today = new Date().toISOString().slice(0, 10);
        const filtered = allOrders.filter(o => 
          o.date.startsWith(today) && 
          o.items.some(i => i.service === 'Restoran') &&
          ['Completed', 'Cancelled'].includes(o.status)
        );
        setHistoryOrders(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setShowHistoryModal(true);
      }
    } catch (err) { toast.error("Gagal memuat riwayat."); }
  };

  const handleVoidOrder = async (orderId) => {
    if (!window.confirm("Yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.")) return;
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
        const res = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'Cancelled' })
        });
        if (res.ok) {
            toast.success(`Transaksi #${orderId} berhasil dibatalkan (VOID).`);
            fetchHistoryOrders(); 
        } else {
            toast.error("Gagal membatalkan transaksi.");
        }
    } catch (err) { toast.error("Koneksi error."); }
  };

  const handleSendWA = (order) => {
    const defaultPhone = selectedCustomer?.name === order.customerName ? selectedCustomer.phone : '';
    let phone = prompt(`Kirim e-Struk untuk ${order.customerName}\nMasukkan nomor WhatsApp (contoh: 0812...):`, defaultPhone);
    
    if (!phone) return; 
    if (phone.startsWith('0')) phone = '62' + phone.slice(1); 
    
    let text = `*${storeSettings.storeName}*\n`;
    text += `${storeSettings.storeAddress}\n`;
    text += `--------------------------------\n`;
    text += `Halo *${order.customerName || 'Pelanggan'}*,\n`;
    text += `Terima kasih atas kunjungan Anda. Berikut adalah detail pesanan Anda (Ref: #${order.id}):\n\n`;
    
    order.items.forEach(item => {
        const priceNum = parseInt(String(item.price).replace(/[^0-9]/g, '') || '0');
        text += `▪ ${item.name} (x${item.qty})\n  Rp ${(priceNum * item.qty).toLocaleString('id-ID')}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `*Total Pembayaran: Rp ${order.total.toLocaleString('id-ID')}*\n`;
    text += `Metode Bayar: ${order.paymentMethod}\n`;
    text += `Waktu: ${new Date(order.date).toLocaleString('id-ID')}\n\n`;
    text += `*${storeSettings.receiptFooter}*`;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleAddCustomer = async () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) return toast.warn("Isi nama dan no HP.");
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCustomerForm)
      });
      if(res.ok) {
        const newCus = await res.json();
        setCustomers([...customers, newCus]);
        setSelectedCustomer(newCus);
        setShowCustomerModal(false);
        setNewCustomerForm({name:'', phone:''});
        toast.success("Member baru ditambahkan & dipilih!");
      }
    } catch(e) { toast.error("Gagal tambah member."); }
  };

  const handleAddCustomItem = () => {
    if(!customForm.name || !customForm.price) return toast.warn("Isi nama dan harga!");
    const price = parseInt(customForm.price.replace(/\./g, '')) || 0;
    
    const newItem = {
        id: `custom-${Date.now()}`,
        name: `${customForm.name} (Custom)`,
        price: price,
        stock: 9999, 
        category: 'Custom',
        service: 'Restoran',
        isCustom: true,
        image: null
    };
    
    addToCart(newItem);
    setShowCustomModal(false);
    setCustomForm({ name: '', price: '' });
    toast.success("Item custom ditambahkan ke keranjang");
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setShowTableModal(false);
    toast.success(`Memulai pesanan untuk ${table.name}`);
  };

  const fetchPendingOrders = async () => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const allOrders = await res.json();
        const activeOrders = allOrders.filter(o =>
          ['Need_Confirmation', 'Pending', 'Processed'].includes(o.status) &&
          o.items.some(i => i.service === 'Restoran')
        );
        setPendingOrders(activeOrders);
        setShowPendingModal(true);
      } else {
        toast.error("Gagal memuat pesanan.");
      }
    } catch (err) {
      toast.error("Koneksi error.");
    }
  };

  const handleSendToKitchen = async () => {
    if (activeCart.length === 0) return toast.warn("Keranjang kosong.");
    
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
        const res = await fetch(`${backendUrl}/api/v2/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            items: activeCart,
            address: selectedTable ? selectedTable.name : 'Takeaway (Saved)',
            total: cartTotals.total,
            paymentMethod: 'Open Bill', 
            status: 'Pending', 
            chefId: selectedChef || null,
            voucherCode: appliedVoucher ? appliedVoucher.code : null,
            memberId: selectedCustomer ? selectedCustomer.id : null,
            customerNameOverride: selectedCustomer ? selectedCustomer.name : null,
            redeemPoints: usePoints
          })
      });
        const result = await res.json();

      if(res.ok) { 
            handlePrintChecker({
                table: selectedTable ? selectedTable.name : 'Takeaway (Saved)',
                items: activeCart,
                orderId: result.order?.receiptNumber || result.orderId
            });

            setActiveCart([]);
            setUsePoints(0);
            setDiscount({ type: 'percent', value: 0 });
            setSelectedTable(null);
            setShowTableModal(true); 
        } else {
            toast.error(result.error || "Gagal mengirim pesanan");
        }
    } catch(e) { toast.error("Koneksi error"); }
  };

  const handleConfirmOrder = async (order) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
        const res = await fetch(`${backendUrl}/api/orders/${order.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'Pending' })
        });
        if (res.ok) {
            toast.success('Pesanan dikonfirmasi dan dikirim ke dapur!');
            handlePrintChecker({
                table: order.customerName,
                items: order.items,
                orderId: order.id
            });
            fetchPendingOrders();
            
            if(props.addNotification) {
                props.addNotification({
                    id: Date.now(), 
                    service: 'Restoran', 
                    message: `Pesanan #${order.id} dikonfirmasi Kasir -> Dapur`, 
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            toast.error("Gagal mengkonfirmasi pesanan.");
        }
    } catch (err) {
        toast.error("Koneksi error.");
    }
  };

  const handlePayPendingOrderClick = (order) => {
    setOrderToPay(order); 
    setShowPaymentModal(true); 
  };

  const confirmPayPendingOrder = async (method) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderToPay.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Completed', processedBy: props.user.id, paymentMethod: method })
      });

      if (!res.ok) throw new Error("Gagal update status");

      toast.success(`Pesanan ${orderToPay.customerName} berhasil dibayar via ${method}!`);

      if (props.addNotification) {
        props.addNotification({
          id: Date.now(),
          service: 'Restoran',
          message: `Pesanan #${orderToPay.id} (${orderToPay.customerName}) telah LUNAS via ${method}.`,
          timestamp: new Date().toISOString()
        });
      }

      const subtotal = orderToPay.items.reduce((acc, item) => {
        const price = parseInt(String(item.price).replace(/[^0-9]/g, '') || '0');
        return acc + (price * item.qty);
      }, 0);
      
      const serviceCharge = subtotal * (storeSettings.serviceChargePercentage / 100);
      const tax = (subtotal + serviceCharge) * (storeSettings.taxPercentage / 100);
      const total = subtotal + serviceCharge + tax;

      const receiptData = { ...orderToPay, subtotal, tax, total, discountAmount: 0, voucherCode: null, paymentMethod: method };

      handlePrintReceipt(receiptData);
      setPendingOrders(pendingOrders.filter(o => o.id !== orderToPay.id)); 
      setOrderToPay(null); 
      setShowPaymentModal(false); 
    } catch (err) {
      console.error(err);
      toast.error("Gagal memproses pembayaran.");
    }
  };

  const handlePrintReceipt = (data) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    document.body.appendChild(iframe);

    const htmlContent = `
      <html>
      <head>
        <title>Struk #${data.receiptNumber || data.id || 'NEW'}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 100%; max-width: 300px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .border-bottom { border-bottom: 1px dashed #000; margin: 5px 0; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; }
          .item-row { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 16px;">${storeSettings.storeName}</div>
        <div class="text-center">${storeSettings.storeAddress}</div>
        <div class="text-center border-bottom">Telp: ${storeSettings.storePhone}</div>
        
        <div>No. Order: ${data.receiptNumber || data.id}</div>
        <div>Tgl: ${new Date().toLocaleString('id-ID')}</div>
        <div>Kasir: ${props.user?.username || 'Staff'}</div>
        ${data.chefName && data.chefName !== '-' ? `<div>Chef: ${data.chefName}</div>` : ''}
        <div class="border-bottom">Metode: ${data.paymentMethod}</div>

        <div class="items">
          ${data.items.map(item => {
      const priceNum = parseInt(String(item.price).replace(/[^0-9]/g, '') || '0');
      return `
              <div class="item-row">
                <div>${item.name} x${item.qty}</div>
                <div class="text-right">${(priceNum * item.qty).toLocaleString('id-ID')}</div>
              </div>
              ${item.note ? `<div style="font-size: 10px; font-style: italic; color: #555;">* ${item.note}</div>` : ''}
            `;
    }).join('')}
        </div>

        <div class="border-bottom" style="margin-top: 10px;"></div>
        
        <div class="row"><span>Subtotal</span><span>${(data.subtotal || 0).toLocaleString('id-ID')}</span></div>
        ${data.discountAmount > 0 ? `<div class="row" style="color:red;"><span>Diskon ${data.voucherCode ? '('+data.voucherCode+')' : ''}</span><span>-${data.discountAmount.toLocaleString('id-ID')}</span></div>` : ''}
        ${(data.serviceCharge || 0) > 0 ? `<div class="row"><span>Service (${storeSettings.serviceChargePercentage}%)</span><span>${Math.round(data.serviceCharge).toLocaleString('id-ID')}</span></div>` : ''}
        <div class="row"><span>PPN (${storeSettings.taxPercentage}%)</span><span>${Math.round(data.tax || 0).toLocaleString('id-ID')}</span></div>
        ${data.pointsDiscount > 0 ? `<div class="row" style="color:green;"><span>Tukar Poin</span><span>-${data.pointsDiscount.toLocaleString('id-ID')}</span></div>` : ''}
        <div class="row bold" style="font-size: 14px; margin-top: 5px;"><span>TOTAL</span><span>Rp ${(data.total || 0).toLocaleString('id-ID')}</span></div>
        
        <div class="text-center border-bottom" style="margin-top: 15px;"></div>
        <div class="text-center" style="margin-top: 10px;">Terima Kasih</div>
        <div class="text-center">Simpan struk ini sebagai bukti pembayaran.</div>
      </body>
      </html>
    `;

    setTimeout(() => {
      const targetDoc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
      targetDoc.open();
      targetDoc.write(htmlContent);
      targetDoc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }, 100);
  };

  const handlePrintChecker = (data) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    document.body.appendChild(iframe);

    const htmlContent = `
      <html>
      <head>
        <title>KITCHEN CHECKER #${data.orderId || 'NEW'}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 10px; width: 100%; max-width: 300px; font-weight: bold; }
          .text-center { text-align: center; }
          .border-bottom { border-bottom: 2px dashed #000; margin: 10px 0; padding-bottom: 10px; }
          .header { font-size: 18px; text-transform: uppercase; margin-bottom: 5px; }
          .meta { font-size: 12px; font-weight: normal; margin-bottom: 2px; }
          .item-row { margin-bottom: 15px; display: flex; align-items: flex-start; }
          .qty { font-size: 22px; width: 40px; margin-right: 10px; }
          .name { flex: 1; font-size: 16px; }
          .note { display: block; font-size: 12px; font-style: italic; margin-top: 4px; font-weight: normal; background: #eee; padding: 2px; }
        </style>
      </head>
      <body>
        <div class="text-center header">PESANAN DAPUR</div>
        <div class="text-center border-bottom">
            <div style="font-size: 22px; margin-bottom: 5px;">${data.table}</div>
            <div class="meta">${new Date().toLocaleString('id-ID')}</div>
            <div class="meta">Ref: #${data.orderId || '-'}</div>
        </div>
        <div class="items">
          ${data.items.map(item => `
            <div class="item-row">
              <div class="qty">${item.qty}</div>
              <div class="name">
                ${item.name}
                ${item.note ? `<span class="note">Note: ${item.note}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="border-bottom" style="margin-top: 20px;"></div>
      </body>
      </html>
    `;
    
    setTimeout(() => {
      const targetDoc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
      targetDoc.open();
      targetDoc.write(htmlContent);
      targetDoc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }, 100);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleMergeOrMove = async (targetOrderId) => {
    if (selectedOrders.length === 0) {
      toast.warn("Pilih minimal satu pesanan sumber.");
      return;
    }

    const sourceOrderIds = selectedOrders.filter(id => id !== targetOrderId);
    if (sourceOrderIds.length === 0) {
      toast.info("Aksi tidak valid. Anda harus memilih pesanan sumber dan target yang berbeda.");
      return;
    }

    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/orders/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sourceOrderIds, targetOrderId })
      });

      if (res.ok) {
        toast.success("Pesanan berhasil digabung/dipindah!");
        const allOrders = await (await fetch(`${backendUrl}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } })).json();
        const activeOrders = allOrders.filter(o =>
          ['Pending', 'Processed'].includes(o.status) &&
          o.items.some(i => i.service === 'Restoran')
        );
        setPendingOrders(activeOrders);
        setSelectedOrders([]); 
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal menggabungkan pesanan.");
      }

    } catch (err) {
      console.error(err);
      toast.error("Koneksi error saat menggabungkan pesanan.");
    }
  };

  const handleEditNote = (item) => {
    setConfirmModal({
      show: true,
      title: `Catatan: ${item.name}`,
      message: 'Tambahkan instruksi khusus untuk dapur (Contoh: Tidak pedas, extra saus, dll).',
      inputType: 'textarea', 
      inputPlaceholder: 'Tulis catatan di sini...',
      inputValue: item.note, 
      confirmText: 'Simpan Catatan',
      cancelText: 'Batal',
      onConfirmWithValue: (newNote) => {
        setActiveCart(prevCart => prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, note: newNote } : cartItem
        ));
        setConfirmModal(prev => ({ ...prev, show: false }));
        if (newNote) toast.success('Catatan disimpan!');
        else toast.info('Catatan dihapus.');
      }
    });
  };

  const applyDiscount = () => {
    const value = parseFloat(discountInput) || 0;
    setDiscount(prev => ({ ...prev, value: value }));
    if (appliedVoucher) setAppliedVoucher(null); 
    toast.info(`Diskon ${discount.type === 'percent' ? `${value}%` : `Rp ${value.toLocaleString('id-ID')}`} diterapkan.`);
  };

  const handleStartShift = async () => {
    if (!startCashInput) {
      toast.warn("Masukkan saldo awal kasir.");
      return;
    }
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/shifts/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ startCash: parseInt(startCashInput.replace(/\./g, '') || '0') })
      });
      
      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        setActiveShift(result);
        const isNew = new Date(result.startTime).getTime() > (Date.now() - 60000); 
        if (isNew) toast.success(`Shift dimulai. Saldo: Rp ${result.startCash.toLocaleString('id-ID')}`);
        else toast.info(`Sesi shift dipulihkan (Aktif sejak ${new Date(result.startTime).toLocaleTimeString()}).`);
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error("Sesi habis. Silakan Logout dan Login ulang.");
        } else if (res.status === 404) {
          toast.error("Endpoint tidak ditemukan (404). Mohon RESTART terminal backend Anda.");
        } else {
          const errMsg = result.error || `Server Error (Code: ${res.status})`;
          toast.error(errMsg);
        }
      }
    } catch(err) { toast.error("Koneksi error."); }
  };

  const handleSaveCashMovement = async () => {
    if (!cashAmount || !cashNote) {
        toast.warn("Mohon isi nominal dan keterangan.");
        return;
    }
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
        const res = await fetch(`${backendUrl}/api/shifts/movement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                type: cashType, 
                amount: parseInt(cashAmount.replace(/\./g, '')), 
                note: cashNote 
            })
        });
        if (res.ok) {
            const updatedShift = await res.json();
            setActiveShift(updatedShift); 
            toast.success(`Berhasil mencatat kas ${cashType === 'in' ? 'masuk' : 'keluar'}.`);
            setShowCashModal(false);
            setCashAmount('');
            setCashNote('');
        } else {
            toast.error("Gagal menyimpan data.");
        }
    } catch (err) { toast.error("Koneksi error."); }
  };

  const handleEndShift = async () => {
    if (!endCashInput) {
      toast.warn("Masukkan total uang tunai yang dihitung.");
      return;
    }
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/shifts/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ endCash: parseInt(endCashInput.replace(/\./g, '') || '0') })
      });
      if (res.ok) {
        const closedShift = await res.json();
        toast.success(`Shift ditutup. Total Penjualan: Rp ${Number(closedShift.total_sales || 0).toLocaleString('id-ID')}`);
        setActiveShift(null); 
        setShowShiftEndModal(false);
        setStartCashInput('');
        setEndCashInput('');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal menutup shift.");
      }
    } catch(err) { toast.error("Koneksi error."); }
  };

  const handleQrisPayment = () => {
    setShowPaymentModal(false);
    setShowQrisModal(true);
    setQrisStatus('waiting');
  };

  const handleSimulatePaymentSuccess = () => {
    setQrisStatus('success');
    new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(()=>{});
    
    setTimeout(() => {
      setShowQrisModal(false);
      if (orderToPay) { 
        confirmPayPendingOrder('QRIS');
      } else { 
        finalizeOrder('QRIS');
      }
    }, 1500);
  };

  const finalizeOrder = async (paymentMethod) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      let itemsToPay = activeCart;
      if (isSplitMode) {
        itemsToPay = activeCart.map(item => {
          const splitQty = splitSelection[item.id] || 0;
          return splitQty > 0 ? { ...item, qty: splitQty } : null;
        }).filter(Boolean);
      }

      const pmMap = { 'Tunai': 'CASH', 'Kartu': 'DEBIT', 'QRIS': 'QRIS', 'Lainnya': 'CASH' };
      const v2PaymentMethod = pmMap[paymentMethod] || 'CASH';

      const res = await fetch(`${backendUrl}/api/v2/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: itemsToPay,
          address: selectedTable ? selectedTable.name : 'Takeaway (POS)', 
          total: cartTotals.total, 
          paymentMethod: v2PaymentMethod,
          chefId: selectedChef || null,
          voucherCode: appliedVoucher ? appliedVoucher.code : null, 
          memberId: selectedCustomer ? selectedCustomer.id : null, 
          customerNameOverride: selectedCustomer ? selectedCustomer.name : null, 
          redeemPoints: usePoints 
        })
      });
      
      const resultData = await res.json();

      if (res.ok) {
        toast.success(`Transaksi ${paymentMethod} berhasil!`);

        if (props.addNotification) {
          const paymentMsg = paymentMethod === 'Open Bill' ? 'Open Bill (Belum Lunas)' : `LUNAS via ${paymentMethod}`;
          props.addNotification({
            id: Date.now(),
            service: 'Restoran',
            message: `Pesanan #${resultData.order?.receiptNumber || resultData.orderId} (${selectedTable ? selectedTable.name : 'Takeaway'}) - ${paymentMsg}. Total: Rp ${cartTotals.total.toLocaleString('id-ID')}`,
            timestamp: new Date().toISOString()
          });
        }

        const receiptData = {
            id: resultData.orderId,
            receiptNumber: resultData.order?.receiptNumber,
            chefName: resultData.order?.chef?.username || '-',
          items: itemsToPay,
          subtotal: cartTotals.subtotal,
          tax: cartTotals.tax,
          discountAmount: cartTotals.discountAmount,
          total: cartTotals.total,
          paymentMethod: paymentMethod,
          voucherCode: appliedVoucher ? appliedVoucher.code : null,
          customerName: selectedCustomer ? selectedCustomer.name : null, 
          pointsDiscount: cartTotals.pointsDiscount
        };
        handlePrintReceipt(receiptData);

        if (isSplitMode) {
            const newCart = activeCart.map(item => {
                const paidQty = splitSelection[item.id] || 0;
                return { ...item, qty: item.qty - paidQty };
            }).filter(item => item.qty > 0);
            setActiveCart(newCart);
            setSplitSelection({});
            if (newCart.length === 0) setIsSplitMode(false); 
        } else {
            setActiveCart([]);
        }

        setDiscount({ type: 'percent', value: 0 }); 
        setDiscountInput('');
        setVoucherCode('');
        setAppliedVoucher(null);
        setUsePoints(0);
        
        fetch(`${backendUrl}/api/customers`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json()).then(data => setCustomers(data)).catch(()=>{});

        setShowPaymentModal(false);
        setSelectedCustomer(null); 
        setSelectedTable(null); 
        setShowTableModal(true); 
      } else {
        toast.error(resultData.error || 'Gagal menyimpan transaksi.');
      }
    } catch (err) {
      toast.error('Koneksi error.');
    }
  };

  return {
    menuItems, setMenuItems, chefs, setChefs, selectedChef, setSelectedChef, activeCart, setActiveCart, heldCarts, setHeldCarts, searchTerm, setSearchTerm, activeCategory, setActiveCategory, showPaymentModal, setShowPaymentModal, showHeldCarts, setShowHeldCarts, showTableModal, setShowTableModal, selectedTable, setSelectedTable, showPendingModal, setShowPendingModal, pendingOrders, setPendingOrders, orderToPay, setOrderToPay, selectedOrders, setSelectedOrders, discount, setDiscount, vouchers, setVouchers, voucherCode, setVoucherCode, appliedVoucher, setAppliedVoucher, discountInput, setDiscountInput, usePoints, setUsePoints, activeShift, setActiveShift, shiftLoading, setShiftLoading, startCashInput, setStartCashInput, endCashInput, setEndCashInput, showShiftEndModal, setShowShiftEndModal, showCashModal, setShowCashModal, cashType, setCashType, cashAmount, setCashAmount, cashNote, setCashNote, showHistoryModal, setShowHistoryModal, historyOrders, setHistoryOrders, showCustomModal, setShowCustomModal, customForm, setCustomForm, isSplitMode, setIsSplitMode, splitSelection, setSplitSelection, tables, setTables, tableViewMode, setTableViewMode, customers, setCustomers, showCustomerModal, setShowCustomerModal, selectedCustomer, setSelectedCustomer, newCustomerForm, setNewCustomerForm, storeSettings, setStoreSettings, showQrisModal, setShowQrisModal, qrisStatus, setQrisStatus, categories, filteredMenu, addToCart, updateQuantity, removeFromCart, cartTotals, handleApplyVoucher, holdCart, resumeCart, fetchHistoryOrders, handleVoidOrder, handleSendWA, handleAddCustomer, handleAddCustomItem, handleSelectTable, fetchPendingOrders, handleSendToKitchen, handleConfirmOrder, handlePayPendingOrderClick, confirmPayPendingOrder, handlePrintReceipt, handlePrintChecker, handleSelectOrder, handleMergeOrMove, handleEditNote, applyDiscount, handleStartShift, handleSaveCashMovement, handleEndShift, handleQrisPayment, handleSimulatePaymentSuccess, finalizeOrder
  };
};