import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FeatureFlagProvider } from "./context/FeatureFlagContext";
import { BrandingProvider } from "./context/BrandingContext";
import AppRoutes from "./AppRoutes";
import NoInternet from "./pages/NoInternet";
import { WishlistProvider } from "./context/WishlistContext";
import { UserNotificationProvider } from "./context/UserNotificationContext";

// Single QueryClient instance — created outside the component to avoid re-creation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <BrandingProvider>
    <FeatureFlagProvider>
      <CartProvider>
        <WishlistProvider isAuthenticated={user.isAuthenticated}>
          <UserNotificationProvider>
            {isOnline ? <AppRoutes /> : <NoInternet />}
          </UserNotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </FeatureFlagProvider>
    </BrandingProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
