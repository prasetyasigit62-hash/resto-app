import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'pos_screen.dart';
import '../attendance_screen.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _selectedIndex = 0;
  late IO.Socket socket;

  // Daftar halaman navigasi
  final List<Widget> _screens = [
    const PosScreen(),
    const AttendanceScreen(), // Menggunakan file yang sudah Anda buat sebelumnya
    const Center(child: Text('Settings')),
  ];

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  void _initSocket() {
    // Koneksi WebSocket ke backend (Langkah 4)
    socket = IO.io('http://10.14.35.19:3000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });
    
    socket.connect();
    
    socket.onConnect((_) => print('Socket Terhubung'));
    
    // Dengarkan event 'newOrder' dari backend index.js
    socket.on('newOrder', (data) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('🔔 PESANAN BARU MASUK! ID: ${data['orderId']}'), backgroundColor: Colors.blue),
      );
    });
  }

  @override
  void dispose() {
    socket.disconnect();
    socket.dispose();
    super.dispose();
  }
  
  void _logout() async {
    await ApiService.logout();
    if(!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width > 600;

    return Scaffold(
      appBar: isTablet ? null : AppBar(title: const Text('Resto App'), actions: [IconButton(icon: const Icon(Icons.logout), onPressed: _logout)]),
      body: isTablet
          ? Row(
              children: [
                NavigationRail(
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
                  labelType: NavigationRailLabelType.all,
                  destinations: const [
                    NavigationRailDestination(icon: Icon(Icons.point_of_sale), label: Text('POS')),
                    NavigationRailDestination(icon: Icon(Icons.fingerprint), label: Text('Absen')),
                    NavigationRailDestination(icon: Icon(Icons.settings), label: Text('Pengaturan')),
                  ],
                  trailing: Expanded(child: Align(alignment: Alignment.bottomCenter, child: IconButton(icon: const Icon(Icons.logout, color: Colors.red), onPressed: _logout))),
                ),
                const VerticalDivider(thickness: 1, width: 1),
                Expanded(child: _screens[_selectedIndex]),
              ],
            )
          : _screens[_selectedIndex],
      bottomNavigationBar: isTablet ? null : BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (idx) => setState(() => _selectedIndex = idx),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.point_of_sale), label: 'POS'),
          BottomNavigationBarItem(icon: Icon(Icons.fingerprint), label: 'Absen'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}