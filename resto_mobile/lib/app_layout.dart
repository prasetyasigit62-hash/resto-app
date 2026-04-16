import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';
import 'login_screen.dart';
import 'attendance_screen.dart';
import 'dashboard_screen.dart';
import 'pos_screen.dart';
import 'kitchen_screen.dart';
import 'inventory_screen.dart';
import 'menu_management_screen.dart';
import 'crm_screen.dart';
import 'tables_screen.dart';
import 'sales_report_screen.dart';
import 'finance_screen.dart';
import 'shift_report_screen.dart';
import 'suppliers_screen.dart';
import 'purchase_order_screen.dart';
import 'stock_opname_screen.dart';
import 'user_management_screen.dart';
import 'settings_screen.dart';
import 'reservations_screen.dart';
import 'vouchers_screen.dart';
import 'ai_insights_screen.dart';

class AppLayout extends StatefulWidget {
  const AppLayout({super.key});

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
  String _activeService = 'DashboardKPI';
  Map<String, dynamic> _dynamicMenus = {};
  bool _isLoadingMenus = true;
  String _username = 'User';
  String _userRole = 'Staff';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    final userData = prefs.getString('user_data');

    if (userData != null) {
      final user = jsonDecode(userData);
      setState(() {
        _username = user['username'] ?? 'User';
        _userRole = user['role'] ?? 'Staff';
      });
    }

    try {
      final response = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/system/menus'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        setState(() {
          _dynamicMenus = jsonDecode(response.body);
          _isLoadingMenus = false;
        });
      } else {
        setState(() => _isLoadingMenus = false);
      }
    } catch (e) {
      setState(() => _isLoadingMenus = false);
    }
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_data');
    if (mounted)
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
  }

  String _getActiveTitle() {
    for (var cat in _dynamicMenus.values) {
      for (var menu in cat) {
        if (menu['service_name'] == _activeService) return menu['title'];
      }
    }
    return _activeService;
  }

  Widget _buildScreen() {
    switch (_activeService) {
      case 'DashboardKPI':
        return const DashboardScreen();
      case 'POS':
        return const PosScreen();
      case 'KitchenView':
        return const KitchenScreen();
      case 'Attendance':
        return const AttendanceScreen();
      case 'MenuBOM':
        return const MenuManagementScreen();
      case 'InventoryV2':
        return const InventoryScreen();
      case 'CRM':
        return const CrmScreen();
      case 'Tables':
        return const TablesScreen();
      case 'SalesReport':
        return const SalesReportScreen();
      case 'Finance':
        return const FinanceScreen();
      case 'ShiftReport':
        return const ShiftReportScreen();
      case 'Suppliers':
        return const SuppliersScreen();
      case 'PurchaseOrder':
        return const PurchaseOrderScreen();
      case 'StockOpname':
        return const StockOpnameScreen();
      case 'UserManagementV2':
        return const UserManagementScreen();
      case 'Settings':
        return const SettingsScreen();
      case 'Reservations':
        return const ReservationsScreen();
      case 'Vouchers':
        return const VouchersScreen();
      case 'AiInsights':
        return const AiInsightsScreen();
      default:
        return Center(
          child: Text(
            'Layar $_activeService Sedang Dibangun...',
            style: const TextStyle(
              fontSize: 20,
              color: AppColors.textMutedLight,
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Deteksi ukuran layar: Jika lebar >= 800, anggap Tablet/Desktop (Sidebar Kiri Muncul)
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      drawer: !isDesktop
          ? _buildSidebar()
          : null, // Drawer/Menu geser hanya untuk Mobile
      body: Row(
        children: [
          if (isDesktop) _buildSidebar(), // Sidebar permanen untuk Tablet/Web
          Expanded(
            child: Column(
              children: [
                _buildTopbar(isDesktop),
                Expanded(child: _buildScreen()), // Konten utama di tengah
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Topbar dengan efek blur Glassmorphism (Sama seperti App.css web)
  Widget _buildTopbar(bool isDesktop) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: AppColors.cardLight.withOpacity(0.8),
            border: const Border(
              bottom: BorderSide(color: AppColors.borderLight),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (!isDesktop)
                    Builder(
                      builder: (ctx) => IconButton(
                        icon: const Icon(
                          Icons.menu,
                          color: AppColors.textLight,
                        ),
                        onPressed: () => Scaffold.of(ctx).openDrawer(),
                      ),
                    ),
                  if (!isDesktop) const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'HOME / ${_getActiveTitle().toUpperCase()}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMutedLight,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _getActiveTitle(),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ),
                  const SizedBox(width: 10),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: Text(
                      _username[0].toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 260,
      color: AppColors.cardLight,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.all(Radius.circular(8)),
                  ),
                  child: Center(
                    child: Text(
                      'R',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  'Resto App',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.borderLight),
          Expanded(
            child: _isLoadingMenus
                ? const Center(child: CircularProgressIndicator())
                : ListView(
                    padding: const EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: 12,
                    ),
                    children: _dynamicMenus.entries.map((entry) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(
                              left: 12,
                              top: 16,
                              bottom: 8,
                            ),
                            child: Text(
                              entry.key.toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.textMutedLight,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          ...entry.value.map((menu) {
                            final isSelected =
                                _activeService == menu['service_name'];
                            return Container(
                              margin: const EdgeInsets.symmetric(vertical: 2),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: ListTile(
                                leading: Text(
                                  menu['icon'],
                                  style: const TextStyle(fontSize: 18),
                                ),
                                title: Text(
                                  menu['title'],
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.white
                                        : AppColors.textLight,
                                    fontWeight: isSelected
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    fontSize: 14,
                                  ),
                                ),
                                onTap: () {
                                  setState(
                                    () => _activeService = menu['service_name'],
                                  );
                                  if (MediaQuery.of(context).size.width < 800)
                                    Navigator.pop(context);
                                },
                              ),
                            );
                          }).toList(),
                        ],
                      );
                    }).toList(),
                  ),
          ),
          // User Profile Meta & Logout Bottom Container
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.borderLight)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primary.withOpacity(0.2),
                  child: Text(
                    _username[0].toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _username,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        _userRole,
                        style: const TextStyle(
                          color: AppColors.textMutedLight,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.logout, color: AppColors.danger),
                  onPressed: _handleLogout,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
