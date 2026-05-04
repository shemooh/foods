"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "./supabase";

type CartItem = {
  id: string;
  emoji: string;
  name: string;
  rest: string;
  price: string;
  image_url?: string;
  quantity: number;
  note?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, note?: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  count: number;
  placeOrders: (userEmail?: string) => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  count: 0,
  placeOrders: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, "quantity">, note?: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1, note }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const clearCart = () => setCart([]);

  const placeOrders = async (userEmail?: string) => {
    const inserts = cart.map(item => ({
      food_name: item.name,
      food_emoji: item.emoji,
      restaurant: item.rest,
      price: item.price,
      note: item.note || null,
      user_email: userEmail || null,
      status: "pending",
    }));
    await supabase.from("orders").insert(inserts);
    clearCart();
  };

  const count = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, count, placeOrders }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);