import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';

class PurchaseOrderScreen extends StatefulWidget {
  const PurchaseOrderScreen({super.key});

  @override
  State<PurchaseOrderScreen> createState() => _PurchaseOrderScreenState();
}

class _PurchaseOrderScreenState extends State<PurchaseOrderScreen> {
  List<dynamic> _pos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPOs();
  }

  Future<void> _fetchPOs() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    try {
      final res = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/v2/purchase-orders'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        if (mounted)
          setState(() {
            _pos = jsonDecode(res.body);
            _isLoading = false;
          });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Purchase Orders (PO)',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add_shopping_cart),
                label: const Text('Buat PO Baru'),
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
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _pos.isEmpty
                ? const Center(
                    child: Text(
                      'Belum ada riwayat PO.',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                  )
                : Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.cardLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        child: DataTable(
                          headingTextStyle: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textMutedLight,
                          ),
                          columns: const [
                            DataColumn(label: Text('No. PO')),
                            DataColumn(label: Text('Tanggal')),
                            DataColumn(label: Text('Supplier')),
                            DataColumn(label: Text('Total Pembelian')),
                            DataColumn(label: Text('Status')),
                            DataColumn(label: Text('Aksi')),
                          ],
                          rows: _pos.map((po) {
                            final date = DateTime.parse(
                              po['createdAt'],
                            ).toLocal().toString().split('.')[0];
                            final isReceived = po['status'] == 'RECEIVED';
                            return DataRow(
                              cells: [
                                DataCell(
                                  Text(
                                    po['poNumber'] ?? '-',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                DataCell(Text(date)),
                                DataCell(Text(po['supplier']?['name'] ?? '-')),
                                DataCell(
                                  Text(
                                    'Rp ${po['totalAmount'] ?? 0}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isReceived
                                          ? AppColors.success.withOpacity(0.1)
                                          : Colors.orange.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      isReceived
                                          ? 'Selesai / Diterima'
                                          : 'Menunggu Approval',
                                      style: TextStyle(
                                        color: isReceived
                                            ? AppColors.success
                                            : Colors.orange,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ),
                                DataCell(
                                  IconButton(
                                    icon: const Icon(
                                      Icons.remove_red_eye,
                                      color: AppColors.primary,
                                    ),
                                    onPressed: () {},
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
