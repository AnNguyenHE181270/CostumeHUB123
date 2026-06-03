"use client"

import { useState, useEffect } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import OrderCard from '../../components/customer/OrderCard'
import { faCube, faTruck, faClock, faCircleXmark, faCheckCircle } from '@fortawesome/free-solid-svg-icons'

const tabs = [
    { id: "all", label: "Tất cả", icon: faCube },
    { id: "delivering", label: "Đang giao", icon: faTruck },
    { id: "rented", label: "Đang thuê", icon: faClock },
    { id: "completed", label: "Hoàn thành", icon: faCheckCircle },
    { id: "cancelled", label: "Đã hủy", icon: faCircleXmark },
]
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

function RentalHistory() {
    const [activeTab, setActiveTab] = useState("all");
    const [rentalOrders, setRentalOrders] = useState([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");

                const res = await fetch(`${API_URL}/api/rentals/rental-history`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await res.json();
                setRentalOrders(data);

            } catch (err) {
                console.error("Failed to fetch rental orders:", err);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = activeTab === "all"
        ? rentalOrders
        : rentalOrders.filter(order => order.status === activeTab)

    const getOrderCount = (status) => {
        if (status === "all") return rentalOrders.length
        return rentalOrders.filter(order => order.status === status).length
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    <h1 className="font-serif text-3xl font-medium tracking-[-0.064px] leading-[1.4] text-text-primary">
                        Lịch sử đơn thuê
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Quản lý và theo dõi tất cả các đơn thuê trang phục của bạn
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-card">
                <div className="mx-auto max-w-5xl px-4">
                    <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const count = getOrderCount(tab.id)
                            const isActive = activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={
                                        "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all " +
                                        (isActive
                                            ? "bg-black text-white"
                                            : "text-slate-900 hover:bg-muted hover:text-foreground")
                                    }
                                >
                                    <FontAwesomeIcon icon={tab.icon} className={
                                        "h-4 w-4 " +
                                        (isActive ? "text-white" : "text-slate-800")
                                    } />
                                    <span className={
                                        "text-[16px] leading-[1.4] tracking-[-0.064px] font-[450] " +
                                        (isActive ? "text-white" : "text-slate-800")
                                    }>{tab.label}</span>
                                    <span className={
                                        "ml-1 rounded-full border px-2 py-0.5 text-xs font-semibold " +
                                        (isActive
                                            ? "bg-slate-900/20 border-slate-700/40 text-white"
                                            : "bg-slate-100 border-slate-200 text-slate-700")
                                    }>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* Orders List */}
            <div className="mx-auto max-w-5xl px-4 py-6">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-muted p-4 text-2xl">
                            📦
                        </div>
                        <h3 className="mt-4 font-medium text-foreground">Không có đơn hàng</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Bạn chưa có đơn thuê nào trong mục này
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
export default RentalHistory;
