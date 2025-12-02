import React, { useContext, useEffect, useRef, useState } from "react";
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
    setAllProductLoading,
    ignoredProductIds,
    prodLength,
    fetchSearchedProduct,
    searchedProducts,
    searchLoading,
    fetchTrendingProduct,
    trendingProducts,
    fetchBestSellerProduct,
    bestSellerProducts,
    fetchNewArrivalProduct,
    arrivalProducts,
    fetchCategories,
    fetchParamProducts,
    totalApiPages,
    paramLoading,
  } = useContext(AdminContext);
  const prevCategoryRef = useRef(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [localIgnoredIds, setLocalIgnoredIds] = useState(new Set());
  const [lastPage, setLastPage] = useState(false);
  const [page, setPage] = useState(1);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [customNames, setCustomNames] = useState({});
  const [updatingName, setUpdatingName] = useState(false);
  const [trending, setTrending] = useState([]);
  const [arrival, setArrival] = useState([]);
  const [sortOption, setSortOption] = useState("all");
  const [best, setBest] = useState([]);
  // Store trending product IDs from API
  const [trendingIds, setTrendingIds] = useState(new Set());
  const [trendingLoading, setTrendingLoading] = useState(false);
  // Store new arrival product IDs from API
  const [newArrivalIds, setNewArrivalIds] = useState(new Set());
  const [newArrivalLoading, setNewArrivalLoading] = useState(false);
  // Store best sellers product IDs from API
  const [bestSellerIds, setBestSellerIds] = useState(new Set());
  const [bestSellerLoading, setBestSellerLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(null); // 'australia', '24hour', or null

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
    setSelectedProducts(new Set(currentProducts.map((p) => String(p.meta.id))));
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
        if (firstProduct && australiaIds.has(String(firstProduct.meta.id))) {
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

        // Refresh data
        if (mode === "australia") {
          await getAllAustralia();
        } else {
          await getAll24HourProduction();
        }

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

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [productionIds, setProductionIds] = useState(new Set());
  const [productionLoading, setProductionLoading] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCategories();
      setCategories(data.data);
    };
    loadData();
  }, []);
  useEffect(() => {
    const loadData = async () => {
      // If no category or "all" selected -> clear categoryProducts and reset page
      if (!selectedCategory || selectedCategory === "all") {
        setCategoryProducts([]);
        setCurrentPage(1);
        return;
      }

      // Fetch server-paginated products for the selected category
      setPageLoading(true);
      try {
        const data = await fetchParamProducts(
          selectedCategory,
          currentPage,
          selectedSupplier || null
        );
        setCategoryProducts(data?.data || []);
        console.log(data);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setCategoryProducts([]);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, selectedSupplier]);
  const getAll24HourProduction = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/24hour/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const productIds = data.map((item) => String(item.id));
        setProductionIds(new Set(productIds));
      } else {
        console.error(
          "Failed to fetch 24 Hour Production products:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching 24 Hour Production products:", error);
    }
  };

  const itemsPerPage = searchTerm ? 50 : 25;
  const processedProductsRef = useRef(new Set());
  const navigate = useNavigate();
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchNextBatch = async () => {
      if (lastPage && sortOption === "all") {
        setPageLoading(true);
        try {
          await fetchProducts(page + 1);
          setPage(page + 1);
          setLastPage(false);
        } catch (error) {
          console.error("Error fetching next batch:", error);
        } finally {
          setPageLoading(false);
        }
      }
    };

    fetchNextBatch();
  }, [lastPage, sortOption]);
  useEffect(() => {
    const search = async () => {
      setLoadingProducts(true);

      try {
        let productData = [];
        setPage(1);

        switch (sortOption) {
          case "trending":
            productData = await fetchTrendingProduct();
            break;
          case "bestSellers":
            productData = await fetchBestSellerProduct();
            break;
          case "newArrivals":
            productData = await fetchNewArrivalProduct();
            break;
          case "all":
            productData = await fetchProducts();
            break;
          default:
            // await fetchProducts();
            productData = products;
            break;
        }

        setProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    search();
  }, [sortOption]);
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
          fetchCustomNames(),
            fetchTrendingProducts(),
            fetchNewArrivalProducts(),
            fetchBestSellerProducts(),
            getAllAustralia();
          getAll24HourProduction();
          return;
        }
        await Promise.all([
          // fetchProducts(),
          fetchCustomNames(),
          fetchTrendingProducts(),
          fetchNewArrivalProducts(),
          fetchBestSellerProducts(),
          getAllAustralia(),
          getAll24HourProduction(),
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
  const [australiaIds, setAustraliaIds] = useState(new Set());
  const [australiaLoading, setAustraliaLoading] = useState(false);
  const getAllAustralia = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/australia/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure consistent data types (convert to strings)
        const productIds = data.map((item) => String(item.id));
        setAustraliaIds(new Set(productIds));
      } else {
        console.error("Failed to fetch Australia products:", response.status);
      }
    } catch (error) {
      console.error("Error fetching Australia products:", error);
    }
  };

  const addToAustralia = async (product) => {
    setAustraliaLoading(true);
    try {
      const response = await fetch(`${backednUrl}/api/australia/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.meta.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data === "Already added") {
          toast.info("Product is already in Australia");
        } else {
          // Add to local state
          setAustraliaIds((prev) => new Set([...prev, product.meta.id]));
          toast.success("Product added to Australia!");
          // Refresh Australia data to ensure consistency
          await getAllAustralia();
        }
      } else {
        toast.error("Failed to add to Australia", response.message);
      }
    } catch (error) {
      console.error("Error adding to Australia:", error);
      toast.error("Error adding to Australia");
    } finally {
      setAustraliaLoading(false);
    }
  };

  const removeFromAustralia = async (product) => {
    setAustraliaLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/australia/delete/${product.meta.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data === "Not found") {
          toast.info("Product was not in Australia");
        } else {
          // Remove from local state
          setAustraliaIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.meta.id);
            return newSet;
          });
          toast.success("Product removed from Australia!");
          // Refresh Australia data to ensure consistency
          await getAllAustralia();
        }
      } else {
        toast.error("Failed to remove from Australia");
      }
    } catch (error) {
      console.error("Error removing from Australia:", error);
      toast.error("Error removing from Australia");
    } finally {
      setAustraliaLoading(false);
    }
  };
  const addTo24HourProduction = async (product) => {
    setProductionLoading(true);
    try {
      const response = await fetch(`${backednUrl}/api/24hour/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.meta.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data === "Already added") {
          toast.info("Product is already in 24 Hour Production");
        } else {
          setProductionIds((prev) => new Set([...prev, product.meta.id]));
          toast.success("Product added to 24 Hour Production!");
          await getAll24HourProduction();
        }
      } else {
        toast.error("Failed to add to 24 Hour Production", response.message);
      }
    } catch (error) {
      console.error("Error adding to 24 Hour Production:", error);
      toast.error("Error adding to 24 Hour Production");
    } finally {
      setProductionLoading(false);
    }
  };

  const removeFrom24HourProduction = async (product) => {
    setProductionLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/24hour/delete/${product.meta.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data === "Not found") {
          toast.info("Product was not in 24 Hour Production");
        } else {
          setProductionIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.meta.id);
            return newSet;
          });
          toast.success("Product removed from 24 Hour Production!");
          await getAll24HourProduction();
        }
      } else {
        toast.error("Failed to remove from 24 Hour Production");
      }
    } catch (error) {
      console.error("Error removing from 24 Hour Production:", error);
      toast.error("Error removing from 24 Hour Production");
    } finally {
      setProductionLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      // If search term is empty, load all products
      setIsSearching(false);
      setCurrentPage(1);
      return;
    }

    try {
      setIsSearching(true);
      setCurrentPage(1);
      setSelectedCategory("all");
      await fetchSearchedProduct(searchTerm.trim());
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search products");
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  // Get current products based on search state
  const getCurrentProducts = () => {
    return isSearching ? searchedProducts?.data || [] : products || [];
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

  // Fetch new arrival products from API
  const fetchNewArrivalProducts = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/newArrival/get-arrivals`);
      if (response.ok) {
        const data = await response.json();
        // Ensure consistent data types (convert to strings)
        const productIds = data.map((item) => String(item.productId));
        setNewArrivalIds(new Set(productIds));
      } else {
        console.error("Failed to fetch new arrival products:", response.status);
        toast.error("Failed to load new arrival products");
      }
    } catch (error) {
      console.error("Error fetching new arrival products:", error);
      toast.error("Error loading new arrival products");
    }
  };

  // Fetch best seller products from API
  const fetchBestSellerProducts = async () => {
    try {
      const response = await fetch(
        `${backednUrl}/api/bestSeller/get-bestSeller`
      );
      if (response.ok) {
        const data = await response.json();
        // Ensure consistent data types (convert to strings)
        const productIds = data.map((item) => String(item.productId));
        setBestSellerIds(new Set(productIds));
      } else {
        console.error("Failed to fetch best seller products:", response.status);
        toast.error("Failed to load best seller products");
      }
    } catch (error) {
      console.error("Error fetching best seller products:", error);
      toast.error("Error loading best seller products");
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

  // Add to new arrival
  const addToNewArrival = async (product) => {
    setNewArrivalLoading(true);
    try {
      const response = await fetch(`${backednUrl}/api/newArrival/add-arrival`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.meta.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data === "Already added") {
          toast.info("Product is already in new arrivals");
        } else {
          // Add to local state
          setNewArrivalIds((prev) => new Set([...prev, product.meta.id]));
          toast.success("Product added to new arrivals!");
          // Refresh new arrival data to ensure consistency
          await fetchNewArrivalProducts();
        }
      } else {
        toast.error("Failed to add to new arrivals");
      }
    } catch (error) {
      console.error("Error adding to new arrivals:", error);
      toast.error("Error adding to new arrivals");
    } finally {
      setNewArrivalLoading(false);
    }
  };

  // Remove from new arrival
  const removeFromNewArrival = async (product) => {
    setNewArrivalLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/newArrival/delete-arrival`,
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
          toast.info("Product was not in new arrivals");
        } else {
          // Remove from local state
          setNewArrivalIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.meta.id);
            return newSet;
          });
          toast.success("Product removed from new arrivals!");
          // Refresh new arrival data to ensure consistency
          await fetchNewArrivalProducts();
        }
      } else {
        toast.error("Failed to remove from new arrivals");
      }
    } catch (error) {
      console.error("Error removing from new arrivals:", error);
      toast.error("Error removing from new arrivals");
    } finally {
      setNewArrivalLoading(false);
    }
  };

  // Add to best seller
  const addToBestSeller = async (product) => {
    setBestSellerLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/bestSeller/add-bestSeller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.meta.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data === "Already added") {
          toast.info("Product is already in best sellers");
        } else {
          // Add to local state
          setBestSellerIds((prev) => new Set([...prev, product.meta.id]));
          toast.success("Product added to best sellers!");
          // Refresh best seller data to ensure consistency
          await fetchBestSellerProducts();
        }
      } else {
        toast.error("Failed to add to best sellers");
      }
    } catch (error) {
      console.error("Error adding to best sellers:", error);
      toast.error("Error adding to best sellers");
    } finally {
      setBestSellerLoading(false);
    }
  };

  // Remove from best seller
  const removeFromBestSeller = async (product) => {
    setBestSellerLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/bestSeller/delete-bestSeller`,
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
          toast.info("Product was not in best sellers");
        } else {
          // Remove from local state
          setBestSellerIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(product.meta.id);
            return newSet;
          });
          toast.success("Product removed from best sellers!");
          // Refresh best seller data to ensure consistency
          await fetchBestSellerProducts();
        }
      } else {
        toast.error("Failed to remove from best sellers");
      }
    } catch (error) {
      console.error("Error removing from best sellers:", error.message);
      toast.error("Error removing from best sellers");
    } finally {
      setBestSellerLoading(false);
    }
  };

  // Fetch custom names from backend
  // Fetch custom names and normalize to { "<id>": "<string>" }
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
      console.log("customNames normalized:", normalized);
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
  //call next products if page is last
  const [pageLoading, setPageLoading] = useState(false);
  // useEffect(() => {
  //   const nextPage = async () => {
  //     setPageLoading(true);
  //     if (lastPage) {
  //       await fetchProducts(page + 1);
  //       setPageLoading(false);
  //       setPage(page + 1);
  //       setLastPage(false);
  //     }
  //     setPageLoading(false);
  //   };
  //   nextPage();
  // }, [lastPage]);

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

  const currentProductList = getCurrentProducts();

  const uniqueSuppliers = [
    ...new Set(
      currentProductList?.map(
        (product) => product.supplier?.supplier || "Unknown"
      )
    ),
  ];

  const filteredProducts = selectedSupplier
    ? currentProductList.filter(
        (product) => product.supplier?.supplier === selectedSupplier
      )
    : currentProductList;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  // Replace currentProducts creation with this
  const currentProducts =
    selectedCategory && selectedCategory !== "all"
      ? categoryProducts // server-paginated results (no client-side slicing)
      : filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const isCategoryMode = selectedCategory && selectedCategory !== "all";

  // total pages: use backend total when in category mode, otherwise compute locally
  const paginationTotal = isCategoryMode
    ? totalApiPages || 1
    : sortOption === "all"
    ? Math.ceil(prodLength / itemsPerPage)
    : Math.ceil(filteredProducts.length / itemsPerPage);

  // simple prev/next disabled flags
  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage >= paginationTotal;

  const handlePageChange = async (newPage) => {
    if (newPage < 1) return;
    if (selectedCategory && selectedCategory !== "all") {
      if (totalApiPages && newPage > totalApiPages) return;

      setCurrentPage(newPage);
      try {
        setPageLoading(true);
        const data = await fetchParamProducts(
          selectedCategory,
          newPage,
          selectedSupplier || null
        );
        setCategoryProducts(data?.data || []);
      } catch (err) {
        console.error("Error changing category page:", err);
      } finally {
        setPageLoading(false);
      }
      return;
    }

    // existing behaviour for "all" / normal mode
    setCurrentPage(newPage);

    // Only trigger backend fetch for "all" products when reaching last page (unchanged)
    if (
      sortOption === "all" &&
      newPage === Math.ceil(filteredProducts.length / itemsPerPage)
    ) {
      setLastPage(true);
    }
  };

  const handleSupplierChange = (e) => {
    setSelectedSupplier(e.target.value);
    setCurrentPage(1);
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
    }
  };

  // Calculate stats
  const totalProducts = currentProductList?.length || 0;
  const activeProducts =
    currentProductList?.filter((p) => !localIgnoredIds.has(p.meta.id)).length ||
    0;
  const trendingProductsCount =
    currentProductList?.filter((p) => trendingIds.has(String(p.meta.id)))
      .length || 0;
  const australiaProducts =
    currentProductList?.filter((p) => australiaIds.has(String(p.meta.id)))
      .length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 p-3">
      <div className="mb-3">
        <div className="flex justify-end mb-2">
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
                <p className="text-xl font-bold text-gray-900">
                  {totalProducts}
                </p>
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
                <p className="text-xl font-bold text-green-600">
                  {activeProducts}
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
                <p className="text-xs text-gray-500 mb-1">Trending</p>
                <p className="text-xl font-bold text-orange-600">
                  {trendingProductsCount}
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
                  {australiaProducts}
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
          clearSearch();
          setSelectedCategory(val);
          setCurrentPage(1);
        }}
        categories={categories}
        sortOption={sortOption}
        onSortChange={setSortOption}
        isSearching={isSearching}
        searchResultsCount={isSearching ? currentProductList?.length : null}
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
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
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
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                      Image
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                      Product Name
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Discount
                    </th>{" "}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Margin %
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Trending
                    </th>
                    {/* 
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                      Australia
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                      24Hr Prod
                    </th> */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                      Last Update
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Code
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Price
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
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
                    currentProducts.map((product, index) => {
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
                      const isAustralia = australiaIds.has(String(productId));
                      const is24HourProduction = productionIds.has(
                        String(productId)
                      );
                      const isSelected = selectedProducts.has(
                        String(product.meta.id)
                      );
                      console.log(product);
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
                              onClick={() => handleViewProduct(product)}
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
                                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">
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
                            {product.discount || "N/A"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {product.margin || "N/A"}
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

                          {/* Australia Toggle */}
                          {/* <td className="px-3 py-3 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={isAustralia}
                                onChange={() => {
                                  if (isAustralia) {
                                    removeFromAustralia(product);
                                  } else {
                                    addToAustralia(product);
                                  }
                                }}
                                disabled={australiaLoading}
                                loading={australiaLoading}
                                size="sm"
                              />
                            </div>
                          </td> */}

                          {/* 24Hr Production Toggle */}
                          {/* <td className="px-3 py-3 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={is24HourProduction}
                                onChange={() => {
                                  if (is24HourProduction) {
                                    removeFrom24HourProduction(product);
                                  } else {
                                    addTo24HourProduction(product);
                                  }
                                }}
                                disabled={productionLoading}
                                loading={productionLoading}
                                size="sm"
                              />
                            </div>
                          </td> */}

                          {/* Last Update */}
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
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
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
          {!isSearching && paginationTotal > 1 && (
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
