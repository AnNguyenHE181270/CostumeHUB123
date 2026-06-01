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

  const addToCart = (costume) => {
    setCartItems((prev) => {
      // Avoid duplicate single items (rental items are unique)
      const existing = prev.find((item) => item.costume._id === costume._id);
      if (existing) return prev;

      // Default dates (today -> tomorrow)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + Math.max(1, costume.minRentalDays || 1));

      return [
        ...prev,
        {
          costume,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          rentalDays: Math.max(1, costume.minRentalDays || 1),
        },
      ];
    });
  };

  const removeFromCart = (costumeId) => {
    setCartItems((prev) => prev.filter((item) => item.costume._id !== costumeId));
  };

  const updateDates = (costumeId, startDateStr, endDateStr) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.costume._id === costumeId) {
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
