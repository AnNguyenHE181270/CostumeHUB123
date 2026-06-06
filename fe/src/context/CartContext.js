import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../services/apiClient";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { token } = useAuth();

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
    const fetchCart = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/api/carts');
          // if (Array.isArray(response)) {
          //   // Chuẩn hóa dữ liệu từ backend để tương thích với component hiện tại (như CheckoutPage)
          //   const formattedCart = response.map(item => ({
          //     ...item,
          //     costumeId: item._id,
          //     costume: { _id: item._id, name: item.costumeName, images: [item.image] },
          //     variant: { size: item.size, price: item.rentalPrice }
          //   }));
          setCartItems(response);
          // }
        } catch (error) {
          console.error("Lỗi khi lấy giỏ hàng từ backend:", error);
        }
      }
    };

    fetchCart();
  }, [token]);

  useEffect(() => {
    localStorage.setItem("costume_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (costume, variant, quantity, startDateStr, endDateStr, rentalDays) => {
    if (token) {
      try {
        await apiClient.post('/api/carts/add-cart', {
          costumeId: costume._id,
          size: variant?.size || "M",
          quantity,
          startDate: startDateStr,
          endDate: endDateStr
        });

        // Lấy lại danh sách giỏ hàng mới nhất từ Backend sau khi thêm thành công
        const response = await apiClient.get('/api/carts');
        setCartItems(response);
        return { success: true };
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng từ backend:", error);
        return { success: false, message: error.response?.data?.message || error.message || "Lỗi máy chủ" };
      }
    } else {
      // Nếu người dùng chưa đăng nhập, vẫn cho thêm ở Local Storage như cũ
      setCartItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => (item.costumeId === costume._id || item.costume?._id === costume._id)
            && (item.size === variant?.size || item.variant?.size === variant?.size || item.variant?._id === variant?._id)
            && item.startDate === startDateStr
            && item.endDate === endDateStr
        );

        if (existingIndex >= 0) {
          const newCart = [...prev];
          const newQty = newCart[existingIndex].quantity + quantity;
          newCart[existingIndex].quantity = Math.min(newQty, variant?.availableStock || newQty);
          return newCart;
        }

        return [
          ...prev,
          {
            cartItemId: `local-${Date.now()}`,
            costumeId: costume._id,
            costumeName: costume.name,
            image: costume.images?.[0] || null,
            size: variant?.size || "M",
            rentalPrice: variant?.price || costume.rentalRates?.pricePerDay || 0,
            costume,
            variant,
            quantity,
            startDate: startDateStr,
            endDate: endDateStr,
            rentalDays,
          },
        ];
      });
      return { success: true };
    }
  };

  const removeFromCart = (costumeId, variantId, startDateStr, endDateStr) => {
    setCartItems((prev) => prev.filter((item) => {
      const currentCostumeId = item.costumeId || item.costume?._id;
      if (variantId || startDateStr) {
        return !(currentCostumeId === costumeId
          && (item.variant?._id === variantId || item.size === variantId || item.variant?.size === variantId)
          && item.startDate === startDateStr
          && item.endDate === endDateStr);
      }
      return currentCostumeId !== costumeId;
    }));
  };

  const updateDates = (costumeId, startDateStr, endDateStr) => {
    setCartItems((prev) =>
      prev.map((item) => {
        const currentCostumeId = item.costumeId || item.costume?._id;
        if (currentCostumeId === costumeId) {
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

  const clearCart = () => setCartItems([]);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
