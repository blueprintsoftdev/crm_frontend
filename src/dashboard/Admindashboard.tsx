import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { FaUserCircle } from "react-icons/fa";
import api from "../utils/api";
import { domainUrl } from "../utils/constant";
import logo123 from "../assets/logo.png";
import { useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import NotificationBell from "../components/NotificationBell";
import OrderToast from "../components/OrderToast";





import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";

import {
  Bars3Icon,
  HomeIcon,
  XMarkIcon,
  UsersIcon,
  TagIcon,
  CubeTransparentIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  TicketIcon,
  BellIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
  ComputerDesktopIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { useFeatureFlags, type Feature } from "../context/FeatureFlagContext";
import { useBranding } from "../context/BrandingContext";

// ── Admin navigation — all features shown; disabled ones rendered as locked ──
const ADMIN_NAVIGATION = [
  { name: "Dashboard", href: "/admin-dashboard", icon: HomeIcon, feature: null },
  {
    name: "User Management",
    icon: UsersIcon,
    feature: "USER_MANAGEMENT" as Feature,
    subLinks: [
      { name: "Admin & Staff", href: "/admin-dashboard/manage-user" },
      { name: "Customers", href: "/admin-dashboard/manage-customers" },
    ],
  },
  {
    name: "Category Management",
    icon: TagIcon,
    feature: "CATEGORY_MANAGEMENT" as Feature,
    subLinks: [
      { name: "Add Category", href: "/admin-dashboard/manage-categories/add-category" },
      { name: "List Categories", href: "/admin-dashboard/manage-categories/list-category" },
    ],
  },
  {
    name: "Product Management",
    icon: CubeTransparentIcon,
    feature: "PRODUCT_MANAGEMENT" as Feature,
    subLinks: [
      { name: "Add Products", href: "/admin-dashboard/manage-products/add-products" },
      { name: "List Products", href: "/admin-dashboard/manage-products/list-products" },
    ],
  },
  {
    name: "Order Management",
    href: "/admin-dashboard/order-management",
    icon: ShoppingBagIcon,
    feature: "ORDER_MANAGEMENT" as Feature,
  },
  {
    name: "Coupon Management",
    href: "/admin-dashboard/coupon-management",
    icon: TicketIcon,
    feature: "COUPON_MANAGEMENT" as Feature,
  },
  {
    name: "Notifications",
    href: "/admin-dashboard/notifications",
    icon: BellIcon,
    feature: "NOTIFICATION_MANAGEMENT" as Feature,
  },
  {
    name: "Reports & Analytics",
    href: "/admin-dashboard/reports",
    icon: ChartBarIcon,
    feature: "REPORTS_ANALYTICS" as Feature,
  },
  {
    name: "Audit Log",
    href: "/admin-dashboard/audit-log",
    icon: ClipboardDocumentListIcon,
    feature: "AUDIT_LOG" as Feature,
  },
  {
    name: "Warehouse Settings",
    href: "/admin-dashboard/warehouse",
    icon: BuildingStorefrontIcon,
    feature: "WAREHOUSE_SETTINGS" as Feature,
  },

 {
    name: "Payment History",
    href: "/admin-dashboard/customer-transactions",
    icon: CreditCardIcon,
    feature: null,
  },
  {
    name: "Payment Logs",
    href: "/admin-dashboard/payment-logs",
    icon: ClipboardDocumentListIcon,
    feature: "PAYMENT_LOGS" as Feature,
  },
  {
    name: "Customer Activity",
    href: "/admin-dashboard/customer-activity",
    icon: EyeIcon,
    feature: "CUSTOMER_ACTIVITY_TRACKER" as Feature,
  },
    {
    name: "Homepage Manager",
    href: "/admin-dashboard/homepage",
    icon: ComputerDesktopIcon,
    feature: "HOMEPAGE_MANAGEMENT" as Feature,
  },
  {
    name: "Place Order",
    href: "/admin-dashboard/place-order",
    icon: ShoppingCartIcon,
    feature: "ADMIN_ORDER" as Feature,
  },
];



interface SubLink {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subLinks?: SubLink[];
  feature?: Feature | null;
  /** When true the item is rendered as locked — grayed out with a lock icon. */
  locked?: boolean;
}

interface AdminInfo {
  name: string;
  role: string;
  avatar?: string;
}

const classNames = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" ");

const NavLink = ({ item, openMenu, toggleMenu, setOpenMenu, onProClick }: { item: NavItem; openMenu: string; toggleMenu: (menuName: string) => void; setOpenMenu: React.Dispatch<React.SetStateAction<string>>; onProClick: () => void }) => {
  const location = useLocation();

  const hasSubLinks = item.subLinks && item.subLinks.length > 0;

  // 🔴 LOCKED — feature disabled by Super Admin
  if (item.locked) {
    return (
      <li key={item.name}>
        <button
          type="button"
          onClick={onProClick}
          className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-500 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <item.icon aria-hidden="true" className="size-6 shrink-0" />
          <span className="flex-1 text-left">{item.name}</span>
          <span className="text-[10px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-1.5 py-0.5 rounded-full leading-none shrink-0">
            PRO
          </span>
        </button>
      </li>
    );
  }

  // MAIN LINK ACTIVE CHECK
  const isCurrent = item.href
    ? location.pathname.startsWith(item.href)
    : false;

  // SUBMENU ACTIVE CHECK
  const isActiveParent =
    hasSubLinks &&
    item.subLinks!.some((sub: SubLink) =>
      location.pathname.startsWith(sub.href)
    );

  const baseClasses =
    "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-colors duration-200 cursor-pointer";
  const activeClasses = "bg-white/10 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-white/10 hover:text-white";

  // 🟢 NORMAL MENU ITEM (no submenu)
  if (!hasSubLinks) {
    return (
      <li key={item.name}>
        <Link
          to={item.href ?? "#"}
          className={classNames(
            isCurrent ? activeClasses : inactiveClasses,
            baseClasses,
            "w-full"
          )}
        >
          <item.icon aria-hidden="true" className="size-6 shrink-0" />
          {item.name}
        </Link>
      </li>
    );
  }

  // 🟢 MENU ITEM WITH SUBMENU
  return (
    <li key={item.name}>
      <button
        onClick={() => toggleMenu(item.name)}
        className={classNames(
          isActiveParent ? activeClasses : inactiveClasses,
          baseClasses,
          "w-full flex justify-between items-center"
        )}
      >
        <div className="flex items-center gap-x-3">
          <item.icon aria-hidden="true" className="size-6 shrink-0" />
          {item.name}
        </div>
        <ChevronDownIcon
          className={classNames(
            "size-5 transition-transform duration-200",
            isActiveParent ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      {/* Submenu */}
      <motion.ul
        initial={{ height: 0 }}
        animate={{
  height: openMenu === item.name || isActiveParent ? "auto" : 0
}}

        transition={{ duration: 0.2 }}
        className="mt-1 space-y-1 overflow-hidden ml-4 p-1 rounded-md bg-black/20"
      >
        {item.subLinks!.map((sub: SubLink) => {
          const isSubActive = location.pathname.startsWith(sub.href);

          return (
            <li key={sub.name}>
             <Link
  to={sub.href}
  onClick={(e) => {
    e.stopPropagation();
    setOpenMenu(item.name); // keep parent open
  }}
  className={classNames(
    isSubActive
      ? "bg-white/20 text-white font-medium"
      : "text-gray-400 hover:bg-white/10 hover:text-white",
    "block px-3 py-2 rounded-md transition-colors duration-200"
  )}
>
  {sub.name}
</Link>


            </li>
          );
        })}
      </motion.ul>
    </li>
  );
};


// =========================
// COOKIE-BASED ADMIN PANEL
// =========================
export default function Admindashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProDialog, setShowProDialog] = useState(false);
  const { user, checkAuthStatus, logout } = useAuth();
  const { latestNotification } = useNotifications();
  const { branding } = useBranding();

  // ── Real-time order toast (fires whenever latestNotification changes) ────────




  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();

  // Build navigation: show ALL items but lock disabled ones.
  // Locked items remain visible in the sidebar (greyed-out with a lock icon).
  const visibleNavigation: NavItem[] = ADMIN_NAVIGATION.map((item) => ({
    ...item,
    locked: item.feature != null && !isEnabled(item.feature),
  }));

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? "" : menuName);
  };

  const handleLogout = () => {
    setAdminInfo(null);
    logout();
  };


  // =========================
  // FETCH ADMIN PROFILE
  // =========================
  const fetchAdminProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/adminProfile");
      const data = res.data.adminData;
      setAdminInfo({
        name: data.username || data.name || "Administrator",
        role: data.role || "Admin",
        avatar: data.avatar || "",
      });
    } catch (err) {
      console.error("Auth failed:", err);
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  

  // RUN ON MOUNT
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <ClipLoader color="#343e32" size={35} />
      </div>
    );
  }

  // =========================
  // RENDER (UI UNCHANGED)
  // =========================
  return (
    <>
      {/* Real-time order toast — appears top-right on new admin-notification */}
      <OrderToast notification={latestNotification} />

      <div>
        {/* Mobile Sidebar */}
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>

              <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-r from-gray-900 to-gray-800  px-6 pb-4 ring-1 ring-white/10">
                <div className="relative flex h-16 shrink-0 items-center ">
                  <img
                    src={branding.companyLogo || logo123}
                    alt={branding.companyName || "CRM Logo"}
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <nav className="relative flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {visibleNavigation.map((item) => (
                          <NavLink
                            key={item.name}
                            item={item}
                            openMenu={openMenu}
                            toggleMenu={toggleMenu}
                             setOpenMenu={setOpenMenu}
                            onProClick={() => setShowProDialog(true)}
                          />
                        ))}
                      </ul>
                    </li>
                    <a
                      onClick={() => setShowLogoutConfirm(true)}
                      className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 mt-auto cursor-pointer transition-colors"
                    >
                      <ArrowRightOnRectangleIcon
                        aria-hidden="true"
                        className="size-6 shrink-0"
                      />
                      Logout
                    </a>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop Sidebar bg-[#343e32] */} 
        <div className="hidden  bg-gradient-to-r from-gray-900 to-gray-800 text-white lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <img
                src={branding.companyLogo || logo123}
                alt={branding.companyName || "CRM Logo"}
                className="h-10 w-auto object-contain"
              />
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {visibleNavigation.map((item) => (
                      <NavLink
                        key={item.name}
                        item={item}
                        openMenu={openMenu}
                        toggleMenu={toggleMenu}
                        setOpenMenu={setOpenMenu}
                        onProClick={() => setShowProDialog(true)}
                      />
                    ))}
                  </ul>
                </li>

                <li className="mt-auto">
                  <a
                    onClick={() => setShowLogoutConfirm(true)}
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-300 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    <ArrowRightOnRectangleIcon
                      aria-hidden="true"
                      className="size-6 shrink-0"
                    />
                    Logout
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Top Navbar */}
        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
            >
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>

            <div
              aria-hidden="true"
              className="h-6 w-px bg-gray-900/10 lg:hidden"
            />

            <div className="flex flex-1 justify-end self-stretch">
              <div className="flex items-center gap-x-4 lg:gap-x-6">

                <NotificationBell dashboardPath="/admin-dashboard" />

                <div
                  aria-hidden="true"
                  className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
                />

                <Menu as="div" className="relative">
                  <MenuButton className="relative flex items-center">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>

                    {adminInfo?.avatar ? (
                      <img src={adminInfo.avatar} alt={adminInfo.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <FaUserCircle size={28} className="text-gray-700" />
                    )}

                    <span className="hidden lg:flex lg:items-center">
                      <span
                        aria-hidden="true"
                        className="ml-4 text-sm/6 font-semibold text-gray-900"
                      >
                        {adminInfo?.name || "Administrator"}
                      </span>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="ml-2 size-5 text-gray-400"
                      />
                    </span>
                  </MenuButton>

                  <MenuItems
  transition
  className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition"
>
  <MenuItem>
    <Link
      to="/admin-dashboard/profile"
      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      View Profile
    </Link>
  </MenuItem>

  <MenuItem>
    <a
      onClick={() => setShowLogoutConfirm(true)}
      className="block px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
    >
      Sign out
    </a>
  </MenuItem>
</MenuItems>

                </Menu>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main>
            <div>
              <Outlet />
            </div>
          </main>
        </div>


      </div>

      {/* ── Upgrade to Pro Dialog ── */}
      {showProDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-amber-100">
                <SparklesIcon className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Upgrade to Pro</h3>
            </div>
            <p className="text-gray-500 text-sm mb-2 ml-1">
              This feature is part of the <span className="font-semibold text-amber-600">Pro plan</span> and has been disabled by the Super Admin.
            </p>
            <p className="text-gray-400 text-xs mb-6 ml-1">
              Contact your Super Admin or upgrade your plan to unlock all Pro features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => setShowProDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6 ml-1">Are you sure you want to sign out of the admin panel?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}
