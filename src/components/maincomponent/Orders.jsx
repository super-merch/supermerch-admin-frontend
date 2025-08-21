import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { Search } from "lucide-react";
import { toast } from "react-toastify";

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
  const ordersPerPage = 15;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");

  const [allUsers, setAllUsers] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleStatusChange = async (orderId, newStatus) => {
    if(newStatus == "Delivered"){
      try {
        setEmailLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkout/send-email`,{
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: orderId }),
          }
        )
        if(response.ok){
          setEmailLoading(false);
          toast.success(response.message||"Email sent successfully");
        }else{
          setEmailLoading(false);
          toast.error(response.message||"Failed to send email");
        }
      } catch (error) {
        setEmailLoading(false);
        toast.error(error.message||"Failed to send email");
      }
    }
    await updateOrderStatus(orderId, newStatus);
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/checkout/update-payment`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus, id: orderId }),
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to update payment status.");
    }
    
    // Option 1: Refetch orders (current approach)
    fetchOrders("", currentPage, {
      searchTerm,
      filterStatus,
      filterDate,
      sortBy,
      sortOrder,
    });
    
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
    fetchOrders("", currentPage, filters);
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

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className=" text-2xl mb-1 font-bold text-start">
          {!allUsers.length > 0 ? "All Orders" : "All Users"}
        </h1>
        <div className="flex justify-start gap-7">
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white mb-3 py-2 px-4 rounded"
            onClick={() => navigate("/all-users")}
          >
            {"See User's Orders"}
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white mb-3 py-2 px-4 rounded"
            onClick={() => fetchOrders()}
          >
            {"Refresh Orders"}
          </button>
        </div>
      </div>

      {loading || emailLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading orders...</p>
        </div>
      ) : (
        <div>
          {/* Search and Filter Controls */}
          <div className=" p-3 bg-gray-100 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, order ID, or date..."
                    value={mySearch}
                    onChange={(e) => setMySearch(e.target.value)}
                    className="w-full pl-2 pr-10 py-2 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <Search
                    onClick={() => setSearchTerm(mySearch)}
                    className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-800 w-5 h-5"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    title={`Sort ${
                      sortOrder === "asc" ? "Descending" : "Ascending"
                    }`}
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
                  setMySearch("");
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
          <div className="mb-1 text-sm text-gray-600">
            Showing {orders.length} of {pagination?.totalOrders || 0} orders
            from page: {currentPage}
            {(searchTerm || filterStatus !== "All" || filterDate) && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-collapse border-gray-200 table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 border border-gray-300">Order ID</th>
                  <th className="px-2 py-1 border border-gray-300">
                    Customer Name
                  </th>
                  <th className="px-2 py-1 border border-gray-300">
                    Order Date
                  </th>
                  <th className="px-2 py-1 border border-gray-300">Status</th>
                  <th className="px-2 py-1 border border-gray-300">Total</th>
                  <th className="px-2 py-1 border border-gray-300">
                    Payment
                  </th>
                  <th className="px-2 py-1 border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-2 py-1 text-center border border-gray-300">
                      {order.orderId||order._id}
                    </td>
                    <td className="px-2 py-1 text-center border border-gray-300">
                      {`${order.user?.firstName || ""} ${
                        order.user?.lastName || ""
                      }`.trim() || "N/A"}
                    </td>
                    <td className="px-2 py-1 text-center border border-gray-300">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2 text-center border border-gray-300">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="px-1 py-1 border border-gray-600 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-2 py-1 text-center border border-gray-300">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-2 text-center border border-gray-300">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusChange(order._id, e.target.value)
                        }
                        className="px-1 py-1 border border-gray-600 outline-none"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 flex justify-center gap-5 text-center border border-gray-300">
                      <button
                        className="px-2 py-2 text-sm text-center text-white bg-blue-700 hover:bg-blue-800 rounded"
                        onClick={() => navigate(`/order-details/${order._id}`)}
                      >
                        View More
                      </button>
                      {/* delete button */}
                      <button
                        className="px-2 py-2 text-sm text-center text-white bg-red-700 hover:bg-red-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteOrder(order._id)}
                        disabled={deleteLoading[order._id]} // Check loading for specific order
                      >
                        {deleteLoading[order._id] ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <div className="flex space-x-1">
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
                        className={`px-3 py-2 border border-gray-300 rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-700 text-white"
                            : "hover:bg-gray-50"
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
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>

              <span className="ml-4 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
