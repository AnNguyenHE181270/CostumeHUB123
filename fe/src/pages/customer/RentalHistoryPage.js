import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useCart } from "../../context/CartContext"
import Toast from "../../components/ui/Toast"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import OrderCard from '../../components/customer/OrderCard'
import { OrderDetail } from './RentalDetail'
import { CancelOrderModal } from './CancelRentalModal'
import { OrderTrackingModal } from './OrderTrackingModal'
import { tabs } from '../../constants/statusOrder'
import { ExtendRentalModal } from "./ExtendRentalModal"
import { IssuesModal } from "./IssuesPage"
import { faBox, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import rentalService from '../../services/rental.service'
import Pagination from '../../components/ui/Pagination'

function RentalHistory() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const initialTab = searchParams.get("status") || "all";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [rentalOrders, setRentalOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [extendOrderTarget, setExtendOrderTarget] = useState(null);
    const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
    const [trackingOrderTarget, setTrackingOrderTarget] = useState(null);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isIssuesOpen, setIsIssuesOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });
    const showToast = (message, type = "success") => {
        setToast({ isVisible: true, message, type });
    };

    useEffect(() => {
        const status = searchParams.get("status");
        if (status && status !== activeTab) {
            setActiveTab(status);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ status: tabId });
        setCurrentPage(1);
        handleCloseDetail();
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await rentalService.getHistory();
            setRentalOrders(data);
            setSelectedOrder((prev) => {
                if (prev) return data.find(o => o.id === prev.id) || prev;
                return null;
            });
        } catch (err) {
            console.error("Failed to fetch rental orders:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Đơn thuộc tab "Trả hàng": khách đã gửi yêu cầu Trả hàng/hoàn tiền (có Issue resolution return_refund)
    const isReturnRefundOrder = (order) => order.issue && order.issue.resolution === "return_refund";

    const filteredOrders = activeTab === "all"
        ? rentalOrders
        : activeTab === "renting"
            ? rentalOrders.filter(order => ["delivered", "renting"].includes(order.status))
            : activeTab === "return_refund"
                ? rentalOrders.filter(isReturnRefundOrder)
                : rentalOrders.filter(order => order.status === activeTab)

    const totalCount = filteredOrders.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const getOrderCount = (status) => {
        if (status === "all") return rentalOrders.length
        if (status === "renting") {
            return rentalOrders.filter(order => ["delivered", "renting"].includes(order.status)).length
        }
        if (status === "return_refund") return rentalOrders.filter(isReturnRefundOrder).length
        return rentalOrders.filter(order => order.status === status).length
    }

    const overdueCount = rentalOrders.filter(order => order.status === "overdue").length

    const isDetailOpen = !!selectedOrder;

    const handleCancelOrder = (order) => {
        setCancelOrderTarget(order);
        setIsCancelOpen(true);
    };

    const handleTrackOrder = (order) => {
        setTrackingOrderTarget(order);
    };

    const handleConfirmCancel = () => {
        showToast("Hủy đơn hàng thành công!", "success");
        if (cancelOrderTarget) {
            setRentalOrders(prev => prev.map(order =>
                order.id === cancelOrderTarget.id ? { ...order, status: 'cancelled' } : order
            ));
        }
        handleCloseDetail();
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
            await rentalService.requestReturn(order.id);
            showToast("Đã gửi yêu cầu trả hàng thành công!", "success");
            setRentalOrders(prev => prev.map(o =>
                o.id === order.id ? { ...o, status: 'returning' } : o
            ));
            if (selectedOrder && selectedOrder.id === order.id) {
                setSelectedOrder(prev => ({ ...prev, status: 'returning' }));
            }
            handleCloseDetail();
        } catch (err) {
            showToast(err.message || "Lỗi yêu cầu trả hàng.", "error");
        }
    };

    const handleConfirmReceipt = async (order) => {
        if (!window.confirm("Bạn có chắc chắn đã nhận được hàng?")) return;
        try {
            await rentalService.confirmReceipt(order.id);
            showToast("Xác nhận đã nhận hàng thành công!", "success");
            setRentalOrders(prev => prev.map(o =>
                o.id === order.id ? { ...o, status: 'renting' } : o
            ));
            if (selectedOrder && selectedOrder.id === order.id) {
                setSelectedOrder(prev => ({ ...prev, status: 'renting' }));
            }
        } catch (err) {
            showToast(err.message || "Lỗi xác nhận nhận hàng.", "error");
        }
    };

    const handleRentAgain = async (items) => {
        if (items && items.length > 0) {
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const startDateStr = tomorrow.toISOString().split('T')[0];

                const dayAfter = new Date();
                dayAfter.setDate(dayAfter.getDate() + 2);
                const endDateStr = dayAfter.toISOString().split('T')[0];

                for (const item of items) {
                    if (item.costumeId) {
                        await addToCart(
                            { _id: item.costumeId },
                            { size: item.size || 'M' },
                            item.quantity || 1,
                            startDateStr,
                            endDateStr,
                            1
                        );
                    }
                }
                showToast("Đã thêm trang phục vào giỏ hàng thành công! Đang chuyển hướng...", "success");
                setTimeout(() => {
                    navigate('/cart');
                }, 1500);
            } catch (err) {
                console.error("Lỗi khi thuê lại:", err);
                showToast("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.", "error");
            }
        } else {
            showToast("Không tìm thấy thông tin trang phục để thuê lại.", "error");
        }
    };

    return (
        <div className="bg-white border border-[#eaeaea] mx-auto my-6 max-w-[1200px] px-6 py-4 rounded-xl">
            {/* Header */}
            <h3 className="text-3xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Lịch sử đơn thuê
            </h3>
            <p className="text-[14px] text-[#858585] mb-4 pb-4 border-b border-[#eaeaea]">
                Quản lý và theo dõi tất cả các đơn thuê trang phục của bạn
            </p>

            {/* Cảnh báo nổi bật — đơn quá hạn cần khách xử lý ngay, không để lẫn trong tab "Đang thuê" */}
            {overdueCount > 0 && (
                <button
                    type="button"
                    onClick={() => handleTabChange("overdue")}
                    className="w-full mb-6 flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-left transition-colors hover:bg-orange-100"
                >
                    <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5 text-orange-600 shrink-0" />
                    <p className="text-sm font-medium text-orange-800">
                        Bạn có <b>{overdueCount}</b> đơn hàng quá hạn trả — vui lòng trả sớm để tránh phát sinh thêm phí trễ hạn.
                    </p>
                </button>
            )}

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
                            <>
                                <div className="space-y-3">
                                    {paginatedOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onViewDetail={handleViewDetail}
                                            isSelected={selectedOrder?.id === order.id}
                                            isCompact={isDetailOpen}
                                            onRentAgain={handleRentAgain}
                                            onExtendOrder={(orderToExtend) => setExtendOrderTarget(orderToExtend)}
                                            onCancelOrder={handleCancelOrder}
                                            onTrackOrder={handleTrackOrder}
                                            onRequestReturn={handleRequestReturn}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <Pagination
                                        displayCount={paginatedOrders.length}
                                        totalCount={totalCount}
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            </>
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
                                    onConfirmReceipt={handleConfirmReceipt}
                                    onRequestIssue={() => setIsIssuesOpen(true)}
                                    onExtendSuccess={fetchOrders}
                                    onRentAgain={handleRentAgain}
                                    onExtendOrder={(orderToExtend) => setExtendOrderTarget(orderToExtend)}
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
                            onConfirmReceipt={handleConfirmReceipt}
                            onRequestIssue={() => setIsIssuesOpen(true)}
                            onExtendSuccess={fetchOrders}
                            onRentAgain={handleRentAgain}
                            onExtendOrder={(orderToExtend) => setExtendOrderTarget(orderToExtend)}
                        />
                    </div>
                </div>
            </div>

            <CancelOrderModal
                open={isCancelOpen}
                onOpenChange={(val) => {
                    setIsCancelOpen(val);
                    if (!val) setCancelOrderTarget(null);
                }}
                order={cancelOrderTarget}
                onConfirm={handleConfirmCancel}
            />

            <OrderTrackingModal
                open={!!trackingOrderTarget}
                onOpenChange={(val) => { if (!val) setTrackingOrderTarget(null) }}
                order={trackingOrderTarget}
            />

            <ExtendRentalModal
                open={!!extendOrderTarget}
                onOpenChange={(val) => { if (!val) setExtendOrderTarget(null); }}
                order={extendOrderTarget}
                onConfirm={() => {
                    fetchOrders();
                    setExtendOrderTarget(null);
                }}
            />

            <IssuesModal
                open={isIssuesOpen}
                onOpenChange={setIsIssuesOpen}
                order={selectedOrder}
                onSuccess={fetchOrders}
            />

            <Toast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    )
}
export default RentalHistory;
