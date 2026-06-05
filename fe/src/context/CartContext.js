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

  const addToCart = (costume, variant, quantity, startDateStr, endDateStr, rentalDays) => {
    setCartItems((prev) => {
      // Find exact same item (same costume, same variant, same dates)
      const existingIndex = prev.findIndex(
        (item) => item.costume._id === costume._id 
               && item.variant?._id === variant?._id
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
          costume,
          variant,
          quantity,
          startDate: startDateStr,
          endDate: endDateStr,
          rentalDays,
        },
      ];
    });
  };

  const removeFromCart = (costumeId, variantId, startDateStr, endDateStr) => {
    setCartItems((prev) => prev.filter((item) => {
      if (variantId || startDateStr) {
        return !(item.costume._id === costumeId 
              && item.variant?._id === variantId 
              && item.startDate === startDateStr 
              && item.endDate === endDateStr);
      }
      return item.costume._id !== costumeId;
    }));
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
