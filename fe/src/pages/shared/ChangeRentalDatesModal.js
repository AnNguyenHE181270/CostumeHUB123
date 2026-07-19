import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "../../components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faSpinner, faBox } from "@fortawesome/free-solid-svg-icons";
import { formatPrice, getRentalDays, getRentalPriceFactor, formatDateNoHours } from "../../utils/formatters";
import DatePickerGroup from "../../components/ui/DatePickerGroup";

const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};


export function ChangeRentalDatesModal({ order, onClose, onUpdate }) {
    const [newStartDate, setNewStartDate] = useState(formatDateForInput(order.startDate));
    const [newEndDate, setNewEndDate] = useState(formatDateForInput(order.endDate));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const calculateNewPrice = () => {
        if (!newStartDate || !newEndDate) return null;
        const start = new Date(newStartDate);
        const end = new Date(newEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today || end <= start) return null;

        const rentalDays = getRentalDays(newStartDate, newEndDate);
        const priceFactor = getRentalPriceFactor(rentalDays);

        let totalRentalPrice = 0;
        let totalDeposit = 0;
        let itemsCalc = [];

        order.items?.forEach(item => {
            const rentalPrice = item.rentalPricePerDay || item.costume?.pricePerDay || 0;
            const deposit = item.depositPrice || item.costume?.deposit || item.costume?.price || 0;

            const itemTotalRental = (rentalPrice * priceFactor) * item.quantity;
            totalRentalPrice += itemTotalRental;
            totalDeposit += deposit * item.quantity;

            itemsCalc.push({
                name: item.costume?.name || item.costumeName,
                size: item.size,
                quantity: item.quantity,
                rentalPricePerDay: rentalPrice,
                itemTotalRental
            });
        });

        const difference = totalRentalPrice - order.totalRentalPrice;
        const totalAmount = order.totalAmount + difference;

        return {
            rentalDays,
            priceFactor,
            itemsCalc,
            totalRentalPrice,
            totalDeposit,
            totalAmount
        };
    };

    const newCalculation = calculateNewPrice();
    const difference = newCalculation !== null ? newCalculation.totalAmount - order.totalAmount : 0;
    const newTotalAmount = newCalculation !== null ? newCalculation.totalAmount : null;

    // Effect to reset dates if order changes (though in this flow, it shouldn't)
    useEffect(() => {
        if (order) {
            setNewStartDate(formatDateForInput(order.startDate));
            setNewEndDate(formatDateForInput(order.endDate));
            setError("");
        }
    }, [order]);

    const handleDateChange = (e, type) => {
        setError("");
        if (type === "start") {
            setNewStartDate(e.target.value);
        } else {
            setNewEndDate(e.target.value);
        }
    };

    const validateDates = () => {
        const start = new Date(newStartDate);
        const end = new Date(newEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!newStartDate || !newEndDate) {
            setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
            return false;
        }
        if (start < today && newStartDate !== formatDateForInput(order.startDate)) {
            setError("Ngày lấy mới không được ở trong quá khứ.");
            return false;
        }
        if (end <= start) {
            setError("Ngày trả phải sau ngày lấy.");
            return false;
        }

        const rentalDays = getRentalDays(newStartDate, newEndDate);
        for (const item of order.items) {
            const minDays = item.costume?.minRentalDays || 1;
            if (rentalDays > minDays) {
                setError(`Sản phẩm ${item.costume?.name || item.costumeName} chỉ được thuê tối đa ${minDays} ngày.`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateDates()) return;

        setLoading(true);
        setError("");
        try {
            await onUpdate(order._id, newStartDate, newEndDate);
            onClose(); // Close modal on success
        } catch (err) {
            setError(err.message || "Cập nhật ngày thuê thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={!!order} onClose={onClose} title={`Yêu cầu thay đổi đơn hàng #${order._id?.slice(-6).toUpperCase()}`}>
            <div className="space-y-5">
                {/* Order Items Display (similar to ExtendRentalModal) */}
                {order?.items?.map((item, index) => {
                    const currentRentalDays = getRentalDays(order.startDate, order.endDate);
                    const currentPriceFactor = getRentalPriceFactor(currentRentalDays);
                    const currentItemRentalPrice = item.rentalPricePerDay * currentPriceFactor * item.quantity;
                    const currentItemDeposit = item.depositPrice * item.quantity;

                    return (
                        <div key={index} className="rounded-lg border border-gray-200 p-2">
                            <div className="flex gap-4">
                                <div className="h-24 w-20 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                    {item.costume?.images?.[0] || item.image ? (
                                        <img src={item.costume?.images?.[0] || item.image} alt={item.costume?.name || item.costumeName} className="h-full w-full object-cover" />
                                    ) : (
                                        <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-[#1a1a1a]" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between pb-2 gap-2">
                                        <h3 className="text-lg font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                            {item.costume?.name || item.costumeName} (Size: {item.size}) x {item.quantity}
                                        </h3>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#1a1a1a]">Giá thuê (hiện tại):</span>
                                        <span className="font-medium text-[#1a1a1a]">{formatPrice(currentItemRentalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#1a1a1a]">Tiền cọc:</span>
                                        <span className="font-medium text-[#1a1a1a]">{formatPrice(currentItemDeposit)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}                <div className="flex justify-between font-bold text-[#1a1a1a] px-2">
                    <span>Tổng tiền hiện tại:</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                </div>

                {/* Current Dates Display */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#1a1a1a]">
                            Ngày lấy hiện tại:
                        </label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] outline-none">
                            {formatDateNoHours(order.startDate)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#1a1a1a]">
                            Ngày trả hiện tại:
                        </label>
                        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] outline-none">
                            {formatDateNoHours(order.endDate)}
                        </div>
                    </div>
                </div>

                {/* New Dates Input */}
                <div className="mt-4">
                    <DatePickerGroup
                        startDate={newStartDate}
                        setStartDate={(val) => { setError(""); setNewStartDate(val); }}
                        endDate={newEndDate}
                        setEndDate={(val) => { setError(""); setNewEndDate(val); }}
                        minRentalDays={Math.max(1, ...(order?.items?.map(item => item.costume?.minRentalDays || 1) || [1]))}
                    />
                </div>

                {/* Detailed Breakdown Display */}
                {newCalculation && (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[#1a1a1a] font-medium">Tổng số ngày thuê:</span>
                            <span className="font-medium text-[#1a1a1a]">{newCalculation.rentalDays} ngày</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-[#1a1a1a] font-medium">Tiền thuê từng sản phẩm:</p>
                            {newCalculation.itemsCalc.map((ib, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-[#1a1a1a] pl-2">
                                        - {ib.name} {ib.size && `(Size ${ib.size})`} x {ib.quantity}
                                    </span>
                                    <span className="text-[#1a1a1a] font-medium">{formatPrice(ib.itemTotalRental)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-[#1a1a1a] font-medium">Tổng tiền thuê:</span>
                            <span className="font-semibold text-[#1a1a1a]">{formatPrice(newCalculation.totalRentalPrice)}</span>
                        </div>


                        {/* Difference Display */}
                        {difference !== 0 ? (
                            <div className={`mt-3 p-3 rounded-lg flex flex-col gap-1 ${difference > 0 ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold">
                                        {difference > 0 ? "Khách cần thanh toán thêm:" : "Khách sẽ được hoàn lại:"}
                                    </span>
                                    <span className="font-bold">
                                        {formatPrice(Math.abs(difference))}
                                    </span>
                                </div>
                                {difference < 0 && (
                                    <span className="text-xs text-emerald-700 italic">
                                        * Số tiền thừa sẽ được tự động hoàn về ví của khách.
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 p-3 rounded-lg bg-gray-200 text-[#1a1a1a] flex justify-between items-center">
                                <span className="text-sm font-semibold">Khách cần thanh toán thêm:</span>
                                <span className="font-bold">Không thay đổi</span>
                            </div>
                        )}
                    </div>
                )}

                {/* General Error */}
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faInfoCircle} /> {error}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !newStartDate || !newEndDate || (new Date(newEndDate) <= new Date(newStartDate))}
                    >
                        {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                        Cập nhật
                    </button>
                </div>
            </div>
        </Modal>
    );
}