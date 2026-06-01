import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "", slug: "", sku: "", categoryId: "", size: "", color: "", condition: "",
    pricePerDay: "", pricePer3Days: "", pricePerWeek: "",
    deposit: "", minRentalDays: 1, lateFeePerDay: 0, description: "", imageUrl: "",
    material: "", includedAccessories: "", bustSize: "", waistSize: ""
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
          parentId = currentCat._id; // Trạng thái legacy: sp đang trỏ vào danh mục gốc
        }
      }
      setSelectedParentId(parentId);

      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        sku: initialData.sku || "",
        categoryId: currentCatId || "",
        size: initialData.size || "",
        color: initialData.color || "",
        condition: initialData.condition || "",
        pricePerDay: initialData.rentalRates?.pricePerDay || "",
        pricePer3Days: initialData.rentalRates?.pricePer3Days || "",
        pricePerWeek: initialData.rentalRates?.pricePerWeek || "",
        deposit: initialData.deposit || "",
        minRentalDays: initialData.minRentalDays || 1,
        lateFeePerDay: initialData.lateFeePerDay || 0,
        description: initialData.description || "",
        imageUrl: initialData.images && initialData.images.length > 0 ? initialData.images[0] : "",
        material: initialData.specifications?.material || "",
        includedAccessories: initialData.specifications?.includedAccessories?.join(", ") || "",
        bustSize: initialData.specifications?.bustSize || "",
        waistSize: initialData.specifications?.waistSize || "",
      });
    } else {
      setSelectedParentId("");
      setFormData({
        name: "", slug: "", sku: "", categoryId: "", size: "", color: "", condition: "",
        pricePerDay: "", pricePer3Days: "", pricePerWeek: "",
        deposit: "", minRentalDays: 1, lateFeePerDay: 0, description: "", imageUrl: "",
        material: "", includedAccessories: "", bustSize: "", waistSize: ""
      });
    }
  }, [initialData, isOpen, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParentChange = (e) => {
    setSelectedParentId(e.target.value);
    setFormData(prev => ({ ...prev, categoryId: "" })); // Reset danh mục con khi đổi cha
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.imageUrl) {
      alert("Vui lòng tải lên ít nhất một ảnh cho sản phẩm!");
      return;
    }

    if (!formData.categoryId) {
      alert("Vui lòng chọn danh mục con (danh mục lá) cho sản phẩm!");
      return;
    }

    const submitData = {
      name: formData.name,
      slug: formData.slug,
      sku: formData.sku,
      categoryId: formData.categoryId,
      size: formData.size,
      color: formData.color,
      condition: formData.condition,
      rentalRates: {
        pricePerDay: Number(formData.pricePerDay),
        pricePer3Days: formData.pricePer3Days ? Number(formData.pricePer3Days) : undefined,
        pricePerWeek: formData.pricePerWeek ? Number(formData.pricePerWeek) : undefined,
      },
      deposit: Number(formData.deposit) || 0,
      minRentalDays: Number(formData.minRentalDays) || 1,
      lateFeePerDay: Number(formData.lateFeePerDay) || 0,
      description: formData.description,
      images: formData.imageUrl ? [formData.imageUrl] : [],
      specifications: {
        material: formData.material,
        includedAccessories: formData.includedAccessories ? formData.includedAccessories.split(",").map(i => i.trim()) : [],
        bustSize: formData.bustSize,
        waistSize: formData.waistSize,
      }
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 sticky top-0 bg-white pb-2 z-10 border-b">
          {initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin chung */}
          <h3 className="text-lg font-semibold border-b pb-2 mt-4 text-[#f94a00]">Thông tin chung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tên sản phẩm" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Slug (Đường dẫn)" name="slug" value={formData.slug} onChange={handleChange} />
            <Input label="Mã SKU" name="sku" value={formData.sku} onChange={handleChange} />
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
              <select
                value={selectedParentId}
                onChange={handleParentChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] focus:border-transparent outline-none transition-all duration-200"
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
              <label className="text-sm font-medium text-gray-700">Danh mục con</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                disabled={!selectedParentId}
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-all duration-200 ${!selectedParentId ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-[#f94a00] focus:border-transparent'}`}
              >
                <option value="">-- Chọn danh mục con --</option>
                {childCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Input label="Kích cỡ (Size)" name="size" value={formData.size} onChange={handleChange} />
            <Input label="Màu sắc" name="color" value={formData.color} onChange={handleChange} />
            <Input label="Tình trạng (Condition)" name="condition" value={formData.condition} onChange={handleChange} />
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <label className="text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] focus:border-transparent outline-none transition-all duration-200 resize-none"
            ></textarea>
          </div>

          {/* Giá thuê */}
          <h3 className="text-lg font-semibold border-b pb-2 mt-6 text-[#f94a00]">Thông tin giá thuê & Đặt cọc</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <Input label="Giá thuê/1 ngày (VNĐ)" name="pricePerDay" type="number" min="0" value={formData.pricePerDay} onChange={handleChange} required />
            <Input label="Giá thuê/3 ngày (VNĐ)" name="pricePer3Days" type="number" min="0" value={formData.pricePer3Days} onChange={handleChange} />
            <Input label="Giá thuê/1 tuần (VNĐ)" name="pricePerWeek" type="number" min="0" value={formData.pricePerWeek} onChange={handleChange} />
            <Input label="Giá cọc (VNĐ)" name="deposit" type="number" min="0" value={formData.deposit} onChange={handleChange} required />
            <Input label="Số ngày thuê tối thiểu" name="minRentalDays" type="number" min="1" value={formData.minRentalDays} onChange={handleChange} />
            <Input label="Phí trễ hẹn/ngày (VNĐ)" name="lateFeePerDay" type="number" min="0" value={formData.lateFeePerDay} onChange={handleChange} />
          </div>

          {/* Thông số kỹ thuật */}
          <h3 className="text-lg font-semibold border-b pb-2 mt-6 text-[#f94a00]">Thông số kỹ thuật</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Input label="Chất liệu" name="material" value={formData.material} onChange={handleChange} />
            <Input label="Phụ kiện (Ngăn cách dấu phẩy)" name="includedAccessories" value={formData.includedAccessories} onChange={handleChange} />
            <Input label="Vòng ngực (Bust Size)" name="bustSize" value={formData.bustSize} onChange={handleChange} />
            <Input label="Vòng eo (Waist Size)" name="waistSize" value={formData.waistSize} onChange={handleChange} />
          </div>

          <h3 className="text-lg font-semibold border-b pb-2 mt-6 text-[#f94a00]">Hình ảnh</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hình ảnh sản phẩm</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, imageUrl: reader.result }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {formData.imageUrl && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Ảnh xem trước:</p>
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=Lỗi+Ảnh";
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Hủy
            </Button>
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
