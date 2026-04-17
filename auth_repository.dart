import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:resto_mobile/utils/api_service.dart';

final authRepositoryProvider = Provider(
  (ref) => AuthRepository(
    apiService: ApiService(),
    secureStorage: const FlutterSecureStorage(),
  ),
);

class AuthRepository {
  final ApiService _apiService;
  final FlutterSecureStorage _secureStorage;

  AuthRepository({
    required ApiService apiService,
    required FlutterSecureStorage secureStorage,
  }) : _apiService = apiService,
       _secureStorage = secureStorage;

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _apiService.dio.post(
        '/auth/login',
        data: {'username': username, 'password': password},
      );

      final data = response.data;
      final String accessToken = data['accessToken'];
      final String refreshToken = data['refreshToken'];

      // Simpan token dengan aman
      await _secureStorage.write(key: 'resto_accessToken', value: accessToken);
      await _secureStorage.write(
        key: 'resto_refreshToken',
        value: refreshToken,
      );

      return data['user'];
    } on DioException catch (e) {
      throw e.response?.data['error'] ?? 'Gagal login, periksa koneksi Anda.';
    }
  }

  Future<void> logout() async => await _secureStorage.deleteAll();
}
