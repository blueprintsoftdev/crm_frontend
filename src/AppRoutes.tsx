

import { Routes, Route, useLocation, Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";

/* ==================== CONTEXT HOOKS ==================== */
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";

/* ==================== GLOBAL COMPONENTS ==================== */
import Navbar from "./components/Navbar";

/* ==================== AUTH ==================== */
import Signup from "./login/Signup";
import Login from "./login/Login";
import ProtectedRoute from "./login/ProtectedRoute";

/* ==================== DASHBOARDS ==================== */
import Admindashboard from "./dashboard/Admindashboard";
import SuperAdminDashboard from "./dashboard/SuperAdminDashboard";
import Customerdashboard from "./dashboard/Customerdashboard";

/* ==================== ADMIN ==================== */
import UserManagementPage from "./users/UserManagementPage";
import CustomerManagementPage from "./users/CustomerManagementPage";
import Adduser from "./users/Adduser";

import Addcategory from "./categories/Addcategory";
import Listcategory from "./categories/Listcategory";
import CategoryAttributes from "./categories/CategoryAttributes";

import Manageproducts from "./products/Manageproducts";
import Addproducts from "./products/Addproducts";
import Listproducts from "./products/Listproducts";

import AdminOrderManagement from "./dashboard/AdminOrderManagement";
import AdminProfile from "./dashboard/AdminProfile";
import SuperAdminSettings from "./dashboard/SuperAdminSettings";
import CouponManagement from "./dashboard/CouponManagement";
import NotificationManagement from "./dashboard/NotificationManagement";
import ReportsAnalytics from "./dashboard/ReportsAnalytics";
import StaffManagement from "./dashboard/StaffManagement";
import StaffDashboard from "./dashboard/StaffDashboard";
import StaffProfile from "./dashboard/StaffProfile";
import StaffDashboardHome from "./dashboard/StaffDashboardHome";
import AuditLog from "./dashboard/AuditLog";
import WarehouseSettings from "./dashboard/WarehouseSettings";
import HomepageManager from "./dashboard/HomepageManager";
import CustomerTransactions from "./dashboard/CustomerTransactions";
import CustomerActivityTracker from "./dashboard/CustomerActivityTracker";
import PaymentTransactionLogs from "./dashboard/PaymentTransactionLogs";
import AdminOrderPage from "./dashboard/AdminOrderPage";

/* ==================== CUSTOMER ==================== */
import ProductsPage from "./components/AllProducts";
import CategoryProductPage from "./cart/CategoryProductPage";
import ProductDetailPage from "./cart/ProductDetailPage";

import Cartpage from "./cart/Cartpage";
import CheckoutPage from "./cart/CheckoutPage";

import MyOrdersPage from "./orders/MyOrdersPage";
import WhishlistPage from "./pages/WishlistPage";
import ProfilePage from "./pages/ProfilePage";
import OrderSuccess from "./pages/OrderSuccess";
import InvoicePage from "./pages/InvoicePage";
import TransactionHistory from "./pages/TransactionHistory";
import DiscountPage from "./components/DiscountPage";

/* ==================== MISC ==================== */
import Home from "./home/Home";
import NotFound from "./pages/NotFound";

/* ==================== NOTIFICATIONS ==================== */
import { NotificationProvider } from "./context/NotificationContext";
import { UserNotificationProvider } from "./context/UserNotificationContext";
import { StaffPermissionProvider } from "./context/StaffPermissionContext";
import FeatureGatedRoute from "./login/FeatureGatedRoute";

/* ======================================================= */
/* ==================== CUSTOMER LAYOUT ================== */
/* ======================================================= */

const CustomerLayout = () => {
  const { logout, user } = useAuth();
  const { cartItems } = useCart();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // use "smooth" if you want animation
    });
  }, [location.pathname]);

  return (
    <UserNotificationProvider>
      <Navbar
        user={user}
        role={user.role}
        cartItemCount={user.isAuthenticated ? cartItems.length : 0}
        handleLogout={logout}
      />

      {/* Padding below navbar */}
      <div className="pt-5">
        <Outlet />
      </div>
    </UserNotificationProvider>
  );
};

/* ======================================================= */
/* ==================== MAIN ROUTES ====================== */
/* ======================================================= */

