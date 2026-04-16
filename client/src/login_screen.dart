import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'main_layout.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    
    try {
      // Sesuaikan endpoint login dengan route Node.js Anda (biasanya /auth/login atau /login)
      final res = await ApiService.post('/login', {
        'username': _usernameCtrl.text,
        'password': _passwordCtrl.text,
      });

      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['token'] != null) {
        // Simpan token ke SharedPreferences
        await ApiService.saveToken(data['token']);
        
        if (!mounted) return;
        // Pindah ke Main Layout
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainLayout()),
        );
      } else {
        _showError(data['error'] ?? 'Login Gagal');
      }
    } catch (e) {
      _showError('Koneksi ke server terputus.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Center(
        child: Container(
          width: 400,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Resto App', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 30),
              TextField(controller: _usernameCtrl, decoration: const InputDecoration(labelText: 'Username', border: OutlineInputBorder())),
              const SizedBox(height: 15),
              TextField(controller: _passwordCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder())),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity, height: 50,
                child: ElevatedButton(onPressed: _isLoading ? null : _handleLogin, child: _isLoading ? const CircularProgressIndicator() : const Text('MASUK')),
              )
            ],
          ),
        ),
      ),
    );
  }
}