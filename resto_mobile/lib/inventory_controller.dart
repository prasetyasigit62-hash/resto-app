import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'material_model.dart';
import 'inventory_repository.dart';

// Provider ini akan mengambil data bahan baku sekali dan menyimpannya (cache).
// UI akan secara otomatis diperbarui saat data berubah atau di-refresh.
final materialsProvider = FutureProvider<List<MaterialModel>>((ref) {
  final inventoryRepository = ref.watch(inventoryRepositoryProvider);
  return inventoryRepository.getMaterials();
});
