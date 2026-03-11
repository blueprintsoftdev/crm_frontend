// src/context/CartContext.tsx
// Migrated: TanStack Query handles server fetching/mutations.
// Zustand (useCartStore) holds the cart items & total for granular subscriptions.
// Public API (useCart hook) is unchanged — all consumers work without modification.

import React, { createContext, useContext, useCallback, useMemo, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useCartStore, CartItem } from "../store/cartStore";
import { useAuth } from "./AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────
export type { CartItem };

interface AddToCartOptions {
  quantity?: number;
  selectedSize?: string | null;
}

interface CartContextValue {
  cartItems: CartItem[];
  cartTotal: string;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, options?: AddToCartOptions) => Promise<unknown>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  clearCart: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};

// ── Fetch helper ───────────────────────────────────────────────────────────────
const fetchCartFromServer = async (): Promise<{ items: CartItem[]; total: string }> => {
  const res = await api.get<{ cart: { items: any[] } | null; totalAmount?: number }>("/cart/list");
  const backendCart = res.data.cart ?? { items: [] };
  const serverTotal = res.data.totalAmount ?? 0;

  const items: CartItem[] = (backendCart.items ?? [])
    .map((item: any) => ({
      _id: item._id ?? item.id,
      productId: item.product?._id ?? item.product?.id,
      name: item.product?.name,
      price: item.product?.price,
      image: item.product?.image,
      stock: item.product?.stock ?? 0,
      quantity: item.quantity,
      selectedSize: item.selectedSize ?? null,
    }))
    .filter((item: CartItem) => item.productId);

  return { items, total: parseFloat(String(serverTotal)).toFixed(2) };
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { items, total, loading, setItems, setLoading, clear } = useCartStore();

  // Only fetch the cart when the user is authenticated (avoids 401 for guests)
  const isCustomerLoggedIn =
    user.isAuthenticated && !user.isInitialLoad && user.role === "CUSTOMER";

  // ── Query: fetch cart ────────────────────────────────────────────────────────
  const { error: queryError, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const data = await fetchCartFromServer();
      setItems(data.items, data.total);
      setLoading(false);
      return data;
    },
    enabled: isCustomerLoggedIn,
    staleTime: 30_000,
    retry: (failureCount: number, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });

  // Clear cart when user logs out
  useEffect(() => {
    if (!isCustomerLoggedIn) {
      clear();
      setLoading(false);
    }
  }, [isCustomerLoggedIn, clear, setLoading]);

  // Stop loading spinner if the query errors (e.g. 401 unauthenticated)
  useEffect(() => {
    if (queryError) setLoading(false);
  }, [queryError, setLoading]);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      await refetch();
    } finally {
      setLoading(false);
    }
  }, [refetch, setLoading]);

  // ── Mutation: add to cart ────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
      selectedSize,
    }: {
      productId: string;
      quantity: number;
      selectedSize: string | null;
    }) => api.post("/cart/add", { productId, quantity, selectedSize }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: any) => {
      if (err?.response?.status !== 401) {
        toast.error(err?.response?.data?.message ?? "Failed to add to cart", {
          id: "failed-to-add-cart",
        });
      }
    },
  });

  const addToCart = useCallback(
    async (productId: string, options: AddToCartOptions = {}) => {
      const { quantity = 1, selectedSize = null } = options;
      return addMutation.mutateAsync({ productId, quantity, selectedSize });
    },
    [addMutation],
  );

  // ── Mutation: remove from cart ───────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/remove/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast("Item removed", { id: "item-removed" });
    },
  });

  const removeFromCart = useCallback(
    async (productId: string) => {
      await removeMutation.mutateAsync(productId);
    },
    [removeMutation],
  );

  // ── Mutation: update quantity (optimistic) ───────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.put(`/cart/updateQuantity/${productId}`, { quantity }),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateQuantity = useCallback(
    async (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) return;

      // Optimistic update in Zustand store
      const item = items.find((i) => i.productId === productId);
      if (item) {
        const diff = (newQuantity - item.quantity) * item.price;
        const updatedItems = items.map((i) =>
          i.productId === productId ? { ...i, quantity: newQuantity } : i,
        );
        setItems(updatedItems, (parseFloat(total) + diff).toFixed(2));
      }

      await updateMutation.mutateAsync({ productId, quantity: newQuantity });
    },
    [items, total, setItems, updateMutation],
  );

  const clearCart = useCallback(() => {
    clear();
    queryClient.removeQueries({ queryKey: ["cart"] });
  }, [clear, queryClient]);

  const contextValue = useMemo(
    () => ({
      cartItems: items,
      cartTotal: total,
      loading: loading || addMutation.isPending || removeMutation.isPending,
      error: queryError ? "Could not load cart" : null,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      total,
      loading,
      addMutation.isPending,
      removeMutation.isPending,
      queryError,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};
