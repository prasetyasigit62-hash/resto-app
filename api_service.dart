import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Untuk web, gunakan 'localhost'.
  // Untuk mobile (emulator/HP), gunakan IP address lokal Anda (misal: 192.168.1.7).
  static const String _baseUrl = 'http://localhost:3000/api/v2';

  ApiService()
    : _dio = Dio(
        BaseOptions(baseUrl: _baseUrl, timeout: const Duration(seconds: 15)),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Ambil token dari secure storage
          final token = await _secureStorage.read(key: 'resto_accessToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // ✨ REPLIKASI LOGIC REFRESH TOKEN DARI api.js
          if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
            final refreshToken = await _secureStorage.read(
              key: 'resto_refreshToken',
            );
            if (refreshToken != null) {
              try {
                // Request token baru
                final response = await Dio().post(
                  '$_baseUrl/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );
                final newAccessToken = response.data['accessToken'];

                // Simpan token baru
                await _secureStorage.write(
                  key: 'resto_accessToken',
                  value: newAccessToken,
                );

                // Ulangi request yang gagal dengan token baru
                e.requestOptions.headers['Authorization'] =
                    'Bearer $newAccessToken';
                final clonedRequest = await _dio.fetch(e.requestOptions);
                return handler.resolve(clonedRequest);
              } catch (refreshError) {
                // Jika refresh token juga gagal, logout user
                await _secureStorage.deleteAll();
                // Di aplikasi nyata, navigasikan ke halaman login
                return handler.next(e);
              }
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  // Getter untuk dio agar bisa diakses dari luar (misal: repository)
  Dio get dio => _dio;
}
