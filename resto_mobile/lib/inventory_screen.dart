import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'inventory_controller.dart';
import 'material_model.dart';
import 'app_colors.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  String searchTerm = '';
  String filterType = 'all'; // 'all', 'low'

  @override
  Widget build(BuildContext context) {
    final materialsAsync = ref.watch(materialsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manajemen Inventori'),
        backgroundColor: AppColors.bgLight,
        elevation: 1,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header & Tombol Tambah
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    '📦 Inventori Bahan',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    // TODO: Implementasi modal tambah
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Fitur Tambah belum siap.')),
                    );
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Tambah'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Filter Tabs
            Row(
              children: [
                FilterChip(
                  label: const Text('Semua Bahan'),
                  selected: filterType == 'all',
                  onSelected: (selected) {
                    if (selected) setState(() => filterType = 'all');
                  },
                ),
                const SizedBox(width: 10),
                FilterChip(
                  label: const Text('⚠️ Stok Menipis'),
                  selected: filterType == 'low',
                  onSelected: (selected) {
                    if (selected) setState(() => filterType = 'low');
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Grid Items
            Expanded(
              child: materialsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err')),
                data: (materials) {
                  final filteredMaterials = materials.where((item) {
                    final matchesFilter = filterType == 'low'
                        ? item.totalStock <= item.minStock
                        : true;
                    return matchesFilter;
                  }).toList();

                  if (filteredMaterials.isEmpty) {
                    return const Center(
                        child: Text('Tidak ada bahan yang ditemukan.'));
                  }

                  return RefreshIndicator(
                    onRefresh: () => ref.refresh(materialsProvider.future),
                    child: GridView.builder(
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 300,
                        childAspectRatio: 1.5,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: filteredMaterials.length,
                      itemBuilder: (context, index) {
                        final item = filteredMaterials[index];
                        return _buildMaterialCard(item);
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMaterialCard(MaterialModel item) {
    final isLow = item.totalStock <= item.minStock;
    final currencyFormatter =
        NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Cost: ${currencyFormatter.format(item.lastPrice)} / ${item.unit}',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textMutedLight),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(isLow ? 'Low Stock' : 'Aman'),
                  backgroundColor: isLow
                      ? AppColors.danger.withOpacity(0.1)
                      : AppColors.success.withOpacity(0.1),
                  labelStyle: TextStyle(
                      color: isLow ? AppColors.danger : AppColors.success,
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(
                  TextSpan(
                    text: '${item.totalStock}',
                    style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: isLow ? AppColors.danger : AppColors.textLight),
                    children: [
                      TextSpan(
                        text: ' ${item.unit}',
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.normal,
                            color: AppColors.textMutedLight),
                      ),
                    ],
                  ),
                ),
                if (isLow)
                  Text(
                    'Min. Stok: ${item.minStock}',
                    style:
                        const TextStyle(fontSize: 12, color: AppColors.danger),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
