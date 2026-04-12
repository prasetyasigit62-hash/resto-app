import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Restoran from '../../features/menu/Restoran.jsx';
import BackOffice from '../../features/admin/BackOffice.jsx';
import KitchenView from '../../features/kitchen/KitchenView.jsx';
import Dashboard from '../../features/dashboard/Dashboard.jsx';
import DashboardV2 from '../../features/dashboard/DashboardV2.jsx';
import PosMain from '../../features/pos/PosMain.jsx';
import SalesReport from '../../features/dashboard/SalesReport.jsx';
import Inventory from '../../features/inventory/Inventory.jsx';
import TableLayout from '../../features/tables/TableLayout.jsx';
import TableManagement from '../../features/tables/TableManagement.jsx';
import Reservations from '../../features/crm/Reservations.jsx';
import Reviews from '../../features/crm/Reviews.jsx';
import Vouchers from '../../features/crm/Vouchers.jsx';
import Suppliers from '../../features/inventory/Suppliers.jsx';
import InventoryReport from '../../features/inventory/InventoryReport.jsx';
import ShiftReport from '../../features/dashboard/ShiftReport.jsx';
import MenuCosting from '../../features/inventory/MenuCosting.jsx';
import Attendance from '../../features/attendance/Attendance.jsx';
import Finance from '../../features/dashboard/Finance.jsx';
import CRM from '../../features/crm/CRM.jsx';
import AiInsights from '../../features/dashboard/AiInsights.jsx';
import UserManagementV2 from '../../features/admin/UserManagementV2.jsx';
import OutletComparisonV2 from '../../features/dashboard/OutletComparisonV2.jsx';
import MenuBomV2 from '../../features/inventory/MenuBomV2.jsx';
import InventoryV2 from '../../features/inventory/InventoryV2.jsx';
import StockMutationV2 from '../../features/inventory/StockMutationV2.jsx';
import PurchaseOrderV2 from '../../features/inventory/PurchaseOrderV2.jsx';
import OutletManagement from '../../features/admin/OutletManagement.jsx';

// ✨ Inisialisasi React Query Client
const queryClient = new QueryClient();

const RestoranApp = (props) => {
  const { activeService, data, user, currentItems } = props;

    // Filter data khusus untuk dashboard modul ini
    const moduleData = { Restoran: data.Restoran || [] };

    const renderRestoranContent = () => {
        switch (activeService) {
            case 'Restoran':
                return <Restoran {...props} data={currentItems || []} />;
            case 'KitchenView':
                return <KitchenView />;
            case 'BackOffice':
                return <BackOffice {...props} />;
            case 'POS':
                return <PosMain {...props} />;
            case 'SalesReport': // Rute baru untuk Laporan
                return <SalesReport {...props} />;
            case 'Inventory': // ✨ NEW Route
                return <Inventory {...props} />;
            case 'InventoryReport': // ✨ NEW Route
                return <InventoryReport {...props} />;
            case 'ShiftReport': // ✨ NEW Route
                return <ShiftReport {...props} />;
            case 'MenuCosting': // ✨ NEW Route
                return <MenuCosting {...props} />;
            case 'MenuBOM': // ✨ Gabungan Resep & Margin
                return <MenuBomV2 {...props} />;
            case 'InventoryV2': // ✨ Master Bahan Baku
                return <InventoryV2 {...props} />;
            case 'StockOpname': // ✨ Manajemen Stok & Opname
                return <StockMutationV2 {...props} />;
            case 'PurchaseOrder': // ✨ Pembelian (PO)
                return <PurchaseOrderV2 {...props} />;
            case 'UserManagementV2': // ✨ NEW Route
                return <UserManagementV2 {...props} />;
            case 'OutletManagement': // ✨ Manajemen Cabang
                return <OutletManagement {...props} />;
            case 'OutletComparisonV2': // ✨ NEW Route
                return <OutletComparisonV2 {...props} />;
            case 'Attendance': // ✨ NEW Route
                return <Attendance {...props} />;
            case 'Finance': // ✨ NEW Route
                return <Finance {...props} />;
            case 'TableLayout': // ✨ NEW Route
                return <TableLayout {...props} />;
            case 'Tables': // ✨ NEW Route
                return <TableManagement {...props} />;
            case 'Reservations': // ✨ NEW Route
                return <Reservations {...props} />;
            case 'Reviews': // ✨ NEW Route
                return <Reviews {...props} />;
            case 'Vouchers': // ✨ NEW Route
                return <Vouchers {...props} />;
            case 'Suppliers': // ✨ NEW Route
                return <Suppliers {...props} />;
            case 'CRM': // ✨ NEW Route
                return <CRM {...props} />;
            case 'AiInsights': // ✨ NEW Route
                return <AiInsights {...props} />;
            case 'DashboardKPI': // ✨ Dashboard Utama V2
                return <DashboardV2 {...props} />;
            default:
                return <PosMain {...props} />;
        }
    };

    return (
        <QueryClientProvider client={queryClient}>
            <div className="module-app-container">
                {renderRestoranContent()}
            </div>
        </QueryClientProvider>
    );
};

export default RestoranApp;
