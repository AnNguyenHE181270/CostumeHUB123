"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import OrderCard from '../../components/customer/OrderCard'
import { OrderDetail } from './RentalDetail'
import { CancelOrderModal } from './CancelRentalModal'
import { tabs } from '../../constants/statusOrder'
import { faBox } from '@fortawesome/free-solid-svg-icons'

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

function RentalHistory() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("status") || "all";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [rentalOrders, setRentalOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const status = searchParams.get("status");
        if (status && status !== activeTab) {
            setActiveTab(status);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ status: tabId });
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/rentals/rental-history`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            setRentalOrders(data);
            setSelectedOrder((prev) => {
                if (prev) {
                    return data.find(o => o.id === prev.id) || prev;
                }
                return null;
            });
        } catch (err) {
            console.error("Failed to fetch rental orders:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
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

    const handleCancelOrder = (order) => {
        setSelectedOrder(order);
        setIsCancelOpen(true);
    };

    const handleConfirmCancel = () => {
        fetchOrders(); // Tải lại danh sách đơn
        setIsCancelOpen(false);
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
                                    onClick={() => handleTabChange(tab.id)}
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
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">
                                    <p>Đang tải dữ liệu đơn hàng...</p>
                                </div>
                            ) : filteredOrders.length === 0 ? (
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
                            <div className="sticky top-4 h-[calc(100vh-40px)] pb-4">
                                <OrderDetail
                                    open={true}
                                    order={selectedOrder}
                                    onOpenChange={(val) => { if (!val) handleCloseDetail() }}
                                    onCancelOrder={handleCancelOrder}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Panel - Mobile Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isDetailOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleCloseDetail}
            >
                <div
                    className={`absolute inset-x-0 bottom-0 top-16 bg-[#faf9f7] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ${isDetailOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="h-full overflow-y-auto p-4 sm:p-6 pb-20">
                        <OrderDetail
                            open={true}
                            order={selectedOrder}
                            onOpenChange={(val) => { if (!val) handleCloseDetail() }}
                            onCancelOrder={handleCancelOrder}
                        />
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            <CancelOrderModal
                open={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                orderId={selectedOrder?.id}
                onConfirm={handleConfirmCancel}
            />
        </div>
    )
}
export default RentalHistory;
