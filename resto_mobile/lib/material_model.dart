class Supplier {
  final String id;
  final String name;

  Supplier({required this.id, required this.name});

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown Supplier',
    );
  }
}

class OutletStock {
  final String outletId;
  final String materialId;
  final double qty;

  OutletStock(
      {required this.outletId, required this.materialId, required this.qty});

  factory OutletStock.fromJson(Map<String, dynamic> json) {
    return OutletStock(
      outletId: json['outletId'] ?? '',
      materialId: json['materialId'] ?? '',
      qty: (json['qty'] ?? 0).toDouble(),
    );
  }
}

class MaterialModel {
  final String id;
  final String name;
  final String unit;
  final double lastPrice;
  final double minStock;
  final Supplier? supplier;
  final List<OutletStock> stocks;

  MaterialModel({
    required this.id,
    required this.name,
    required this.unit,
    required this.lastPrice,
    required this.minStock,
    this.supplier,
    required this.stocks,
  });

  // Helper untuk mendapatkan total stok dari semua outlet
  double get totalStock {
    if (stocks.isEmpty) return 0;
    return stocks.map((s) => s.qty).reduce((a, b) => a + b);
  }

  factory MaterialModel.fromJson(Map<String, dynamic> json) {
    return MaterialModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown Material',
      unit: json['unit'] ?? 'pcs',
      lastPrice: (json['lastPrice'] ?? 0).toDouble(),
      minStock: (json['minStock'] ?? 0).toDouble(),
      supplier:
          json['supplier'] != null ? Supplier.fromJson(json['supplier']) : null,
      stocks: (json['stocks'] as List<dynamic>? ?? [])
          .map((stock) => OutletStock.fromJson(stock))
          .toList(),
    );
  }
}
