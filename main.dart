import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:resto_mobile/features/auth/auth_controller.dart';
import 'package:resto_mobile/features/auth/login_screen.dart';
import 'package:resto_mobile/features/dashboard/dashboard_screen.dart';

void main() {
  runApp(
    // 1. Bungkus seluruh aplikasi dengan ProviderScope agar Riverpod berfungsi
    const ProviderScope(child: MyApp()),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 2. Pantau status autentikasi user
    final authState = ref.watch(authControllerProvider);

    return MaterialApp(
      title: 'Resto Superapp',
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        fontFamily:
            'Plus Jakarta Sans', // Contoh jika Anda menambahkan custom font
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 1,
          iconTheme: IconThemeData(color: Colors.black87),
          titleTextStyle: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      debugShowCheckedModeBanner: false,
      // 3. Tentukan halaman mana yang akan ditampilkan berdasarkan state
      home: authState.when(
        data: (user) {
          // Jika ada data user (sudah login), tampilkan Dashboard
          if (user != null) {
            return const DashboardScreen();
          }
          // Jika tidak ada, tampilkan Login
          return const LoginScreen();
        },
        // Selama proses pengecekan, tampilkan loading
        loading: () =>
            const Scaffold(body: Center(child: CircularProgressIndicator())),
        // Jika terjadi error saat cek sesi, arahkan ke login
        error: (err, stack) => const LoginScreen(),
      ),
    );
  }
}
