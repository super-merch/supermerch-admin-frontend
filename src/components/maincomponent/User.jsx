import React, { useState, useEffect } from "react";
import { editUser, deleteUser } from "../apis/UserApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import {
  Users,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Eye,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User as UserIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../ui/ActionButton";
import UserOrdersPerUserChart from "./charts/UserOrdersPerUserChart";
import UserAvgTransactionChart from "./charts/UserAvgTransactionChart";
import UserOrderRecencyChart from "./charts/UserOrderRecencyChart";

const User = () => {
  const {
    users,
    setUsers,
    loading,
    fetchUsers,
    usersPagination, // Add this to AdminContext
  } = useContext(AdminContext);

  // Existing states
  const [editingUser, setEditingUser] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});

  // Updated pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [mySearch, setMySearch] = useState("");
  const initialAdvancedFilters = {
    orderMonth: "",
    orderYear: "",
    orderAmountMin: "",
    orderAmountMax: "",
    orderCountMin: "",
    orderCountMax: "",
  };
  const [advancedFilters, setAdvancedFilters] = useState(
    initialAdvancedFilters
  );
  const [appliedFilters, setAppliedFilters] = useState(initialAdvancedFilters);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Updated useEffect for pagination and search
  useEffect(() => {
    const filters = {
      searchTerm,
      ...Object.fromEntries(
        Object.entries(appliedFilters).filter(([, value]) => value !== "")
      ),
    };
    fetchUsers(currentPage, filters);
  }, [currentPage, searchTerm, appliedFilters]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, appliedFilters]);

  const navigate = useNavigate();

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setUpdatedName(user.name || "");
    setUpdatedEmail(user.email || "");
    setEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!updatedName || !updatedEmail) {
        toast.error("Name and email cannot be empty");
        return;
      }

      if (updatedName.length > 20) {
        return toast.error("Name should be less than 20 characters");
      }

      setUpdateLoading(true);
      const updatedData = { name: updatedName, email: updatedEmail };
      await editUser(editingUser, updatedData);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === editingUser
            ? { ...user, name: updatedName, email: updatedEmail }
            : user
        )
      );

      toast.success("User updated successfully!");
      setEditingUser(null);
      setEditModal(false);
      // Refresh current page
      fetchUsers(currentPage, { searchTerm });
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      console.error(error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    navigate(`/user-orders/${user._id}`);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    const { id: userId } = deleteModal;
    setDeleteLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user._id !== userId));
      toast.success("User deleted successfully!");
      setDeleteModal(null);
      // Refresh current page
      fetchUsers(currentPage, { searchTerm });
    } catch (error) {
      toast.error("Error deleting user");
      console.error(error);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Updated pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (usersPagination && currentPage < usersPagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getUserStatus = (user) => {
    if (user) {
      return user.orderStats?.totalOrders > 0 ? "active" : "inactive";
    }

    return null;
  };

  const totalUsers = usersPagination?.totalUsers ?? users.length ?? 0;
  const handleAdvancedFilterChange = (name, value) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyAdvancedFilters = () => {
    setAppliedFilters(advancedFilters);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters(initialAdvancedFilters);
    setAppliedFilters(initialAdvancedFilters);
  };

  const monthOptions = [
    { label: "All", value: "" },
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const activeUsers =
    usersPagination?.activeUsers ??
    users.filter((user) => getUserStatus(user) === "active").length;
  const inactiveUsers =
    usersPagination?.inactiveUsers ??
    users.filter((user) => getUserStatus(user) === "inactive").length;

  const getLastOrderDate = (order) => {
    if (order?.orders?.length === 0) return "-";
    const sortedOrders = order?.orders?.sort(
      (a, b) => new Date(a?.orderDate) - new Date(b?.orderDate)
    );
    return new Date(sortedOrders[0]?.orderDate).toLocaleDateString();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading users...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="bg-gray-200 p-2 rounded-lg mb-3">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-3 items-start">
          <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-900">
                Last order recency
              </p>
              <span className="text-[11px] text-gray-500">
                Users by last purchase
              </span>
            </div>

            <UserOrderRecencyChart height={300} />
          </div>
          <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-900">
                Avg transaction value
              </p>
            </div>

            <UserAvgTransactionChart height={300} />
          </div>
          <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-900">
                Orders per customer
              </p>
            </div>

            <UserOrdersPerUserChart height={300} />
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <div className="w-full flex items-end gap-2">
            <div className="col-span-1">
              <div className="flex flex-col">
                {/* Search */}
                <label className="block text-xs text-gray-600 mb-1">
                  Search
                </label>

                <input
                  type="text"
                  placeholder="Search by name, email, or phone number..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(mySearch);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {mySearch && (
                  <button
                    onClick={() => {
                      setMySearch("");
                      setSearchTerm("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Clear Search */}
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setMySearch("");
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col flex-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Order Month
                </label>
                <select
                  value={advancedFilters.orderMonth}
                  onChange={(e) =>
                    handleAdvancedFilterChange("orderMonth", e.target.value)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-w-[120px]">
              <label className="block text-xs text-gray-600 mb-1">
                Order Year
              </label>
              <input
                type="number"
                min="2000"
                max="9999"
                value={advancedFilters.orderYear}
                onChange={(e) =>
                  handleAdvancedFilterChange("orderYear", e.target.value)
                }
                placeholder="e.g., 2024"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Order Count (Min)
              </label>
              <input
                type="number"
                min="0"
                value={advancedFilters.orderCountMin}
                onChange={(e) =>
                  handleAdvancedFilterChange("orderCountMin", e.target.value)
                }
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Order Count (Max)
              </label>
              <input
                type="number"
                min="0"
                value={advancedFilters.orderCountMax}
                onChange={(e) =>
                  handleAdvancedFilterChange("orderCountMax", e.target.value)
                }
                placeholder="100"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Order Amount (Min)
              </label>
              <input
                type="number"
                min="0"
                value={advancedFilters.orderAmountMin}
                onChange={(e) =>
                  handleAdvancedFilterChange("orderAmountMin", e.target.value)
                }
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Order Amount (Max)
              </label>
              <input
                type="number"
                min="0"
                value={advancedFilters.orderAmountMax}
                onChange={(e) =>
                  handleAdvancedFilterChange("orderAmountMax", e.target.value)
                }
                placeholder="10000"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex  gap-2">
              <ActionButton
                label="Apply Filters"
                onClick={applyAdvancedFilters}
                variant="primary"
                size="sm"
              />
              <ActionButton
                label="Reset"
                onClick={clearAdvancedFilters}
                variant="outline"
                size="sm"
              />
              <ActionButton
                icon={RefreshCw}
                onClick={() => fetchUsers(currentPage, { searchTerm })}
                variant="outline"
                size="sm"
                ariaLabel="Refresh users"
                className="!px-2 !py-1"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <Users className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {searchTerm
                ? "No users found matching your search."
                : "No users found."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ">
                    User
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Location
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Orders
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Pending Orders
                  </th>{" "}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Completed Orders
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Last Order
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Joined
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user, index) => (
                  <tr
                    key={user._id}
                    className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100"
                  >
                    {/* Serial Number */}
                    <td className="px-3 py-3 whitespace-nowrap text-center ">
                      <span className="text-sm font-medium text-gray-600">
                        {(currentPage - 1) * 15 + index + 1}
                      </span>
                    </td>

                    {/* User Name */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div
                        className="flex items-center gap-2 hover:cursor-pointer"
                        onClick={() => handleViewDetails(user)}
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 hover:underline">
                          {user.name || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Contact (Email & Phone) */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[180px]">
                            {user.email || "N/A"}
                          </span>
                        </div>
                        {user?.defaultShippingAddress?.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{user.defaultShippingAddress.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location (City) */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {user?.defaultShippingAddress?.city ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.defaultShippingAddress.city}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-">
                        {user?.orderStats?.totalOrders || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-yellow-600">
                        {user?.orderStats?.totalPending || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-green-600">
                        {user?.orderStats?.totalCompleted || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-">
                        {getLastOrderDate(user)}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton
                          icon={Edit}
                          onClick={() => handleEdit(user)}
                          variant="outline"
                          size="sm"
                        />
                        <ActionButton
                          icon={Trash2}
                          onClick={() =>
                            setDeleteModal({
                              id: user._id,
                              name: user.name || "Unknown",
                            })
                          }
                          disabled={deleteLoading[user._id]}
                          loading={deleteLoading[user._id]}
                          variant="danger"
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pagination */}
      {usersPagination && usersPagination.totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={!usersPagination.hasPrevPage}
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(5, usersPagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (usersPagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= usersPagination.totalPages - 2) {
                    pageNum = usersPagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-teal-600 text-white"
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
              disabled={!usersPagination.hasNextPage}
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">
                {usersPagination.totalPages}
              </span>
            </span>
          </div>
        </div>
      )}{" "}
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter username"
                  maxLength={20}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 20 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setEditModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label="Save Changes"
                onClick={handleUpdate}
                disabled={updateLoading || !updatedName || !updatedEmail}
                loading={updateLoading}
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full mx-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-5">
              Are you sure you want to delete the user "{deleteModal.name}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label="Delete"
                onClick={handleDelete}
                disabled={deleteLoading[deleteModal.id]}
                loading={deleteLoading[deleteModal.id]}
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
