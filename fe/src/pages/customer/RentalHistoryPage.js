"use client"

import { useState, useEffect } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import OrderCard from '../../components/customer/OrderCard'
import { OrderDetail } from './RentalDetail'
import { OrderTrackingModal } from './OrderTrackingModal'
import { tabs } from '../../constants/statusOrder'
import { faBox } from '@fortawesome/free-solid-svg-icons'

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

function RentalHistory() {
    const [activeTab, setActiveTab] = useState("all");
    const [rentalOrders, setRentalOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);

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

    const isDetailOpen = !!selectedOrder;

    const handleTrackOrder = (order) => {
        setSelectedOrder(order);
        setIsTrackingOpen(true);
    };

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
    };

    const handleCloseDetail = () => {
        setSelectedOrder(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#fbf9f6] to-[#faf9f7] transition-colors duration-300">
            {/* Header */}
            <div className="border-b border-border bg-transparent">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                        Lịch sử đơn thuê
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Quản lý và theo dõi tất cả các đơn thuê trang phục của bạn
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-transparent">
                <div className="mx-auto max-w-7xl px-4">
                    <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
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
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground")
                                    }
                                >
                                    <FontAwesomeIcon icon={Icon} className="h-4 w-4" />
                                    <span >{tab.label}</span>
                                    <span>{count}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content with Split View */}
            <div className="mx-auto max-w-7xl">
                <div className="flex">
                    {/* Orders List */}
                    <div className={
                        "transition-all duration-300 ease-in-out " +
                        (isDetailOpen ? "lg:w-2/5 flex-none" : "flex-1 w-full")
                    }>
                        <div className={
                            "px-4 py-6 " +
                            (isDetailOpen ? "lg:pr-4" : "")
                        }>
                            {filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-muted p-4">
                                        <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="mt-4 font-medium text-foreground">Không có đơn hàng</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Bạn chưa có đơn thuê nào trong mục này
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onTrackOrder={handleTrackOrder}
                                            onViewDetail={handleViewDetail}
                                            isSelected={selectedOrder?.id === order.id}
                                            isCompact={isDetailOpen}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail Panel - Desktop */}
                    <div className={
                        "hidden lg:block transition-all duration-300 ease-in-out overflow-hidden " +
                        (isDetailOpen ? "lg:w-3/5 opacity-100" : "w-0 opacity-0")
                    }>
                        {isDetailOpen && (
                            <div className="sticky top-0 h-[calc(100vh-180px)]">
                                <OrderDetail
                                    open={true}
                                    order={selectedOrder}
                                    onOpenChange={(val) => { if (!val) handleCloseDetail() }}
                                    onTrackOrder={handleTrackOrder}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tracking Modal */}
            <OrderTrackingModal
                open={isTrackingOpen}
                onOpenChange={setIsTrackingOpen}
                order={selectedOrder}
            />
        </div>
    )
}
export default RentalHistory;
