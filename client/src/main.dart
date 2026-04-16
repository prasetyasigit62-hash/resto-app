import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme/app_colors.dart';
import 'presentation/layouts/app_layout.dart';

void main() {
  runApp(const RestoAppMobile());
}

class RestoAppMobile extends StatelessWidget {
  const RestoAppMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Resto App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.bgLight,
        // Menggunakan Google Fonts Inter/Plus Jakarta Sans seperti di web
        textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme)
            .apply(
              bodyColor: AppColors.textLight,
              displayColor: AppColors.textLight,
            ),
        cardColor: AppColors.cardLight,
        dividerColor: AppColors.borderLight,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      home: const AppLayout(),
    );
  }
}
