import 'package:flutter/material.dart';
import 'app_colors.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    final List<Map<String, dynamic>> inventories = [
      {
        'name': 'Beras Putih',
        'stock': 2,
        'unit': 'KG',
        'min': 5,
        'cost': 15000,
      },
      {
        'name': 'Minyak Goreng',
        'stock': 8,
        'unit': 'L',
        'min': 3,
        'cost': 18000,
      },
      {
        'name': 'Daging Ayam',
        'stock': 15,
        'unit': 'KG',
        'min': 10,
        'cost': 35000,
      },
      {
        'name': 'Telur Ayam',
        'stock': 30,
        'unit': 'Butir',
        'min': 50,
        'cost': 2000,
      },
      {
        'name': 'Bawang Merah',
        'stock': 1,
        'unit': 'KG',
        'min': 2,
        'cost': 25000,
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Manajemen Inventori',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('Tambah Barang'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.cardLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: isDesktop
                ? DataTable(
                    headingTextStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMutedLight,
                    ),
                    columns: const [
                      DataColumn(label: Text('Nama Bahan')),
                      DataColumn(label: Text('Stok Tersedia')),
                      DataColumn(label: Text('Stok Minimum')),
                      DataColumn(label: Text('Harga Beli Terakhir')),
                      DataColumn(label: Text('Status')),
                      DataColumn(label: Text('Aksi')),
                    ],
                    rows: inventories.map((item) {
                      final isCritical = item['stock'] <= item['min'];
                      return DataRow(
                        cells: [
                          DataCell(
                            Text(
                              item['name'],
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          DataCell(Text('${item['stock']} ${item['unit']}')),
                          DataCell(Text('${item['min']} ${item['unit']}')),
                          DataCell(Text('Rp ${item['cost']}')),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: isCritical
                                    ? AppColors.danger.withOpacity(0.1)
                                    : AppColors.success.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                isCritical ? 'Kritis' : 'Aman',
                                style: TextStyle(
                                  color: isCritical
                                      ? AppColors.danger
                                      : AppColors.success,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                          DataCell(
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(
                                    Icons.edit_outlined,
                                    color: AppColors.primary,
                                  ),
                                  onPressed: () {},
                                ),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: AppColors.danger,
                                  ),
                                  onPressed: () {},
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: inventories.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = inventories[index];
                      final isCritical = item['stock'] <= item['min'];
                      return ListTile(
                        title: Text(
                          item['name'],
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Sisa: ${item['stock']} ${item['unit']} (Min: ${item['min']})',
                        ),
                        trailing: Icon(
                          isCritical ? Icons.warning : Icons.check_circle,
                          color: isCritical
                              ? AppColors.danger
                              : AppColors.success,
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
