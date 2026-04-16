import 'package:flutter/material.dart';
import 'app_colors.dart';

class KitchenScreen extends StatelessWidget {
  const KitchenScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    // Mock data pesanan aktif di dapur
    final List<Map<String, dynamic>> activeOrders = [
      {
        'id': 'ORD-1001',
        'table': 'Meja 4',
        'time': '10:45',
        'status': 'Menunggu',
        'items': [
          {
            'name': 'Nasi Goreng Spesial',
            'qty': 2,
            'note': 'Pedas, tanpa kerupuk',
          },
          {'name': 'Es Teh Manis', 'qty': 2, 'note': ''},
        ],
      },
      {
        'id': 'ORD-1002',
        'table': 'Takeaway',
        'time': '10:48',
        'status': 'Sedang Dimasak',
        'items': [
          {'name': 'Ayam Bakar Madu', 'qty': 1, 'note': 'Sambal dipisah'},
          {'name': 'Jus Jeruk', 'qty': 1, 'note': 'Jangan terlalu manis'},
        ],
      },
      {
        'id': 'ORD-1003',
        'table': 'Meja 12',
        'time': '10:50',
        'status': 'Menunggu',
        'items': [
          {'name': 'Mie Goreng Seafood', 'qty': 3, 'note': ''},
        ],
      },
    ];

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Kitchen Display System (KDS)',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: GridView.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isDesktop ? 3 : 1,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: isDesktop ? 0.9 : 1.2,
              ),
              itemCount: activeOrders.length,
              itemBuilder: (context, index) {
                final order = activeOrders[index];
                final isCooking = order['status'] == 'Sedang Dimasak';

                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.cardLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isCooking ? AppColors.primary : Colors.orange,
                      width: 2,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isCooking
                              ? AppColors.primary.withOpacity(0.1)
                              : Colors.orange.withOpacity(0.1),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(14),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order['table'],
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              order['time'],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.textMutedLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: order['items'].length,
                          itemBuilder: (ctx, i) {
                            final item = order['items'][i];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.bgLight,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '${item['qty']}x',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item['name'],
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        if (item['note'].isNotEmpty)
                                          Text(
                                            '* ${item['note']}',
                                            style: const TextStyle(
                                              color: AppColors.danger,
                                              fontSize: 12,
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: SizedBox(
                          width: double.infinity,
                          height: 45,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isCooking
                                  ? AppColors.success
                                  : AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: () {},
                            child: Text(
                              isCooking ? 'SELESAI DIMASAK' : 'MULAI MASAK',
                            ),
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
}