const AppRoutes = () => {

  return (
    <Routes>
      {/* ===================== ADMIN ROUTES (ADMIN role only) ===================== */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRoles={["ADMIN"]} redirectTo="/super-admin-dashboard">
            <NotificationProvider>
              <StaffPermissionProvider>
                <Admindashboard />
              </StaffPermissionProvider>
            </NotificationProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        {/* Combined Admin/Staff + Customer Management */}
        <Route
          path="manage-user"
          element={
            <FeatureGatedRoute feature="USER_MANAGEMENT">
              <UserManagementPage />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-customers"
          element={
            <FeatureGatedRoute feature="USER_MANAGEMENT">
              <CustomerManagementPage />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-user/add-user"
          element={
            <FeatureGatedRoute feature="USER_MANAGEMENT">
              <Adduser />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-categories/add-category"
          element={
            <FeatureGatedRoute feature="CATEGORY_MANAGEMENT">
              <Addcategory />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-categories/list-category"
          element={
            <FeatureGatedRoute feature="CATEGORY_MANAGEMENT">
              <Listcategory />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-categories/attributes/:categoryId"
          element={
            <FeatureGatedRoute feature="CATEGORY_MANAGEMENT">
              <CategoryAttributes />
            </FeatureGatedRoute>
          }
        />
        <Route path="manage-products" element={<Manageproducts />} />
        <Route
          path="manage-products/add-products"
          element={
            <FeatureGatedRoute feature="PRODUCT_MANAGEMENT">
              <Addproducts />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="manage-products/list-products"
          element={
            <FeatureGatedRoute feature="PRODUCT_MANAGEMENT">
              <Listproducts />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="order-management"
          element={
            <FeatureGatedRoute feature="ORDER_MANAGEMENT">
              <AdminOrderManagement />
            </FeatureGatedRoute>
          }
        />
        <Route path="profile" element={<AdminProfile />} />
        <Route
          path="coupon-management"
          element={
            <FeatureGatedRoute feature="COUPON_MANAGEMENT">
              <CouponManagement />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <FeatureGatedRoute feature="NOTIFICATION_MANAGEMENT">
              <NotificationManagement />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <FeatureGatedRoute feature="REPORTS_ANALYTICS">
              <ReportsAnalytics />
            </FeatureGatedRoute>
          }
        />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="warehouse" element={<WarehouseSettings />} />
        <Route
          path="homepage"
          element={
            <FeatureGatedRoute feature="HOMEPAGE_MANAGEMENT">
              <HomepageManager />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="staff-management"
          element={
            <FeatureGatedRoute feature="STAFF_MANAGEMENT">
              <StaffManagement />
            </FeatureGatedRoute>
          }
        />
        <Route path="customer-transactions" element={<CustomerTransactions />} />
        <Route
          path="customer-activity"
          element={
            <FeatureGatedRoute feature="CUSTOMER_ACTIVITY_TRACKER">
              <CustomerActivityTracker />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="payment-logs"
          element={
            <FeatureGatedRoute feature="PAYMENT_LOGS">
              <PaymentTransactionLogs />
            </FeatureGatedRoute>
          }
        />
        <Route
          path="place-order"
          element={
            <FeatureGatedRoute feature="ADMIN_ORDER">
              <AdminOrderPage />
            </FeatureGatedRoute>
          }
        />
      </Route>

      {/* ===================== SUPER ADMIN ROUTES (SUPER_ADMIN role only) ===================== */}
      <Route
        path="/super-admin-dashboard"
        element={
          <ProtectedRoute requiredRoles={["SUPER_ADMIN"]} redirectTo="/admin-dashboard">
            <NotificationProvider>
              <StaffPermissionProvider>
                <SuperAdminDashboard />
              </StaffPermissionProvider>
            </NotificationProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        {/* Super Admin: all features always accessible — no FeatureGatedRoute wrapper */}
        <Route path="manage-user" element={<UserManagementPage />} />
        <Route path="manage-customers" element={<CustomerManagementPage />} />
        <Route path="manage-user/add-user" element={<Adduser />} />
        <Route path="manage-categories/add-category" element={<Addcategory />} />
        <Route path="manage-categories/list-category" element={<Listcategory />} />
        <Route path="manage-categories/attributes/:categoryId" element={<CategoryAttributes />} />
        <Route path="manage-products" element={<Manageproducts />} />
        <Route path="manage-products/add-products" element={<Addproducts />} />
        <Route path="manage-products/list-products" element={<Listproducts />} />
        <Route path="order-management" element={<AdminOrderManagement />} />
        <Route path="profile" element={<AdminProfile />} />
        {/* Super Admin only — feature flag management */}
        <Route path="feature-settings" element={<SuperAdminSettings />} />
        <Route path="coupon-management" element={<CouponManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="warehouse" element={<WarehouseSettings />} />
        <Route path="homepage" element={<HomepageManager />} />
        <Route path="customer-transactions" element={<CustomerTransactions />} />
        <Route path="customer-activity" element={<CustomerActivityTracker />} />
        <Route path="payment-logs" element={<PaymentTransactionLogs />} />
        <Route path="place-order" element={<AdminOrderPage />} />
      </Route>

      {/* ===================== STAFF ROUTES ===================== */}
      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute requiredRoles={["STAFF"]}>
            <NotificationProvider>
              <StaffPermissionProvider>
                <StaffDashboard />
              </StaffPermissionProvider>
            </NotificationProvider>
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<StaffProfile />} />
        <Route index element={<StaffDashboardHome />} />
        <Route path="manage-categories/add-category" element={<Addcategory />} />
        <Route path="manage-categories/list-category" element={<Listcategory />} />
        <Route path="manage-categories/attributes/:categoryId" element={<CategoryAttributes />} />
        <Route path="manage-products/add-products" element={<Addproducts />} />
        <Route path="manage-products/list-products" element={<Listproducts />} />
        <Route path="order-management" element={<AdminOrderManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="customer-transactions" element={<CustomerTransactions />} />
      </Route>

      {/* ===================== CUSTOMER ROUTES ===================== */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Customerdashboard />} />
        <Route path="/discounts" element={<DiscountPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories/:slug" element={<CategoryProductPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cartpage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/WishlistPage"
          element={
            <ProtectedRoute>
              <WhishlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myorders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ===================== INVOICE ROUTE (all authenticated roles) ===================== */}
      <Route
        path="/invoice/:orderId"
        element={
          <ProtectedRoute>
            <InvoicePage />
          </ProtectedRoute>
        }
      />

      {/* ===================== AUTH ROUTES ===================== */}
      {/* /signup replaced by CustomerAuthModal — redirect to home */}
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />

      {/* ===================== FALLBACK ===================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
