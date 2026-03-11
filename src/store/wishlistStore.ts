// src/store/wishlistStore.ts
// Zustand store for wishlist UI state (optimistic toggles, local item set).
// Actual server-sync is handled by TanStack Query in WishlistContext.

import { create } from "zustand";

export interface WishlistProduct {
  id: string;
  name?: string;
  price?: number;
  image?: string;
  [key: string]: unknown;
}

interface WishlistState {
  items: WishlistProduct[];
  setItems: (items: WishlistProduct[]) => void;
  addItem: (product: WishlistProduct) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),
  addItem: (product) =>
    set((state) => ({
      items: state.items.some((i) => i.id === product.id)
        ? state.items
        : [...state.items, product],
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== productId),
    })),
  clear: () => set({ items: [] }),
}));
