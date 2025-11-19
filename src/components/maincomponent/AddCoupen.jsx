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
} from "lucide-react";
import ActionButton from "../ui/ActionButton";

const AddCoupen = () => {
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchAllCoupons();
  }, []);

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

  const handleAddCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (
      !discountInput ||
      Number(discountInput) < 1 ||
      Number(discountInput) > 100
    ) {
      toast.error("Please enter a valid discount percentage between 1 and 100");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupen: couponCode.trim().toUpperCase(),
          discount: parseFloat(discountInput),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Coupon added successfully!");
        // Add new coupon to the list
        setCoupons((prev) => [...prev, data.data]);
        setCouponCode("");
        setDiscountInput("");
      } else {
        toast.error(data.message || "Failed to add coupon");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Error adding coupon:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Manager</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Create, track, and control all discount codes
            </p>
          </div>
          <ActionButton
            icon={RefreshCw}
            label={loading ? "Refreshing..." : "Refresh"}
            onClick={fetchAllCoupons}
            disabled={loading}
            loading={loading}
            variant="outline"
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

      <div className="space-y-4">
        {/* Active Coupons Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-teal-600" />
                Active Coupons
              </h2>
              <p className="text-xs text-gray-500">
                {activeCoupons.length > 0
                  ? "Currently available for customers"
                  : "No coupons are active right now"}
              </p>
            </div>
            {coupons.length > 0 && (
              <ActionButton
                icon={Trash2}
                label={isLoading ? "Removing..." : "Remove All"}
                onClick={handleRemoveAllCoupons}
                disabled={isLoading}
                loading={isLoading}
                variant="danger"
                size="sm"
              />
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          ) : activeCoupons?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeCoupons?.map((coupon) => (
                <div
                  key={coupon._id}
                  className="group border border-gray-200 rounded-lg p-2 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        Coupon Code
                      </span>
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {coupon.coupen}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">Discount</span>
                      <p className="text-2xl font-bold text-teal-600">
                        {coupon.discount}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      icon={Power}
                      label="Deactivate"
                      onClick={() =>
                        handleToggleCouponStatus(coupon._id, coupon.isActive)
                      }
                      disabled={isLoading}
                      variant="warning"
                      size="sm"
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Remove"
                      onClick={() =>
                        handleRemoveCoupon(coupon._id, coupon.coupen)
                      }
                      disabled={isLoading}
                      variant="danger"
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-gray-500">
              No active coupons available.
            </div>
          )}
        </div>

        {/* Inactive Coupons Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-500" />
            Inactive Coupons
            <span className="text-xs font-medium text-gray-500">
              ({inactiveCoupons.length})
            </span>
          </h2>
          {inactiveCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {inactiveCoupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="border border-gray-200 rounded-lg p-2 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        Coupon Code
                      </span>
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {coupon.coupen}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                      Inactive
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">Discount</span>
                      <p className="text-2xl font-bold text-gray-600">
                        {coupon.discount}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      icon={Power}
                      label="Activate"
                      onClick={() =>
                        handleToggleCouponStatus(coupon._id, coupon.isActive)
                      }
                      disabled={isLoading}
                      variant="success"
                      size="sm"
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Remove"
                      onClick={() =>
                        handleRemoveCoupon(coupon._id, coupon.coupen)
                      }
                      disabled={isLoading}
                      variant="danger"
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-500">
              No inactive coupons.
            </div>
          )}
        </div>

        {/* Add Coupon Form */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-teal-600" />
                Create Coupon
              </h2>
              <p className="text-xs text-gray-500">
                Set up a new coupon code with discount percentage
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Coupon Code
              </label>
              <div className="relative">
                <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  placeholder="e.g., WELCOME10"
                  maxLength="20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Discount Percentage (1-100)
              </label>
              <div className="relative">
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Discount %"
                />
              </div>
            </div>
          </div>
          <ActionButton
            icon={Plus}
            label={isLoading ? "Adding..." : "Add Coupon"}
            onClick={handleAddCoupon}
            disabled={isLoading || !couponCode.trim() || !discountInput}
            loading={isLoading}
            variant="primary"
            size="md"
            className="w-full md:w-auto"
          />
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Tips for effective coupon management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
              <p className="font-semibold text-teal-800 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Status Workflow
              </p>
              <ul className="space-y-1">
                <li>• Use deactivate for temporary pauses</li>
                <li>• Remove codes only when no longer needed</li>
                <li>• Keep codes short, unique, and memorable</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4" />
                Best Practices
              </p>
              <ul className="space-y-1">
                <li>• Track performance of active vs inactive codes</li>
                <li>• Schedule seasonal campaigns in advance</li>
                <li>• Convert codes to uppercase for consistency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoupen;
