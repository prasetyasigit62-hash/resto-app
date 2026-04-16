import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_layout.dart';
import 'app_colors.dart';
import 'login_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Resto App Mobile',
      // Menghilangkan pita tulisan "DEBUG" di pojok kanan atas
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.bgLight,
        // Menggunakan Google Fonts Inter seperti di web untuk konsistensi
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme)
            .apply(
              bodyColor: AppColors.textLight,
              displayColor: AppColors.textLight,
            ),
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
      ),
      // Mengarahkan halaman pertama kali ke form Login
      home: const LoginScreen(),
    );
  }
}
