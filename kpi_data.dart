class KpiData {
  final double omzetToday;
  final List<TopSellingItem> topSelling;
  final List<CriticalStockItem> criticalStocks;

  KpiData({
    required this.omzetToday,
    required this.topSelling,
    required this.criticalStocks,
  });

  factory KpiData.fromJson(Map<String, dynamic> json) {
    return KpiData(
      omzetToday: (json['omzetToday'] ?? 0).toDouble(),
      topSelling: (json['topSelling'] as List<dynamic>? ?? [])
          .map((item) => TopSellingItem.fromJson(item))
          .toList(),
      criticalStocks: (json['criticalStocks'] as List<dynamic>? ?? [])
          .map((item) => CriticalStockItem.fromJson(item))
          .toList(),
    );
  }
}

class TopSellingItem {
  final String menu;
  final int qty;

  TopSellingItem({required this.menu, required this.qty});

  factory TopSellingItem.fromJson(Map<String, dynamic> json) {
    return TopSellingItem(
      menu: json['menu'] ?? 'Unknown',
      qty: json['qty'] ?? 0,
    );
  }
}

class CriticalStockItem {
  final String material;
  final double qty;

  CriticalStockItem({required this.material, required this.qty});

  factory CriticalStockItem.fromJson(Map<String, dynamic> json) {
    return CriticalStockItem(
      material: json['material'] ?? 'Unknown',
      qty: (json['qty'] ?? 0).toDouble(),
    );
  }
}
