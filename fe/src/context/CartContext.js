import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([])
  const fetchCart = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/carts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng từ máy chủ:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = async (costume, variant, quantity, startDateStr, endDateStr, rentalDays) => {
    if (!token) {
      navigate("/login");
      return { success: false, message: "Vui lòng đăng nhập để thêm vào giỏ hàng." };
    }

    try {
      const response = await fetch(`${API_URL}/api/carts/add-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          costumeId: costume._id,
          size: variant?.size || "M",
          quantity: quantity,
          startDate: startDateStr,
          endDate: endDateStr
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message };
      }

      await fetchCart();
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng backend:", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  };

  const removeFromCart = async (costumeId, variantId, startDateStr, endDateStr) => {
    // 1. Xóa state local để UI cập nhật ngay lập tức (Áp dụng cho cả Guest & Logged In)
    setCartItems((prev) => prev.filter((item) => {
      const currentId = item.costumeId || item._id || item.costume?._id;
      const currentSize = item.size || item.variant?.size;
      if (variantId || startDateStr) {
        return !(currentId === costumeId
          && currentSize === variantId
          && item.startDate === startDateStr
          && item.endDate === endDateStr);
      }
      return currentId !== costumeId;
    }));

    // 2. Gọi API xóa khỏi Database nếu đã đăng nhập
    if (token) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
        await fetch(`${API_URL}/api/carts/remove`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            costumeId,
            size: variantId, // Ở component truyền xuống, biến thứ 2 đang chứa size
            startDate: startDateStr,
            endDate: endDateStr
          })
        });

        await fetchCart();
        return; // Dừng lại, không chạy logic filter bên dưới vì đã lấy mảng chuẩn từ DB
      } catch (error) {
        console.error("Lỗi khi xóa khỏi giỏ hàng backend:", error);
      }
    }

    // 2. Xóa state local để UI cập nhật ngay lập tức (Áp dụng cho Guest)
    setCartItems((prev) => prev.filter((item) => {
      const currentId = item.costumeId || item._id || item.costume?._id;
      const currentSize = item.size || item.variant?.size;
      if (variantId || startDateStr) {
        return !(currentId === costumeId
          && currentSize === variantId
          && item.startDate === startDateStr
          && item.endDate === endDateStr);
      }
      return currentId !== costumeId;
    }));
  };

  const updateDates = (costumeId, startDateStr, endDateStr) => {
    setCartItems((prev) =>
      prev.map((item) => {
        const currentId = item.costumeId || item._id || item.costume?._id;
        if (currentId === costumeId) {
          const start = new Date(startDateStr);
          const end = new Date(endDateStr);

          if (end < start) {
            return item; // invalid date, ignore update
          }

          const diffTime = Math.abs(end - start);
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 0) diffDays = 1;

          return {
            ...item,
            startDate: startDateStr,
            endDate: endDateStr,
            rentalDays: diffDays,
          };
        }
        return item;
      })
    );
  };

  const clearCart = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await fetch(`${API_URL}/api/carts/clear`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Lỗi kết nối máy chủ khi xóa giỏ hàng:", error);
    }

    setCartItems([]);
  };

  const updateCartItem = async (costumeId, currentSize, oldStartDate, oldEndDate, newSize, newQuantity, newStartDate, newEndDate) => {
    const finalStartDate = newStartDate || oldStartDate;
    const finalEndDate = newEndDate || oldEndDate;

    try {
      if (!token) return;

      // Cập nhật giao diện tạm thời
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          ((item.costumeId === costumeId || item._id === costumeId) &&
            item.size === currentSize &&
            item.startDate === oldStartDate &&
            item.endDate === oldEndDate)
            ? { ...item, size: newSize, quantity: newQuantity, startDate: finalStartDate, endDate: finalEndDate }
            : item
        )
      );

      const res = await fetch(`${API_URL}/api/carts/update-cart/${costumeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldSize: currentSize,
          oldStartDate: oldStartDate,
          oldEndDate: oldEndDate,
          size: newSize,
          quantity: newQuantity,
          startDate: finalStartDate,
          endDate: finalEndDate
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        await fetchCart();
        return { error: data.message || "Cập nhật giỏ hàng thất bại." };
      }

      return null;
    } catch (error) {
      console.error("Lỗi kết nối khi cập nhật giỏ hàng:", error);
      fetchCart();
      return { error: "Lỗi kết nối. Vui lòng thử lại." };
    }
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateDates,
        clearCart,
        cartCount,
        fetchCart,
        updateCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
