import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import {
  Truck,
  Search,
  X,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Percent,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderTree,
  Plus,
  Trash2,
} from "lucide-react";
import axios from "axios";
import ActionButton from "../ui/ActionButton";

const AlSuppliers = () => {
  const {
    fetchSuppliers,
    suppliers,
    setSuppliers,
    supplierLoading,
    suppliersPagination,
  } = useContext(AdminContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [ignoredSuppliers, setIgnoredSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState({});
  const [discounts, setDiscounts] = useState({}); // input values
  const [supplierDiscounts, setSupplierDiscounts] = useState({}); // existing discounts from DB
  const [loading, setLoading] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const [margins, setMargins] = useState({}); // Track margin input per supplier
  const [supplierMargins, setSupplierMargins] = useState({}); // Track existing margins from DB
  const itemsPerPage = 15;
  const [addLoading, setAddLoading] = useState(false);
  const navigate = useNavigate();
  const [mySearch, setMySearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const fetchSupplierDiscounts = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/add-discount/list-supplier-discounts`
      );
      if (response.ok) {
        const data = await response.json();
        const discountsObj = {};
        (data.data || []).forEach((item) => {
          discountsObj[item.supplierId] = item.discount;
        });
        setSupplierDiscounts(discountsObj);
        setDiscounts(discountsObj); // initialize input fields with existing discounts
      }
    } catch (err) {
      console.error("Error fetching supplier discounts:", err);
    }
  };
  useEffect(() => {
    if (!searchTerm) {
      // If search is cleared, fetch regular suppliers
      setIsSearchMode(false);
      fetchSuppliers(1);
      setCurrentPage(1);
      return;
    }

    const search = async () => {
      setLoading(true);
      setIsSearchMode(true);
      try {
        const response = await axios.post(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/supplier/search?page=1&limit=25`,
          { searchTerm },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.status === 200) {
          setSuppliers(response.data.data);
          setLoading(false);
          setMySearch("");
          return;
        } else {
          setLoading(false);
          setMySearch("");
          return;
        }
      } catch (error) {
        console.log(error);
        setLoading(false);
        setMySearch("");
        return;
      }
    };
    search();
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm("");
    setMySearch("");
    setIsSearchMode(false);
    setCurrentPage(1);
    fetchSuppliers(1);
  };

  useEffect(() => {
    // fetchSuppliers(1);
    fetchSupplierMargins();
    fetchSupplierDiscounts();
  }, []);
  const handleDiscountChange = (supplierId, value) => {
    setDiscounts((prev) => ({ ...prev, [supplierId]: value }));
  };
  const handleAddDiscount = async (supplier) => {
    setAddLoading(true);
    const discountValue = parseFloat(discounts[supplier.id]);
    if (isNaN(discountValue)) {
      toast.error("Please enter a valid discount");
      setAddLoading(false);
      return;
    }

    setLoadingSuppliers((prev) => ({ ...prev, [supplier.id]: "adding" }));

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/add-discount/add-supplier-discounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: supplier.id,
            discount: discountValue,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Discount added/updated successfully");
        setSupplierDiscounts((prev) => ({
          ...prev,
          [supplier.id]: discountValue,
        }));
        window.dispatchEvent(
          new CustomEvent("supplierDiscountChanged", {
            detail: { supplierId: supplier.id },
          })
        );
        fetchSupplierDiscounts();
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to add/update discount");
      }
    } catch (err) {
      console.error("Error adding/updating discount:", err);
      toast.error("Error adding/updating discount");
    } finally {
      setAddLoading(false);
      setLoadingSuppliers((prev) => {
        const n = { ...prev };
        delete n[supplier.id];
        return n;
      });
    }
  };
  const handleDeleteDiscount = async (supplier) => {
    setLoadingSuppliers((prev) => ({ ...prev, [supplier.id]: "deleting" }));
    setAddLoading(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/add-discount/delete-supplier-discounts?supplierId=${supplier.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Discount deleted successfully");
        setSupplierDiscounts((prev) => {
          const n = { ...prev };
          delete n[supplier.id];
          return n;
        });
        setDiscounts((prev) => {
          const n = { ...prev };
          delete n[supplier.id];
          return n;
        });
        fetchSupplierDiscounts();
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to delete discount");
      }
    } catch (err) {
      console.error("Error deleting discount:", err);
      toast.error("Error deleting discount");
    } finally {
      setLoadingSuppliers((prev) => {
        const n = { ...prev };
        delete n[supplier.id];
        return n;
      });
      setAddLoading(false);
    }
  };

  // Fetch supplier margins from API
  const fetchSupplierMargins = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/list-margin/supplier`
      );
      if (response.ok) {
        const data = await response.json();
        // Convert array to object with supplierId as key
        const marginsObj = {};
        data.data.forEach((item) => {
          marginsObj[item.supplierId] = item.margin;
        });
        setSupplierMargins(marginsObj);
        setMargins(marginsObj); // Initialize input fields with existing margins
      }
    } catch (error) {
      console.error("Error fetching supplier margins:", error);
    }
  };

  const fetchIgnoredSuppliers = async () => {
    setLoading(true);
    setIgnored(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ignored-suppliers`
      );
      if (!response.ok) {
        setLoading(false);
        throw new Error("Failed to fetch ignored suppliers");
      }
      const data = await response.json();
      if (!data || !data.data) {
        setLoading(false);
        throw new Error("Unexpected API response structure");
      }
      setIgnoredSuppliers(data.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error fetching ignored suppliers:", err);
    }
  };

  // Calculate stats
  const totalSuppliers = ignored
    ? ignoredSuppliers.length
    : suppliersPagination?.totalSuppliers || suppliers.length || 0;
  const activeSuppliers = !ignored
    ? suppliersPagination?.totalSuppliers || suppliers.length || 0
    : 0;
  const inactiveSuppliers = ignored ? ignoredSuppliers.length : 0;

  if (supplierLoading || loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading suppliers...
          </p>
        </div>
      </div>
    );

  // Pagination logic
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchSuppliers(newPage); // Fetch new page data
  };

  const handleViewSupplier = (supplier) => {
    navigate(`/supplier/${supplier.id}`, { state: supplier });
  };

  const deactivateSupplier = async (supplier) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ignore-supplier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supplierId: supplier.id }),
      }
    );
    if (response.ok) {
      toast.success("Supplier deactivated successfully!");
      fetchSuppliers();
    } else {
      const errorData = await response.json();
      toast.error(errorData.message);
    }
  };

  const activateSupplier = async (supplier) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/unignore-supplier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supplierId: supplier.id }),
      }
    );
    if (response.ok) {
      toast.success("Supplier activated successfully!");
      fetchIgnoredSuppliers();
    } else {
      const errorData = await response.json();
      toast.error(errorData.message);
    }
  };
  const handleViewCategories = (supplier, margin) => {
    navigate("/supplier-categories", { state: { supplier, margin } });
  };

  // Handle margin input change
  const handleMarginChange = (supplierId, value) => {
    setMargins((prev) => ({ ...prev, [supplierId]: value }));
  };

  // Add or update margin
  const handleAddMargin = async (supplier) => {
    setAddLoading(true);
    const marginValue = parseFloat(margins[supplier.id]);
    if (isNaN(marginValue)) {
      toast.error("Please enter a valid margin");
      setAddLoading(false);
      return;
    }

    // Set loading for this specific supplier
    setLoadingSuppliers((prev) => ({ ...prev, [supplier.id]: "adding" }));

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/add-margin/supplier`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplierId: supplier.id,
            margin: marginValue,
          }),
        }
      );

      if (response.ok) {
        // const resp = await fetch(
        //   `${import.meta.env.VITE_BACKEND_URL}/myapi`
        // );

        const data = await response.json();
        toast.success(data.message || "Margin added/updated successfully");
        // Update local state
        setSupplierMargins((prev) => ({ ...prev, [supplier.id]: marginValue }));
        // Emit custom event when margin changes
        window.dispatchEvent(
          new CustomEvent("supplierMarginChanged", {
            detail: { supplierId: supplier.id },
          })
        );
        fetchSupplierMargins();
        setAddLoading(false);
      }
    } catch (error) {
      console.error("Error adding/updating margin:", error);
      toast.error("Error adding/updating margin");
      setAddLoading(false);
    } finally {
      // Clear loading for this specific
      setAddLoading(false);
      setLoadingSuppliers((prev) => {
        const newState = { ...prev };
        delete newState[supplier.id];
        return newState;
      });
    }
  };
  // Delete margin
  const handleDeleteMargin = async (supplier) => {
    // Set loading for this specific supplier
    setLoadingSuppliers((prev) => ({ ...prev, [supplier.id]: "deleting" }));
    setAddLoading(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/del-margin/supplier?supplierId=${supplier.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // const resp = await fetch(
        //   `${import.meta.env.VITE_BACKEND_URL}/myapi`
        // );

        const data = await response.json();
        toast.success(data.message || "Margin deleted successfully");
        // Update local state
        setSupplierMargins((prev) => {
          const newState = { ...prev };
          delete newState[supplier.id];
          return newState;
        });
        setMargins((prev) => {
          const newState = { ...prev };
          delete newState[supplier.id];
          return newState;
        });
        // Refresh margins from server
        fetchSupplierMargins();
        setAddLoading(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message);
        setAddLoading(false);
      }
    } catch (error) {
      console.error("Error deleting margin:", error);
      toast.error("Error deleting margin");
      setAddLoading(false);
    } finally {
      // Clear loading for this specific supplier
      setLoadingSuppliers((prev) => {
        const newState = { ...prev };
        delete newState[supplier.id];
        return newState;
      });
      setAddLoading(false);
    }
  };

  const currentSuppliers = ignored ? ignoredSuppliers : suppliers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Suppliers Management
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage suppliers, margins, and discounts
            </p>
          </div>
          <ActionButton
            icon={RefreshCw}
            label="Refresh"
            onClick={() => {
              if (ignored) {
                fetchIgnoredSuppliers();
              } else {
                fetchSuppliers(currentPage);
              }
            }}
            variant="outline"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Suppliers</p>
                <p className="text-xl font-bold text-gray-900">
                  {suppliersPagination?.totalSuppliers || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {activeSuppliers}
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
                <p className="text-xl font-bold text-red-600">
                  {inactiveSuppliers}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers by name..."
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

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                !ignored && !isSearchMode
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                fetchSuppliers(1);
                setIgnored(false);
                setIsSearchMode(false);
                setSearchTerm("");
                setMySearch("");
                setCurrentPage(1);
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Active
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                ignored
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                fetchIgnoredSuppliers();
                setIgnored(true);
                setIsSearchMode(false);
                setSearchTerm("");
                setMySearch("");
              }}
            >
              <XCircle className="w-4 h-4" />
              Inactive
            </button>
          </div>

          {/* Clear Search */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
          Showing{" "}
          <span className="font-semibold">{currentSuppliers.length}</span> of{" "}
          <span className="font-semibold">{totalSuppliers}</span> suppliers
          {isSearchMode && searchTerm && (
            <span className="ml-1 text-blue-600">(search: "{searchTerm}")</span>
          )}
        </div>
      </div>
      {/* Suppliers Table */}
      {currentSuppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <Truck className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {isSearchMode
                ? `No suppliers found matching "${searchTerm}"`
                : ignored
                ? "No inactive suppliers found"
                : "No suppliers found"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                    Supplier
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Country
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Created
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Margin %
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Discount %
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Actions
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentSuppliers.map((sup) => {
                  const createdAt = new Date(
                    sup.created_at
                  ).toLocaleDateString();
                  const hasExistingMargin =
                    supplierMargins[sup.id] !== undefined;
                  const hasExistingDiscount =
                    supplierDiscounts[sup.id] !== undefined;

                  return (
                    <tr
                      key={sup.id}
                      className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100"
                    >
                      {/* Supplier Name */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Building className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <span
                            className="text-sm font-semibold text-gray-90 cursor-pointer"
                            onClick={() =>
                              handleViewCategories(sup, supplierMargins[sup.id])
                            }
                          >
                            {sup.name || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{sup.country || "N/A"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {!ignored ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{createdAt}</span>
                        </div>
                      </td>

                      {/* Margin Management */}
                      <td className="px-3 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="number"
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Margin %"
                                value={margins[sup.id] || ""}
                                onChange={(e) =>
                                  handleMarginChange(sup.id, e.target.value)
                                }
                                disabled={loadingSuppliers[sup.id]}
                              />
                            </div>
                            <ActionButton
                              icon={hasExistingMargin ? Plus : Plus}
                              label={hasExistingMargin ? "Update" : "Add"}
                              onClick={() => handleAddMargin(sup)}
                              disabled={loadingSuppliers[sup.id]}
                              loading={loadingSuppliers[sup.id] === "adding"}
                              variant="primary"
                              size="sm"
                            />
                            {hasExistingMargin && (
                              <ActionButton
                                icon={Trash2}
                                onClick={() => handleDeleteMargin(sup)}
                                disabled={loadingSuppliers[sup.id]}
                                loading={
                                  loadingSuppliers[sup.id] === "deleting"
                                }
                                variant="danger"
                                size="sm"
                              />
                            )}
                          </div>
                          {hasExistingMargin && (
                            <div className="text-xs text-gray-600">
                              Current:{" "}
                              <span className="font-semibold">
                                {supplierMargins[sup.id]}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Discount Management */}
                      <td className="px-3 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="number"
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Discount %"
                                value={discounts[sup.id] || ""}
                                onChange={(e) =>
                                  handleDiscountChange(sup.id, e.target.value)
                                }
                                disabled={loadingSuppliers[sup.id]}
                              />
                            </div>
                            <ActionButton
                              icon={hasExistingDiscount ? Plus : Plus}
                              label={hasExistingDiscount ? "Update" : "Add"}
                              onClick={() => handleAddDiscount(sup)}
                              disabled={loadingSuppliers[sup.id]}
                              loading={loadingSuppliers[sup.id] === "adding"}
                              variant="primary"
                              size="sm"
                            />
                            {hasExistingDiscount && (
                              <ActionButton
                                icon={Trash2}
                                onClick={() => handleDeleteDiscount(sup)}
                                disabled={loadingSuppliers[sup.id]}
                                loading={
                                  loadingSuppliers[sup.id] === "deleting"
                                }
                                variant="danger"
                                size="sm"
                              />
                            )}
                          </div>
                          {hasExistingDiscount && (
                            <div className="text-xs text-gray-600">
                              Current:{" "}
                              <span className="font-semibold">
                                {supplierDiscounts[sup.id]}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {!ignored ? (
                          <ActionButton
                            icon={XCircle}
                            label="Deactivate"
                            onClick={() => deactivateSupplier(sup)}
                            variant="danger"
                            size="sm"
                          />
                        ) : (
                          <ActionButton
                            icon={CheckCircle2}
                            label="Activate"
                            onClick={() => activateSupplier(sup)}
                            variant="success"
                            size="sm"
                          />
                        )}
                      </td>

                      {/* View Categories */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <ActionButton
                          icon={FolderTree}
                          label="View"
                          onClick={() =>
                            handleViewCategories(sup, supplierMargins[sup.id])
                          }
                          variant="primary"
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!ignored &&
        !isSearchMode &&
        suppliersPagination &&
        suppliersPagination.totalPages > 1 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!suppliersPagination.hasPrevPage}
                className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, suppliersPagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (suppliersPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      currentPage >=
                      suppliersPagination.totalPages - 2
                    ) {
                      pageNum = suppliersPagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!suppliersPagination.hasNextPage}
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
                  {suppliersPagination.totalPages}
                </span>
              </span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span>
                <span className="font-semibold">
                  {suppliersPagination.totalSuppliers}
                </span>{" "}
                total
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

export default AlSuppliers;
