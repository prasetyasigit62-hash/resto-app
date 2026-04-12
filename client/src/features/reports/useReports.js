import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export const useReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Menggunakan instance axios dari api.js agar auto-refresh token berjalan
      const res = await api.get('/orders/history');
      setOrders(res.data);
    } catch (err) {
      toast.error("Error koneksi saat mengambil data pesanan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'Completed' || o.status === 'CheckOut' || o.status === 'Served')
      .filter(o => {
        const orderDate = new Date(o.date);
        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      });
  }, [orders, filter]);

  const salesTrendData = useMemo(() => {
    const salesByDate = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.date).toISOString().slice(0, 10);
      salesByDate[date] = (salesByDate[date] || 0) + Number(order.total || 0);
    });
    return Object.keys(salesByDate).sort().map(date => ({
      date,
      Pendapatan: salesByDate[date]
    }));
  }, [filteredOrders]);

  const topProductsData = useMemo(() => {
    const productCount = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productCount[item.name]) {
          productCount[item.name] = { name: item.name, Terjual: 0, Pendapatan: 0 };
        }
        productCount[item.name].Terjual += 1;
        const price = parseInt(String(item.price || '0').replace(/[^0-9]/g, ''), 10);
        productCount[item.name].Pendapatan += price;
      });
    });
    return Object.values(productCount).sort((a, b) => b.Terjual - a.Terjual).slice(0, 5);
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, order) => acc + Number(order.total || 0), 0);
  }, [filteredOrders]);

  return {
    loading,
    filter,
    setFilter,
    salesTrendData,
    topProductsData,
    totalRevenue,
    totalOrders: filteredOrders.length
  };
};