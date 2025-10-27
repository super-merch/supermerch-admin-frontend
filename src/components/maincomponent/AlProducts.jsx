import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import { addDiscount, addMargin } from "../apis/UserApi";

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
  // Add these state variables after your existing useState declarations
  const [bulkMode, setBulkMode] = useState(null); // 'australia-add', 'australia-remove', '24hour-add', '24hour-remove', or null
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Add these handler functions
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
    const eligibleProducts = currentProducts.filter((product) => {
      const productId = String(product.meta.id);
      if (bulkMode === "australia-add") {
        return !australiaIds.has(productId);
      } else if (bulkMode === "australia-remove") {
        return australiaIds.has(productId);
      } else if (bulkMode === "24hour-add") {
        return !productionIds.has(productId);
      } else if (bulkMode === "24hour-remove") {
        return productionIds.has(productId);
      }
      return false;
    });

    setSelectedProducts(
      new Set(eligibleProducts.map((p) => String(p.meta.id)))
    );
  };

  const handleDeselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkAction = async () => {
    if (selectedProducts.size === 0) {
      toast.warning("Please select at least one product");
      return;
    }

    setBulkLoading(true);
    try {
      const ids = Array.from(selectedProducts);
      let endpoint = "";
      let actionName = "";

      if (bulkMode === "australia-add") {
        endpoint = `${backednUrl}/api/australia/bulk-add`;
        actionName = "Australia";
      } else if (bulkMode === "australia-remove") {
        endpoint = `${backednUrl}/api/australia/bulk-remove`;
        actionName = "Australia";
      } else if (bulkMode === "24hour-add") {
        endpoint = `${backednUrl}/api/24hour/bulk-add`;
        actionName = "24 Hour Production";
      } else if (bulkMode === "24hour-remove") {
        endpoint = `${backednUrl}/api/24hour/bulk-remove`;
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
        const action = bulkMode.includes("add") ? "added to" : "removed from";
        toast.success(
          `${data.added || data.removed} products ${action} ${actionName}!`
        );

        // Refresh data
        if (bulkMode.includes("australia")) {
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
    }
  };

  const cancelBulkMode = () => {
    setBulkMode(null);
    setSelectedProducts(new Set());
  };

  const isProductSelectable = (product) => {
    if (!bulkMode) return false;

    const productId = String(product.meta.id);
    if (bulkMode === "australia-add") {
      return !australiaIds.has(productId);
    } else if (bulkMode === "australia-remove") {
      return australiaIds.has(productId);
    } else if (bulkMode === "24hour-add") {
      return !productionIds.has(productId);
    } else if (bulkMode === "24hour-remove") {
      return productionIds.has(productId);
    }
    return false;
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
          // case "all":
          //   productData = await fetchProducts();
          //   break;
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
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Products..</p>
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Updating Prices...</p>
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

  return (
    <div className="px-4 pb-6 lg:pb-10 md:pb-10 lg:px-10 md:px-10 sm:px-6">
      <h1 className="pt-3 pb-3 text-2xl font-bold text-center text-gray-600">
        All Products
      </h1>

      {/* Search Section */}
      <div className="mb-3">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={searchLoading}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {searchLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              "Search"
            )}
          </Button>
        </form>
        {/* Bulk Actions Bar */}
        {!bulkMode ? (
          <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Bulk Actions
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => setBulkMode("australia-add")}
                className="bg-green-600 hover:bg-green-700 text-sm"
              >
                Bulk Add to Australia
              </Button>
              <Button
                onClick={() => setBulkMode("australia-remove")}
                className="bg-red-600 hover:bg-red-700 text-sm"
              >
                Bulk Remove from Australia
              </Button>
              <Button
                onClick={() => setBulkMode("24hour-add")}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Bulk Add to 24Hr Production
              </Button>
              <Button
                onClick={() => setBulkMode("24hour-remove")}
                className="bg-orange-600 hover:bg-orange-700 text-sm"
              >
                Bulk Remove from 24Hr Production
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                {bulkMode === "australia-add" && "Bulk Add to Australia"}
                {bulkMode === "australia-remove" &&
                  "Bulk Remove from Australia"}
                {bulkMode === "24hour-add" && "Bulk Add to 24 Hour Production"}
                {bulkMode === "24hour-remove" &&
                  "Bulk Remove from 24 Hour Production"}
              </h3>
              <button
                onClick={cancelBulkMode}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {selectedProducts.size} product
              {selectedProducts.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                className="text-sm"
              >
                Select All Eligible
              </Button>
              <Button
                onClick={handleDeselectAll}
                variant="outline"
                className="text-sm"
              >
                Deselect All
              </Button>
              <Button
                onClick={handleBulkAction}
                disabled={selectedProducts.size === 0 || bulkLoading}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                {bulkLoading
                  ? "Processing..."
                  : bulkMode.includes("add")
                  ? "Add Selected"
                  : "Remove Selected"}
              </Button>
            </div>
          </div>
        )}

        {/* dropdown to show sort by trendings, new arrivals, best sellers and all products(default) */}
        <div className="flex justify-between">
          <div className="flex justify-end mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value;
                clearSearch(); // clears search state and sets current page to 1
                setSelectedCategory(val);
                setCurrentPage(1); // defensive: ensures page is 1
              }}
              disabled={searchLoading}
              className="px-4 py-2 border rounded"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end mb-4">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-2 border rounded"
              disabled={searchLoading}
            >
              <option value="all">All Products</option>
              <option value="trending">Trending</option>
              <option value="newArrivals">New Arrivals</option>
              <option value="bestSellers">Best Sellers</option>
            </select>
          </div>
        </div>

        {isSearching &&
          (searchLoading ? (
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>
                Showing search results for: <strong>"{searchTerm}"</strong>
              </span>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Show all products
              </button>
            </div>
          ))}
      </div>

      <Table>
        <TableCaption>
          {isSearching
            ? searchLoading
              ? "Searching..."
              : `Search results for "${searchTerm}" (${currentProductList.length} products found)`
            : "A list of All Products."}
        </TableCaption>
        <TableHeader>
          <TableRow>
            {bulkMode && <TableHead className="w-[50px]">Select</TableHead>}
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trending</TableHead>
            {/* <TableHead>New Arrival</TableHead>
            <TableHead>Best Seller</TableHead> */}
            <TableHead>Australia</TableHead>
            <TableHead>24Hr Prod</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="">Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentProducts.map((product, index) => {
            const priceGroups = product.product?.prices?.price_groups || [];
            const basePrice =
              priceGroups.find((group) => group?.base_price) || {};
            const priceBreaks = basePrice.base_price?.price_breaks || [];
            const realPrice =
              priceBreaks.length > 0 && priceBreaks[0]?.price !== undefined
                ? priceBreaks[0].price.toFixed(2)
                : "0";

            const isIgnored = localIgnoredIds.has(product.meta.id);
            const productId = product.meta.id;
            const displayName = getDisplayName(product);
            const isEditing = editingProductId === productId;
            const isTrending = trendingIds.has(String(productId));
            // const isNewArrival = newArrivalIds.has(String(productId));
            // const isBestSeller = bestSellerIds.has(String(productId));
            const isAustralia = australiaIds.has(String(productId));
            const is24HourProduction = productionIds.has(String(productId));
            const isSelectable = isProductSelectable(product);
            const isSelected = selectedProducts.has(String(product.meta.id));

            return (
              <TableRow
                key={index}
                className={
                  !bulkMode
                    ? ""
                    : isSelectable
                    ? "hover:bg-blue-50 cursor-pointer"
                    : "opacity-50"
                }
              >
                {bulkMode && (
                  <TableCell>
                    {isSelectable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handleBulkSelect(String(product.meta.id))
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <img
                    src={
                      product.overview.hero_image
                        ? product.overview.hero_image
                        : "cap.png"
                    }
                    alt=""
                    className="w-8 rounded-full"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder="Enter product name"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              updateProductName(productId, editingName);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                          onClick={() =>
                            updateProductName(productId, editingName)
                          }
                          disabled={updatingName}
                        >
                          {updatingName ? "..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={cancelEditing}
                          disabled={updatingName}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex-1">{displayName}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={() => startEditing(productId, displayName)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {isIgnored ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      InActive
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      isTrending
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isTrending ? "Yes" : "No"}
                  </span>
                </TableCell>
                {/* <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      isNewArrival
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isNewArrival ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      isBestSeller
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isBestSeller ? "Yes" : "No"}
                  </span>
                </TableCell> */}
                <TableCell>
                  {isAustralia ? (
                    <button
                      className="px-2 py-1 rounded text-xs font-medium bg-red-700 text-white hover:bg-red-800 transition-colors"
                      onClick={() => removeFromAustralia(product)}
                      disabled={australiaLoading}
                    >
                      {australiaLoading ? "..." : "Remove"}
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 rounded text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
                      onClick={() => addToAustralia(product)}
                      disabled={australiaLoading}
                    >
                      {australiaLoading ? "..." : "Add"}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {" "}
                  {/* Add this entire cell */}
                  {is24HourProduction ? (
                    <button
                      className="px-2 py-1 rounded text-xs font-medium bg-red-700 text-white hover:bg-red-800 transition-colors"
                      onClick={() => removeFrom24HourProduction(product)}
                      disabled={productionLoading}
                    >
                      {productionLoading ? "..." : "Remove"}
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 rounded text-xs font-medium bg-green-700 text-white hover:bg-green-800 transition-colors"
                      onClick={() => addTo24HourProduction(product)}
                      disabled={productionLoading}
                    >
                      {productionLoading ? "..." : "Add"}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {product.meta.last_changed_at.slice(0, 10) || "No Code"}
                </TableCell>
                <TableCell>{product.overview.code || "No Code"}</TableCell>
                <TableCell>${realPrice}</TableCell>
                <TableCell className="text-right">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === productId ? null : productId
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openDropdown === productId && (
                      <div className="absolute right-0 top-full  mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-10  overflow-auto">
                        <div className="py-2">
                          {isIgnored ? (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-red-50 hover:bg-red-100 text-green-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                handleActivateProduct(product);
                                setOpenDropdown(null);
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Activate
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                handleDeactivateProduct(product);
                                setOpenDropdown(null);
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Deactivate
                            </button>
                          )}

                          <button
                            className="w-full text-left px-4 py-3 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors flex items-center gap-3"
                            onClick={() => {
                              handleViewProduct(product);
                              setOpenDropdown(null);
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View More
                          </button>

                          {isTrending ? (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                removeFromTrending(product);
                                setOpenDropdown(null);
                              }}
                              disabled={trendingLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                              </svg>
                              {trendingLoading
                                ? "Removing..."
                                : "Remove from Trending"}
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                addToTrending(product);
                                setOpenDropdown(null);
                              }}
                              disabled={trendingLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              {trendingLoading
                                ? "Adding..."
                                : "Add to Trending"}
                            </button>
                          )}

                          {/* {isNewArrival ? (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                removeFromNewArrival(product);
                                setOpenDropdown(null);
                              }}
                              disabled={newArrivalLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                              {newArrivalLoading
                                ? "Removing..."
                                : "Remove from New Arrival"}
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                addToNewArrival(product);
                                setOpenDropdown(null);
                              }}
                              disabled={newArrivalLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                              {newArrivalLoading
                                ? "Adding..."
                                : "Add to New Arrival"}
                            </button>
                          )} */}

                          {/* {isBestSeller ? (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-pink-50 hover:bg-pink-100 text-pink-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                removeFromBestSeller(product);
                                setOpenDropdown(null);
                              }}
                              disabled={bestSellerLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                />
                              </svg>
                              {bestSellerLoading
                                ? "Removing..."
                                : "Remove from Best Seller"}
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-4 py-3 text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium transition-colors flex items-center gap-3"
                              onClick={() => {
                                addToBestSeller(product);
                                setOpenDropdown(null);
                              }}
                              disabled={bestSellerLoading}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                              {bestSellerLoading
                                ? "Adding..."
                                : "Add to Best Seller"}
                            </button>
                          )} */}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {currentProducts.length === 0 && !allProductLoading && !searchLoading && (
        <div className="text-center py-8 text-gray-500">
          {isSearching
            ? `No products found for "${searchTerm}"`
            : "No products found"}
        </div>
      )}

      {!searchTerm && (
        <div className="flex items-center justify-end gap-4 mt-12">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={prevDisabled}
            className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
              prevDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Previous
          </button>

          <span className="text-lg font-medium">
            Page {currentPage} of {paginationTotal}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={nextDisabled}
            className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
              nextDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AlProducts;
