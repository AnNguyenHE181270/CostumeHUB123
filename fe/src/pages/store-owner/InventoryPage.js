import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBoxOpen,
  faExclamationTriangle,
  faChevronRight,
  faWarehouse,
  faClockRotateLeft,
  faFileExcel,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Input from "../../components/ui/Input";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import DataTable from "../../components/ui/DataTable";
import InventoryDetailDrawer from "../../components/store-owner/InventoryDetailDrawer";
import StockHistoryPanel from "../../components/store-owner/StockHistoryPanel";
import costumeService from "../../services/costume.service";
import { computeVariantBreakdown, exportInventoryExcelFile } from "../../utils/inventoryReport";
const PAGE_SIZE = 10;

export default function InventoryPage() {
  const [tab, setTab] = useState("stock"); // "stock" | "history"
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
  const [exporting, setExporting] = useState(false);

  const showToast = (message, type = "success") =>
    setToast({ isVisible: true, message, type });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await costumeService.getInventory();
      setProducts(data.costumes || []);
    } catch {
      showToast("Không thể tải dữ liệu kho", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Enrich each product with aggregate inventory numbers — tách riêng "đang thuê" và "đang bảo trì"
  // từ instances[] (nguồn sự thật), thay vì gộp chung thành totalStock - availableStock như trước
  // (khiến unit đang bảo trì bị đếm nhầm là "đang thuê").
  const enriched = useMemo(() => products.map(p => {
    const variants = p.variants || [];
    let totalStock = 0, availStock = 0, rentedStock = 0, maintenanceStock = 0;
    variants.forEach((v) => {
      const b = computeVariantBreakdown(v);
      totalStock += b.total; availStock += b.available; rentedStock += b.rented; maintenanceStock += b.maintenance;
    });
    return {
      ...p,
      _totalStock: totalStock,
      _availStock: availStock,
      _rentedStock: rentedStock,
      _maintenanceStock: maintenanceStock,
      _sizeCount: variants.length,
      _isOutOfStock: availStock === 0 && totalStock > 0,
      _isEmpty: totalStock === 0,
    };
  }), [products]);

  const filtered = useMemo(() => enriched.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStock =
      filterStock === "all" ? true :
        filterStock === "out_of_stock" ? p._isOutOfStock :
          filterStock === "in_stock" ? p._availStock > 0 : true;
    return matchSearch && matchStock;
  }), [enriched, search, filterStock]);

  useEffect(() => setCurrentPage(1), [search, filterStock]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Summary stats at top
  const stats = useMemo(() => ({
    totalProducts: enriched.length,
    totalItems: enriched.reduce((s, p) => s + p._totalStock, 0),
    availItems: enriched.reduce((s, p) => s + p._availStock, 0),
    outOfStockCount: enriched.filter(p => p._isOutOfStock).length,
  }), [enriched]);

  // selectedProduct is always fresh — derived from latest products state
  const selectedProduct = useMemo(
    () => products.find(p => p._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleSaved = () => {
    fetchProducts(); // refresh; selectedProduct auto-updates via derivation above
    setHistoryRefreshKey((k) => k + 1); // history tab refetches next time it's visible
  };

  // Xuất báo cáo tồn kho ngay từ dữ liệu đang hiển thị trên màn hình (không gọi lại API) — đảm bảo
  // số liệu trong file Excel luôn khớp 100% với những gì chủ shop đang thấy trên trang này.
  const handleExportInventory = () => {
    if (products.length === 0) {
      showToast("Chưa có dữ liệu để xuất báo cáo.", "error");
      return;
    }
    setExporting(true);
    try {
      exportInventoryExcelFile(products);
      showToast("Xuất báo cáo tồn kho thành công!");
    } catch {
      showToast("Lỗi khi xuất báo cáo tồn kho.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Tabs ── */}
      <div className="flex items-center justify-between gap-2 border-b border-[#eaeaea]">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("stock")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "stock" ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <FontAwesomeIcon icon={faWarehouse} className="text-xs" />
            Tồn kho
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "history" ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-xs" />
            Lịch sử Nhập/Xuất
          </button>
        </div>
        {tab === "stock" && (
          <button
            type="button"
            onClick={handleExportInventory}
            disabled={exporting}
            className="mb-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={exporting ? faSpinner : faFileExcel} spin={exporting} className="text-xs" />
            {exporting ? "Đang xuất..." : "Xuất báo cáo tồn kho"}
          </button>
        )}
      </div>

      {tab === "history" ? (
        <StockHistoryPanel refreshKey={historyRefreshKey} />
      ) : (
      <>
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Tổng sản phẩm</p>
          <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Tổng trang phục</p>
          <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Sẵn sàng cho thuê</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availItems}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Đang hết hàng</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.outOfStockCount}</p>
          <p className="text-[11px] text-gray-400">sản phẩm</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative w-full md:col-span-2">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm"
          />
          <Input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="!pl-10 w-full"
          />
        </div>
        <div className="w-full">
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value)}
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a] text-sm bg-white text-[#555]"
          >
            <option value="all">Tất cả tình trạng kho</option>
            <option value="in_stock">Còn hàng</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        isLoading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="Không tìm thấy sản phẩm nào"
        footer={
          <div className="p-4 border-t border-[#f0f0f0]">
            <Pagination
              displayCount={paginated.length}
              totalCount={filtered.length}
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
              onPageChange={setCurrentPage}
            />
          </div>
        }
      >
        <thead>
          <tr className="border-b border-[#f0f0f0] bg-gray-50/50">
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider w-[28%] text-left">
              Sản phẩm
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider w-[15%] text-left">
              Danh mục
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">
              Số size
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">
              Tổng kho
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">
              Sẵn sàng
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">
              Đang thuê
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center w-[10%]">
              Đang bảo trì
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right w-[7%]">
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {paginated.map(product => (
            <tr
              key={product._id}
              onClick={() => setSelectedProductId(product._id)}
              className="hover:bg-[#faf9f7] transition-colors cursor-pointer"
            >
              {/* Product name + image */}
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <img
                    src={product.images?.[0] || "https://placehold.co/48x48"}
                    alt={product.name}
                    className="w-11 h-11 rounded-lg object-cover bg-[#f5f5f5] border border-[#eaeaea] flex-shrink-0"
                    onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48"; }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[14px] text-[#1a1a1a] truncate">{product.name}</p>
                    {product._isOutOfStock && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium mt-0.5">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                        Hết hàng
                      </span>
                    )}
                    {product._isEmpty && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <FontAwesomeIcon icon={faBoxOpen} className="text-[10px]" />
                        Chưa có hàng
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="py-4 px-6 text-[13px] text-[#555] whitespace-nowrap">
                <span className="inline-block bg-[#f4f4f5] text-[#3f3f46] text-xs px-2.5 py-1 rounded-full font-medium border border-[#e4e4e7]">
                  {product.categoryId?.name || "—"}
                </span>
              </td>

              {/* Size count */}
              <td className="py-4 px-6 text-center">
                {product._sizeCount > 0 ? (
                  <span className="font-medium text-[#1a1a1a] text-sm">{product._sizeCount}</span>
                ) : (
                  <span className="text-[#ccc]">—</span>
                )}
              </td>

              {/* Total stock */}
              <td className="py-4 px-6 text-center font-semibold text-[#1a1a1a] text-sm">
                {product._totalStock}
              </td>

              {/* Available */}
              <td className="py-4 px-6 text-center">
                {product._availStock > 0 ? (
                  <span className="text-emerald-600 font-bold text-sm">{product._availStock}</span>
                ) : (
                  <span className="text-red-500 font-bold text-sm">0</span>
                )}
              </td>

              {/* Rented */}
              <td className="py-4 px-6 text-center">
                <span className={`font-medium text-sm ${product._rentedStock > 0 ? "text-orange-500" : "text-[#ccc]"}`}>
                  {product._rentedStock > 0 ? product._rentedStock : "—"}
                </span>
              </td>

              {/* Maintenance */}
              <td className="py-4 px-6 text-center">
                <span className={`font-medium text-sm ${product._maintenanceStock > 0 ? "text-amber-600" : "text-[#ccc]"}`}>
                  {product._maintenanceStock > 0 ? product._maintenanceStock : "—"}
                </span>
              </td>

              {/* Action */}
              <td className="py-4 px-6 text-right whitespace-nowrap">
                <button
                  onClick={e => { e.stopPropagation(); setSelectedProductId(product._id); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a1a1a] hover:text-[#666] transition-colors"
                >
                  Chi tiết
                  <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      {/* ── Detail Drawer ── */}
      <InventoryDetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProductId(null)}
        onSaved={handleSaved}
        showToast={showToast}
      />
      </>
      )}

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
