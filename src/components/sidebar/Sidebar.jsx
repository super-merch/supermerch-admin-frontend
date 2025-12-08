import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Quote,
  Package,
  Truck,
  FolderTree,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Percent,
  Ticket,
  Ship,
  Lock,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { IoIosPricetags } from "react-icons/io";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { setAToken, showPopup, setShowPopup } = useContext(AdminContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("aToken");
    setAToken("");
    navigate("/login");
    setShowPopup(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", exact: true },
    {
      icon: ShoppingBag,
      label: "Orders",
      path: "/orders",
      matches: ["/orders", "/all-users", "/user-orders", "/order-details"],
    },
    {
      icon: Quote,
      label: "Quote",
      path: "/quote",
      matches: ["/quote", "/quote-detail"],
    },
    {
      icon: Package,
      label: "Products",
      path: "/products",
      matches: ["/products", "/product"],
    },
    {
      icon: Truck,
      label: "Suppliers",
      path: "/suppliers",
      matches: ["/suppliers", "/supplier-categories"],
    },
    {
      icon: FolderTree,
      label: "Categories",
      path: "/categories",
      matches: ["/categories", "/category-detail"],
    },
    { icon: Users, label: "Users", path: "/users", exact: true },
    {
      icon: FileText,
      label: "Admin Quotes",
      path: "/admin-quotes",
      matches: ["/admin-quotes", "/add-admin-quote", "/admin-quote-detail"],
    },
    {
      icon: MessageSquare,
      label: "Users Queries",
      path: "/user-queries",
      matches: ["/user-queries", "/user-query"],
    },
    {
      icon: FileText,
      label: "Blogs",
      path: "/blogs",
      matches: ["/blogs", "/add-blog"],
    },
    { icon: BarChart3, label: "Reports", path: "/reports", exact: true },
    {
      icon: Percent,
      label: "Global Discount",
      path: "/global-discount",
      exact: true,
    },
    {
      icon: IoIosPricetags,
      label: "Global Margin",
      path: "/global-margin",
      exact: true,
    },
    { icon: Ticket, label: "Coupon", path: "/add-coupen", exact: true },
    { icon: Ship, label: "Shipping", path: "/shipping", exact: true },
    { icon: Lock, label: "Change Password", path: "/change-pass", exact: true },
    { icon: Settings, label: "Settings", path: "/settings", exact: true },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (item.matches) {
      return item.matches.some((match) => location.pathname.startsWith(match));
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      <div
        className={`${
          isOpen ? "w-64" : "w-20"
        } transition-all duration-300 h-screen fixed flex flex-col bg-secondary border-r border-teal-500/20 shadow-2xl z-50`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-teal-500/20">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className=" rounded-lg flex items-center justify-center">
                <img src="/LOGO.png" className=" object-contain" alt="Logo" />
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 text-teal-300 hover:bg-teal-500/20 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-teal-500/30"
                    : "text-gray-300 hover:bg-teal-500/10 hover:text-teal-300"
                } ${!isOpen && "justify-center"}`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active
                      ? "text-white"
                      : "text-gray-400 group-hover:text-teal-400"
                  }`}
                />
                {isOpen && (
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      active ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={() => setShowPopup(true)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-300 hover:bg-red-500/20 hover:text-red-300 w-full mt-4 ${
              !isOpen && "justify-center"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-400" />
            {isOpen && (
              <span className="text-sm font-medium whitespace-nowrap">
                Logout
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Logout Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Confirm Logout
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to logout? You can login back at any time.
              All your changes will be saved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowPopup(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
