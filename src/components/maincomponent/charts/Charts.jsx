import React, { useContext } from "react";
import BarChart from "./BarChart";
import CurcleChart from "./CurcleChart";
import { AdminContext } from "../../context/AdminContext";
import { Users, ShoppingBag, Package, FileText, Quote, Truck, UserX, Mail, Calendar, Eye } from "lucide-react";
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
    suppliers
  } = useContext(AdminContext);

  if (allProductLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }
  const navigate = useNavigate()
  const recentUsers = users?.slice(0, 5) || [];
  const recentOrders = orders?.slice(0, 5) || [];
  const recentSuppliers = suppliers?.slice(0, 5) || [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className={`${
        isOpen ? "max-w-[95%]" : "max-w-full"
      } lg:px-3 md:px-3 px-0 w-full mx-auto my-5 max-sm:p-2`}
    >
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {/* Users */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {usersPagination?.totalUsers ?? users?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Users</p>
          </div>
        </div>

        {/* Orders */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {pagination?.totalOrders ?? orders?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Orders</p>
          </div>
        </div>

        {/* Products */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <Package className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {prodLength ?? products?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Products</p>
          </div>
        </div>

        {/* Blogs */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {blogs?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Blogs</p>
          </div>
        </div>

        {/* Quotes */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <Quote className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {quoteData?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Quotes</p>
          </div>
        </div>

        {/* Active Suppliers */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <Truck className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {supplierCount ?? 0}
            </p>
            <p className="text-sm text-gray-500">Active Suppliers</p>
          </div>
        </div>

        {/* Deactive Suppliers */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center">
            <UserX className="w-7 h-7 text-blue-900" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-800">
              {deactiveSuppliers ?? 0}
            </p>
            <p className="text-sm text-gray-500">Deactive Suppliers</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Recent Users</h3>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {recentUsers.map((user, index) => (
              <div key={user._id || index} className="p-2 rounded border border-gray-200 bg-gray-50">
                <p className="font-medium text-gray-800 text-sm mb-2">{user.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button onClick={() => navigate('/users')} className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
              View All
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Recent Orders</h3>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {recentOrders.map((order, index) => (
              <div key={order._id || index} className="p-2 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{order.orderId}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'Pending' ? 'bg-gray-200 text-gray-700' : 
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-1">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(order.orderDate)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">
                    ${order.total?.toFixed(2)}
                  </span>
                  <button onClick={() => navigate(`/order-details/${order._id}`)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition">
                    <Eye className="w-3 h-3" />
                    View Order
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button onClick={() => navigate('/orders')} className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
              View All
            </button>
          </div>
        </div>

        {/* Recent Suppliers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Recent Suppliers</h3>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {recentSuppliers.map((supplier, index) => (
              <div key={supplier._id || index} className="p-2 rounded border border-gray-200 bg-gray-50">
                <p className="font-medium text-gray-800 text-sm mb-2">{supplier.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-[2px]">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">

                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(supplier.created_at)}</span>
                  </div>
                  <div className={` px-2 py-1 rounded ${supplier.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`} >
                    {supplier.active ? "Active": "Inactive"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button onClick={() => navigate('/suppliers')} className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
