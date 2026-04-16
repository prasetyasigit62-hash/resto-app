import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../screens/attendance/attendance_screen.dart';

class AppLayout extends StatefulWidget {
  const AppLayout({super.key});

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
  int _selectedIndex = 0;

  // Mock Data Menu seperti di App.jsx
  final List<Map<String, dynamic>> _menus = [
    {'title': 'Dashboard', 'icon': Icons.dashboard_outlined},
    {'title': 'Kasir & POS', 'icon': Icons.point_of_sale_outlined},
    {'title': 'Kitchen Display', 'icon': Icons.soup_kitchen_outlined},
    {'title': 'Absensi', 'icon': Icons.timer_outlined},
  ];

  Widget _buildScreen() {
    switch (_selectedIndex) {
      case 3:
        return const AttendanceScreen(); // Layar absensi yang kita buat
      default:
        return const Center(child: Text('Layar Sedang Dibangun...'));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Deteksi ukuran layar: Jika lebar >= 800, anggap Tablet/Desktop (Sidebar)
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    return Scaffold(
      drawer: !isDesktop ? _buildSidebar() : null, // Drawer hanya untuk Mobile
      body: Row(
        children: [
          if (isDesktop) _buildSidebar(), // Sidebar permanen untuk Tablet
          Expanded(
            child: Column(
              children: [
                _buildTopbar(isDesktop),
                Expanded(child: _buildScreen()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Topbar dengan efek Glassmorphism (Sama seperti App.css .topbar)
  Widget _buildTopbar(bool isDesktop) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: AppColors.cardLight.withOpacity(0.8),
            border: const Border(bottom: BorderSide(color: AppColors.borderLight)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (!isDesktop)
                    Builder(
                      builder: (ctx) => IconButton(
                        icon: const Icon(Icons.menu, color: AppColors.textLight),
                        onPressed: () => Scaffold.of(ctx).openDrawer(),
                      ),
                    ),
                  if (!isDesktop) const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('HOME / ${_menus[_selectedIndex]['title'].toUpperCase()}', 
                           style: const TextStyle(fontSize: 10, color: AppColors.textMutedLight, fontWeight: FontWeight.bold)),
                      Text(_menus[_selectedIndex]['title'], 
                           style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textLight)),
                    ],
                  ),
                ],
              ),
              // Ikon Notifikasi & Profil
              Row(
                children: [
                  IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
                  const SizedBox(width: 10),
                  const CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: Text('A', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  )
                ],
              )
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
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.all(Radius.circular(8))),
                  child: Center(child: Text('R', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                ),
                SizedBox(width: 12),
                Text('Resto App', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.borderLight),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 10),
              itemCount: _menus.length,
              itemBuilder: (context, index) {
                final isSelected = _selectedIndex == index;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ListTile(
                    leading: Icon(_menus[index]['icon'], color: isSelected ? Colors.white : AppColors.textMutedLight),
                    title: Text(_menus[index]['title'], style: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textLight,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal
                    )),
                    onTap: () {
                      setState(() => _selectedIndex = index);
                      if (MediaQuery.of(context).size.width < 800) Navigator.pop(context); // Tutup drawer di HP
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}