import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  List<dynamic> menus = [];
  List<Map<String, dynamic>> cart = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMenus();
  }

  Future<void> _fetchMenus() async {
    try {
      final res = await ApiService.get('/v2/menus');
      if (res.statusCode == 200) {
        setState(() {
          menus = jsonDecode(res.body);
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  void _addToCart(dynamic menu) {
    setState(() {
      final existingIndex = cart.indexWhere((item) => item['id'] == menu['id']);
      if (existingIndex >= 0) {
        cart[existingIndex]['qty']++;
      } else {
        cart.add({
          'id': menu['id'],
          'name': menu['name'],
          'price': menu['price'],
          'qty': 1,
          'isCustom': false,
        });
      }
    });
  }

  double get _totalPrice {
    return cart.fold(0, (sum, item) => sum + (item['price'] * item['qty']));
  }

  Future<void> _checkout() async {
    if (cart.isEmpty) return;
    
    try {
      final res = await ApiService.post('/v2/orders', {
        'items': cart,
        'total': _totalPrice,
        'paymentMethod': 'CASH', // Bisa dikembangkan jadi dinamis
      });

      if (res.statusCode == 201) {
        setState(() => cart.clear());
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Checkout Berhasil!'), backgroundColor: Colors.green));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('❌ Checkout Gagal'), backgroundColor: Colors.red));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('❌ Error Jaringan'), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width > 600;

    return Row(
      children: [
        // AREA KIRI: DAFTAR MENU
        Expanded(
          flex: 2,
          child: isLoading 
            ? const Center(child: CircularProgressIndicator())
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isTablet ? 3 : 2, childAspectRatio: 0.85, crossAxisSpacing: 10, mainAxisSpacing: 10,
                ),
                itemCount: menus.length,
                itemBuilder: (context, index) {
                  final menu = menus[index];
                  return InkWell(
                    onTap: () => _addToCart(menu),
                    child: Card(
                      elevation: 2,
                      child: Column(
                        children: [
                          Expanded(child: Container(color: Colors.grey[200], child: const Center(child: Icon(Icons.fastfood, size: 50)))), // Placeholder gambar
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Column(
                              children: [
                                Text(menu['name'], style: const TextStyle(fontWeight: FontWeight.bold), textAlign: TextAlign.center, maxLines: 2),
                                Text('Rp ${menu['price']}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  );
                },
              ),
        ),

        // AREA KANAN: KERANJANG (Hanya tampil di tablet, di HP disembunyikan atau dipindah ke BottomSheet nantinya)
        if (isTablet)
          Container(
            width: 350,
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Keranjang Pesanan', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const Divider(),
                Expanded(
                  child: ListView.builder(
                    itemCount: cart.length,
                    itemBuilder: (context, index) {
                      final item = cart[index];
                      return ListTile(
                        title: Text(item['name']),
                        subtitle: Text('Rp ${item['price']} x ${item['qty']}'),
                        trailing: Text('Rp ${item['price'] * item['qty']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      );
                    },
                  ),
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text('Total:', style: TextStyle(fontSize: 18)), Text('Rp $_totalPrice', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue))],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity, height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    onPressed: _checkout,
                    child: const Text('BAYAR (CHECKOUT)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                )
              ],
            ),
          )
      ],
    );
  }
}