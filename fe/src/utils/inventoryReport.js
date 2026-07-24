import * as XLSX from "xlsx";

export const COSTUME_STATUS_LABEL = {
  available: "Còn hàng", rented: "Đang thuê",
  maintenance: "Bảo trì", dry_cleaning: "Bảo trì",
  hidden: "Đang ẩn", out_of_stock: "Hết hàng",
};

// Tính đúng breakdown Sẵn sàng / Đang thuê / Đang bảo trì từ instances[] (nguồn sự thật của tồn kho) —
// trước đây "Đang thuê" bị tính bằng total - available nên gộp luôn cả unit đang bảo trì vào, không
// khớp với số "đang thuê" thực tế ở dashboard/report. Có fallback cho variant cũ chưa từng có instances[].
export function computeVariantBreakdown(variant) {
  const total = variant.totalStock || 0;
  const available = variant.availableStock || 0;
  const hasInstances = variant.instances && variant.instances.length > 0;
  const rented = hasInstances
    ? variant.instances.filter((i) => i.status === "rented").length
    : Math.max(0, total - available);
  const maintenance = hasInstances
    ? variant.instances.filter((i) => i.status === "maintenance").length
    : 0;
  return { total, available, rented, maintenance };
}

// Dùng cho nút "Xuất báo cáo tồn kho" ở trang "Kho hàng" (InventoryPage).
export function buildInventoryWorkbook(products) {
  const detailRows = [];
  let tStock = 0, tAvail = 0, tRented = 0, tMaintenance = 0;

  products.forEach((p) => {
    const variants = p.variants?.length > 0 ? p.variants : [{}];
    variants.forEach((v) => {
      const { total, available, rented, maintenance } = computeVariantBreakdown(v);
      tStock += total; tAvail += available; tRented += rented; tMaintenance += maintenance;
      detailRows.push({
        "Tên sản phẩm": p.name || "",
        "Danh mục": p.categoryId?.name || "",
        "Size": v.size || "—",
        "SKU": v.sku || "—",
        "Tổng kho": total,
        "Sẵn sàng": available,
        "Đang thuê": rented,
        "Đang bảo trì": maintenance,
        "Tỷ lệ khai thác": total > 0 ? `${((rented / total) * 100).toFixed(1)}%` : "0%",
        "Trạng thái": COSTUME_STATUS_LABEL[v.status || p.status] || "",
      });
    });
  });

  const currentDate = new Date().toLocaleString("vi-VN");
  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ["BÁO CÁO TỒN KHO CHI TIẾT - COSTUMEHUB"],
    [`Ngày trích xuất: ${currentDate}`], [],
    ["Tổng sản phẩm", products.length],
    ["Tổng kho", tStock],
    ["Sẵn sàng", tAvail],
    ["Đang thuê", tRented],
    ["Đang bảo trì", tMaintenance],
  ]);
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 14 }];

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail["!cols"] = [
    { wch: 30 }, { wch: 18 }, { wch: 8 }, { wch: 14 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");
  XLSX.utils.book_append_sheet(wb, wsDetail, "Chi tiet tung size");
  return wb;
}

export function exportInventoryExcelFile(products) {
  const wb = buildInventoryWorkbook(products);
  XLSX.writeFile(wb, `Bao_cao_ton_kho_CostumeHUB_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
