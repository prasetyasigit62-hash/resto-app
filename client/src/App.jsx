import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { useAuth } from './AuthContext.jsx';
import BackOffice from './features/admin/BackOffice.jsx';
import Login from './features/auth/Login.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import Settings from './features/account/Settings.jsx';
import Profile from './features/account/Profile.jsx';
import ActivityLog from './features/admin/ActivityLog.jsx';
import Help from './features/crm/Help.jsx';
import Orders from './features/orders/Orders.jsx';
import Reports from './features/reports/Reports.jsx';
import AiInsights from './features/dashboard/AiInsights.jsx';
// --- Import App Containers ---
import RestoranApp from './components/apps/RestoranApp.jsx';
import SelfOrder from './features/consumer/SelfOrder.jsx';
import { ToastContainer, toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'react-toastify/dist/ReactToastify.css';

// ✨ FITUR 4: Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const getBackendUrl = () => import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const serviceComponents = {
  Dashboard,
  BackOffice,
  Settings,
  Profile,
  ActivityLog,
  Help,
  Orders,
  Reports,
  AiInsights,
};

function App() {
  const { user, logout, updateUser, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('resto_notifs_cache');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [activeOutletId, setActiveOutletId] = useState('ALL');
  const [outlets, setOutlets] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onConfirmWithValue: null,
    inputValue: '',
    inputType: null,
    inputPlaceholder: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal'
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (newNotif) => {
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 20);
      localStorage.setItem('resto_notifs_cache', JSON.stringify(updated));

      const lastReadTime = localStorage.getItem('resto_last_read_notif') || 0;
      setUnreadCount(updated.filter(log => new Date(log.timestamp).getTime() > Number(lastReadTime)).length);

      return updated;
    });
  };

  const [modalInputValue, setModalInputValue] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [activeService, setActiveService] = useState(() => {
      const saved = localStorage.getItem('resto_activeService');
      return (saved && saved !== 'Dashboard') ? saved : 'DashboardKPI';
  });
  const [data, setData] = useState({
    Restoran: [],
  });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('resto_theme') === 'dark';
  });
  // ✨ STATE BARU: Menyimpan menu dinamis dari Database
  const [dynamicMenus, setDynamicMenus] = useState({});
  const currentModule = 'Restoran'; // Hardcode khusus Resto App

  useEffect(() => { localStorage.setItem('resto_activeService', activeService); }, [activeService]);

  const services = [
    'Dashboard',
    'Restoran',
    'Reservations',
    'Tables',
    'Vouchers',
    'Customers'
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('resto_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ✨ FETCH WARNA TEMA PUBLIK (Berjalan walau belum login)
  useEffect(() => {
    fetch(`${getBackendUrl()}/api/public/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', data.primaryColor);
          document.documentElement.style.setProperty('--primary-hover', data.primaryColor + 'E6');
        }
      }).catch(() => {});
  }, []);

  // ✨ FETCH DAFTAR OUTLET UNTUK DROPDOWN HEADER
  useEffect(() => {
    if (user && ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(String(user.role).toUpperCase())) {
        const token = localStorage.getItem('resto_token');
        fetch(`${getBackendUrl()}/api/v2/outlets`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setOutlets(Array.isArray(data) ? data : []))
            .catch(err => console.error("Gagal load outlets untuk dropdown:", err));
    }
  }, [user]);

  // ✨ FETCH MENU DINAMIS BERDASARKAN ROLE
  useEffect(() => {
    if (user) {
        const token = localStorage.getItem('resto_token');
        fetch(`${getBackendUrl()}/api/system/menus`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setDynamicMenus(data);
                }
            })
            .catch(err => console.error(err));
    }
  }, [user]);

  // ✨ FIX: Kunci aplikasi 100% di modul Restoran saat halaman di-refresh
  useEffect(() => {
    if (user) {
        const userRole = String(user.role || '').toUpperCase();
        if ((activeService === 'Dashboard' || activeService === 'DashboardKPI') && !['OWNER', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
            if (userRole === 'CHEF') {
                setActiveService('KitchenView');
            } else {
                setActiveService('POS');
            }
        } else if (activeService === 'Dashboard' && ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(userRole)) {
            setActiveService('DashboardKPI');
        }
    }
  }, [user, activeService]);

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const dataServices = services.filter(s => s !== 'Dashboard');
      try {
        const responses = await Promise.all(
          dataServices.map(s => fetch(`${getBackendUrl()}/api/${s.toLowerCase()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }))
        );
        const jsonData = await Promise.all(responses.map(res => {
          if (!res.ok) return [];
          return res.json();
        }));

        const newDataState = {};
        dataServices.forEach((service, index) => {
          newDataState[service] = jsonData[index];
        });

        setData(newDataState);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user]);

  // ✨ FITUR 4: Setup Firebase Cloud Messaging & Minta Izin Notifikasi
  useEffect(() => {
    if (!user) return;
    
    const setupFCM = async () => {
      // ✨ FITUR PUSH NOTIFICATION DIMATIKAN SEMENTARA
      console.log("ℹ️ Fitur Push Notification dinonaktifkan sementara.");
      return;
      try {
        // TODO: Masukkan konfigurasi Firebase Anda di sini
        const firebaseConfig = {
          apiKey: "AIzaSyCOl8oTsmA-I0fbtXC9WRlCMURBD4CvsVE",
          projectId: "superapp-da381",
          messagingSenderId: "256774617757",
          appId: "1:256774617757:web:54512d653a20d842367274"
        };
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, { vapidKey: 'BHpaqJf1wg-aFP0E2sHSGyqeemp82e6hgX_PmRgw1nMoPZQLT-z4d62hHdAqqx04IPcl1K3Vd0o4lmhnXEO8DRQ' });
            if (currentToken) {
                // Kirim token device ini ke backend
                await fetch(`${getBackendUrl()}/api/users/fcm-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('resto_token')}` },
                    body: JSON.stringify({ fcmToken: currentToken })
                });
                
                // Dengarkan notifikasi saat aplikasi sedang dibuka
                onMessage(messaging, (payload) => {
                    toast.info(<div><strong>{payload.notification.title}</strong><br/>{payload.notification.body}</div>, { icon: "🔔", autoClose: false });
                });
            }
        }
      } catch (err) {
        console.error("Gagal setup FCM:", err);
      }
    };
    setupFCM();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/system/activity-log`);
        if (res.ok) {
          const logs = await res.json();

          const normalizedBackendLogs = logs.map(log => {
            const actionStr = log.action ? log.action.toUpperCase() : '';
            const isRestoAction = actionStr.includes('ORDER') || actionStr.includes('CHECKOUT');
            return {
              ...log,
              message: log.message || log.details || `Aktivitas ${log.action}`,
              service: log.service || 'System'
            };
          });

          setNotifications(prev => {
            const currentNotifs = [...prev];

            normalizedBackendLogs.forEach(bLog => {
              const bTime = new Date(bLog.timestamp).getTime();

              const hasLocalTwin = currentNotifs.some(lLog => {
                if (lLog.action) return false;
                const lTime = new Date(lLog.timestamp).getTime();
                return Math.abs(bTime - lTime) < 15000;
              });

              if (!hasLocalTwin && !currentNotifs.some(m => m.id === bLog.id)) {
                currentNotifs.push(bLog);
              }
            });

            const finalNotifs = currentNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);

            localStorage.setItem('resto_notifs_cache', JSON.stringify(finalNotifs));

            const lastReadTime = localStorage.getItem('resto_last_read_notif') || 0;
            setUnreadCount(finalNotifs.filter(log => new Date(log.timestamp).getTime() > Number(lastReadTime)).length);

            return finalNotifs;
          });
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.length > 0) {
      setUnreadCount(0);
      localStorage.setItem('resto_last_read_notif', new Date().getTime());
    }
  };

  useEffect(() => {
    if (confirmModal.show) {
      setModalInputValue(confirmModal.inputValue || '');
    } else {
      setModalInputValue('');
    }
  }, [confirmModal.show, confirmModal.inputValue]);

  const handleDataAdded = (serviceType, newItem) => {
    const serviceKey = Object.keys(data).find(key => key.toLowerCase() === serviceType.toLowerCase());
    if (serviceKey) {
      setData(prevData => ({
        ...prevData,
        [serviceKey]: [...prevData[serviceKey], newItem]
      }));
    }
  };

  const requestDelete = (serviceType, id) => {
    setModalInputValue('');
    setConfirmModal({
      show: true,
      title: 'Hapus Data',
      message: 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        await performDelete(serviceType, id);
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const performDelete = async (serviceType, id) => {
    const token = localStorage.getItem('resto_token');
    try {
      const response = await fetch(`${getBackendUrl()}/api/delete/${serviceType.toLowerCase()}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const serviceKey = Object.keys(data).find(key => key.toLowerCase() === serviceType.toLowerCase());
        if (serviceKey) {
          setData(prevData => ({
            ...prevData,
            [serviceKey]: prevData[serviceKey].filter(item => item.id !== id)
          }));
        }
        toast.success('Data berhasil dihapus!');
      } else {
        toast.error('Gagal menghapus data di server');
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleEditClick = (serviceType, item) => {
    setEditingItem({ service: serviceType, item });
    setActiveService('BackOffice');
  };

  const handleSelectionChange = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (pageItems) => {
    const pageItemIds = pageItems.map(item => item.id);
    const allSelected = pageItemIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageItemIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageItemIds])]);
    }
  };

  const requestDeleteSelected = () => {
    setModalInputValue('');
    setConfirmModal({
      show: true,
      title: 'Hapus Banyak Data',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} item yang dipilih?`,
      onConfirm: async () => {
        await performDeleteSelected();
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const performDeleteSelected = async () => {
    const token = localStorage.getItem('resto_token');
    try {
      const response = await fetch(`${getBackendUrl()}/api/delete-many/${activeService.toLowerCase()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (response.ok) {
        setData(prevData => ({
          ...prevData,
          [activeService]: prevData[activeService].filter(item => !selectedIds.includes(item.id))
        }));
        setSelectedIds([]);
        toast.success(`${selectedIds.length} item berhasil dihapus.`);
      } else { toast.error('Gagal menghapus item.'); }
    } catch (error) { toast.error('Error koneksi saat menghapus.'); }
  };

  const handleViewClick = (item) => {
    setViewingItem(item);
  };

  const handleDataUpdated = (serviceType, updatedItem) => {
    const serviceKey = Object.keys(data).find(key => key.toLowerCase() === serviceType.toLowerCase());
    if (serviceKey) {
      setData(prevData => ({
        ...prevData,
        [serviceKey]: prevData[serviceKey].map(item => item.id === updatedItem.id ? updatedItem : item)
      }));
    }
    setEditingItem(null);
    setActiveService(serviceKey);
    toast.info('Mode edit selesai');
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    const dataToExport = data[activeService];
    if (!dataToExport || dataToExport.length === 0) {
      toast.warn('Tidak ada data untuk diexport');
      return;
    }

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_${activeService}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Laporan ${activeService} berhasil didownload!`);
  };

  const handleExportPDF = () => {
    const rawData = data[activeService];
    const dataToExport = Array.isArray(rawData) ? rawData.filter(item => item) : [];

    if (dataToExport.length === 0) {
      toast.warn('Tidak ada data untuk diexport');
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(`Laporan Data ${activeService}`, 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);
      doc.text(`Oleh Admin: ${user.username}`, 14, 27);

      if (dataToExport.length > 0) {
        const allKeys = new Set();
        dataToExport.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));

        const headers = Array.from(allKeys).filter(key => !['image', 'id', 'createdAt', 'lastModified'].includes(key));
        const tableData = dataToExport.map(item => headers.map(key => {
          const val = item[key];
          return val !== null && val !== undefined ? String(val) : '';
        }));

        autoTable(doc, {
          head: [headers.map(h => h.toUpperCase())],
          body: tableData,
          startY: 35,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [231, 76, 60] }
        });
      }

      const pdfBlobUrl = doc.output('bloburl');
      setPdfPreviewUrl(pdfBlobUrl);

    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      toast.error("Gagal membuat PDF. Pastikan data valid.");
    }
  };

  const handleImportClick = () => {
    document.getElementById('import-file').click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const firstLine = text.split('\n')[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';

      const lines = text.split('\n');
      if (lines.length < 2) {
        toast.error('File CSV kosong atau format salah.');
        return;
      }
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/[\r"]/g, ''));

      const result = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const obj = {};
        const currentline = lines[i].split(delimiter);

        for (let j = 0; j < headers.length; j++) {
          if (currentline[j] !== undefined) {
            obj[headers[j]] = currentline[j].trim().replace(/[\r"]/g, '');
          }
        }
        if (Object.keys(obj).length > 0) result.push(obj);
      }

      const token = localStorage.getItem('resto_token');
      try {
        const res = await fetch(`${getBackendUrl()}/api/import/${activeService.toLowerCase()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(result)
        });
        const dataRes = await res.json();
        if (res.ok) {
          toast.success(dataRes.message);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error(dataRes.error || 'Gagal import data dari server.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal terhubung ke server saat import.');
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const currentDataRaw = data[activeService];
  const safeData = Array.isArray(currentDataRaw) ? currentDataRaw : [];

  const filteredData = useMemo(() => {
    return safeData.filter(item => {
      if (!item) return false;
      if (!searchTerm) return true;
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [safeData, searchTerm]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a ? (a[sortConfig.key] ?? '') : '';
        const valB = b ? (b[sortConfig.key] ?? '') : '';

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const getBreadcrumbs = () => {
    if (activeService === 'Dashboard') return 'Home / Dashboard';
    if (activeService === 'Profile') return 'User / Profile';
    if (services.includes(activeService) && activeService !== 'Dashboard') return `Main Menu / ${activeService}`;
    if (activeService === 'UserManagementV2') return 'System / Manajemen Pegawai';
    if (currentModule) return `${currentModule} App / ${activeService}`;
    if (['BackOffice', 'ActivityLog', 'Settings', 'Help'].includes(activeService)) return `System / ${activeService.replace(/([A-Z])/g, ' $1').trim()}`;
    return 'Home';
  };

  const renderContent = () => {
    if (!activeService) {
      return (
        <div className="welcome-message">
          <h2>Welcome to Resto App!</h2>
          <p>Please select a service from the navigation menu to begin.</p>
        </div>
      );
    }

    if (loading && activeService !== 'BackOffice') {
      return <div className="service-view"><h2>Loading {activeService}...</h2></div>;
    }

    if (activeService === 'Dashboard') {
      return <Dashboard data={{ Restoran: data.Restoran }} darkMode={darkMode} notifications={notifications.filter(n => n.service === 'Restoran' || n.service === 'System')} />;
    }

    if (activeService === 'Settings') {
      return <Settings user={user} />;
    }
    if (activeService === 'Profile') {
      return <Profile user={user} onUpdateUser={updateUser} />;
    }
    if (activeService === 'ActivityLog') {
      return <ActivityLog />;
    }
    if (activeService === 'Help') {
      return <Help />;
    }
    if (activeService === 'Reports') {
      return <Reports data={data} />;
    }

      const appProps = {
        activeService,
        data,
        currentItems,
        user,
        darkMode,
        notifications,
        addNotification,
        setConfirmModal,
        onDataAdded: handleDataAdded,
        onDataUpdated: handleDataUpdated,
        onDelete: (id) => requestDelete(activeService, id),
        onEdit: (item) => handleEditClick(activeService, item),
        onSort: handleSort,
        onView: handleViewClick,
        selectedIds,
        onSelectionChange: handleSelectionChange,
        onSelectAll: () => handleSelectAll(currentItems),
        sortConfig,
        editingItem,
        onCancel: () => {
          setEditingItem(null);
          setActiveService(editingItem ? editingItem.service : activeService);
        },
        initialService: activeService.toLowerCase(),
        activeOutletId: activeOutletId // ✨ Pass filter cabang ke komponen anak (Dashboard)
      };

    const ServiceComponent = serviceComponents[activeService];

    // Jika tidak ada di ServiceComponent (berarti menu spesifik Resto), lempar ke RestoranApp
    if (!ServiceComponent) {
      return <RestoranApp {...appProps} />;
    }

    return activeService === 'BackOffice'
      ? <BackOffice
        onDataAdded={handleDataAdded}
        initialService={currentModule ? currentModule.toLowerCase() : 'restoran'}
        editingItem={editingItem}
        onDataUpdated={handleDataUpdated}
        onCancel={() => {
          setEditingItem(null);
          setActiveService(editingItem ? editingItem.service : 'Restoran');
        }}
      />
      : <ServiceComponent
        data={currentItems}
        onDelete={(id) => requestDelete(activeService, id)}
        onEdit={(item) => handleEditClick(activeService, item)}
        onSort={handleSort}
        onView={handleViewClick}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={() => handleSelectAll(currentItems)}
        sortConfig={sortConfig}
        user={user}
      />;
  };

  // ✨ CSS Global Responsif untuk Tampilan Mobile & Tablet
  const globalMobileCSS = `
    .hamburger-btn { display: none; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--text-color); margin-right: 15px; padding: 5px; border-radius: 8px; }
    .hamburger-btn:hover { background: rgba(0,0,0,0.05); }
    .mobile-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 999; backdrop-filter: blur(4px); animation: fadeIn 0.3s; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    @media (max-width: 992px) {
      /* Mengecilkan skala UI secara keseluruhan di HP (dari 16px menjadi 12px) */
      html { font-size: 12px !important; touch-action: manipulation; }

      /* Penataan Sidebar & Wrapper Utama */
      .sidebar { position: fixed; left: -300px; top: 0; bottom: 0; z-index: 1000; width: 280px; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 5px 0 25px rgba(0,0,0,0.15); }
      .sidebar.open { left: 0; }
      
      .main-wrapper { margin-left: 0 !important; width: 100% !important; padding: 12px !important; box-sizing: border-box; }
      
      /* Penataan Topbar (Sistem Simetris & Rapih) */
      .topbar { flex-direction: column; align-items: stretch; height: auto !important; padding: 16px !important; gap: 16px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
      .topbar-left { display: grid !important; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 15px; row-gap: 4px; align-items: center; width: 100%; }
      .hamburger-btn { display: flex !important; grid-column: 1; grid-row: 1 / span 2; margin: 0; background: #f1f5f9; border-radius: 10px; width: 44px; height: 44px; align-items: center; justify-content: center; border: 1px solid #e2e8f0; }
      .breadcrumbs { grid-column: 2; grid-row: 1; font-size: 0.85rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); line-height: 1; }
      .topbar-left h2 { grid-column: 2; grid-row: 2; margin: 0; font-size: 1.6rem; line-height: 1.2; word-break: break-word; color: var(--text-color); font-weight: 800; }
      
      .topbar-right { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; width: 100%; justify-content: flex-end; }
      .branch-selector { flex: 1; min-width: 140px; margin-right: auto !important; justify-content: space-between; border-radius: 12px !important; height: 44px; padding: 0 15px !important; order: 1; }
      .notification-wrapper { order: 2; margin-right: 0 !important; }
      .theme-toggle { order: 3; margin: 0 !important; width: 44px !important; height: 44px !important; display: flex !important; align-items: center; justify-content: center; border-radius: 12px !important; background: var(--card-bg) !important; border: 1px solid var(--border-color) !important; padding: 0 !important; }
      .search-wrapper { order: 4; width: 100%; margin-top: 5px; }
      
      /* Paksa grid 2 kolom menjadi 1 kolom di HP (Dashboard, Sales, Finance) */
      [style*="grid-template-columns: 2fr 1fr"],
      [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      
      /* Izinkan tabel digeser secara horizontal tanpa merusak layout */
      .table-responsive, table { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; }
      
      /* Tumpuk tombol dan pencarian di header tiap halaman agar tidak tumpang tindih */
      .service-view > div:first-child { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
      .service-view > div:first-child > div { width: 100% !important; display: flex; flex-wrap: wrap; justify-content: flex-start !important; gap: 10px; }
      
      /* Perbaiki ukuran Pop-up / Modal agar pas di layar HP */
      .modal-content, .modal-content-animated, .modal-container-modern { width: 95% !important; max-width: none !important; margin: 15px auto !important; padding: 24px !important; max-height: 90vh; overflow-y: auto; border-radius: 20px; }
      
      /* Modifikasi lebar input/button agar mudah ditekan jari */
      input[type="date"], input[type="month"], select, .profile-save-btn, .btn-success-sm { width: 100% !important; box-sizing: border-box; justify-content: center; }
      
      /* Mencegah iPhone Safari/Chrome otomatis zoom-in saat mengklik kolom input */
      input, select, textarea { font-size: 16px !important; }
    }
  `;

  const renderPagination = () => {
    if (activeService === 'Dashboard' || activeService === 'BackOffice' || activeService === 'Settings' || activeService === 'Profile' || totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          &lt; Sebelumnya
        </button>
        <span style={{ margin: '0 15px', fontWeight: 'bold' }}>
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Selanjutnya &gt;
        </button>
      </div>
    );
  };


  // --- ROUTER SEDERHANA ---
  if (window.location.pathname.startsWith('/order/')) {
    const tableId = window.location.pathname.split('/')[2];
    return <SelfOrder tableId={tableId} />;
  }

  // Show a loading screen while auth state is being determined
  if (authLoading) {
    return <div className="loading-fullscreen">Memuat Sesi...</div>
  }

  // ✨ FIX FINAL LOGIN: Penguncian portal yang dieksekusi detik itu juga!
  if (!user) {
    return <Login />;
  }

  // ✨ FILTER AKSES ROLE (RBAC)
  const userRole = String(user?.role || '').toUpperCase();
  const isAdminOrOwner = ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(userRole);
  const isKasir = userRole === 'KASIR';
  const isChef = userRole === 'CHEF';

  return (
    <div className="app-layout">
      <style>{globalMobileCSS}</style>
      {/* ✨ FIX BUG: CSS Global untuk memaksa konten semua tabel rata tengah */}
      <style>{`
        .content-area table th, 
        .content-area table td {
          text-align: center !important;
          vertical-align: middle !important;
        }
      `}</style>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme={darkMode ? "dark" : "light"}
      />

      {confirmModal.show && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-container-modern">

            <div className="modal-header-modern">
              <h3 className="modal-title-modern">
                {confirmModal.title.toLowerCase().includes('hapus') || confirmModal.title.toLowerCase().includes('delete') ?
                  <span className="modal-title-icon">⚠️</span> :
                  <span className="modal-title-icon">📝</span>
                }
                {confirmModal.title}
              </h3>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="modal-close-modern"
              >
                &times;
              </button>
            </div>

            <div className="modal-body-modern">
              <p className="modal-message-modern">{confirmModal.message}</p>

              {confirmModal.inputType === 'textarea' ? (
                <textarea
                  value={modalInputValue}
                  onChange={(e) => setModalInputValue(e.target.value)}
                  placeholder={confirmModal.inputPlaceholder}
                  autoFocus
                  className="modal-textarea"
                />
              ) : confirmModal.inputType && (
                <input
                  type={confirmModal.inputType}
                  value={modalInputValue}
                  onChange={(e) => setModalInputValue(e.target.value)}
                  placeholder={confirmModal.inputPlaceholder}
                  autoFocus
                  className="modal-input"
                />
              )}
            </div>

            <div className="modal-footer-modern">
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              <button
                className="modal-btn modal-btn-primary"
                style={{ background: (confirmModal.title.toLowerCase().includes('hapus') || confirmModal.title.toLowerCase().includes('delete')) ? 'var(--danger-color)' : 'var(--primary-color)' }}
                onClick={() => {
                  if (confirmModal.onConfirmWithValue) {
                    confirmModal.onConfirmWithValue(modalInputValue);
                  } else if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                }}
              >
                {confirmModal.confirmText || 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="modal-overlay" onClick={() => setPdfPreviewUrl(null)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Preview Laporan PDF</h3>
              <button className="modal-close" onClick={() => setPdfPreviewUrl(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#525659' }}>
              <iframe src={pdfPreviewUrl} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview"></iframe>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setPdfPreviewUrl(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Data</h3>
              <button className="modal-close" onClick={() => setViewingItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {viewingItem.image && (
                <img
                  src={viewingItem.image}
                  alt={viewingItem.name}
                  className="modal-image"
                />
              )}
              <div className="modal-info-grid">
                <div className="info-item">
                  <label>ID</label>
                  <span>{viewingItem.id}</span>
                </div>
                <div className="info-item">
                  <label>Nama</label>
                  <span>{viewingItem.name}</span>
                </div>
                {Object.entries(viewingItem).map(([key, value]) => {
                  if (['id', 'name', 'image', 'createdAt', 'lastModified'].includes(key)) return null;
                  return (
                    <div className="info-item" key={key}>
                      <label style={{ textTransform: 'capitalize' }}>{key}</label>
                      <span>{value}</span>
                    </div>
                  );
                })}
                <div className="info-item">
                  <label>Dibuat</label>
                  <span>{viewingItem.createdAt ? new Date(viewingItem.createdAt).toLocaleString('id-ID') : '-'}</span>
                </div>
                <div className="info-item">
                  <label>Terakhir Diubah</label>
                  <span>{viewingItem.lastModified ? new Date(viewingItem.lastModified).toLocaleString('id-ID') : '-'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon" style={{ background: 'var(--primary-color)' }}>R</div>
          <h1>Resto App</h1>
        </div>

        <nav className="sidebar-menu" onClick={(e) => { if (e.target.closest('.menu-item')) setIsMobileSidebarOpen(false); }}>
              {/* ✨ RENDER MENU DINAMIS DARI DATABASE */}
              {Object.keys(dynamicMenus).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat Menu...</div>
              ) : (
                  Object.entries(dynamicMenus).map(([category, menus], idx) => (
                      <React.Fragment key={category}>
                          <div className="menu-label" style={{ marginTop: idx === 0 ? '10px' : '20px' }}>{category}</div>
                          {Array.isArray(menus) && menus.map(menu => (
                              <button key={menu.service_name} onClick={() => setActiveService(menu.service_name)} className={`menu-item ${activeService === menu.service_name ? 'active' : ''}`}>
                                  <span style={{ marginRight: '10px' }}>{menu.icon}</span> {menu.title}
                              </button>
                          ))}
                      </React.Fragment>
                  ))
              )}

              {isAdminOrOwner && (
                 <button onClick={() => window.open('/order/preview', '_blank')} className="menu-item" style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                   <span style={{ marginRight: '10px' }}>📱</span> Preview Self-Order Pelanggan
                 </button>
              )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-card" onClick={() => setActiveService('Profile')} title="Lihat Profil">
            <div className="user-info-group">
              <div className="user-avatar-pro">
                {user.image ? (
                  <img src={user.image} alt="avatar" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="user-meta">
                <span className="user-name-pro">{user.username}</span>
                <span className="user-role-pro">{user.role}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="logout-btn-pro"
              title="Keluar / Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '20px' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {isMobileSidebarOpen && <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>}

      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
            <div className="breadcrumbs">{getBreadcrumbs()}</div>
            <h2>{activeService === 'AiInsights' ? 'Smart Operational Insight' : activeService.replace(/([A-Z])/g, ' $1').trim()}</h2>
          </div>
          <div className="topbar-right">

            {isAdminOrOwner && (
                <div className="branch-selector" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px', background: 'var(--card-bg)', padding: '5px 15px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏢</span>
                  <select
                    value={activeOutletId}
                    onChange={(e) => {
                      setActiveOutletId(e.target.value);
                      toast.info(e.target.value === 'ALL' ? 'Menampilkan Omzet Semua Cabang' : `Filter aktif untuk cabang terpilih`);
                    }}
                  style={{ background: 'transparent', border: 'none', fontWeight: 'bold', color: 'var(--text-color)', outline: 'none', cursor: 'pointer', width: '100%', maxWidth: '160px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                  >
                  <option value="ALL">Semua Cabang</option>
                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
            )}

            <div className="notification-wrapper" style={{ position: 'relative', marginRight: '15px' }}>
              <button
                onClick={handleNotificationClick}
                className="theme-toggle"
                title="Notifikasi"
                style={{ position: 'relative', fontSize: '1.2rem', padding: '8px' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '2px solid var(--bg-color)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown" style={{
                  position: 'absolute', top: '50px', right: '-10px', width: '320px',
                  backgroundColor: darkMode ? '#2c3e50' : 'white',
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                  zIndex: 1000, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 15px', borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`, fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Aktivitas Terbaru
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>Belum ada notifikasi</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{ padding: '12px 15px', borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: notif.action === 'ALERT' ? '#e74c3c' : (notif.action === 'DELETE' ? '#e74c3c' : (notif.action === 'CREATE' ? '#2ecc71' : '#3498db')), fontSize: '0.75rem' }}>{notif.action || 'NEW ORDER'}</span>
                            <span style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ color: darkMode ? '#ddd' : '#555' }}>{notif.details || notif.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div onClick={() => { setActiveService('ActivityLog'); setShowNotifications(false); }} style={{ padding: '10px', textAlign: 'center', backgroundColor: darkMode ? '#34495e' : '#f9f9f9', cursor: 'pointer', fontSize: '0.85rem', color: '#3498db', fontWeight: '500' }}>
                    Lihat Semua Aktivitas
                  </div>
                </div>
              )}
            </div>

            {activeService !== 'BackOffice' && activeService !== 'Dashboard' && activeService !== 'Settings' && activeService !== 'ActivityLog' && activeService !== 'Help' && (
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="search-input"
                />
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle" title="Toggle Theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="content-area">
          {services.includes(activeService) && activeService !== 'Dashboard' && (
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <input type="file" id="import-file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

          {String(user.role || '').toLowerCase() === 'admin' && (
                <button onClick={handleImportClick} className="btn-success-sm" style={{ backgroundColor: '#3498db', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  📥 Import CSV
                </button>
              )}
              <button onClick={handleExport} className="btn-success-sm" style={{ backgroundColor: '#27ae60', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                📤 Export CSV
              </button>
              <button onClick={handleExportPDF} className="btn-success-sm" style={{ backgroundColor: '#e74c3c', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                📑 Export PDF
              </button>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="selection-bar">
              <span>{selectedIds.length} item dipilih</span>
              {user.role === 'admin' && (
                <button onClick={requestDeleteSelected} className="btn-danger-sm">Hapus Terpilih</button>
              )}
            </div>
          )}
            <div key={activeService} className="animate-enter">
              {renderContent()}
              {renderPagination()}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;