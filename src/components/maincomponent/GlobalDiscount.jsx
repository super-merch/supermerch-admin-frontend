import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { addGlobalDiscount } from '../apis/UserApi';
import { getGlobalDiscount, removeGlobalDiscount } from '../apis/UserApi';
import { useNavigate } from 'react-router-dom';

const GlobalDiscount = () => {
  const [globalDiscount, setGlobalDiscount] = useState(null);
  const [discountInput, setDiscountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    fetchGlobalDiscount();
  }, []);

  const fetchGlobalDiscount = async () => {
    try {
      const response = await getGlobalDiscount();
      if (response.data && response.data.isActive) {
        setGlobalDiscount(response.data);
      } else {
        setGlobalDiscount(null);
      }
    } catch (error) {
      console.error('Error fetching global discount:', error);
    }
  };

  const handleAddGlobalDiscount = async () => {
    if (!discountInput || Number(discountInput) < 1 || Number(discountInput) > 100) {
      toast.error('Please enter a valid discount percentage between 1 and 100');
      return;
    }

    setIsLoading(true);
    try {
      const response = await addGlobalDiscount(parseFloat(discountInput));
      // const resp = await fetch(
      //   `${import.meta.env.VITE_BACKEND_URL}/myapi2`
      // )
      toast.success(response.message);
      setGlobalDiscount({
        discount: parseFloat(discountInput),
        isActive: true
      });
      setDiscountInput('');
      
    } catch (error) {
      toast.error(error.message || 'Failed to add global discount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveGlobalDiscount = async () => {
    if (!window.confirm('Are you sure you want to remove the global discount?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await removeGlobalDiscount();
      // const resp = await fetch(
      //   `${import.meta.env.VITE_BACKEND_URL}/myapi2`
      // )
      toast.success(response.message);
      setGlobalDiscount(null);
      
    } catch (error) {
      toast.error(error.message || 'Failed to remove global discount');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Global Discount Management</h2>
        
        {/* Current Global Discount Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          {globalDiscount ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">
                  ✅ Global discount is active: {globalDiscount.discount}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This discount is applied to all products and overrides individual product discounts.
                </p>
              </div>
              <button
                onClick={handleRemoveGlobalDiscount}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove Global Discount'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No global discount is currently active.</p>
          )}
        </div>

        {/* Add Global Discount Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Global Discount</h3>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter discount percentage"
              />
            </div>
            
            <button
              onClick={handleAddGlobalDiscount}
              disabled={isLoading || !discountInput}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Global Discount'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Adding a global discount will remove ALL existing individual product discounts</li>
              <li>• The global discount will be applied to all products in your store</li>
              <li>• Individual product discounts cannot be added while global discount is active</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalDiscount;