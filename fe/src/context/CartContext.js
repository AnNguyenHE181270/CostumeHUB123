import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("costume_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("costume_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const fetchCart = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
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

  // Gọi API lấy giỏ hàng mỗi khi load lại trang
  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (costume, variant, quantity, startDateStr, endDateStr, rentalDays) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 1. Nếu user đã đăng nhập, tiến hành gọi API lưu giỏ hàng
    if (token) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
        const response = await fetch(`${API_URL}/api/carts/add-cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            costumeId: costume._id, // Trích xuất _id từ object truyền xuống BE
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

        // Quan trọng: Gọi fetchCart ngay sau khi thêm thành công để lấy dữ liệu có Format chuẩn 
        // từ Backend (đầy đủ costumeName, image, category...) giúp CartPage hiển thị ngay lập tức
        await fetchCart();
        return { success: true };
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng backend:", error);
        return { success: false, message: "Lỗi kết nối máy chủ" };
      }
    }

    // 2. Cập nhật state local cho UI (Chỉ áp dụng cho Guest/Chưa đăng nhập)
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item.costumeId || item.costume?._id) === costume._id
          && item.size === (variant?.size || "M")
          && item.startDate === startDateStr
          && item.endDate === endDateStr
      );

      if (existingIndex >= 0) {
        // If exact same item exists, increment its quantity
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + quantity;
        // Don't exceed variant's availableStock
        newCart[existingIndex].quantity = Math.min(newQty, variant?.availableStock || newQty);
        return newCart;
      }

      return [
        ...prev,
        {
          // Bổ sung các trường phẳng để CartPage hiển thị đầy đủ ngay lập tức cho Guest
          _id: costume._id,
          costumeId: costume._id,
          costumeName: costume.name,
          image: costume.images?.[0] || null,
          category: costume.categoryId?.name || "",
          size: variant?.size || "M",
          rentalPerDay: costume.rentalPerDay || 0,
          price: costume.price || 0,
          costume,
          variant: variant || { size: "M" },
          quantity,
          startDate: startDateStr,
          endDate: endDateStr,
          rentalDays,
        },
      ];
    });

    return { success: true };
  };

  const removeFromCart = async (costumeId, variantId, startDateStr, endDateStr) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 1. Gọi API xóa khỏi Database nếu đã đăng nhập
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
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 1. Xóa giỏ hàng dưới Database nếu người dùng đã đăng nhập
    if (token) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999";
        // Lưu ý: Hãy đảm bảo endpoint `/api/carts/clear` khớp với route gọi hàm removeAllCartByCustomer ở Backend của bạn
        const response = await fetch(`${API_URL}/api/carts/clear`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error("Lỗi khi xóa toàn bộ giỏ hàng ở backend");
        } else {
          await fetchCart();
          return;
        }
      } catch (error) {
        console.error("Lỗi kết nối máy chủ khi xóa giỏ hàng:", error);
      }
    }

    // 2. Xóa state local để UI cập nhật ngay lập tức
    setCartItems([]);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
