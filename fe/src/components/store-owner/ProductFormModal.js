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
    minRentalDays: 1, maxRentalDays: 7, description: "",
    images: [], material: "", includedAccessories: "",
    variants: []
  });

  const [selectedParentId, setSelectedParentId] = useState("");
  
  // State quản lý lỗi hiển thị dưới input (Xử lý Issue 4)
  const [errors, setErrors] = useState({});

  const parentCategories = categories.filter(c => !c.parentId);
  const childCategories = categories.filter(c => c.parentId === selectedParentId);

  const lateFeePerDay = formData.deposit ? Math.round(Number(formData.deposit) * 0.1) : 0;

  useEffect(() => {
    // Reset lỗi mỗi khi mở form
    setErrors({});
    
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
        maxRentalDays: initialData.maxRentalDays || 7,
        description: initialData.description || "",
        images: initialData.images || [],
        material: initialData.specifications?.material || "",
        includedAccessories: initialData.specifications?.includedAccessories?.join(", ") || "",
        variants: (initialData.variants || []).map(v => ({
          _id: v._id,
          size: v.size || "",
          totalStock: v.totalStock || 1,
          availableStock: v.availableStock ?? 0,
          lowStockThreshold: v.lowStockThreshold ?? 3,
        })),
      });
    } else {
      setSelectedParentId("");
      setFormData({
        name: "", slug: "", categoryId: "",
        pricePerDay: "", deposit: "",
        minRentalDays: 1, maxRentalDays: 7, description: "",
        images: [], material: "", includedAccessories: "",
        variants: []
      });
    }
  }, [initialData, isOpen, categories]);

  const handleParentChange = (e) => {
    setSelectedParentId(e.target.value);
    setFormData(prev => ({ ...prev, categoryId: "" }));
    setErrors(prev => ({ ...prev, parentId: "", categoryId: "" }));
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
    
    // Xóa thông báo lỗi khi user bắt đầu gõ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: "", totalStock: 1, lowStockThreshold: 3 }]
    }));
    setErrors(prev => ({ ...prev, variants: "" }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
    setErrors(prev => {
      const copy = { ...prev, variants: "" };
      if (copy.variantErrors && copy.variantErrors[index]) {
        const updatedVarErr = { ...copy.variantErrors };
        const curItemErr = { ...updatedVarErr[index], [field]: "" };
        if (Object.values(curItemErr).every(val => !val)) {
          delete updatedVarErr[index];
        } else {
          updatedVarErr[index] = curItemErr;
        }
        copy.variantErrors = updatedVarErr;
      }
      return copy;
    });
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
      setErrors(prev => ({ ...prev, images: "Chỉ được tải lên tối đa 5 ảnh!" }));
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
    setErrors(prev => ({ ...prev, images: "" }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate dữ liệu và đẩy lỗi vào mảng newErrors
    if (!formData.name) newErrors.name = "Vui lòng nhập tên sản phẩm.";
    if (!selectedParentId) newErrors.parentId = "Vui lòng chọn danh mục cha.";
    if (!formData.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục con.";
    if (!formData.pricePerDay) newErrors.pricePerDay = "Vui lòng nhập giá thuê.";
    if (!formData.deposit) newErrors.deposit = "Vui lòng nhập tiền cọc.";

    if (formData.variants.length === 0) {
      newErrors.variants = "Vui lòng thêm ít nhất một kích cỡ (Size).";
    } else {
      const vErrors = {};
      formData.variants.forEach((v, index) => {
        const itemErr = {};
        if (!v.size) itemErr.size = "Vui lòng chọn Size.";
        if (v.totalStock === "" || v.totalStock === null || v.totalStock === undefined || Number(v.totalStock) < 1) {
          itemErr.totalStock = "Số lượng tối thiểu là 1.";
        }
        if (Object.keys(itemErr).length > 0) {
          vErrors[index] = itemErr;
        }
      });
      if (Object.keys(vErrors).length > 0) {
        newErrors.variantErrors = vErrors;
        newErrors.variants = "Vui lòng kiểm tra lại thông tin các biến thể.";
      }
    }

    if (formData.images.length === 0) {
      newErrors.images = "Vui lòng tải lên ít nhất một ảnh cho sản phẩm.";
    }

    // Nếu có lỗi, chặn việc submit và hiển thị lên giao diện
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
      maxRentalDays: Number(formData.maxRentalDays) || 7,
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
        lowStockThreshold: Number(v.lowStockThreshold) || 0,
      })),
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  const totalVariantStock = formData.variants.reduce((sum, v) => sum + (Number(v.totalStock) || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto px-4 py-10">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-8 m-auto max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-8" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── 1. Thông tin chung ── */}
          <section className="bg-white p-6 rounded-lg border border-[#eaeaea] shadow-sm">
            <h3 className="text-sm font-semibold text-[#555] uppercase tracking-wider mb-5 border-b border-[#eaeaea] pb-2">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <Input label="Tên sản phẩm" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
              
              <Input label="Slug (đường dẫn)" name="slug" value={formData.slug} onChange={handleChange} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
                <select
                  value={selectedParentId}
                  onChange={handleParentChange}
                  className={`w-full px-4 py-2 border rounded-lg outline-none text-sm transition-colors ${errors.parentId ? 'border-red-500' : 'border-gray-300 focus:border-[#1a1a1a]'}`}
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parentCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.parentId && <p className="text-red-500 text-xs">{errors.parentId}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục con <span className="text-red-500">*</span></label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={!selectedParentId}
                  className={`w-full px-4 py-2 border rounded-lg outline-none text-sm transition-colors ${
                    !selectedParentId ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" :
                    errors.categoryId ? "border-red-500" : "border-gray-300 focus:border-[#1a1a1a]"
                  }`}
                >
                  <option value="">-- Chọn danh mục con --</option>
                  {childCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId}</p>}
              </div>

              <Input label="Chất liệu (VD: Nhung, Tơ tằm)" name="material" value={formData.material} onChange={handleChange} />
              <Input label="Phụ kiện đi kèm (VD: Kiềng bạc, nơ)" name="includedAccessories" value={formData.includedAccessories} onChange={handleChange} />

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none resize-none text-sm transition-colors ${errors.description ? 'border-red-500' : 'border-gray-300 focus:border-[#1a1a1a]'}`}
                />
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              </div>
            </div>
          </section>

          {/* ── 2. Giá thuê & Đặt cọc ── */}
          <section className="bg-white p-6 rounded-lg border border-[#eaeaea] shadow-sm">
            <h3 className="text-sm font-semibold text-[#555] uppercase tracking-wider mb-5 border-b border-[#eaeaea] pb-2">Định giá</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              
              <Input
                label="Giá thuê / ngày (VNĐ)"
                name="pricePerDay"
                type="number"
                min="0"
                value={formData.pricePerDay}
                onChange={handleChange}
                error={errors.pricePerDay}
                required
              />
              
              <Input
                label="Tiền cọc ký quỹ (VNĐ)"
                name="deposit"
                type="number"
                min="0"
                value={formData.deposit}
                onChange={handleChange}
                error={errors.deposit}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Phí trễ hẹn / ngày</label>
                <div className="w-full px-4 py-2 border border-[#eaeaea] rounded-lg bg-[#faf9f7] text-sm">
                  <span className="font-semibold text-[#1a1a1a]">
                    {lateFeePerDay.toLocaleString("vi-VN")} VNĐ
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1">Tự động = 10% tiền cọc</p>
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

              <Input
                label="Thuê tối đa (ngày)"
                name="maxRentalDays"
                type="number"
                min="1"
                value={formData.maxRentalDays}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* ── 3. Biến thể & Tồn kho ── */}
          <section className="bg-white p-6 rounded-lg border border-[#eaeaea] shadow-sm">
            <div className="flex justify-between items-center mb-5 border-b border-[#eaeaea] pb-2">
              <h3 className="text-sm font-semibold text-[#555] uppercase tracking-wider">Biến thể theo Size</h3>
              <button 
                type="button" 
                onClick={handleAddVariant} 
                className="text-sm bg-[#faf9f7] hover:bg-gray-200 text-[#1a1a1a] px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2 border border-[#eaeaea]"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Thêm Size
              </button>
            </div>

            {formData.variants.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#eaeaea] rounded-lg bg-[#faf9f7]">
                <p className="text-sm text-gray-500">Chưa có biến thể nào được thiết lập.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="bg-[#faf9f7] border border-[#eaeaea] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-end gap-4"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-600">Kích cỡ <span className="text-red-500">*</span></label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                        className={`px-3 py-2 border rounded-md outline-none text-sm bg-white transition-colors ${
                          errors.variantErrors?.[index]?.size ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1a1a1a]"
                        }`}
                      >
                        <option value="">-- Chọn --</option>
                        {SIZES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.variantErrors?.[index]?.size && (
                        <p className="text-red-500 text-xs font-medium mt-0.5">{errors.variantErrors[index].size}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-600">Tổng số lượng <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        value={variant.totalStock}
                        onChange={(e) => handleVariantChange(index, "totalStock", e.target.value)}
                        placeholder="VD: 3"
                        className={`px-3 py-2 border rounded-md outline-none text-sm bg-white transition-colors ${
                          errors.variantErrors?.[index]?.totalStock ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1a1a1a]"
                        }`}
                      />
                      {errors.variantErrors?.[index]?.totalStock && (
                        <p className="text-red-500 text-xs font-medium mt-0.5">{errors.variantErrors[index].totalStock}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs font-medium text-gray-600">Ngưỡng cảnh báo hết hàng</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.lowStockThreshold ?? 3}
                        onChange={(e) => handleVariantChange(index, "lowStockThreshold", e.target.value)}
                        placeholder="VD: 3"
                        title="Khi xuất kho, nếu số lượng sẵn sàng còn lại sau khi xuất <= ngưỡng này, hệ thống sẽ cảnh báo"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:border-[#1a1a1a] outline-none text-sm bg-white"
                      />
                    </div>

                    {initialData && variant.availableStock !== undefined && (
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-xs font-medium text-gray-600">Còn sẵn sàng</label>
                        <div className="px-3 py-2 border border-[#eaeaea] rounded-md bg-white text-sm text-gray-600">
                          <span className="font-semibold text-[#1a1a1a]">{variant.availableStock}</span>
                          <span className="text-gray-400"> / {variant.totalStock}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-gray-400 hover:text-red-500 p-2 mb-0.5 transition-colors"
                      title="Xóa biến thể này"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.variants && <p className="text-red-500 text-xs mt-3 font-medium">{errors.variants}</p>}

            {formData.variants.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#eaeaea] text-sm text-gray-600">
                Tổng cộng: <strong className="text-[#1a1a1a]">{totalVariantStock}</strong> sản phẩm trong kho.
              </div>
            )}
          </section>

          {/* ── 4. Hình ảnh ── */}
          <section className="bg-white p-6 rounded-lg border border-[#eaeaea] shadow-sm">
            <h3 className="text-sm font-semibold text-[#555] uppercase tracking-wider mb-5 border-b border-[#eaeaea] pb-2">Hình ảnh minh họa</h3>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Tải ảnh lên (Tối đa 5 ảnh)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={formData.images.length >= 5}
                className={`w-full px-4 py-2 border rounded-lg text-sm bg-[#faf9f7] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1a1a1a] file:text-white hover:file:bg-[#333] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none transition-colors ${errors.images ? 'border-red-500' : 'border-[#eaeaea]'}`}
              />
              {errors.images && <p className="text-red-500 text-xs font-medium">{errors.images}</p>}
            </div>

            {formData.images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group border border-[#eaeaea] rounded-lg overflow-hidden bg-white aspect-square">
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
                      className="absolute top-2 right-2 bg-white text-red-500 hover:text-white hover:bg-red-500 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] bg-opacity-80 text-white text-[11px] py-1 text-center font-medium">
                        Ảnh chính
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[#eaeaea]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-[#eaeaea] text-gray-700 rounded-lg hover:bg-[#faf9f7] font-medium transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333] font-medium transition-colors text-sm"
            >
              {initialData ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;