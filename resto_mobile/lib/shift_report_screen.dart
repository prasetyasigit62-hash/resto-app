import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';

class ShiftReportScreen extends StatefulWidget {
  const ShiftReportScreen({super.key});

  @override
  State<ShiftReportScreen> createState() => _ShiftReportScreenState();
}

class _ShiftReportScreenState extends State<ShiftReportScreen> {
  List<dynamic> _shifts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchShifts();
  }

  Future<void> _fetchShifts() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    try {
      final res = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/v2/shifts/history'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        if (mounted)
          setState(() {
            _shifts = jsonDecode(res.body);
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
          const Text(
            'Laporan Shift Kasir',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _shifts.isEmpty
                ? const Center(
                    child: Text(
                      'Belum ada history shift kasir.',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                  )
                : ListView.builder(
                    itemCount: _shifts.length,
                    itemBuilder: (context, index) {
                      final shift = _shifts[index];
                      final start = DateTime.parse(
                        shift['start_time'],
                      ).toLocal().toString().split('.')[0];
                      final end = shift['end_time'] != null
                          ? DateTime.parse(
                              shift['end_time'],
                            ).toLocal().toString().split('.')[0]
                          : 'Berjalan';
                      final diff =
                          double.tryParse(
                            shift['difference']?.toString() ?? '0',
                          ) ??
                          0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primary.withOpacity(0.1),
                            child: const Icon(
                              Icons.point_of_sale,
                              color: AppColors.primary,
                            ),
                          ),
                          title: Text(
                            'Kasir: ${shift['username']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            'Mulai: $start\nTutup: $end\nTotal Transaksi: ${shift['transaction_count'] ?? 0} Pesanan',
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text(
                                'Selisih Uang Laci:',
                                style: TextStyle(fontSize: 12),
                              ),
                              Text(
                                'Rp $diff',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: diff < 0
                                      ? AppColors.danger
                                      : (diff > 0
                                            ? AppColors.primary
                                            : AppColors.success),
                                ),
                              ),
                            ],
                          ),
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
