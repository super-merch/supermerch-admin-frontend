import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Tag,
  Percent,
  RefreshCw,
  Gift,
  Trash2,
  Power,
  CheckCircle2,
  Ban,
  Plus,
  Edit,
  X,
  DollarSign,
  Calendar,
  Users,
  Search,
} from "lucide-react";
import ActionButton from "../ui/ActionButton";

const AddCoupen = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mySearch, setMySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // Form state
  const [formData, setFormData] = useState({
    coupen: "",
    discount: "",
    maxLimitAmount: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
    isActive: true,
  });

  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchAllCoupons();
  }, []);

  // Reset form when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      setEditingCoupon(null);
      setFormData({
        coupen: "",
        discount: "",
        maxLimitAmount: "",
        startDate: "",
        endDate: "",
        maxUsage: "",
        isActive: true,
      });
    }
  }, [drawerOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        coupen: editingCoupon.coupen || "",
        discount: editingCoupon.discount || "",
        maxLimitAmount: editingCoupon.maxLimitAmount || "",
        startDate: editingCoupon.startDate
          ? new Date(editingCoupon.startDate).toISOString().split("T")[0]
          : "",
        endDate: editingCoupon.endDate
          ? new Date(editingCoupon.endDate).toISOString().split("T")[0]
          : "",
        maxUsage: editingCoupon.maxUsage || "",
        isActive: editingCoupon.isActive !== false,
      });
    }
  }, [editingCoupon]);

  const fetchAllCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/coupen/get`);
      const data = await response.json();

      if (data && Array.isArray(data)) {
        setCoupons(data);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (coupon = null) => {
    setEditingCoupon(coupon);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingCoupon(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.coupen.trim()) {
      toast.error("Please enter a coupon code");
      return false;
    }

    if (
      !formData.discount ||
      Number(formData.discount) < 1 ||
      Number(formData.discount) > 100
    ) {
      toast.error("Please enter a valid discount percentage between 1 and 100");
      return false;
    }

    if (formData.maxLimitAmount && Number(formData.maxLimitAmount) < 0) {
      toast.error("Maximum limit amount must be a positive number");
      return false;
    }

    if (
      formData.maxUsage &&
      (Number(formData.maxUsage) < 1 ||
        !Number.isInteger(Number(formData.maxUsage)))
    ) {
      toast.error("Maximum usage must be a positive integer");
      return false;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        toast.error("End date must be after start date");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        coupen: formData.coupen.trim().toUpperCase(),
        discount: parseFloat(formData.discount),
        maxLimitAmount: formData.maxLimitAmount
          ? parseFloat(formData.maxLimitAmount)
          : undefined,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        isActive: formData.isActive,
      };

      // Remove undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      const url = editingCoupon
        ? `${API_BASE}/api/coupen/update/${editingCoupon._id}`
        : `${API_BASE}/api/coupen/add`;
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          data.message ||
            (editingCoupon
              ? "Coupon updated successfully!"
              : "Coupon added successfully!")
        );
        await fetchAllCoupons();
        handleCloseDrawer();
      } else {
        toast.error(
          data.message ||
            (editingCoupon ? "Failed to update coupon" : "Failed to add coupon")
        );
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Error saving coupon:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = async (couponId, couponCode) => {
    if (
      !window.confirm(
        `Are you sure you want to remove the coupon "${couponCode}"?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/coupen/delete/${couponId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Coupon removed successfully!");
        // Remove coupon from the list
        setCoupons((prev) => prev.filter((coupon) => coupon._id !== couponId));
      } else {
        toast.error(data.message || "Failed to remove coupon");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Error removing coupon:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCouponStatus = async (couponId, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this coupon?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/coupen/toggle/${couponId}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Coupon ${action}d successfully!`);
        // Update coupon status in the list
        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon._id === couponId
              ? { ...coupon, isActive: data.data.isActive }
              : coupon
          )
        );
      } else {
        toast.error(data.message || `Failed to ${action} coupon`);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error(`Error ${action}ing coupon:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAllCoupons = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove ALL coupons? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "All coupons removed successfully!");
        setCoupons([]);
      } else {
        toast.error(data.message || "Failed to remove coupons");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Error removing coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate active and inactive coupons
  const activeCoupons = coupons.filter((coupon) => coupon.isActive !== false);
  const inactiveCoupons = coupons.filter((coupon) => coupon.isActive === false);
  const totalCoupons = coupons.length;

  // Filter coupons based on search and status
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      !searchTerm ||
      coupon.coupen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.discount?.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && coupon.isActive !== false) ||
      (statusFilter === "inactive" && coupon.isActive === false);

    return matchesSearch && matchesStatus;
  });

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <ActionButton
            icon={Plus}
            label="Add Coupon"
            onClick={() => handleOpenDrawer()}
            variant="primary"
            size="sm"
          />
          <ActionButton
            icon={RefreshCw}
            onClick={fetchAllCoupons}
            disabled={loading}
            loading={loading}
            variant="outline"
            size="sm"
            ariaLabel="Refresh coupons"
            className="!px-2 !py-1"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Coupons</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalCoupons}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {activeCoupons.length}
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
                <p className="text-xs text-gray-500 mb-1">Inactive</p>
                <p className="text-xl font-bold text-orange-600">
                  {inactiveCoupons.length}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Ban className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by coupon code or discount..."
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(mySearch);
                }
              }}
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "inactive"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive
            </button>
          </div>

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
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
          Showing{" "}
          <span className="font-semibold">{filteredCoupons.length}</span> of{" "}
          <span className="font-semibold">{totalCoupons}</span> coupons
          {searchTerm && <span className="ml-1 text-blue-600">(filtered)</span>}
        </div>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">
              Loading coupons...
            </p>
          </div>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <Tag className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "No coupons found matching your filters."
                : "No coupons found. Create your first coupon!"}
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
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                    Coupon Code
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Discount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Max Limit
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Start Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    End Date
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Max Usage
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCoupons.map((coupon, index) => (
                  <tr
                    key={coupon._id}
                    className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100"
                  >
                    {/* Serial Number */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </td>

                    {/* Coupon Code */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Tag className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-mono font-bold text-gray-900">
                          {coupon.coupen || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-teal-600">
                        {coupon.discount || 0}%
                      </span>
                    </td>

                    {/* Max Limit Amount */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {coupon.maxLimitAmount ? (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {parseFloat(coupon.maxLimitAmount).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {coupon.startDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(coupon.startDate)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* End Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {coupon.endDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(coupon.endDate)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Max Usage */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      {coupon.maxUsage ? (
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{coupon.maxUsage}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                          coupon.isActive !== false
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {coupon.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton
                          icon={Edit}
                          onClick={() => handleOpenDrawer(coupon)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        />
                        <ActionButton
                          icon={Power}
                          onClick={() =>
                            handleToggleCouponStatus(
                              coupon._id,
                              coupon.isActive
                            )
                          }
                          disabled={isLoading}
                          variant={
                            coupon.isActive !== false ? "warning" : "success"
                          }
                          size="sm"
                        />
                        <ActionButton
                          icon={Trash2}
                          onClick={() =>
                            handleRemoveCoupon(coupon._id, coupon.coupen)
                          }
                          disabled={isLoading}
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

      {/* Side Drawer for Add/Edit Coupon */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={handleCloseDrawer}
          />
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingCoupon
                      ? "Update coupon details"
                      : "Set up a new discount code"}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="coupen"
                      value={formData.coupen}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                      placeholder="e.g., WELCOME10"
                      maxLength="20"
                    />
                  </div>
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      step="1"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="1-100"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a percentage between 1 and 100
                  </p>
                </div>

                {/* Max Limit Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Discount Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="maxLimitAmount"
                      value={formData.maxLimitAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., 50.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum discount amount (optional)
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    When the coupon becomes active (optional)
                  </p>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || ""}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    When the coupon expires (optional)
                  </p>
                </div>

                {/* Max Usage */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Usage
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="maxUsage"
                      value={formData.maxUsage}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum number of times the coupon can be used (optional)
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
                  >
                    <Power className="w-4 h-4 text-gray-400" />
                    Active (coupon will be immediately available)
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseDrawer}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <ActionButton
                  icon={editingCoupon ? Edit : Plus}
                  label={
                    isLoading
                      ? editingCoupon
                        ? "Updating..."
                        : "Creating..."
                      : editingCoupon
                      ? "Update Coupon"
                      : "Create Coupon"
                  }
                  onClick={handleSubmit}
                  disabled={
                    isLoading || !formData.coupen.trim() || !formData.discount
                  }
                  loading={isLoading}
                  variant="primary"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddCoupen;
