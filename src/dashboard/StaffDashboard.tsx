// src/dashboard/StaffDashboard.tsx
// Dashboard layout for STAFF role.
// Navigation is built dynamically from their assigned permission set.
// UI matches Admin / SuperAdmin layouts exactly.

import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { FaUserCircle } from "react-icons/fa";
import logo123 from "../assets/logo.png";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions, type StaffPermission } from "../context/StaffPermissionContext";
import { useBranding } from "../context/BrandingContext";
import NotificationBell from "../components/NotificationBell";

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
  TagIcon,
  CubeTransparentIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  BellIcon,
  CreditCardIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubLink { name: string; href: string }
interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subLinks?: SubLink[];
}

// ── Build staff nav from permissions ─────────────────────────────────────────
function buildNav(permissions: StaffPermission[]): NavItem[] {
  const has = (...perms: StaffPermission[]) => perms.some((p) => permissions.includes(p));

  const items: NavItem[] = [
    { name: "Dashboard", href: "/staff-dashboard", icon: HomeIcon },
  ];

  if (has("CATEGORY_VIEW", "CATEGORY_ADD", "CATEGORY_EDIT", "CATEGORY_DELETE")) {
    const subLinks: SubLink[] = [];
    if (has("CATEGORY_ADD"))
      subLinks.push({ name: "Add Category", href: "/staff-dashboard/manage-categories/add-category" });
    if (has("CATEGORY_VIEW", "CATEGORY_EDIT", "CATEGORY_DELETE"))
      subLinks.push({ name: "List Categories", href: "/staff-dashboard/manage-categories/list-category" });
    items.push({ name: "Category Management", icon: TagIcon, subLinks });
  }

  if (has("PRODUCT_VIEW", "PRODUCT_ADD", "PRODUCT_EDIT", "PRODUCT_DELETE")) {
    const subLinks: SubLink[] = [];
    if (has("PRODUCT_ADD"))
      subLinks.push({ name: "Add Products", href: "/staff-dashboard/manage-products/add-products" });
    if (has("PRODUCT_VIEW", "PRODUCT_EDIT", "PRODUCT_DELETE"))
      subLinks.push({ name: "List Products", href: "/staff-dashboard/manage-products/list-products" });
    items.push({ name: "Product Management", icon: CubeTransparentIcon, subLinks });
  }

  if (has("ORDER_VIEW", "ORDER_UPDATE")) {
    items.push({
      name: "Order Management",
      href: "/staff-dashboard/order-management",
      icon: ShoppingBagIcon,
    });
    items.push({
      name: "Payment History",
      href: "/staff-dashboard/customer-transactions",
      icon: CreditCardIcon,
    });
  }

  items.push({ name: "Notifications", href: "/staff-dashboard/notifications", icon: BellIcon });
  items.push({ name: "My Profile", href: "/staff-dashboard/profile", icon: UserCircleIcon });

  return items;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const classNames = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

// ── Nav item renderer — matches Admin/SuperAdmin NavLink exactly ──────────────
const NavLink = ({
  item,
  openMenu,
  toggleMenu,
  setOpenMenu,
}: {
  item: NavItem;
  openMenu: string;
  toggleMenu: (name: string) => void;
  setOpenMenu: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const location = useLocation();
  const hasSubLinks = item.subLinks && item.subLinks.length > 0;

  const isCurrent = item.href
    ? item.href === "/staff-dashboard"
      ? location.pathname === "/staff-dashboard"
      : location.pathname.startsWith(item.href)
    : false;

  const isActiveParent =
    hasSubLinks &&
    item.subLinks!.some((sub) => location.pathname.startsWith(sub.href));

  const baseClasses =
    "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-colors duration-200 cursor-pointer";
  const activeClasses = "bg-white/10 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-white/10 hover:text-white";

  if (!hasSubLinks) {
    return (
      <li>
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

  return (
    <li>
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

      <motion.ul
        initial={{ height: 0 }}
        animate={{
          height: openMenu === item.name || isActiveParent ? "auto" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="mt-1 space-y-1 overflow-hidden ml-4 p-1 rounded-md bg-black/20"
      >
        {item.subLinks!.map((sub) => {
          const isSubActive = location.pathname.startsWith(sub.href);
          return (
            <li key={sub.name}>
              <Link
                to={sub.href}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(item.name);
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

// ── Main component ────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const { permissions, username, loading } = useStaffPermissions();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const nav = buildNav(permissions);

  const toggleMenu = (name: string) =>
    setOpenMenu((prev) => (prev === name ? "" : name));

  const handleLogout = () => logout();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <ClipLoader color="#343e32" size={35} />
      </div>
    );
  }

  return (
    <>
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
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-r from-gray-900 to-gray-800 px-6 pb-4 ring-1 ring-white/10">
                <div className="relative flex h-16 shrink-0 items-center">
                  <img src={branding.companyLogo || logo123} alt={branding.companyName || "CRM"} className="h-10 w-auto object-contain" />
                </div>

                <nav className="relative flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {nav.map((item) => (
                          <NavLink
                            key={item.name}
                            item={item}
                            openMenu={openMenu}
                            toggleMenu={toggleMenu}
                            setOpenMenu={setOpenMenu}
                          />
                        ))}
                      </ul>
                    </li>
                    <a
                      onClick={() => setShowLogoutConfirm(true)}
                      className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 mt-auto cursor-pointer transition-colors"
                    >
                      <ArrowRightOnRectangleIcon aria-hidden="true" className="size-6 shrink-0" />
                      Logout
                    </a>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop Sidebar */}
        <div className="hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <img src={branding.companyLogo || logo123} alt={branding.companyName || "CRM"} className="h-10 w-auto object-contain" />
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {nav.map((item) => (
                      <NavLink
                        key={item.name}
                        item={item}
                        openMenu={openMenu}
                        toggleMenu={toggleMenu}
                        setOpenMenu={setOpenMenu}
                      />
                    ))}
                  </ul>
                </li>

                <li className="mt-auto">
                  <a
                    onClick={() => setShowLogoutConfirm(true)}
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-300 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    <ArrowRightOnRectangleIcon aria-hidden="true" className="size-6 shrink-0" />
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

            <div aria-hidden="true" className="h-6 w-px bg-gray-900/10 lg:hidden" />

            <div className="flex flex-1 justify-end self-stretch">
              <div className="flex items-center gap-x-4 lg:gap-x-6">

                <NotificationBell dashboardPath="/staff-dashboard" />

                <div
                  aria-hidden="true"
                  className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
                />

                <Menu as="div" className="relative">
                  <MenuButton className="relative flex items-center">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>

                    <FaUserCircle size={28} className="text-gray-700" />

                    <span className="hidden lg:flex lg:items-center">
                      <span
                        aria-hidden="true"
                        className="ml-4 text-sm/6 font-semibold text-gray-900"
                      >
                        {username || "Staff"}
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
                        to="/staff-dashboard/profile"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
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
            <p className="text-gray-500 text-sm mb-6 ml-1">Are you sure you want to sign out?</p>
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
