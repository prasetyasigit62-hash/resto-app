import 'package:flutter/material.dart';
import 'app_colors.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Overview Hari Ini',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          // KPI Cards (Responsive Grid)
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: isDesktop ? 4 : 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: isDesktop ? 2.5 : 1.5,
            children: [
              _buildKpiCard(
                'Total Omzet',
                'Rp 4.500.000',
                Icons.account_balance_wallet,
                AppColors.success,
              ),
              _buildKpiCard(
                'Total Pesanan',
                '124',
                Icons.receipt_long,
                AppColors.primary,
              ),
              _buildKpiCard(
                'Stok Kritis',
                '3 Item',
                Icons.warning_amber_rounded,
                AppColors.danger,
              ),
              _buildKpiCard(
                'Pelanggan Baru',
                '12',
                Icons.people_outline,
                Colors.orange,
              ),
            ],
          ),
          const SizedBox(height: 32),
          // Two Columns Layout for Charts/Tables
          if (isDesktop)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 2, child: _buildTopSellingMenu()),
                const SizedBox(width: 24),
                Expanded(flex: 1, child: _buildCriticalStocks()),
              ],
            )
          else ...[
            _buildTopSellingMenu(),
            const SizedBox(height: 24),
            _buildCriticalStocks(),
          ],
        ],
      ),
    );
  }

  Widget _buildKpiCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textMutedLight,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    color: AppColors.textLight,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopSellingMenu() {
    final menus = [
      'Nasi Goreng Spesial',
      'Ayam Bakar Madu',
      'Es Teh Manis',
      'Mie Goreng Seafood',
      'Sate Ayam',
    ];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Top 5 Menu Terlaris',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ...List.generate(
            5,
            (index) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                children: [
                  Text(
                    '#${index + 1}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      menus[index],
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                  Text(
                    '${50 - (index * 5)} Terjual',
                    style: const TextStyle(color: AppColors.textMutedLight),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCriticalStocks() {
    final stocks = [
      {'name': 'Beras Putih', 'sisa': '2 KG', 'min': '5 KG'},
      {'name': 'Minyak Goreng', 'sisa': '1 L', 'min': '3 L'},
      {'name': 'Daging Ayam', 'sisa': '3 KG', 'min': '10 KG'},
    ];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Peringatan Stok',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ...stocks.map(
            (s) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.warning_amber_rounded,
                color: AppColors.danger,
              ),
              title: Text(s['name']!),
              subtitle: Text('Sisa: ${s['sisa']} (Min: ${s['min']})'),
              trailing: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('PO'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
