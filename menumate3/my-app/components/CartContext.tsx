"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import type { ParsedDish } from "../types/menu";

interface CartItem extends ParsedDish {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (dish: ParsedDish) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (dish: ParsedDish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== dishId));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // originalPrice is a string, try to parse as float
      const price = parseFloat(item.originalPrice || "0");
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, getCartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};
