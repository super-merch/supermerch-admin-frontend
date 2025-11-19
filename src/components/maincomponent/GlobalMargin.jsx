import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  addGlobalMargin,
  getGlobalMargin,
  removeGlobalMargin,
} from "../apis/UserApi";
import { useNavigate } from "react-router-dom";

const GlobalMargin = () => {
  const [globalMargin, setGlobalMargin] = useState(null);
  const [marginInput, setMarginInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalMargin();
  }, []);

  const [loading, setLoading] = useState(false);

  const fetchGlobalMargin = async () => {
    setLoading(true);
    try {
      const response = await getGlobalMargin();
      if (response.data && response.data.isActive) {
        setGlobalMargin(response.data);
        console.log(response);
        setLoading(false);
      } else {
        setGlobalMargin(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching global margin:", error);
      setGlobalMargin(null);
      setLoading(false);
    }
  };

  const handleAddGlobalMargin = async () => {
    if (!marginInput || Number(marginInput) < 0) {
      toast.error("Please enter a valid margin amount (must be 0 or greater)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await addGlobalMargin(parseFloat(marginInput));
      toast.success(response.message);
      setGlobalMargin({
        margin: parseFloat(marginInput),
        isActive: true,
      });
      setMarginInput("");
    } catch (error) {
      toast.error(error.message || "Failed to add global margin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveGlobalMargin = async () => {
    if (!window.confirm("Are you sure you want to remove the global margin?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await removeGlobalMargin();
      toast.success(response.message);
      setGlobalMargin(null);
    } catch (error) {
      toast.error(error.message || "Failed to remove global margin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Global Margin Management
        </h2>

        {/* Loader for Global Margin */}
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">
              Loading global margin...
            </p>
          </div>
        )}

        {/* Current Global Margin Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          {globalMargin ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">
                  ✅ Global margin is active: {globalMargin.margin.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This margin is added to all product prices and overrides
                  individual product margins.
                </p>
              </div>
              <button
                onClick={handleRemoveGlobalMargin}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? "Removing..." : "Remove Global Margin"}
              </button>
            </div>
          ) : (
            <p className="text-gray-600">
              No global margin is currently active.
            </p>
          )}
        </div>

        {/* Add Global Margin Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add New Global Margin</h3>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margin Percentage
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">%</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={marginInput}
                  onChange={(e) => setMarginInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              onClick={handleAddGlobalMargin}
              disabled={isLoading || !marginInput}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Global Margin"}
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Important Notice:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Adding a global margin will remove ALL existing individual
                product margins
              </li>
              <li>
                • The global margin will be added to all product prices in your
                store
              </li>
              <li>
                • Individual product margins cannot be added while global margin
                is active
              </li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalMargin;
