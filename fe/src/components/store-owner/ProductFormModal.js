import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";

const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
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
    pricePerDay: "", pricePer3Days: "", pricePerWeek: "",
    deposit: "", minRentalDays: 1, lateFeePerDay: 0, description: "",
    images: [], material: "", includedAccessories: "",
    variants: []
  });

  const [selectedParentId, setSelectedParentId] = useState("");

  const parentCategories = categories.filter(c => !c.parentId);
  const childCategories = categories.filter(c => c.parentId === selectedParentId);

  useEffect(() => {
    if (initialData) {
      const currentCatId = initialData.categoryId?._id || initialData.categoryId;
      const currentCat = categories.find(c => c._id === currentCatId);

      let parentId = "";
      if (currentCat) {
        if (currentCat.parentId) {
          parentId = currentCat.parentId;
        } else {
          parentId = currentCat._id;
        }
      }
      setSelectedParentId(parentId);

      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        categoryId: currentCatId || "",
        pricePerDay: initialData.rentalRates?.pricePerDay || "",
        pricePer3Days: initialData.rentalRates?.pricePer3Days || "",
        pricePerWeek: initialData.rentalRates?.pricePerWeek || "",
        deposit: initialData.deposit || "",
        minRentalDays: initialData.minRentalDays || 1,
        lateFeePerDay: initialData.lateFeePerDay || 0,
        description: initialData.description || "",
        images: initialData.images || [],
        material: initialData.specifications?.material || "",
        includedAccessories: initialData.specifications?.includedAccessories?.join(", ") || "",
        variants: initialData.variants && initialData.variants.length > 0
          ? initialData.variants
          : [],
      });
    } else {
      setSelectedParentId("");
      setFormData({
        name: "", slug: "", categoryId: "",
        pricePerDay: "", pricePer3Days: "", pricePerWeek: "",
        deposit: "", minRentalDays: 1, lateFeePerDay: 0, description: "",
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
      setFormData((prev) => ({
        ...prev,
        name: value,
        // Chỉ tự động update slug khi đang thêm mới hoặc slug rỗng
        slug: (!initialData || !prev.slug) ? generateSlug(value) : prev.slug
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Variants handlers
  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: "", sku: "", totalStock: 1, bustSize: "", waistSize: "" }]
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;

    // Auto-generate SKU when size changes
    if (field === "size" && formData.slug) {
      newVariants[index].sku = `SCOS-${formData.slug}-${value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }

    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleRemoveVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  // Images handlers
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (formData.images.length + files.length > 5) {
      alert("Chỉ được tải lên tối đa 5 ảnh!");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
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

    const submitData = {
      name: formData.name,
      slug: formData.slug,
      categoryId: formData.categoryId,
      rentalRates: {
        pricePerDay: Number(formData.pricePerDay),
        pricePer3Days: formData.pricePer3Days ? Number(formData.pricePer3Days) : undefined,
        pricePerWeek: formData.pricePerWeek ? Number(formData.pricePerWeek) : undefined,
      },
      deposit: Number(formData.deposit) || 0,
      minRentalDays: Number(formData.minRentalDays) || 1,
      lateFeePerDay: Number(formData.lateFeePerDay) || 0,
      description: formData.description,
      images: formData.images,
      specifications: {
        material: formData.material,
        includedAccessories: formData.includedAccessories ? formData.includedAccessories.split(",").map(i => i.trim()) : [],
      },
      variants: formData.variants.map(v => ({
        ...v,
        totalStock: Number(v.totalStock) || 0
      }))
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 sticky top-0 bg-white pb-2 z-10 border-b flex justify-between items-center">
          <span>{initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FontAwesomeIcon icon={faTimes} /></button>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-[#f94a00]">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Tên sản phẩm *" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Slug (Đường dẫn)" name="slug" value={formData.slug} onChange={handleChange} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Danh mục cha *</label>
                <select
                  value={selectedParentId}
                  onChange={handleParentChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none transition-all duration-200"
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parentCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
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
                  className={`w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200 ${!selectedParentId ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-[#f94a00]'}`}
                >
                  <option value="">-- Chọn danh mục con --</option>
                  {childCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input label="Chất liệu (VD: Nhung, Tơ tằm)" name="material" value={formData.material} onChange={handleChange} />

              <div className="md:col-span-2">
                <Input label="Phụ kiện đi kèm (VD: Kiềng bạc, nơ)" name="includedAccessories" value={formData.includedAccessories} onChange={handleChange} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none transition-all duration-200 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold border-b border-blue-200 pb-2 mb-4 text-blue-700">Cấu hình Biểu phí & Đặt cọc</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Giá thuê/3 ngày (VNĐ) *" name="pricePer3Days" type="number" min="0" value={formData.pricePer3Days} onChange={handleChange} required />
              <Input label="Giá thuê lẻ/1 ngày (VNĐ)" name="pricePerDay" type="number" min="0" value={formData.pricePerDay} onChange={handleChange} />
              <Input label="Giá cọc ký quỹ (VNĐ) *" name="deposit" type="number" min="0" value={formData.deposit} onChange={handleChange} required />
              <Input label="Phí trễ hẹn/ngày (VNĐ) *" name="lateFeePerDay" type="number" min="0" value={formData.lateFeePerDay} onChange={handleChange} required />
              <Input label="Số ngày thuê tối thiểu" name="minRentalDays" type="number" min="1" value={formData.minRentalDays} onChange={handleChange} />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex justify-between items-center border-b border-purple-200 pb-2 mb-4">
              <h3 className="text-lg font-semibold text-purple-700">Cấu hình Biến thể & Tồn kho</h3>
              <Button type="button" variant="primary" icon={faPlus} onClick={handleAddVariant} className="text-sm px-3 py-1">
                Thêm Biến Thể
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-100 text-purple-800 text-sm">
                    <th className="p-2 border border-purple-200">Kích cỡ (Size)</th>
                    <th className="p-2 border border-purple-200">Mã SKU</th>
                    <th className="p-2 border border-purple-200">Tổng số lượng (totalStock)</th>
                    <th className="p-2 border border-purple-200">Ngực (cm)</th>
                    <th className="p-2 border border-purple-200">Eo (cm)</th>
                    <th className="p-2 border border-purple-200 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.variants.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500 bg-white border border-purple-200">
                        Chưa có biến thể nào. Vui lòng thêm biến thể.
                      </td>
                    </tr>
                  )}
                  {formData.variants.map((variant, index) => (
                    <tr key={index} className="bg-white hover:bg-gray-50">
                      <td className="p-2 border border-purple-200">
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                          placeholder="S, M, L..."
                          className="w-full px-2 py-1 border rounded focus:ring-1 outline-none"
                          required
                        />
                      </td>
                      <td className="p-2 border border-purple-200">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                          placeholder="Auto generated"
                          className="w-full px-2 py-1 border rounded focus:ring-1 outline-none bg-gray-50"
                        />
                      </td>
                      <td className="p-2 border border-purple-200">
                        <input
                          type="number"
                          min="0"
                          value={variant.totalStock}
                          onChange={(e) => handleVariantChange(index, "totalStock", e.target.value)}
                          className="w-full px-2 py-1 border rounded focus:ring-1 outline-none"
                          required
                        />
                      </td>
                      <td className="p-2 border border-purple-200">
                        <input
                          type="text"
                          value={variant.bustSize}
                          onChange={(e) => handleVariantChange(index, "bustSize", e.target.value)}
                          placeholder="84-88"
                          className="w-full px-2 py-1 border rounded focus:ring-1 outline-none"
                        />
                      </td>
                      <td className="p-2 border border-purple-200">
                        <input
                          type="text"
                          value={variant.waistSize}
                          onChange={(e) => handleVariantChange(index, "waistSize", e.target.value)}
                          placeholder="66-70"
                          className="w-full px-2 py-1 border rounded focus:ring-1 outline-none"
                        />
                      </td>
                      <td className="p-2 border border-purple-200 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Xóa"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-purple-600 mt-2 italic">* availableStock sẽ tự động được gán bằng totalStock khi tạo mới và giảm khi có đơn thuê.</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-[#f94a00]">Hình ảnh sản phẩm</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Hình ảnh sản phẩm (Tối đa 5 ảnh)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={formData.images.length >= 5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] outline-none transition-all duration-200 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">Đã chọn: {formData.images.length}/5 ảnh</p>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group border rounded-lg overflow-hidden bg-white">
                    <img
                      src={img}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/150x150?text=Error";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-white bg-opacity-70 text-red-600 hover:bg-opacity-100 rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" className="px-8">
              {initialData ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
