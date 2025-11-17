import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import {
  Search,
  RefreshCw,
  FileText,
  Users,
  Filter,
  X,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";
import EmailTemplatesManager from "./EmailTemplatesManager";

const Orders = () => {
  const {
    orders,
    fetchOrders,
    fetchUsers,
    users,
    loading,
    setLoading,
    updateOrderStatus,
    pagination,
    deleteOrder,
    deleteLoading,
  } = useContext(AdminContext);
  const [byUsers, setByUsers] = useState(false);
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  const [deleteModel, setDeleteModel] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");

  const [allUsers, setAllUsers] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus !== "Pending") {
      try {
        setEmailLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkout/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: orderId, status: newStatus }),
          }
        );
        if (response.ok) {
          setEmailLoading(false);
          toast.success(response.message || "Email sent successfully");
        } else {
          setEmailLoading(false);
          toast.error(response.message || "Failed to send email");
        }
      } catch (error) {
        setEmailLoading(false);
        toast.error(error.message || "Failed to send email");
      }
    }
    await updateOrderStatus(orderId, newStatus);
  };
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [cancelledOrders, setCancelledOrders] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const response = await fetchOrders("", 1, {}, ordersPerPage);
      setTotalOrders(response.pagination.totalOrders);
      setPendingOrders(response.pendingOrders);
      setDeliveredOrders(response.deliveredOrders);
      setCancelledOrders(response.cancelledOrders);
    };
    loadData();
  }, [ordersPerPage]);
  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/update-payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentStatus: newPaymentStatus,
            id: orderId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update payment status.");
      }

      // Option 1: Refetch orders (current approach)
      fetchOrders(
        "",
        currentPage,
        {
          searchTerm,
          filterStatus,
          filterDate,
          sortBy,
          sortOrder,
        },
        ordersPerPage
      );

      // Option 2: Update local state directly (if you have setOrders in AdminContext)
      // setOrders(prevOrders =>
      //   prevOrders.map(order =>
      //     order._id === orderId
      //       ? { ...order, paymentStatus: newPaymentStatus }
      //       : order
      //   )
      // );

      toast.success("Payment status updated successfully!");
    } catch (error) {
      toast.error("Failed to update payment status.");
    }
  };

  useEffect(() => {
    const filters = {
      searchTerm,
      filterStatus,
      filterDate,
      sortBy,
      sortOrder,
    };
    fetchOrders("", currentPage, filters, ordersPerPage);
  }, [currentPage, searchTerm, filterStatus, filterDate, sortBy, sortOrder]);

  // Update goToPage, goToPreviousPage, goToNextPage functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handleDeleteOrder = async (_id) => {
    await deleteOrder(_id);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, sortBy, sortOrder]);
  const [mySearch, setMySearch] = useState("");

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
      "Artwork Pending": "bg-orange-100 text-orange-800",
      "ArtWork Approved": "bg-blue-100 text-blue-800",
      "Branding in progress": "bg-purple-100 text-purple-800",
      "Production Complete": "bg-indigo-100 text-indigo-800",
      "Shipped/In Transit": "bg-cyan-100 text-cyan-800",
      Returned: "bg-pink-100 text-pink-800",
      "On Hold": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Delete Confirmation Modal */}
      {deleteModel && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full mx-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Order</h2>
              <button
                onClick={() => {
                  setDeleteId("");
                  setDeleteModel(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-5">
              Are you sure you want to delete this order? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteId("");
                  setDeleteModel(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteOrder(deleteId);
                  setDeleteId("");
                  setDeleteModel(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {!allUsers.length > 0 ? "Orders Management" : "All Users"}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage and track all orders
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              onClick={() => navigate("/all-users")}
            >
              <Users className="w-4 h-4" />
              User Orders
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              onClick={() => fetchOrders("", 1, {}, ordersPerPage)}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              onClick={() => setShowTemplates(true)}
            >
              <FileText className="w-4 h-4" />
              Templates
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {pendingOrders}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Delivered</p>
              <p className="text-xl font-bold text-green-600">
                {deliveredOrders}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Cancelled</p>
              <p className="text-xl font-bold text-red-600">
                {cancelledOrders}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {loading || emailLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm font-medium text-gray-600">
              Loading orders...
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Filters Section */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(mySearch);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
                <option value="Artwork Pending">Artwork Pending</option>
                <option value="ArtWork Approved">ArtWork Approved</option>
                <option value="Branding in progress">
                  Branding in progress
                </option>
                <option value="Production Complete">Production Complete</option>
                <option value="Shipped/In Transit">Shipped/In Transit</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
                <option value="On Hold">On Hold</option>
              </select>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Sort By */}
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="orderDate">Date</option>
                  <option value="userName">User Name</option>
                  <option value="orderId">Order ID</option>
                  <option value="status">Status</option>
                  <option value="total">Total</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={`Sort ${
                    sortOrder === "asc" ? "Descending" : "Ascending"
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Clear Filters */}
              {(searchTerm || filterStatus !== "All" || filterDate) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setMySearch("");
                    setFilterStatus("All");
                    setFilterDate("");
                    setSortBy("orderDate");
                    setSortOrder("desc");
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
            <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
              Showing <span className="font-semibold">{orders.length}</span> of{" "}
              <span className="font-semibold">
                {pagination?.totalOrders || 0}
              </span>{" "}
              orders
              {(searchTerm || filterStatus !== "All" || filterDate) && (
                <span className="ml-1 text-blue-600">(filtered)</span>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {order.orderId || order._id.slice(-8)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {`${order.user?.firstName || ""} ${
                              order.user?.lastName || ""
                            }`.trim() || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Artwork Pending">
                              Artwork Pending
                            </option>
                            <option value="ArtWork Approved">
                              ArtWork Approved
                            </option>
                            <option value="Branding in progress">
                              Branding in progress
                            </option>
                            <option value="Production Complete">
                              Production Complete
                            </option>
                            <option value="Shipped/In Transit">
                              Shipped/In Transit
                            </option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Returned">Returned</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            ${order.total?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) =>
                              handlePaymentStatusChange(
                                order._id,
                                e.target.value
                              )
                            }
                            className={`text-xs px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors ${
                              order.paymentStatus === "Received"
                                ? "border-green-200 bg-green-50"
                                : "border-yellow-200 bg-yellow-50"
                            }`}
                          >
                            <option value="Received">Received</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              onClick={() =>
                                navigate(`/order-details/${order._id}`)
                              }
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                setDeleteId(order._id);
                                setDeleteModel(true);
                              }}
                              disabled={deleteLoading[order._id]}
                            >
                              <Trash2 className="w-3 h-3" />
                              {deleteLoading[order._id] ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPrevPage}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>
                  Page{" "}
                  <span className="font-semibold">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">{pagination.totalPages}</span>
                </span>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="ordersPerPage"
                    className="text-xs text-gray-600"
                  >
                    Per page:
                  </label>
                  <select
                    id="ordersPerPage"
                    value={ordersPerPage}
                    onChange={(e) => {
                      setOrdersPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <EmailTemplatesManager
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />
    </div>
  );
};

export default Orders;
