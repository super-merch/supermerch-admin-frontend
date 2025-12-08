import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import {
  Package,
  Search,
  RefreshCw,
  Edit,
  Save,
  X,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
} from "lucide-react";
import FiltersSection from "../ui/FiltersSection";
import ActionButton from "../ui/ActionButton";
import ToggleSwitch from "../ui/ToggleSwitch";

const backednUrl = import.meta.env.VITE_BACKEND_URL;

const AlProducts = () => {
  const {
    fetchProducts,
    products,
    setProducts,
    allProductLoading,
    ignoredProductIds,
    prodLength,
    fetchSearchedProduct,
    searchedProducts,
    searchLoading,
    fetchTrendingProduct,
    fetchAustraliaProducts,
    fetchProductionProducts,
    fetchCategories,
    fetchParamProducts,
    totalApiPages,
  } = useContext(AdminContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [localIgnoredIds, setLocalIgnoredIds] = useState(new Set());
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [customNames, setCustomNames] = useState({});
  const [updatingName, setUpdatingName] = useState(false);
  const [sortOption, setSortOption] = useState("all");
  // Store trending product IDs from API
  const [trendingIds, setTrendingIds] = useState(new Set());
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteId,setDeleteId]=useState(null)
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(null);
  const [australiaCount, setAustraliaCount] = useState(0);
  const [trendingCount, setTrendingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [productionIds, setProductionIds] = useState(new Set());
  const ITEMS_PER_PAGE = 25;
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCategories();
      setCategories(data.data);
      setPageLoading(true);
      const resp = await fetch(`${backednUrl}/api/products-count`);
      const data2 = await resp.json();
      setCategories(data.data);
      setTrendingCount(data2.trendingCount);
      setAustraliaCount(data2.australiaCount);
      try {
        let data;

        // Handle search mode first

        if (searchTerm && isSearching) {
          data = await fetchSearchedProduct(
            searchTerm,
            sortOption,
            supplier !== "all" ? supplier : null,
            selectedCategory !== "all" ? selectedCategory : null,
            currentPage,
            ITEMS_PER_PAGE
          );
          setProducts(data.data);
          return;
        }

        // Handle different sort options
        switch (sortOption) {
          case "trending":
            setSelectedCategory("all");
            setSupplier("all");
            data = await fetchTrendingProduct(
              currentPage,
              ITEMS_PER_PAGE,
              supplier !== "all" ? supplier : null
            );
            setProducts(data.data);
            break;
          case "australia":
            setSelectedCategory("all");
            data = await fetchAustraliaProducts(
              currentPage,
              ITEMS_PER_PAGE,
              supplier !== "all" ? supplier : null
            );
            setProducts(data.data);
            break;
          case "24hrProducts":
            setSelectedCategory("all");
            data = await fetchProductionProducts(
              currentPage,
              ITEMS_PER_PAGE,
              supplier !== "all" ? supplier : null
            );
            setProducts(data.data);
            break;
          case "all":
          default:
            data = await fetchProducts(
              currentPage,
              ITEMS_PER_PAGE,
              supplier,
              selectedCategory !== "all" ? selectedCategory : null
            );
            setProducts(data.data);
            break;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [currentPage, sortOption, selectedCategory, supplier, localSearch]);

  // Bulk selection handlers
  const handleBulkSelect = (productId) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedProducts(new Set(currentProducts?.map((p) => String(p.meta.id))));
  };

  const handleDeselectAll = () => {
    setSelectedProducts(new Set());
    setBulkMode(null);
  };

  const handleBulkAction = async (mode) => {
    if (selectedProducts.size === 0) {
      toast.warning("Please select at least one product");
      return;
    }

    setBulkLoading(true);
    setBulkMode(mode);
    try {
      const ids = Array.from(selectedProducts);
      let endpoint = "";
      let actionName = "";

      if (mode === "australia") {
        // Determine if adding or removing based on first selected product
        const firstProduct = currentProducts.find((p) =>
          selectedProducts.has(String(p.meta.id))
        );
        if (firstProduct) {
          endpoint = `${backednUrl}/api/australia/bulk-remove`;
        } else {
          endpoint = `${backednUrl}/api/australia/bulk-add`;
        }
        actionName = "Australia";
      } else if (mode === "24hour") {
        const firstProduct = currentProducts.find((p) =>
          selectedProducts.has(String(p.meta.id))
        );
        if (firstProduct && productionIds.has(String(firstProduct.meta.id))) {
          endpoint = `${backednUrl}/api/24hour/bulk-remove`;
        } else {
          endpoint = `${backednUrl}/api/24hour/bulk-add`;
        }
        actionName = "24 Hour Production";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        const data = await response.json();
        const action = endpoint.includes("add") ? "added to" : "removed from";
        toast.success(
          `${data.added || data.removed} products ${action} ${actionName}!`
        );

        // Reset selection
        setSelectedProducts(new Set());
        setBulkMode(null);
      } else {
        toast.error(`Failed to perform bulk action`);
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Error performing bulk action");
    } finally {
      setBulkLoading(false);
      setBulkMode(null);
    }
  };

  const paginationTotal = useMemo(() => {
    return totalApiPages || 1;
  }, [totalApiPages]);
  const navigate = useNavigate();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deactivatedProducts, setDeactivatedProducts] = useState(0);
  const getIgnored = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/ignored-products`);
      if (response.ok) {
        const data = await response.json();
        data.data.map((item) => {
          setLocalIgnoredIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(item.meta.id);
            return newSet;
          });
        });
        setDeactivatedProducts(data.data.length);
        //   const id = data.data.meta.id
        //   setLocalIgnoredIds(new Set(id));
      }
    } catch (error) {
      console.error("Error fetching ignored products:", error);
    }
  };
  useEffect(() => {
    getIgnored();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (products.length > 0) {
          fetchCustomNames(), fetchTrendingProducts();
          return;
        }
        await Promise.all([
          // fetchProducts(),
          fetchCustomNames(),
          fetchTrendingProducts(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (ignoredProductIds) {
      setLocalIgnoredIds(new Set(ignoredProductIds));
    }
  }, []);
  const currentProducts = useMemo(() => {
    return products || [];
  }, [selectedCategory, products]);
  const handleDeleteProduct = async()=>{
    try {
      setPageLoading(true);
      const response = await fetch(`${backednUrl}/api/custom-products/delete/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Product deleted successfully");
        setSearchTerm("");
        await fetchProducts();
      }
    } catch (error) {
      console.log(error)
    }finally{
      setShowDeletePopup(false);
      setPageLoading(false);
      setDeleteId(null)
    }
  }
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setIsSearching(false);
      setCurrentPage(1);
      return;
    }
    setLocalSearch(searchTerm);
    setIsSearching(true);
    setCurrentPage(1);
  };

  // Update clearSearch:
  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setLocalSearch("");
    setCurrentPage(1);
  };

  // Fetch trending products from API
  const fetchTrendingProducts = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/trending/get-trending`);
      if (response.ok) {
        const data = await response.json();
        // Ensure consistent data types (convert to strings)
        const productIds = data.map((item) => String(item.productId));
        setTrendingIds(new Set(productIds));
      } else {
        console.error("Failed to fetch trending products:", response.status);
        toast.error("Failed to load trending products");
      }
    } catch (error) {
      console.error("Error fetching trending products:", error);
      toast.error("Error loading trending products");
    }
  };

  // Add to trending
  const addToTrending = async (product) => {
    setTrendingLoading(true);
    try {
      const response = await fetch(`${backednUrl}/api/trending/add-trending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.meta.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data === "Already added") {
          toast.info("Product is already in trending");
        } else {
          // Add to local state
          setTrendingIds((prev) => new Set([...prev, product.meta.id]));
          toast.success("Product added to trending!");
          // Refresh trending data to ensure consistency
          await fetchTrendingProducts();
        }
      } else {
        toast.error("Failed to add to trending");
      }
    } catch (error) {
      console.error("Error adding to trending:", error);
      toast.error("Error adding to trending");
    } finally {
      setTrendingLoading(false);
    }
  };

  // Remove from trending
  const removeFromTrending = async (product) => {
    setTrendingLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/trending/delete-trending`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.meta.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data === "Not found") {
          toast.info("Product was not in trending");
        } else {
          // Remove from local state
          setTrendingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.meta.id);
            return newSet;
          });
          toast.success("Product removed from trending!");
          // Refresh trending data to ensure consistency
          await fetchTrendingProducts();
        }
      } else {
        toast.error("Failed to remove from trending");
      }
    } catch (error) {
      console.error("Error removing from trending:", error);
      toast.error("Error removing from trending");
    } finally {
      setTrendingLoading(false);
    }
  };
  const fetchCustomNames = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/custom-names`);
      if (!response.ok) {
        console.error("Failed to fetch custom names:", response.status);
        return;
      }
      const data = await response.json();
      const raw = data.customNames ?? data ?? {};

      const normalized = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => {
          // if v is object like { customName: 'Foo' } pick the likely field
          let name =
            typeof v === "string"
              ? v
              : v && typeof v === "object"
              ? v.customName ?? v.custom_name ?? v.name ?? ""
              : "";
          return [String(k), name];
        })
      );

      setCustomNames(normalized);
    } catch (error) {
      console.error("Error fetching custom names:", error);
    }
  };

  // Update product name
  const updateProductName = async (productId, newName) => {
    if (!newName.trim()) {
      toast.error("Product name cannot be empty");
      return;
    }

    setUpdatingName(true);
    try {
      const response = await fetch(`${backednUrl}/api/update-product-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          customName: newName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomNames((prev) => ({
          ...prev,
          [productId]: newName.trim(),
        }));
        toast.success("Product name updated successfully!");
        setEditingProductId(null);
        setEditingName("");
      } else {
        toast.error("Failed to update product name");
      }
    } catch (error) {
      console.error("Error updating product name:", error);
      toast.error("Error updating product name");
    } finally {
      setUpdatingName(false);
    }
  };

  // Start editing
  const startEditing = (productId, currentName) => {
    setEditingProductId(productId);
    setEditingName(currentName);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProductId(null);
    setEditingName("");
  };
  const getDisplayName = (product) => {
    const productId = product.meta.id;
    return customNames[productId] || product.overview.name || "No Name";
  };
  const [pageLoading, setPageLoading] = useState(false);

  if (pageLoading || (allProductLoading && !isSearching) || loadingProducts)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 p-3 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading Products...
          </p>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 p-3 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Updating Prices...
          </p>
        </div>
      </div>
    );

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage >= paginationTotal;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > paginationTotal) return;
    setCurrentPage(newPage);
  };

  const handleViewProduct = (product) => {
    navigate(`/product/${product.meta.id}`, { state: product });
  };

  const handleActivateProduct = async (product) => {
    const response = await fetch(`${backednUrl}/api/unignore-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId: product.meta.id }),
    });
    if (response.ok) {
      toast.success("Product activated successfully!");
      setLocalIgnoredIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.meta.id);
        return newSet;
      });
      setDeactivatedProducts((prev) => prev - 1);
    }
  };

  const handleDeactivateProduct = async (product) => {
    const response = await fetch(`${backednUrl}/api/ignore-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId: product.meta.id }),
    });
    if (response.ok) {
      toast.success("Product deactivated successfully!");
      setLocalIgnoredIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(product.meta.id);
        return newSet;
      });
      setDeactivatedProducts((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br relative from-gray-50 to-teal-50/30 p-3">
      {showDeletePopup && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50" >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Delete Product</h2>
            <p className="text-gray-600">
              Are you sure you want to delete this product?
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleDeleteProduct}
                className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setShowDeletePopup(false)
                  setDeleteId(null)
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-3">
        <div className="flex justify-end mb-2 gap-4">
          <button
            onClick={() => navigate("/add-product")}
            className="bg-teal-600 rounded-lg px-4 text-white py-2"
          >
            + Add Product
          </button>
          <ActionButton
            icon={RefreshCw}
            onClick={() => {
              if (isSearching) {
                clearSearch();
              } else {
                setCurrentPage(1);
              }
            }}
            variant="outline"
            size="sm"
            ariaLabel="Refresh products"
            className="!px-2 !py-1"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{prodLength}</p>
              </div>
              <div className="p-2 bg-teal-100 rounded-lg">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <p className="text-xl font-bold text-green-600">{prodLength - deactivatedProducts}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Trending</p>
                <p className="text-xl font-bold text-orange-600">
                  {trendingCount}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Australia</p>
                <p className="text-xl font-bold text-purple-600">
                  {australiaCount}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions - Only show when products are selected */}
      {selectedProducts.size > 0 && (
        <div className="bg-teal-50 rounded-lg p-3 border-2 border-teal-300 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-teal-900">
                {selectedProducts.size} product
                {selectedProducts.size !== 1 ? "s" : ""} selected
              </h3>
              <div className="flex gap-2">
                <ActionButton
                  label="Select All"
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                />
                <ActionButton
                  label="Deselect All"
                  onClick={handleDeselectAll}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <ActionButton
                icon={Globe}
                label="Bulk Australia"
                onClick={() => handleBulkAction("australia")}
                disabled={bulkLoading}
                loading={bulkLoading && bulkMode === "australia"}
                variant="primary"
                size="sm"
              />
              <ActionButton
                icon={Clock}
                label="Bulk 24Hr Production"
                onClick={() => handleBulkAction("24hour")}
                disabled={bulkLoading}
                loading={bulkLoading && bulkMode === "24hour"}
                variant="primary"
                size="sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <FiltersSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onClearSearch={clearSearch}
        selectedCategory={selectedCategory || "all"}
        onCategoryChange={(val) => {
          setSelectedCategory(val);
          setCurrentPage(1);
        }}
        categories={categories}
        sortOption={sortOption}
        onSortChange={setSortOption}
        isSearching={isSearching}
        searchResultsCount={isSearching ? currentProducts.length : null}
        supplier={supplier}
        onSupplierChange={setSupplier}
      />

      {searchLoading || pageLoading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm font-medium text-gray-600">
              Loading products...
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-3">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={
                          currentProducts.length > 0 &&
                          currentProducts.every((p) =>
                            selectedProducts.has(String(p.meta.id))
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAll();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                      Image
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">
                      Product Name
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">
                      SKU
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Discount
                    </th>{" "}
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Margin %
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Trending
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Last Update
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Code
                    </th>
                    <th className="px-3 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Price
                    </th>
                    <th className="px-3 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-12 text-center text-sm text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-gray-300" />
                          <p className="font-medium">
                            {isSearching
                              ? `No products found for "${searchTerm}"`
                              : "No products found"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentProducts?.map((product, index) => {
                      const priceGroups =
                        product.product?.prices?.price_groups || [];
                      const basePrice =
                        priceGroups.find((group) => group?.base_price) || {};
                      const priceBreaks =
                        basePrice.base_price?.price_breaks || [];
                      const realPrice =
                        priceBreaks.length > 0 &&
                        priceBreaks[0]?.price !== undefined
                          ? priceBreaks[0].price.toFixed(2)
                          : "0";

                      const isIgnored = localIgnoredIds.has(product.meta.id);
                      const productId = product.meta.id;
                      const displayName = getDisplayName(product);
                      const isEditing = editingProductId === productId;
                      const isTrending = trendingIds.has(String(productId));
                      const is24HourProduction = productionIds.has(
                        String(productId)
                      );
                      const isSelected = selectedProducts.has(
                        String(product.meta.id)
                      );
                      return (
                        <tr
                          key={index}
                          className={`group hover:bg-teal-50/30 transition-colors border-b border-gray-100 ${
                            isSelected ? "bg-teal-50/50" : ""
                          }`}
                        >
                          {/* Bulk Selection Checkbox */}
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleBulkSelect(String(product.meta.id))
                              }
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                            />
                          </td>

                          {/* Image */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-teal-300 transition-colors shadow-sm">
                              <img
                                src={
                                  product.overview.hero_image
                                    ? product.overview.hero_image
                                    : "cap.png"
                                }
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "cap.png";
                                }}
                              />
                            </div>
                          </td>

                          {/* Product Name */}
                          <td className="px-3 py-3">
                            <div
                              className="flex items-center gap-2 min-w-[200px] hover:cursor-pointer hover:underline"
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) =>
                                      setEditingName(e.target.value)
                                    }
                                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Enter product name"
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        updateProductName(
                                          productId,
                                          editingName
                                        );
                                      }
                                    }}
                                  />
                                  <ActionButton
                                    icon={Save}
                                    label="Save"
                                    onClick={() =>
                                      updateProductName(productId, editingName)
                                    }
                                    disabled={updatingName}
                                    loading={updatingName}
                                    variant="success"
                                    size="sm"
                                  />
                                  <ActionButton
                                    icon={X}
                                    label="Cancel"
                                    onClick={cancelEditing}
                                    disabled={updatingName}
                                    variant="outline"
                                    size="sm"
                                  />
                                </div>
                              ) : (
                                <>
                                  <span
                                    onClick={() => handleViewProduct(product)}
                                    className="text-sm font-medium cursor-pointer text-gray-900 flex-1 truncate"
                                  >
                                    {displayName}
                                  </span>
                                  <ActionButton
                                    icon={Edit}
                                    onClick={() =>
                                      startEditing(productId, displayName)
                                    }
                                    variant="outline"
                                    size="sm"
                                  />
                                </>
                              )}
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-3 py-3 text-sm whitespace-nowrap text-center">
                            {product?.overview?.sku_number || "N/A"}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {isIgnored ? (
                              <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                                InActive
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {(product?.discountInfo?.type == "product" &&
                              product?.discountInfo?.discount) ||
                              "0"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {product?.marginInfo?.productMargin || "0"}
                          </td>

                          {/* Trending Toggle */}
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={isTrending}
                                onChange={() => {
                                  if (isTrending) {
                                    removeFromTrending(product);
                                  } else {
                                    addToTrending(product);
                                  }
                                }}
                                disabled={trendingLoading}
                                loading={trendingLoading}
                                size="sm"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-600">
                              {product.meta.last_changed_at?.slice(0, 10) ||
                                "N/A"}
                            </span>
                          </td>

                          {/* Code */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              {product.overview.code || "N/A"}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-3 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-bold text-gray-900">
                              ${realPrice}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <div className="relative flex justify-center">
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown === productId
                                      ? null
                                      : productId
                                  )
                                }
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group/btn"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500 group-hover/btn:text-teal-600" />
                              </button>

                              {openDropdown === productId && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenDropdown(null)}
                                  ></div>
                                  <div
                                    className={`absolute right-0 ${
                                      currentProducts.length < 2 ||
                                      currentProducts.length === index + 1
                                        ? "bottom-5"
                                        : "top-full"
                                    } mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-visible`}
                                  >
                                    <div className="py-1">
                                      {isIgnored ? (
                                        <button
                                          className="w-full text-left px-4 py-2.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors flex items-center gap-2"
                                          onClick={() => {
                                            handleActivateProduct(product);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                          Activate Product
                                        </button>
                                      ) : (
                                        <button
                                          className="w-full text-left px-4 py-2.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors flex items-center gap-2"
                                          onClick={() => {
                                            handleDeactivateProduct(product);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Deactivate Product
                                        </button>
                                      )}

                                      <button
                                        className="w-full text-left px-4 py-2.5 text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium transition-colors flex items-center gap-2"
                                        onClick={() => {
                                          handleViewProduct(product);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                      </button>
                                      {product?.isCustom && <button
                                        className="w-full text-left px-4 py-2.5 text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium transition-colors flex items-center gap-2"
                                        onClick={() => {
                                          setDeleteId(product._id);
                                          setShowDeletePopup(true)
                                        }}
                                      >
                                        <Eye className="w-4 h-4" />
                                        Delete Product
                                      </button>}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {paginationTotal > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={prevDisabled}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, paginationTotal) },
                    (_, i) => {
                      let pageNum;
                      if (paginationTotal <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= paginationTotal - 2) {
                        pageNum = paginationTotal - 4 + i;
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
                  disabled={nextDisabled}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>
                  Page <span className="font-semibold">{currentPage}</span> of{" "}
                  <span className="font-semibold">{paginationTotal}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlProducts;
