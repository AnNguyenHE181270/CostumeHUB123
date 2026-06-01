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
    name: "",
    category: "",
    rentalPricePerDay: "",
    depositPrice: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category?._id || initialData.category || "",
        rentalPricePerDay: initialData.rentalPricePerDay || "",
        depositPrice: initialData.depositPrice || "",
        description: initialData.description || "",
        imageUrl: initialData.images && initialData.images.length > 0 ? initialData.images[0] : "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        rentalPricePerDay: "",
        depositPrice: "",
        description: "",
        imageUrl: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      images: formData.imageUrl ? [formData.imageUrl] : [],
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 m-4 mt-20">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tên sản phẩm"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Danh mục</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f94a00] focus:border-transparent outline-none transition-all duration-200"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Giá thuê/ngày (VNĐ)"
              name="rentalPricePerDay"
              type="number"
              min="0"
              value={formData.rentalPricePerDay}
              onChange={handleChange}
              required
            />

            <Input
              label="Giá cọc (VNĐ)"
              name="depositPrice"
              type="number"
              min="0"
              value={formData.depositPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
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

          <Input
            label="URL Hình ảnh"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />

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
