import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';

class StockOpnameScreen extends StatefulWidget {
  const StockOpnameScreen({super.key});

  @override
  State<StockOpnameScreen> createState() => _StockOpnameScreenState();
}

class _StockOpnameScreenState extends State<StockOpnameScreen> {
  List<dynamic> _mutations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMutations();
  }

  Future<void> _fetchMutations() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    try {
      final res = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/v2/mutations'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _mutations = jsonDecode(res.body);
            _isLoading = false;
          });
        }
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
                'Stok & Opname (Kartu Stok)',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.playlist_add_check),
                label: const Text('Catat Opname Manual'),
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
                : _mutations.isEmpty
                ? const Center(
                    child: Text(
                      'Belum ada riwayat pergerakan stok.',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                  )
                : Container(
                    decoration: BoxDecoration(
                      color: AppColors.cardLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: ListView.separated(
                      itemCount: _mutations.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final mut = _mutations[index];
                        final qty =
                            double.tryParse(mut['qty']?.toString() ?? '0') ?? 0;
                        final isPositive = qty > 0;
                        final date = DateTime.parse(
                          mut['createdAt'],
                        ).toLocal().toString().split('.')[0];

                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 8,
                          ),
                          leading: CircleAvatar(
                            backgroundColor: isPositive
                                ? AppColors.success.withOpacity(0.1)
                                : AppColors.danger.withOpacity(0.1),
                            child: Icon(
                              isPositive
                                  ? Icons.arrow_downward
                                  : Icons.arrow_upward,
                              color: isPositive
                                  ? AppColors.success
                                  : AppColors.danger,
                            ),
                          ),
                          title: Text(
                            mut['material']?['name'] ?? 'Unknown',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            '${mut['type']} • $date\nOleh: ${mut['user']?['username'] ?? '-'} • ${mut['note'] ?? ''}',
                          ),
                          isThreeLine: true,
                          trailing: Text(
                            '${isPositive ? '+' : ''}$qty ${mut['material']?['unit'] ?? ''}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: isPositive
                                  ? AppColors.success
                                  : AppColors.danger,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
