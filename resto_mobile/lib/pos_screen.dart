import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_colors.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  // Data Menu dari API
  List<Map<String, dynamic>> _menus = [];
  List<String> _categories = ['Semua'];
  String _activeCategory = 'Semua';
  String _searchTerm = '';
  bool _isLoading = true;

  // State Keranjang Belanja
  final List<Map<String, dynamic>> _cart = [];

  @override
  void initState() {
    super.initState();
    _fetchMenus();
  }

  Future<void> _fetchMenus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token') ?? '';

      final response = await http.get(
        Uri.parse('http://10.14.35.19:3000/api/v2/menus'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _menus = List<Map<String, dynamic>>.from(data);
            final cats = _menus
                .map((m) => m['category']?['name']?.toString() ?? 'Umum')
                .toSet()
                .toList();
            _categories = ['Semua', ...cats];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      print('Error fetching menus: $e');
    }
  }

  void _addToCart(Map<String, dynamic> item) {
    setState(() {
      final index = _cart.indexWhere(
        (cartItem) => cartItem['id'] == item['id'],
      );
      if (index >= 0) {
        _cart[index]['qty'] += 1;
      } else {
        _cart.add({...item, 'qty': 1});
      }
    });
  }

  Map<String, dynamic> get _cartTotals {
    int subtotal = _cart.fold(
      0,
      (sum, item) => sum + (item['price'] as int) * (item['qty'] as int),
    );
    // Asumsi Tax 11% dan Service 0% berdasarkan default setting Anda
    double tax = subtotal * 0.11;
    double total = subtotal + tax;
    return {'subtotal': subtotal, 'tax': tax, 'total': total};
  }

  List<Map<String, dynamic>> get _filteredMenus {
    return _menus.where((item) {
      final matchSearch = item['name'].toString().toLowerCase().contains(
            _searchTerm.toLowerCase(),
          );
      final matchCat = _activeCategory == 'Semua' ||
          (item['category']?['name'] ?? 'Umum') == _activeCategory;
      return matchSearch && matchCat;
    }).toList();
  }

  Future<void> _processCheckout(String paymentMethod) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token') ?? '';

      final payload = {
        'items': _cart
            .map((c) => {'id': c['id'], 'qty': c['qty'], 'price': c['price']})
            .toList(),
        'total': _cartTotals['total'],
        'paymentMethod': paymentMethod,
      };

      final response = await http.post(
        Uri.parse('http://10.14.35.19:3000/api/v2/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      if (!mounted) return;

      if (response.statusCode == 201) {
        setState(() => _cart.clear());
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Transaksi Berhasil!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal: ${response.body}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error koneksi'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  void _showCheckoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Proses Pembayaran',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Total Pembayaran: Rp ${NumberFormat.currency(locale: 'id', symbol: '', decimalDigits: 0).format(_cartTotals['total'])}\n\nPilih Metode Pembayaran:',
          style: const TextStyle(fontSize: 16),
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
            onPressed: () {
              Navigator.pop(ctx);
              _processCheckout('CASH');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
            ),
            child: const Text('TUNAI (CASH)'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _processCheckout('QRIS');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('QRIS / E-WALLET'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    return isDesktop
        ? Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 7, child: _buildMenuGrid()),
              Container(width: 1, color: AppColors.borderLight),
              Expanded(flex: 3, child: _buildCart()),
            ],
          )
        : Column(
            children: [
              Expanded(flex: 2, child: _buildMenuGrid()),
              Container(height: 1, color: AppColors.borderLight),
              Expanded(flex: 1, child: _buildCart()),
            ],
          );
  }

  Widget _buildMenuGrid() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: AppColors.cardLight,
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Cari menu...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: AppColors.bgLight,
            ),
            onChanged: (val) => setState(() => _searchTerm = val),
          ),
        ),
        Container(
          height: 60,
          color: AppColors.cardLight,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            itemCount: _categories.length,
            itemBuilder: (ctx, idx) {
              final cat = _categories[idx];
              final isActive = _activeCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: ChoiceChip(
                  label: Text(
                    cat,
                    style: TextStyle(
                      color: isActive ? Colors.white : AppColors.textMutedLight,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  selected: isActive,
                  onSelected: (val) => setState(() => _activeCategory = cat),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.bgLight,
                  side: BorderSide(
                    color: isActive ? AppColors.primary : AppColors.borderLight,
                  ),
                ),
              );
            },
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 220,
                    childAspectRatio: 0.85,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: _filteredMenus.length,
                  itemBuilder: (context, index) {
                    final menu = _filteredMenus[index];
                    return InkWell(
                      onTap: () => _addToCart(menu),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.cardLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderLight),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  image: menu['image'] != null
                                      ? DecorationImage(
                                          image: NetworkImage(menu['image']),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(16),
                                  ),
                                ),
                                child: menu['image'] == null
                                    ? const Icon(
                                        Icons.fastfood,
                                        size: 50,
                                        color: Colors.grey,
                                      )
                                    : null,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    menu['name'],
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Rp ${NumberFormat.currency(locale: 'id', symbol: '', decimalDigits: 0).format(menu['price'])}',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
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
    );
  }

  Widget _buildCart() {
    return Container(
      color: AppColors.cardLight,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Center(
              child: Text(
                'Current Order',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _cart.isEmpty
                ? const Center(
                    child: Text(
                      'Belum ada pesanan',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                  )
                : ListView.builder(
                    itemCount: _cart.length,
                    itemBuilder: (context, index) => ListTile(
                      title: Text(
                        _cart[index]['name'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        'Rp ${_cart[index]['price']} x ${_cart[index]['qty']}',
                      ),
                      trailing: Text(
                        'Rp ${_cart[index]['price'] * _cart[index]['qty']}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardLight,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Subtotal:',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                    Text(
                      'Rp ${NumberFormat.currency(locale: 'id', symbol: '', decimalDigits: 0).format(_cartTotals['subtotal'])}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'PPN (11%):',
                      style: TextStyle(color: AppColors.textMutedLight),
                    ),
                    Text(
                      'Rp ${NumberFormat.currency(locale: 'id', symbol: '', decimalDigits: 0).format(_cartTotals['tax'])}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total:',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Rp ${NumberFormat.currency(locale: 'id', symbol: '', decimalDigits: 0).format(_cartTotals['total'])}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _cart.isEmpty ? null : _showCheckoutDialog,
                    child: const Text(
                      'PROSES PEMBAYARAN',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
