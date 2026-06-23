import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBoxOpen,
  faExclamationTriangle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import Input from "../../components/ui/Input";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import DataTable from "../../components/ui/DataTable";
import InventoryDetailDrawer from "../../components/store-owner/InventoryDetailDrawer";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
const PAGE_SIZE = 10;

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  const showToast = (message, type = "success") =>
    setToast({ isVisible: true, message, type });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Pass all non-hidden statuses so owner sees every product including out_of_stock
      const res = await fetch(`${API_URL}/api/costumes?limit=1000&status=available,out_of_stock,maintenance,dry_cleaning,rented`);
      const data = await res.json();
      if (res.ok) setProducts(data.costumes || []);
    } catch {
      showToast("Không thể tải dữ liệu kho", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Enrich each product with aggregate inventory numbers
  const enriched = useMemo(() => products.map(p => {
    const variants = p.variants || [];
    const totalStock  = variants.reduce((s, v) => s + (v.totalStock || 0), 0);
    const availStock  = variants.reduce((s, v) => s + (v.availableStock || 0), 0);
    return {
      ...p,
      _totalStock:  totalStock,
      _availStock:  availStock,
      _rentedStock: totalStock - availStock,
      _sizeCount:   variants.length,
      _isOutOfStock: availStock === 0 && totalStock > 0,
      _isEmpty:      totalStock === 0,
    };
  }), [products]);

  const filtered = useMemo(() => enriched.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStock =
      filterStock === "all"          ? true :
      filterStock === "out_of_stock" ? p._isOutOfStock :
      filterStock === "in_stock"     ? p._availStock > 0 : true;
    return matchSearch && matchStock;
  }), [enriched, search, filterStock]);

  useEffect(() => setCurrentPage(1), [search, filterStock]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Summary stats at top
  const stats = useMemo(() => ({
    totalProducts:  enriched.length,
    totalItems:     enriched.reduce((s, p) => s + p._totalStock, 0),
    availItems:     enriched.reduce((s, p) => s + p._availStock, 0),
    outOfStockCount: enriched.filter(p => p._isOutOfStock).length,
  }), [enriched]);

  // selectedProduct is always fresh — derived from latest products state
  const selectedProduct = useMemo(
    () => products.find(p => p._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleSaved = () => {
    fetchProducts(); // refresh; selectedProduct auto-updates via derivation above
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight text-[#1a1a1a]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Quản lý Kho hàng
        </h2>
        <p className="text-[#999] text-sm mt-1">
          Theo dõi tồn kho và cập nhật số lượng từng sản phẩm
        </p>
      </div>

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
      <div className="bg-white rounded-2xl p-5 border border-[#f0f0f0] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider w-[35%]">
              Sản phẩm
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider">
              Danh mục
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">
              Số size
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">
              Tổng kho
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">
              Sẵn sàng
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-center">
              Đang thuê
            </th>
            <th className="py-4 px-6 text-xs font-semibold text-[#999] uppercase tracking-wider text-right">
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
              <td className="py-4 px-6 text-[13px] text-[#555]">
                <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 text-[13px]">
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

              {/* Action */}
              <td className="py-4 px-6 text-right">
                <button
                  onClick={e => { e.stopPropagation(); setSelectedProductId(product._id); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a1a1a] border border-[#e0e0e0] hover:border-[#1a1a1a] hover:bg-[#f5f5f5] px-3 py-1.5 rounded-lg transition-colors"
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

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
