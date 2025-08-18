import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AddCoupen = () => {
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCurrentCoupon();
  }, []);
  const [loading, setLoading] = useState(false);
  const fetchCurrentCoupon = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/coupen/get`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setCurrentCoupon(data[0]);
        setLoading(false);

      } else {
        setCurrentCoupon(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching current coupon:', error);
      setCurrentCoupon(null);
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
        setCurrentCoupon({
          coupen: couponCode.trim().toUpperCase(),
          discount: parseFloat(discountInput)
        });
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

  const handleRemoveCoupon = async () => {
    if (!window.confirm('Are you sure you want to remove the current coupon?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/coupen/delete`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Coupon removed successfully!');
        setCurrentCoupon(null);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Coupon Management</h2>
        {/*Loader for fetching coupon*/ }
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading coupon...</p>
          </div>
        )}
        
        {/* Current Coupon Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          {currentCoupon ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">
                  ✅ Active Coupon: <span className="font-mono bg-green-100 px-2 py-1 rounded">{currentCoupon.coupen}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Discount: {currentCoupon.discount}% - Customers can use this code at checkout.
                </p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Removing...' : 'Remove Coupon'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No coupon is currently active.</p>
          )}
        </div>

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
              <li>• Only one coupon can be active at a time</li>
              <li>• Adding a new coupon will replace the current one</li>
              <li>• Customers enter the coupon code at checkout to get the discount</li>
              <li>• Coupon codes are automatically converted to uppercase</li>
              <li>• Make sure to use memorable and unique coupon codes</li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Tips for effective coupon codes:</h4>
          <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong>Good examples:</strong>
              <ul className="ml-4 mt-1">
                <li>• SAVE20 (clear purpose)</li>
                <li>• WELCOME10 (for new customers)</li>
                <li>• FLASH30 (for flash sales)</li>
              </ul>
            </div>
            <div>
              <strong>Best practices:</strong>
              <ul className="ml-4 mt-1">
                <li>• Keep codes short and memorable</li>
                <li>• Use numbers to indicate discount</li>
                <li>• Avoid confusing characters (0, O)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoupen;