import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { addGstCharges, getShippingCharges, removeGstCharges } from '../apis/UserApi';
import { useNavigate } from 'react-router-dom';

const GstCharges = () => {
  const [gstCharges, setGstCharges] = useState(null);
  const [gstInput, setGstInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGstCharges();
  }, []);
  const [loading, setLoading] = useState(false);
  const fetchGstCharges = async () => {
    setLoading(true);
    try {
      const response = await getShippingCharges();
      if (response.data && response.data.gst !== undefined) {
        setGstCharges(response.data);
        setLoading(false);
      } else {
        setGstCharges(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching Gst charges:', error);
      setLoading(false);
      if (error.status === 404) {
        setGstCharges(null);
      }
    }
  };

  const handleAddGstCharges = async () => {
    if (!gstInput || gstInput < 0) {
      toast.error('Please enter a valid Gst charge (must be 0 or greater)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await addGstCharges(parseFloat(gstInput));
      toast.success(response.message);
      setGstCharges({
        gst: parseFloat(gstInput)
      });
      setGstInput('');
      
    } catch (error) {
      toast.error(error.message || 'Failed to add gst charges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveGstCharges = async () => {
    if (!window.confirm('Are you sure you want to remove the gst charges?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await removeGstCharges();
      toast.success(response.message);
      setGstCharges(null);
      
    } catch (error) {
      toast.error(error.message || 'Failed to remove gst charges');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Gst Charges Management</h2>
        {/*loader for gst charger */}
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading...</p>
          </div>
        )}
        
        {/* Current gst Charges Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          {gstCharges ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">
                  ✅ Gst charges are set: ${gstCharges.gst}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This Gst charge will be applied to all orders.
                </p>
              </div>
              <button
                onClick={handleRemoveGstCharges}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove Gst Charges'}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No gst charges are currently set.</p>
          )}
        </div>

=        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Gst Charges</h3>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gst Charge Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gstInput}
                onChange={(e) => setGstInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter gst charge amount"
              />
            </div>
            
            <button
              onClick={handleAddGstCharges}
              disabled={isLoading || !gstInput}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Gst Charges'}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Information:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Only one gst charge can be active at a time</li>
              <li>• Adding new gst charges will replace the existing ones</li>
              <li>• The gst charge will be applied to all orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GstCharges;