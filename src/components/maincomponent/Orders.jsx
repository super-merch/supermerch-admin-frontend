import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";

const Orders = () => {
  const { orders, fetchOrders, fetchUsers, users, loading, updateOrderStatus } = useContext(AdminContext);
  const [byUsers, setByUsers] = useState(false);
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");
  
  console.log(orders);
  const [allUsers, setAllUsers] = useState([]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchUsersOrders = async () => {
    setByUsers(true);
    fetchUsers();
    setAllUsers(users);
  };

  const fetchAllOrders = () => {
    setByUsers(false);
    setAllUsers([]);
    // Reset pagination and filters when switching views
    setCurrentPage(1);
    setSearchTerm("");
    setFilterStatus("All");
    setFilterDate("");
  };

  // Filter and search logic
  const filteredOrders = orders.filter((order) => {
    const userName = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.toLowerCase();
    const orderId = order._id.toLowerCase();
    const orderDate = new Date(order.orderDate).toLocaleDateString().toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = 
      userName.includes(searchLower) ||
      orderId.includes(searchLower) ||
      orderDate.includes(searchLower);

    const matchesStatus = filterStatus === "All" || order.status === filterStatus;

    const matchesDate = !filterDate || 
      new Date(order.orderDate).toLocaleDateString() === new Date(filterDate).toLocaleDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "userName":
        aValue = `${a.user?.firstName || ""} ${a.user?.lastName || ""}`.toLowerCase();
        bValue = `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase();
        break;
      case "orderId":
        aValue = a._id.toLowerCase();
        bValue = b._id.toLowerCase();
        break;
      case "orderDate":
        aValue = new Date(a.orderDate);
        bValue = new Date(b.orderDate);
        break;
      case "status":
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case "total":
        aValue = a.total;
        bValue = b.total;
        break;
      default:
        aValue = new Date(a.orderDate);
        bValue = new Date(b.orderDate);
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination logic
  const totalOrders = sortedOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = sortedOrders.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, sortBy, sortOrder]);

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-center">
        {!allUsers.length > 0 ? "All Orders" : "All Users"}
      </h1>
      
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white mb-3 py-2 px-4 rounded"
        onClick={()=>navigate('/all-users')}
      >
        {"See User's Orders"}
      </button>

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading orders...</p>
        </div>
      ) : (
        <div>
          {/* Search and Filter Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name, order ID, or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="orderDate">Date</option>
                    <option value="userName">User Name</option>
                    <option value="orderId">Order ID</option>
                    <option value="status">Status</option>
                    <option value="total">Total</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("All");
                  setFilterDate("");
                  setSortBy("orderDate");
                  setSortOrder("desc");
                }}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {currentOrders.length} of {totalOrders} orders
            {(searchTerm || filterStatus !== "All" || filterDate) && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-collapse border-gray-200 table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 border border-gray-300">Order ID</th>
                  <th className="px-4 py-2 border border-gray-300">Customer Name</th>
                  <th className="px-4 py-2 border border-gray-300">Order Date</th>
                  <th className="px-4 py-2 border border-gray-300">Status</th>
                  <th className="px-4 py-2 border border-gray-300">Total Payment</th>
                  <th className="px-4 py-2 border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-2 text-center border border-gray-300">
                      {order._id}
                    </td>
                    <td className="px-4 py-2 text-center border border-gray-300">
                      {`${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-center border border-gray-300">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center border border-gray-300">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="px-1 py-1 border border-gray-600 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Complete">Complete</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center border border-gray-300">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center border border-gray-300">
                      <button
                        className="px-4 py-2 text-center text-white bg-blue-500 rounded"
                        onClick={() => navigate(`/order-details/${order._id}`)}
                      >
                        View More
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 border border-gray-300 rounded-md ${
                        currentPage === pageNum
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>

              <span className="ml-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;