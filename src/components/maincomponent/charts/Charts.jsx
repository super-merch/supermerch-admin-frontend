import React, { useContext } from "react";
import BarChart from "./BarChart";
import CurcleChart from "./CurcleChart";
import { AdminContext } from "../../context/AdminContext";
import {
  Users,
  ShoppingBag,
  Package,
  FileText,
  Quote,
  Truck,
  UserX,
  Mail,
  Calendar,
  Eye,
  TrendingUp,
  ArrowRight,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Charts = ({ isOpen }) => {
  const {
    users,
    orders,
    orderCompleted,
    orderPending,
    products,
    blogs,
    quoteData,
    allProductLoading,
    pagination,
    prodLength,
    usersPagination,
    supplierCount,
    deactiveSuppliers,
    suppliers,
  } = useContext(AdminContext);

  if (allProductLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-6 text-gray-700 text-lg font-semibold">
            Loading dashboard...
          </p>
          <p className="mt-2 text-gray-500 text-sm">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }
  const navigate = useNavigate();
  const recentUsers = users?.slice(0, 5) || [];
  const recentOrders = orders?.slice(0, 5) || [];
  const recentSuppliers = suppliers?.slice(0, 5) || [];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statCards = [
    {
      title: "Total Users",
      value: usersPagination?.totalUsers ?? users?.length ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      route: "/users",
    },
    {
      title: "Total Orders",
      value: pagination?.totalOrders ?? orders?.length ?? 0,
      icon: ShoppingBag,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconColor: "text-green-600",
      route: "/orders",
    },
    {
      title: "Products",
      value: prodLength ?? products?.length ?? 0,
      icon: Package,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      route: "/products",
    },
    {
      title: "Blogs",
      value: blogs?.length ?? 0,
      icon: FileText,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
      route: "/blog",
    },
    {
      title: "Quotes",
      value: quoteData?.length ?? 0,
      icon: Quote,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
      route: "/quotes",
    },
    {
      title: "Active Suppliers",
      value: supplierCount ?? 0,
      icon: Truck,
      gradient: "from-cyan-500 to-cyan-600",
      bgGradient: "from-cyan-50 to-cyan-100",
      iconColor: "text-cyan-600",
      route: "/suppliers",
    },
    {
      title: "Inactive Suppliers",
      value: deactiveSuppliers ?? 0,
      icon: UserX,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconColor: "text-red-600",
      route: "/suppliers",
    },
  ];

  return (
    <div
      className={`${
        isOpen ? "max-w-[95%]" : "max-w-full"
      } lg:px-6 md:px-4 px-3 w-full mx-auto py-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 min-h-screen`}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(stat.route)}
              className="group relative bg-white rounded-xl p-3 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient Background Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-0.5 group-hover:text-gray-800 transition-colors">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs font-medium text-gray-600">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Analytics Overview
              </h3>
              <p className="text-sm text-gray-600">
                Users, Orders & Completed Orders
              </p>
            </div>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <BarChart />
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Distribution Chart
              </h3>
              <p className="text-sm text-gray-600">
                Data breakdown by category
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex justify-center">
            <CurcleChart />
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[650px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Recent Users
                </h3>
                <p className="text-sm text-gray-600">Latest registered users</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user, index) => (
                <div
                  key={user._id || index}
                  className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-blue-600 transition-colors">
                        {user.name || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{user.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent users</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => navigate("/users")}
              className="w-full py-3 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              View All Users
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[650px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600">
                  Latest order transactions
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <div
                  key={order._id || index}
                  className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">
                          {order.orderId || "N/A"}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status || "Unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">
                        {order.user?.firstName || ""}{" "}
                        {order.user?.lastName || ""}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(order.orderDate)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-base font-bold text-gray-900">
                          ${order.total?.toFixed(2) || "0.00"}
                        </span>
                        <button
                          onClick={() =>
                            navigate(`/order-details/${order._id}`)
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent orders</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => navigate("/orders")}
              className="w-full py-3 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              View All Orders
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Recent Suppliers */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[650px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-cyan-100/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Recent Suppliers
                </h3>
                <p className="text-sm text-gray-600">
                  Latest supplier registrations
                </p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Truck className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {recentSuppliers.length > 0 ? (
              recentSuppliers.map((supplier, index) => (
                <div
                  key={supplier._id || index}
                  className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-cyan-600 transition-colors">
                        {supplier.name || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">
                          {supplier.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(supplier.created_at)}</span>
                        </div>
                        <div
                          className={`px-2.5 py-1 rounded-full font-medium text-xs ${
                            supplier.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {supplier.active ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent suppliers</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => navigate("/suppliers")}
              className="w-full py-3 text-sm font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              View All Suppliers
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
