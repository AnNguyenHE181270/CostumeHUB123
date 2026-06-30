import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import rentalService from "../../services/rental.service";

export default function RentCostumePage() {
  const { costumeId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ startDate: "", endDate: "", quantity: 1 });
  const [status, setStatus] = useState({ isChecked: false, isAvailable: false, msg: "" });

  const handleCheck = async () => {
    try {
      const data = await rentalService.checkAvailability({ costumeId, ...form });
      setStatus({
        isChecked: true,
        isAvailable: data.isAvailable,
        msg: data.isAvailable ? `Còn trống ${data.availableQty} bộ. Bạn có thể đặt!` : "Hết hàng thời gian này."
      });
    } catch (err) {
      setStatus({ isChecked: true, isAvailable: false, msg: err.message || "Lỗi kết nối!" });
    }
  };

  const handleCreate = async () => {
    try {
      await rentalService.createOrder({ costumeId, ...form });
      alert("Đặt thuê thành công!");
      navigate("/");
    } catch (err) {
      alert(err.message || "Lỗi khi tạo đơn.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-lg border border-[#f0f0f0]">
      <h2 className="text-2xl font-bold mb-6 text-midnight-ink">Chọn ngày thuê</h2>
      <div className="space-y-4">
        <Input label="Ngày nhận" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
        <Input label="Ngày trả" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
        <Input label="Số lượng" type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        
        <Button label="1. Kiểm tra kho" onClick={handleCheck} className="w-full bg-gray-600 text-white" />
        
        {status.isChecked && (
          <p className={`text-center font-medium ${status.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
            {status.msg}
          </p>
        )}

        {status.isAvailable && (
          <Button label="2. Xác nhận Đặt hàng" onClick={handleCreate} className="w-full bg-action-blue text-white mt-4" />
        )}
      </div>
    </div>
  );
}