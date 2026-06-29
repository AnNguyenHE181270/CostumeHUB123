import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "", slug: "", categoryId: "",
    pricePerDay: "", deposit: "",
    minRentalDays: 1, description: "",
    images: [], material: "", includedAccessories: "",
    variants: []
  });

  const [selectedParentId, setSelectedParentId] = useState("");

  const parentCategories = categories.filter(c => !c.parentId);
  const childCategories = categories.filter(c => c.parentId === selectedParentId);

  const lateFeePerDay = formData.deposit ? Math.round(Number(formData.deposit) * 0.1) : 0;

  useEffect(() => {
    if (initialData) {
      const currentCatId = initialData.categoryId?._id || initialData.categoryId;
      const currentCat = categories.find(c => c._id === currentCatId);

      let parentId = "";
      if (currentCat) {
        parentId = currentCat.parentId ? currentCat.parentId : currentCat._id;
      }
      setSelectedParentId(parentId);

      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        categoryId: currentCatId || "",
        pricePerDay: initialData.pricePerDay ?? "",
        deposit: initialData.deposit ?? "",
        minRentalDays: initialData.minRentalDays || 1,
        description: initialData.description || "",
        images: initialData.images || [],
        material: initialData.specifications?.material || "",
        includedAccessories: initialData.specifications?.includedAccessories?.join(", ") || "",
        variants: (initialData.variants || []).map(v => ({
          _id: v._id,
          size: v.size || "",
          totalStock: v.totalStock || 1,
          availableStock: v.availableStock ?? 0,
        })),
      });
    } else {
      setSelectedParentId("");
      setFormData({
        name: "", slug: "", categoryId: "",
        pricePerDay: "", deposit: "",
        minRentalDays: 1, description: "",
        images: [], material: "", includedAccessories: "",
        variants: []
      });
    }
  }, [initialData, isOpen, categories]);

  const handleParentChange = (e) => {
    setSelectedParentId(e.target.value);
    setFormData(prev => ({ ...prev, categoryId: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: (!initialData || !prev.slug) ? generateSlug(value) : prev.slug
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: "", totalStock: 1 }]
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      alert("Chỉ được tải lên tối đa 5 ảnh!");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      alert("Vui lòng tải lên ít nhất một ảnh cho sản phẩm!");
      return;
    }
    if (!formData.categoryId) {
      alert("Vui lòng chọn danh mục cho sản phẩm!");
      return;
    }
    if (formData.variants.length === 0) {
      alert("Vui lòng thêm ít nhất một biến thể (Size) cho sản phẩm!");
      return;
    }
    if (formData.variants.some(v => !v.size || !v.totalStock || Number(v.totalStock) < 1)) {
      alert("Vui lòng điền đầy đủ Size và Số lượng (tối thiểu 1) cho tất cả biến thể!");
      return;
    }

    const computedLateFee = Math.round(Number(formData.deposit) * 0.1);

    const submitData = {
      name: formData.name,
      slug: formData.slug,
      categoryId: formData.categoryId,
      pricePerDay: Number(formData.pricePerDay) || 0,
      deposit: Number(formData.deposit) || 0,
      lateFeePerDay: computedLateFee,
      minRentalDays: Number(formData.minRentalDays) || 1,
      description: formData.description,
      images: formData.images,
      specifications: {
        material: formData.material,
        includedAccessories: formData.includedAccessories
          ? formData.includedAccessories.split(",").map(i => i.trim()).filter(Boolean)
          : [],
      },
      variants: formData.variants.map(v => ({
        ...(v._id ? { _id: v._id } : {}),
        size: v.size,
        totalStock: Number(v.totalStock) || 0,
      })),
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  const totalVariantStock = formData.variants.reduce((sum, v) => sum + (Number(v.totalStock) || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white pb-3 z-10 border-b flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            {initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 1. Thông tin chung ── */}
          <section className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-[#f94a00] mb-4">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Tên sản phẩm *" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Slug (đường dẫn)" name="slug" value={formData.slug} onChange={handleChange} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục cha *</label>
                <select
                  value={selectedParentId}
                  onChange={handleParentChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none text-sm"
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parentCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục con *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  disabled={!selectedParentId}
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none text-sm ${
                    !selectedParentId
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-[#f94a00]"
                  }`}
                >
                  <option value="">-- Chọn danh mục con --</option>
                  {childCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <Input label="Chất liệu (VD: Nhung, Tơ tằm)" name="material" value={formData.material} onChange={handleChange} />
              <Input label="Phụ kiện đi kèm (VD: Kiềng bạc, nơ)" name="includedAccessories" value={formData.includedAccessories} onChange={handleChange} />

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Mô tả chi tiết *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none resize-none text-sm"
                />
              </div>
            </div>
          </section>

          {/* ── 2. Giá thuê & Đặt cọc ── */}
          <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h3 className="text-base font-semibold text-blue-700 mb-4">Giá thuê & Đặt cọc</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Giá thuê / ngày (VNĐ) *"
                name="pricePerDay"
                type="number"
                min="0"
                value={formData.pricePerDay}
                onChange={handleChange}
                required
              />
              <Input
                label="Tiền cọc ký quỹ (VNĐ) *"
                name="deposit"
                type="number"
                min="0"
                value={formData.deposit}
                onChange={handleChange}
                required
              />

              {/* Auto-calculated late fee */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Phí trễ hẹn / ngày
                </label>
                <div className="w-full px-4 py-2.5 border border-blue-200 rounded-lg bg-white text-sm">
                  <span className="font-bold text-blue-700">
                    {lateFeePerDay.toLocaleString("vi-VN")} VNĐ
                  </span>
                  <p className="text-xs text-blue-500 mt-0.5">Tự động = 10% tiền cọc</p>
                </div>
              </div>

              <Input
                label="Thuê tối thiểu (ngày)"
                name="minRentalDays"
                type="number"
                min="1"
                value={formData.minRentalDays}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* ── 3. Biến thể & Tồn kho ── */}
          <section className="bg-purple-50 p-5 rounded-xl border border-purple-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold text-purple-700">Biến thể theo Size</h3>
                <p className="text-xs text-purple-500 mt-0.5">
                  Mỗi dòng = 1 size. Nhập số lượng thực tế cho từng size.
                </p>
              </div>
              <Button type="button" variant="primary" icon={faPlus} onClick={handleAddVariant} className="text-sm">
                Thêm Size
              </Button>
            </div>

            {formData.variants.length === 0 ? (
              <div className="text-center py-10 text-purple-300 border-2 border-dashed border-purple-200 rounded-xl">
                <p className="font-semibold text-purple-400">Chưa có size nào</p>
                <p className="text-sm mt-1">Nhấn "Thêm Size" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="bg-white border border-purple-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-end gap-3"
                  >
                    {/* Size selector */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Kích cỡ *
                      </label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                      >
                        <option value="">-- Chọn --</option>
                        {SIZES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Total stock */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tổng số lượng *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={variant.totalStock}
                        onChange={(e) => handleVariantChange(index, "totalStock", e.target.value)}
                        required
                        placeholder="VD: 3"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                      />
                    </div>

                    {/* Available stock (read-only, edit mode only) */}
                    {initialData && variant.availableStock !== undefined && (
                      <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Còn sẵn sàng
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 font-medium">
                          {variant.availableStock}
                          <span className="text-gray-400 font-normal"> / {variant.totalStock}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="self-end text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.variants.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-200 flex justify-between text-sm text-purple-600 font-medium">
                <span>
                  {formData.variants.length} size &nbsp;·&nbsp; Tổng:{" "}
                  <strong className="text-purple-800">{totalVariantStock}</strong> sản phẩm
                </span>
              </div>
            )}
          </section>

          {/* ── 4. Hình ảnh ── */}
          <section className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-[#f94a00] mb-4">Hình ảnh sản phẩm</h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Chọn ảnh (tối đa 5 ảnh)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={formData.images.length >= 5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">Đã chọn: {formData.images.length} / 5 ảnh</p>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group border rounded-xl overflow-hidden bg-white aspect-square">
                    <img
                      src={img}
                      alt={`Ảnh ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/150x150?text=Lỗi";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1.5 right-1.5 bg-white bg-opacity-80 text-red-500 hover:bg-opacity-100 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-[#f94a00] text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                        Ảnh chính
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={onClose}>Hủy</Button>
            <Button variant="primary" type="submit">
              {initialData ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
