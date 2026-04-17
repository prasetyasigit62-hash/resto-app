import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'material_model.dart';
import 'api_service.dart';

final inventoryRepositoryProvider = Provider<InventoryRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return InventoryRepository(apiService.dio);
});

class InventoryRepository {
  final Dio _dio;
  InventoryRepository(this._dio);

  Future<List<MaterialModel>> getMaterials() async {
    try {
      final response = await _dio.get('/v2/materials');
      final List<dynamic> data = response.data;
      return data.map((json) => MaterialModel.fromJson(json)).toList();
    } on DioException catch (e) {
      // Lemparkan pesan error yang lebih deskriptif dari backend
      throw e.response?.data['error'] ?? 'Gagal memuat data bahan baku.';
    } catch (e) {
      throw 'Terjadi kesalahan yang tidak diketahui.';
    }
  }
}
