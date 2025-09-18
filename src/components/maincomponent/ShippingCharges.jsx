import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { addShippingCharges, getShippingCharges, removeShippingCharges } from '../apis/UserApi';
import { useNavigate } from 'react-router-dom';

const ShippingCharges = () => {
  const [shippingCharges, setShippingCharges] = useState(null);
  const [shippingInput, setShippingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShippingCharges();
  }, []);
  const [loading, setLoading] = useState(false);
  const fetchShippingCharges = async () => {
    setLoading(true);
    try {
      const response = await getShippingCharges();
      if (response.data && response.data.shipping !== undefined) {
        setShippingCharges(response.data);
        setLoading(false);
      } else {
        setShippingCharges(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching shipping charges:', error);
      // If 404, it means no shipping charges exist
      setLoading(false);
      if (error.status === 404) {
        setShippingCharges(null);
      }
    }
  };

  const handleAddShippingCharges = async () => {
    if (!shippingInput || shippingInput < 0) {
      toast.error('Please enter a valid shipping charge (must be 0 or greater)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await addShippingCharges(parseFloat(shippingInput));
      toast.success(response.message);
      setShippingCharges({
        shipping: parseFloat(shippingInput)
      });
      setShippingInput('');
      
    } catch (error) {
      toast.error(error.message || 'Failed to add shipping charges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShippingCharges = async () => {
    if (!window.confirm('Are you sure you want to remove the shipping charges?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await removeShippingCharges();
      toast.success(response.message);
      setShippingCharges(null);
      
    } catch (error) {
      toast.error(error.message || 'Failed to remove shipping charges');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Shipping Charges Management</h2>
        {/*loader for shipping charger */}
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading...</p>
          </div>
        )}
        
        {/* Current Shipping Charges Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          {shippingCharges ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">
                  ✅ Shipping charges are set: ${shippingCharges.shipping}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This shipping charge will be applied to all orders.
                </p>
              </div>
              <button
                onClick={handleRemoveShippingCharges}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove Shipping Charges'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No shipping charges are currently set.</p>
          )}
        </div>

        {/* Add Shipping Charges Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Shipping Charges</h3>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Charge Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingInput}
                onChange={(e) => setShippingInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter shipping charge amount"
              />
            </div>
            
            <button
              onClick={handleAddShippingCharges}
              disabled={isLoading || !shippingInput}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Shipping Charges'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Information:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Only one shipping charge can be active at a time</li>
              <li>• Adding new shipping charges will replace the existing ones</li>
              <li>• The shipping charge will be applied to all orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingCharges;