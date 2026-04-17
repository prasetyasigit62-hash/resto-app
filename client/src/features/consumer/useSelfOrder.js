import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export const useSelfOrder = (tableId) => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/restoran`);
        if (res.ok) {
          const data = await res.json();
          setMenu(data);
        } else {
          setError('Gagal memuat menu. Silakan coba lagi.');
        }
      } catch (err) {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const socket = io(backendUrl);
    socket.on('orderStatusUpdate', (data) => {
      if (activeOrderId && String(data.orderId) === String(activeOrderId)) {
        setOrderStatus(data.status);
        if (data.status === 'Pending') toast.info('✅ Pesanan dikonfirmasi! Segera dimasak.');
        if (data.status === 'Processed') toast.info('👨‍🍳 Pesanan Anda sedang dimasak!');
        if (data.status === 'Completed') toast.success('🛎️ Pesanan Anda siap disajikan!');
      }
    });
    return () => socket.disconnect();
  }, [activeOrderId]);

  const displayLocation = useMemo(() => {
    const decoded = decodeURIComponent(tableId).replace(/-/g, ' ');
    return `Meja ${decoded}`;
  }, [tableId]);

  const categories = useMemo(() => {
    return [...new Set(menu.map(item => item.cuisine || 'Lainnya'))];
  }, [menu]);

  const addToCart = (item) => {
    if (item.stock === 0) {
      toast.warn(`Maaf, ${item.name} sedang habis.`);
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, qty: 1, service: 'Restoran' }];
    });
    setShowCart(true);
    toast.success(`${item.name} masuk keranjang. Jangan lupa Checkout!`);
  };

  const updateQuantity = (itemId, amount) => {
    setCart(prevCart => prevCart.map(item => (item.id === itemId ? { ...item, qty: item.qty + amount } : item)).filter(item => item.qty > 0));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + parseInt(String(item.price).replace(/[^0-9]/g, '') || '0') * item.qty, 0);
  }, [cart]);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const backendUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✨ FIX: Menyamakan key 'address' untuk table dengan sistem V2
        body: JSON.stringify({ items: cart, total: cartTotal, address: decodeURIComponent(tableId).replace(/-/g, ' '), paymentMethod: 'Open Bill', status: 'Need_Confirmation' }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Pesanan Anda telah dikirim ke dapur! Silakan tunggu.');
        setCart([]);
        setShowCart(false);
        setActiveOrderId(result.orderId);
        setOrderStatus('Need_Confirmation');
      } else { toast.error(result.error || 'Gagal mengirim pesanan.'); }
    } catch (err) { toast.error('Koneksi error.'); } finally { setLoading(false); }
  };

  return { menu, cart, loading, error, showCart, setShowCart, activeOrderId, orderStatus, displayLocation, categories, addToCart, updateQuantity, cartTotal, submitOrder };
};