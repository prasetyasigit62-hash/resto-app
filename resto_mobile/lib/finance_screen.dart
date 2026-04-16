import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  List<dynamic> _expenses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchExpenses();
  }

  Future<void> _fetchExpenses() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    try {
      final res = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/expenses'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _expenses = jsonDecode(res.body);
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

  void _showAddExpenseModal() {
    final _formKey = GlobalKey<FormState>();
    String category = 'Belanja Bahan Baku';
    String amount = '';
    String description = '';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Catat Pengeluaran',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items:
                    [
                          'Belanja Bahan Baku',
                          'Gaji Pegawai',
                          'Listrik & Air',
                          'Sewa Tempat',
                          'Operasional Lainnya',
                        ]
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                onChanged: (val) => category = val!,
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Nominal (Rp)',
                  prefixText: 'Rp ',
                ),
                keyboardType: TextInputType.number,
                onChanged: (val) => amount = val,
                validator: (val) =>
                    val == null || val.isEmpty ? 'Tidak boleh kosong' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Keterangan / Catatan',
                ),
                onChanged: (val) => description = val,
                validator: (val) =>
                    val == null || val.isEmpty ? 'Tidak boleh kosong' : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Batal',
              style: TextStyle(color: AppColors.textMutedLight),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              if (_formKey.currentState!.validate()) {
                Navigator.pop(ctx);
                await _submitExpense(category, amount, description);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitExpense(
    String category,
    String amount,
    String description,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? '';
    try {
      final res = await http.post(
        Uri.parse('http://10.14.35.19:3000/api/expenses'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'category': category,
          'amount': amount,
          'description': description,
        }),
      );
      if (res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pengeluaran dicatat!'),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() => _isLoading = true);
        _fetchExpenses();
      }
    } catch (e) {}
  }

  @override
  Widget build(BuildContext context) {
    int totalExpense = _expenses.fold(
      0,
      (sum, item) =>
          sum + (int.tryParse(item['amount']?.toString() ?? '0') ?? 0),
    );

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Keuangan & Pengeluaran',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                onPressed: _showAddExpenseModal,
                icon: const Icon(Icons.add),
                label: const Text('Catat Pengeluaran'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.danger,
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
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.danger.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.danger),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.account_balance_wallet,
                  color: AppColors.danger,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Total Pengeluaran Tercatat',
                      style: TextStyle(color: AppColors.danger),
                    ),
                    Text(
                      'Rp $totalExpense',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.danger,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _expenses.isEmpty
                ? const Center(
                    child: Text(
                      'Belum ada data pengeluaran.',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                  )
                : ListView.separated(
                    itemCount: _expenses.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final exp = _expenses[index];
                      final date = DateTime.parse(
                        exp['date'],
                      ).toLocal().toString().split('.')[0];
                      return ListTile(
                        title: Text(
                          exp['category'] ?? '-',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          '${exp['description']}\n$date • Oleh: ${exp['recorded_by'] ?? exp['recordedBy']}',
                        ),
                        trailing: Text(
                          '- Rp ${exp['amount']}',
                          style: const TextStyle(
                            color: AppColors.danger,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
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
