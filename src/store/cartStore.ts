// src/store/cartStore.ts
// Zustand store for cart UI state (optimistic updates, local count, loading flags).
// Actual server-sync is handled by TanStack Query in CartContext.

import { create } from "zustand";

export interface CartItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
  selectedSize: string | null;
}

interface CartState {
  items: CartItem[];
  total: string;
  loading: boolean;
  setItems: (items: CartItem[], total: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  total: "0.00",
  loading: true,

  setItems: (items, total) => set({ items, total }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ items: [], total: "0.00" }),
}));
