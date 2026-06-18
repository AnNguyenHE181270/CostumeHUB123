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

    const handleRequestReturn = async (order) => {
        if (!window.confirm("Bạn có chắc muốn gửi yêu cầu trả hàng?")) return;
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/rentals/${order.id}/request-return`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) {
                alert("Đã gửi yêu cầu trả hàng thành công!");
                fetchOrders();
                handleCloseDetail();
            } else {
                const errorData = await res.json();
                alert(errorData.message || "Lỗi yêu cầu trả hàng.");
            }
        } catch (err) {
            console.error("Return request error:", err);
            alert("Lỗi hệ thống khi yêu cầu trả hàng.");
        }
    };

    return (
        <div className="bg-white border border-[#eaeaea] mx-auto my-6 max-w-[1200px] px-6 py-4 rounded-xl">
            {/* Header */}
            <h3 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Lịch sử đơn thuê
            </h3>
            <p className="text-[14px] text-[#858585] mb-6 pb-4 border-b border-[#eaeaea]">
                Quản lý và theo dõi tất cả các đơn thuê trang phục của bạn
            </p>

            {/* Tabs */}
            <div className="mb-6 border-b border-[#eaeaea]">
                <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="Tabs">
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

            {/* Main Content with Split View */}
            <div>
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Orders List */}
                    <div className={
                        "transition-all duration-300 ease-in-out " +
                        (isDetailOpen ? "lg:w-5/12 flex-none" : "w-full")
                    }>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground">
                                <p>Đang tải dữ liệu đơn hàng...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="rounded-full bg-muted p-2">
                                    <FontAwesomeIcon icon={faBox} className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium text-foreground">Không có đơn hàng</h3>
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

                    {/* Detail Panel - Desktop */}
                    <div className={
                        "hidden lg:block transition-all duration-300 ease-in-out overflow-hidden " +
                        (isDetailOpen ? "lg:w-7/12 opacity-100" : "w-0 opacity-0")
                    }>
                        {isDetailOpen && (
                            <div className="sticky top-4 h-[calc(100vh-40px)] pb-4">
                                <OrderDetail
                                    open={true}
                                    order={selectedOrder}
                                    onOpenChange={(val) => { if (!val) handleCloseDetail() }}
                                    onCancelOrder={handleCancelOrder}
                                    onRequestReturn={handleRequestReturn}
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
                            onRequestReturn={handleRequestReturn}
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
