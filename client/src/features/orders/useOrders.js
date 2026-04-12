import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchOrders = useCallback(async () => {
    try {
      // Memanfaatkan Axios Interceptor yang sudah kita buat di api.js
      const res = await api.get('/orders/history');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data pesanan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Status pesanan #${orderId} diubah menjadi ${newStatus}`);
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengubah status pesanan.");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.status !== 'all' && order.status !== filters.status) return false;
      if (filters.search &&
        !(order.customerName?.toLowerCase() || '').includes(filters.search.toLowerCase()) &&
        !String(order.id).includes(filters.search)) {
        return false;
      }
      const orderDate = new Date(order.date);
      if (filters.startDate && new Date(filters.startDate) > orderDate) return false;
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (end < orderDate) return false;
      }
      return true;
    });
  }, [orders, filters]);

  return {
    orders,
    filteredOrders,
    loading,
    filters,
    setFilters,
    handleStatusChange
  };
};