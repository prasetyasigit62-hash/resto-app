import 'package:flutter/material.dart';
import 'app_colors.dart';

class MenuManagementScreen extends StatefulWidget {
  const MenuManagementScreen({super.key});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  bool _isLoading = false;
  List<Map<String, dynamic>> _menus = [];

  // Mock data daftar menu
  final List<Map<String, dynamic>> menuItems = [
    {
      'name': 'Nasi Goreng Seafood',
      'price': 35000,
      'category': {'name': 'Makanan'},
      'isActive': true,
      'image': null,
    },
    {
      'name': 'Mie Goreng Spesial',
      'price': 30000,
      'category': {'name': 'Makanan'},
      'isActive': true,
      'image': null,
    },
    {
      'name': 'Ayam Bakar Taliwang',
      'price': 40000,
      'category': {'name': 'Makanan'},
      'isActive': true,
      'image': null,
    },
    {
      'name': 'Es Teh Manis',
      'price': 8000,
      'category': {'name': 'Minuman'},
      'isActive': true,
      'image': null,
    },
    {
      'name': 'Kopi Susu Es',
      'price': 15000,
      'category': {'name': 'Minuman'},
      'isActive': true,
      'image': null,
    },
    {
      'name': 'Jus Jeruk',
      'price': 12000,
      'category': {'name': 'Minuman'},
      'isActive': false,
      'image': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    // Inisialisasi data menu dari mock data
    _menus = menuItems;
  }

  void _showAddMenuModal() {
    // TODO: Implementasi logika untuk menampilkan modal tambah menu
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('Fungsi Tambah Menu belum diimplementasikan')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Tombol Tambah
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Manajemen Menu',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: _showAddMenuModal,
                icon: const Icon(Icons.add),
                label: const Text('Tambah Menu'),
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

          // Kategori Filter (Tabs)
          Row(
            children: [
              _buildFilterChip('Semua Menu', true),
              const SizedBox(width: 12),
              _buildFilterChip('Makanan', false),
              const SizedBox(width: 12),
              _buildFilterChip('Minuman', false),
            ],
          ),
          const SizedBox(height: 24),

          // Grid Daftar Menu
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : GridView.builder(
                    gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 280,
                      childAspectRatio: 0.8,
                      crossAxisSpacing: 20,
                      mainAxisSpacing: 20,
                    ),
                    itemCount: _menus.length,
                    itemBuilder: (context, index) {
                      final item = _menus[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: AppColors.cardLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderLight),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Image Placeholder
                            Expanded(
                              flex: 3,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(16),
                                  ),
                                ),
                                child: item['image'] != null
                                    ? ClipRRect(
                                        borderRadius:
                                            const BorderRadius.vertical(
                                          top: Radius.circular(16),
                                        ),
                                        child: Image.network(
                                          item['image'],
                                          fit: BoxFit.cover,
                                        ),
                                      )
                                    : Icon(
                                        Icons.restaurant,
                                        size: 64,
                                        color: Colors.grey[400],
                                      ),
                              ),
                            ),
                            // Detail Menu
                            Expanded(
                              flex: 4,
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary
                                                .withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            item['category']?['name'] ?? 'Umum',
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          item['name'],
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Rp ${item['price']}',
                                          style: const TextStyle(
                                            color: AppColors.success,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        IconButton(
                                          icon: const Icon(
                                            Icons.edit_outlined,
                                            color: AppColors.textMutedLight,
                                          ),
                                          onPressed: () {},
                                          tooltip: 'Edit',
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.delete_outline,
                                            color: AppColors.danger,
                                          ),
                                          onPressed: () {},
                                          tooltip: 'Hapus',
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return Chip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.textMutedLight,
          fontWeight: FontWeight.bold,
        ),
      ),
      backgroundColor: isSelected ? AppColors.textLight : AppColors.bgLight,
      side: BorderSide(
        color: isSelected ? AppColors.textLight : AppColors.borderLight,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }
}
