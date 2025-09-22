import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AddCoupen = () => {
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!discountInput || Number(discountInput) < 1 || Number(discountInput) > 100) {
      toast.error('Please enter a valid discount percentage between 1 and 100');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupen: couponCode.trim().toUpperCase(),
          discount: parseFloat(discountInput)
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Coupon added successfully!');
        // Add new coupon to the list
        setCoupons(prev => [...prev, data.data]);
        setCouponCode('');
        setDiscountInput('');
      } else {
        toast.error(data.message || 'Failed to add coupon');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Error adding coupon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = async (couponId, couponCode) => {
    if (!window.confirm(`Are you sure you want to remove the coupon "${couponCode}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/delete/${couponId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Coupon removed successfully!');
        // Remove coupon from the list
        setCoupons(prev => prev.filter(coupon => coupon._id !== couponId));
      } else {
        toast.error(data.message || 'Failed to remove coupon');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Error removing coupon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCouponStatus = async (couponId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this coupon?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/toggle/${couponId}`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Coupon ${action}d successfully!`);
        // Update coupon status in the list
        setCoupons(prev => 
          prev.map(coupon => 
            coupon._id === couponId 
              ? { ...coupon, isActive: data.data.isActive }
              : coupon
          )
        );
      } else {
        toast.error(data.message || `Failed to ${action} coupon`);
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error(`Error ${action}ing coupon:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAllCoupons = async () => {
    if (!window.confirm('Are you sure you want to remove ALL coupons? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/delete`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'All coupons removed successfully!');
        setCoupons([]);
      } else {
        toast.error(data.message || 'Failed to remove coupons');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Error removing coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate active and inactive coupons
  const activeCoupons = coupons.filter(coupon => coupon.isActive !== false);
  const inactiveCoupons = coupons.filter(coupon => coupon.isActive === false);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Coupon Management</h2>
        
        {/* Loader for fetching coupons */}
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading coupons...</p>
          </div>
        )}
        
        {/* Active Coupons Section */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800">Active Coupons ({activeCoupons.length})</h3>
            {coupons.length > 0 && (
              <button
                onClick={handleRemoveAllCoupons}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
              >
                {isLoading ? 'Removing...' : 'Remove All'}
              </button>
            )}
          </div>
          
          {activeCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCoupons.map((coupon) => (
                <div key={coupon._id} className="bg-white border border-green-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-green-600 font-medium">
                        ✅ <span className="font-mono bg-green-100 px-2 py-1 rounded">{coupon.coupen}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Discount: {coupon.discount}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCouponStatus(coupon._id, coupon.isActive)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleRemoveCoupon(coupon._id, coupon.coupen)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600">No coupons are currently active.</p>
          )}
        </div>

        {/* Inactive Coupons Section */}
        {inactiveCoupons.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-800">Inactive Coupons ({inactiveCoupons.length})</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveCoupons.map((coupon) => (
                <div key={coupon._id} className="bg-white border border-red-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-red-600 font-medium">
                        ❌ <span className="font-mono bg-red-100 px-2 py-1 rounded">{coupon.coupen}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Discount: {coupon.discount}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCouponStatus(coupon._id, coupon.isActive)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleRemoveCoupon(coupon._id, coupon.coupen)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Coupon Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Coupon</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="e.g., SAVE20, WELCOME10"
                maxLength="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter discount %"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddCoupon}
            disabled={isLoading || !couponCode.trim() || !discountInput}
            className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Adding Coupon...' : 'Add Coupon'}
          </button>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 How it works:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You can add multiple coupons and manage their active status</li>
              <li>• Each coupon code must be unique</li>
              <li>• Only active coupons can be used by customers at checkout</li>
              <li>• You can activate/deactivate coupons without deleting them</li>
              <li>• Coupon codes are automatically converted to uppercase</li>
              <li>• Remove individual coupons or clear all coupons at once</li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Tips for effective coupon management:</h4>
          <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong>Coupon Status:</strong>
              <ul className="ml-4 mt-1">
                <li>• ✅ Active: Customers can use this coupon</li>
                <li>• ❌ Inactive: Coupon is disabled but saved</li>
                <li>• Use deactivate for temporary promotions</li>
                <li>• Use remove to permanently delete</li>
              </ul>
            </div>
            <div>
              <strong>Best practices:</strong>
              <ul className="ml-4 mt-1">
                <li>• Deactivate instead of delete for tracking</li>
                <li>• Keep codes short and memorable</li>
                <li>• Create seasonal campaigns with activate/deactivate</li>
                <li>• Monitor active vs inactive coupon performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoupen;