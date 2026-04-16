import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with SingleTickerProviderStateMixin {
  // Menggunakan IPv4 dari ipconfig
  final String backendUrl = "http://10.14.35.19:3000/api"; 

  String _currentTime = "";
  Timer? _timer;
  bool _isScanning = false;

  late AnimationController _scanAnimController;
  late Animation<double> _scanLineAnimation;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) => _updateTime());

    // Setup Animasi Garis Scan Biru (Seperti di CSS pulse-dot / scan-line)
    _scanAnimController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _scanLineAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_scanAnimController);
  }

  void _updateTime() {
    final now = DateTime.now();
    setState(() {
      _currentTime = "${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}";
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scanAnimController.dispose();
    super.dispose();
  }

  Future<void> _startScan(String action) async {
    setState(() => _isScanning = true);
    
    // Simulasi proses scan wajah selama 4 detik untuk efek UI (Opsional)
    await Future.delayed(const Duration(seconds: 4));
    if (!mounted) return;
    setState(() => _isScanning = false);

    try {
      // MENGIRIM HTTP REQUEST KE BACKEND NODE.JS
      final response = await http.post(
        Uri.parse('$backendUrl/attendance'),
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer TOKEN_ANDA_DISINI', // Catatan: Nanti kita ambil dari mekanisme Login
        },
        body: jsonEncode({'action': action}), // mengirim { action: 'in' } atau 'out'
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Berhasil Absen ${action == 'in' ? 'Masuk' : 'Keluar'}!'), backgroundColor: AppColors.success),
        );
      } else {
        final errorData = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Gagal: ${errorData['error']}'), backgroundColor: AppColors.danger),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Error: Gagal terhubung ke Server Node.js.'), backgroundColor: AppColors.danger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Layout responsif: Di tablet samping-sampingan, di HP atas-bawah
    final isTablet = MediaQuery.of(context).size.width > 600;

    // KOTAK KIRI (JAM & TOMBOL)
    final leftPanel = Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          const Text('Jumat, 25 Oktober 2023', style: TextStyle(color: AppColors.textMutedLight)),
          const SizedBox(height: 10),
          Text(_currentTime, style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
          const SizedBox(height: 30),
          SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('FACE ID CLOCK IN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
              onPressed: () => _startScan('in'),
            ),
          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('FACE ID CLOCK OUT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
              onPressed: () => _startScan('out'),
            ),
          ),
        ],
      ),
    );

    // KOTAK KANAN (TABEL HISTORI)
    final rightPanel = Container(
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: AppColors.borderLight)),
            ),
            child: const Text('Riwayat Kehadiran Saya', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          const Padding(
            padding: EdgeInsets.all(30.0),
            child: Center(child: Text('Data histori absensi akan muncul di sini...')),
          )
        ],
      ),
    );

    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: isTablet
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 1, child: leftPanel),
                    const SizedBox(width: 30),
                    Expanded(flex: 2, child: rightPanel),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    leftPanel,
                    const SizedBox(height: 30),
                    rightPanel,
                  ],
                ),
        ),

        // OVERLAY SCANNER FACE ID FUTURISTIK
        if (_isScanning)
          Container(
            color: const Color(0xFF0F172A).withOpacity(0.9), // Dark slate blue overlay
            child: Center(
              child: Container(
                width: 300,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF334155)),
                  boxShadow: const [BoxShadow(color: Color(0x330EA5E9), blurRadius: 40)],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Face ID Authentication', style: TextStyle(color: Color(0xFF0EA5E9), fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 20),
                    // Box Kamera Simulasi
                    Container(
                      width: 250, height: 320,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF0EA5E9), width: 2),
                      ),
                      child: Stack(
                        children: [
                          // Target Wajah (Lingkaran Putih Transparan)
                          Center(
                            child: Container(
                              width: 150, height: 200,
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                                borderRadius: BorderRadius.circular(100), // Bentuk oval/telur
                              ),
                            ),
                          ),
                          // Animasi Garis Scan Biru
                          AnimatedBuilder(
                            animation: _scanLineAnimation,
                            builder: (context, child) {
                              return Positioned(
                                top: _scanLineAnimation.value * 320,
                                left: 0, right: 0,
                                child: Container(
                                  height: 3,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF0EA5E9),
                                    boxShadow: [BoxShadow(color: Color(0xFF0EA5E9), blurRadius: 10, spreadRadius: 2)],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text('Memindai titik biometrik wajah...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: () => setState(() => _isScanning = false),
                      child: const Text('Batalkan', style: TextStyle(color: Colors.grey)),
                    )
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}