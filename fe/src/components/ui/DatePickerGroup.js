import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { motion, AnimatePresence } from "framer-motion";

export default function DatePickerGroup({ startDate, setStartDate, endDate, setEndDate, disabled = false, minRentalDays }) {
    const [activePicker, setActivePicker] = useState(null);
    const pickerRef = useRef(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const requiredDays = Math.max(1, Number(minRentalDays) || 1);
    const start = new Date(startDate);
    const minEndDate = new Date(start);
    minEndDate.setDate(minEndDate.getDate() + requiredDays);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setActivePicker(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 " ref={pickerRef}>
                {/* Ngày Nhận */}
                <div className="relative">
                    <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1.5">
                        Ngày nhận đồ
                    </label>
                    <button
                        onClick={() => !disabled && setActivePicker(activePicker === 'start' ? null : 'start')}
                        disabled={disabled}
                        className={`w-full text-left bg-white border ${activePicker === 'start' ? 'border-[#1a1a1a] shadow-sm' : 'border-[#eaeaea]'
                            } text-[13px] text-[#1a1a1a] rounded-lg px-4 py-3 font-semibold transition-all flex justify-between items-center hover:border-[#1a1a1a] ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : ''}`}
                    >
                        {new Date(startDate).toLocaleDateString('vi-VN')}
                        <FontAwesomeIcon icon={faCalendarDays} className={activePicker === 'start' ? 'text-[#1a1a1a]' : 'text-[#999]'} />
                    </button>

                    <AnimatePresence>
                        {activePicker === 'start' && !disabled && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-20 mt-2 p-3 bg-white rounded-xl shadow-xl border border-[#eaeaea] custom-calendar-wrapper left-0 min-w-[280px]"
                            >
                                <Calendar
                                    onChange={(date) => {
                                        const startStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                                        setStartDate(startStr);
                                        const newStart = new Date(date);
                                        const existingEnd = new Date(endDate);
                                        const diffDays = Math.ceil((existingEnd - newStart) / (1000 * 60 * 60 * 24));
                                        if (diffDays < requiredDays) {
                                            const defaultEnd = new Date(newStart);
                                            defaultEnd.setDate(defaultEnd.getDate() + requiredDays);
                                            setEndDate(defaultEnd.toISOString().split("T")[0]);
                                        }
                                        setActivePicker('end'); // Tự động chuyển sang chọn ngày trả
                                    }}
                                    value={new Date(startDate)}
                                    minDate={tomorrow}
                                    className="border-none text-[13px] font-sans w-full"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Ngày Trả */}
                <div className="relative">
                    <label className="block text-[11px] uppercase tracking-[0.05em] text-[#999] font-medium mb-1.5">
                        Ngày trả đồ
                    </label>
                    <button
                        onClick={() => !disabled && setActivePicker(activePicker === 'end' ? null : 'end')}
                        disabled={disabled}
                        className={`w-full text-left bg-white border ${activePicker === 'end' ? 'border-[#1a1a1a] shadow-sm' : 'border-[#eaeaea]'
                            } text-[13px] text-[#1a1a1a] rounded-lg px-4 py-3 font-semibold transition-all flex justify-between items-center hover:border-[#1a1a1a] ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : ''}`}
                    >
                        {new Date(endDate).toLocaleDateString('vi-VN')}
                        <FontAwesomeIcon icon={faCalendarDays} className={activePicker === 'end' ? 'text-[#1a1a1a]' : 'text-[#999]'} />
                    </button>

                    <AnimatePresence>
                        {activePicker === 'end' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-20 mt-2 p-3 bg-white rounded-xl shadow-xl border border-[#eaeaea] custom-calendar-wrapper right-0 min-w-[280px]"
                            >
                                <Calendar
                                    onChange={(date) => {
                                        const endStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                                        setEndDate(endStr);
                                        setActivePicker(null); // Chọn xong thì đóng lịch
                                    }}
                                    value={new Date(endDate)}
                                    minDate={minEndDate}
                                    className="border-none text-[13px] font-sans w-full"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
        .custom-calendar-wrapper .react-calendar { border: none !important; font-family: inherit; width: 100%; }
        .custom-calendar-wrapper .react-calendar__tile { padding: 0.6em 0.2em; border-radius: 8px; transition: background 0.2s; }
        .custom-calendar-wrapper .react-calendar__tile:enabled:hover { background: #f5f5f5 !important; }
        .custom-calendar-wrapper .react-calendar__tile--active { background: #1a1a1a !important; color: white !important; font-weight: bold; border-radius: 8px; }
        .custom-calendar-wrapper .react-calendar__navigation button { border-radius: 8px; min-width: 36px; }
        .custom-calendar-wrapper .react-calendar__navigation button:enabled:hover, .custom-calendar-wrapper .react-calendar__navigation button:enabled:focus { background-color: #f5f5f5; }
        .custom-calendar-wrapper .react-calendar__month-view__days__day--weekend { color: #d10000; }
      `}</style>
        </>
    );
}