import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:resto_app_flutter/features/auth/auth_controller.dart';
import 'package:resto_app_flutter/features/dashboard/dashboard_controller.dart';
import 'package:resto_app_flutter/models/kpi_data.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).value;
    final kpiData = ref.watch(kpiProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard, ${user?['username'] ?? 'User'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: kpiData.when(
        data: (data) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(kpiProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // 1. KPI Card Omzet
                _buildKpiCard(
                  title: 'Omzet Hari Ini',
                  value:
                      'Rp ${NumberFormat.decimalPattern('id_ID').format(data.omzetToday)}',
                  icon: Icons.monetization_on,
                  color: Colors.green,
                ),
                const SizedBox(height: 16),

                // 2. KPI Card Stok Kritis
                _buildKpiCard(
                  title: 'Stok Kritis',
                  value: '${data.criticalStocks.length} Item',
                  icon: Icons.warning_amber,
                  color: Colors.orange,
                  details: data.criticalStocks
                      .map((s) => '${s.material} (Sisa: ${s.qty})')
                      .toList(),
                ),
                const SizedBox(height: 16),

                // 3. Card Menu Terlaris
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '🔥 Menu Terlaris',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (data.topSelling.isEmpty)
                          const Text(
                            'Belum ada data penjualan.',
                            style: TextStyle(color: Colors.grey),
                          )
                        else
                          ...data.topSelling.map(
                            (item) => ListTile(
                              leading: const Icon(Icons.restaurant_menu),
                              trailing: Text(
                                '${item.qty}x Terjual',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Gagal memuat data: $err'),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () => ref.refresh(kpiProvider.future),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    List<String>? details,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 28),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black54,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            if (details != null && details.isNotEmpty) ...[
              const Divider(height: 24),
              ...details.map(
                (d) =>
                    Text('• $d', style: const TextStyle(color: Colors.black87)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
