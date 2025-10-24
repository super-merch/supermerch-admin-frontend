import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDiscount, getDiscount } from "../apis/UserApi";
import { addMargin as addMarginApi } from "../apis/UserApi";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AlProductDetail = () => {
  const { state: product } = useLocation();
  const { aToken, backednUrl } = useContext(AdminContext);
  const [productDesc, setProductDesc] = useState("");
  const [prodName, setProdName] = useState("");
  const [loading, setLoading] = useState(false);
  const getProductDesc = async () => {
    setLoading(true);
    const res = await axios.get(
      `${backednUrl}/api/single-product/${product.meta.id}`
    );
    setProductDesc(res.data.data.product.description);
    setProdName(res.data.data.overview.name);
    setLoading(false);
  };
  useEffect(() => {
    getProductDesc();
  }, []);

  // track initial page loading only
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  // button-level loading states
  const [isDiscountLoading, setIsDiscountLoading] = useState(false);
  const [isMarginLoading, setIsMarginLoading] = useState(false);

  const [discountPercent, setDiscountPercent] = useState("");
  const [marginPercent, setMarginPercent] = useState("");
  const [discountMessage, setDiscountMessage] = useState("");
  const [marginMessage, setMarginMessage] = useState("");
  const [discountPrice, setDiscountPrice] = useState(null);
  // Add state for true base price
  const [trueBasePrice, setTrueBasePrice] = useState(null);
  const [marginPrice, setMarginPrice] = useState(null);

  // Local product copy so we can update description in-place without changing other logic
  const [localProduct, setLocalProduct] = useState(product);
  useEffect(() => setLocalProduct(product), [product]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(
    localProduct?.overview?.name || ""
  );
  const [updatingName, setUpdatingName] = useState(false);
  const nameInputRef = useRef(null);

  // start editing name (populate input)
  const startEditName = () => {
    setEditingName(localProduct?.overview?.name || "");
    setIsEditingName(true);
    // focus after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  // cancel name editing (revert local text)
  const cancelEditName = () => {
    setEditingName(localProduct?.overview?.name || "");
    setIsEditingName(false);
  };

  // save updated name
  const saveName = async () => {
    const newName = (editingName || "").trim();
    if (!newName) {
      toast.error("Product name cannot be empty");
      return;
    }
    // if unchanged just cancel
    if (newName === (localProduct?.overview?.name || "").trim()) {
      setIsEditingName(false);
      return;
    }

    setUpdatingName(true);
    try {
      const res = await fetch(`${backednUrl}/api/update-product-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(aToken ? { Authorization: `Bearer ${aToken}` } : {}),
        },
        body: JSON.stringify({
          productId: String(localProduct?.meta?.id),
          customName: newName,
        }),
      });

      if (res.ok) {
        toast.success("Name updated successfully!");
        // update local copy so UI reflects new name immediately
        setLocalProduct((prev) => ({
          ...prev,
          overview: {
            ...(prev?.overview || {}),
            name: newName,
          },
        }));
        setIsEditingName(false);
      } else {
        const err = await res.text().catch(() => null);
        console.error("Failed to update name", err);
        toast.error("Failed to update name");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Error updating name");
    } finally {
      setUpdatingName(false);
    }
  };

  // keyboard handler for name input: Enter = save, Escape = cancel
  const onNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!updatingName) saveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditName();
    }
  };

  // Description editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editingDesc, setEditingDesc] = useState(
    localProduct?.product?.description || ""
  );
  const [updatingDesc, setUpdatingDesc] = useState(false);

  // Start editing (populate textarea with current desc)
  const startEditDesc = () => {
    setEditingDesc(productDesc || "");
    setIsEditingDesc(true);
  };

  // Cancel editing (revert local text)
  const cancelEditDesc = () => {
    setEditingDesc(localProduct?.product?.description || "");
    setIsEditingDesc(false);
  };

  // Save updated description by calling your existing endpoint
  const saveDesc = async () => {
    if (!editingDesc || !editingDesc.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    setUpdatingDesc(true);
    try {
      const res = await fetch(`${backednUrl}/api/update-product-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // include auth header if available (safe fallback)
          ...(aToken ? { Authorization: `Bearer ${aToken}` } : {}),
        },
        body: JSON.stringify({
          productId: String(localProduct.meta.id),
          customDesc: editingDesc.trim(),
        }),
      });

      if (res.ok) {
        // Optionally read response: const data = await res.json();
        toast.success("Description updated successfully!");
        // Update local copy so UI reflects new description immediately
        setLocalProduct((prev) => ({
          ...prev,
          product: {
            ...prev.product,
            description: editingDesc.trim(),
          },
        }));
        setProductDesc(editingDesc.trim());
        setIsEditingDesc(false);
      } else {
        const err = await res.text().catch(() => null);
        console.error("Failed to update description", err);
        toast.error("Failed to update description");
      }
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Error updating description");
    } finally {
      setUpdatingDesc(false);
    }
  };

  // derive base price once
  const price = useMemo(() => {
    const priceGroups = product?.product?.prices?.price_groups || [];
    const baseGroup = priceGroups.find((g) => g?.base_price) || {};
    const priceBreaks = baseGroup.base_price?.price_breaks || [];
    return priceBreaks[0]?.price ? parseFloat(priceBreaks[0].price) : 0;
  }, [product]);
  const [newBasePrice, setNewBasePrice] = useState(null);
  const getBasePrice = async () => {
    try {
      const response = await fetch(
        `${backednUrl}/api/client-products/single/getPrice?productId=${product?.meta?.id}`
      );
      const data = await response.json();
      setNewBasePrice(data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getBasePrice();
  }, []);

  const batchPromises = async (promises, batchSize = 10) => {
    const results = [];

    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  };
  const fetchInitialData = async () => {
    if (product?.meta?.id && price > 0) {
      try {
        // Fetch discount and margin data
        const [discountData, marginData] = await Promise.all([
          fetchDiscount(product.meta.id, true),
          fetchMargin(product.meta.id, true),
        ]);

        let calculatedTrueBasePrice = newBasePrice;
        // if (discountData && discountData.discount > 0) {
        //   calculatedTrueBasePrice = price / (1 - discountData.discount / 100);
        // }
        setTrueBasePrice(newBasePrice);

        // Now calculate discounted price from the true base price
        let calculatedDiscountPrice = newBasePrice;
        if (discountData && discountData.discount > 0) {
          calculatedDiscountPrice =
            newBasePrice - (newBasePrice * discountData.discount) / 100;
        }
        setDiscountPrice(calculatedDiscountPrice);

        // Calculate and set margined price
        let calculatedMarginPrice = calculatedDiscountPrice;
        if (marginData && marginData.margin > 0) {
          calculatedMarginPrice =
            calculatedDiscountPrice +
            (marginData.margin * calculatedDiscountPrice) / 100;
        }
        setMarginPrice(calculatedMarginPrice);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Set default values if fetching fails
        setTrueBasePrice(price);
        setDiscountPrice(price);
        setMarginPrice(price);
      } finally {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (product?.meta?.id && newBasePrice) {
      fetchInitialData();
    }
  }, [product?.meta?.id, newBasePrice]);

  // Enhanced fetchDiscount function to handle both single IDs and arrays
  const fetchDiscount = async (id, isInitial = false) => {
    try {
      // If it's a single ID, process normally
      if (typeof id === "string" || typeof id === "number") {
        const res = await axios.get(
          `${backednUrl}/api/add-discount/discounts/${id}`,
          { headers: { Authorization: `Bearer ${aToken}` } }
        );
        // Check if discount data exists in response
        if (res.data.data) {
          const { discount, discountPrice } = res.data.data;
          setDiscountPercent(discount);
          if (!isInitial) {
            setDiscountPrice(discountPrice);
          }
          return { discount, discountPrice };
        } else {
          // No discount found - response has only message property
          setDiscountPercent("");
          if (!isInitial) {
            setDiscountPrice(null);
          }
          return { discount: 0, discountPrice: 0 };
        }
      } else if (Array.isArray(id)) {
        // If it's an array of IDs, process in batches
        const discountPromises = id.map((productId) =>
          axios
            .get(`${backednUrl}/api/add-discount/discounts/${productId}`, {
              headers: { Authorization: `Bearer ${aToken}` },
            })
            .then((res) => {
              // Handle successful response - check if data exists
              if (res.data.data) {
                return res;
              } else {
                // No discount found
                return { data: { data: { discount: 0, discountPrice: 0 } } };
              }
            })
            .catch((e) => {
              if (e.response?.status === 404) {
                return { data: { data: { discount: 0, discountPrice: 0 } } };
              }
              throw e;
            })
        );

        // Process in batches of 10 concurrent requests
        const discountResults = await batchPromises(discountPromises, 10);

        // Return results for further processing if needed
        return discountResults.map((result) => result.data.data);
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setDiscountPercent("");
        if (!isInitial) {
          setDiscountPrice(null);
        }
        return { discount: 0, discountPrice: 0 };
      } else {
        console.error("Error fetching discount:", e);
        return { discount: 0, discountPrice: 0 };
      }
    }
  };

  // Enhanced fetchMargin function to handle both single IDs and arrays
  const fetchMargin = async (id, isInitial = false) => {
    try {
      // If it's a single ID, process normally
      if (typeof id === "string" || typeof id === "number") {
        const res = await axios.get(
          `${backednUrl}/api/product-margin/margin/${id}`,
          { headers: { Authorization: `Bearer ${aToken}` } }
        );
        // Check if margin data exists in response
        if (res.data.data) {
          const { margin, marginPrice } = res.data.data;
          setMarginPercent(margin);
          if (!isInitial) {
            setMarginPrice(marginPrice);
          }
          return { margin, marginPrice };
        } else {
          // No margin found - response has only message property
          setMarginPercent("");
          if (!isInitial) {
            setMarginPrice(null);
          }
          return { margin: 0, marginPrice: 0 };
        }
      } else if (Array.isArray(id)) {
        // If it's an array of IDs, process in batches
        const marginPromises = id.map((productId) =>
          axios
            .get(`${backednUrl}/api/product-margin/margin/${productId}`, {
              headers: { Authorization: `Bearer ${aToken}` },
            })
            .then((res) => {
              // Handle successful response - check if data exists
              if (res.data.data) {
                return res;
              } else {
                // No margin found
                return { data: { data: { margin: 0, marginPrice: 0 } } };
              }
            })
            .catch((e) => {
              if (e.response?.status === 404) {
                return { data: { data: { margin: 0, marginPrice: 0 } } };
              }
              throw e;
            })
        );

        // Process in batches of 10 concurrent requests
        const marginResults = await batchPromises(marginPromises, 10);

        // Return results for further processing if needed
        return marginResults.map((result) => result.data.data);
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setMarginPercent("");
        if (!isInitial) {
          setMarginPrice(null);
        }
        return { margin: 0, marginPrice: 0 };
      } else {
        console.error("Error fetching margin:", e);
        return { margin: 0, marginPrice: 0 };
      }
    }
  };

  // Enhanced batch processing function for discounts
  const processBatchDiscounts = async (productIds, discountPercent, prices) => {
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map((productId, index) =>
        addDiscount(productId, discountPercent, prices[i + index])
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error("Error in batch discount processing:", error);
      }
    }

    return results;
  };

  // Enhanced batch processing function for margins
  const processBatchMargins = async (productIds, marginPercent, prices) => {
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map((productId, index) =>
        addMarginApi(productId, marginPercent, prices[i + index])
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error("Error in batch margin processing:", error);
      }
    }

    return results;
  };

  const handleAddDiscount = async (e, triggered = false) => {
    if (!triggered && e?.preventDefault) e.preventDefault();
    const p = parseFloat(discountPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      const msg = "Enter a valid discount (0–100%).";
      setDiscountMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsDiscountLoading(true);

      // Use the true base price for calculation
      const basePrice = trueBasePrice || price;

      const res = await addDiscount(product.meta.id, p, basePrice);
      setDiscountMessage(res.data.message);

      toast.success(res.data.message || "Discount applied successfully!");

      // After applying discount, refresh the data
      await fetchDiscount(product.meta.id);

      // Recalculate prices
      const newDiscountPrice = basePrice - (basePrice * p) / 100;
      setDiscountPrice(newDiscountPrice);

      // Update margin price if margin exists
      if (marginPercent && parseFloat(marginPercent) > 0) {
        const newMarginPrice =
          newDiscountPrice +
          (parseFloat(marginPercent) * newDiscountPrice) / 100;
        setMarginPrice(newMarginPrice);
      } else {
        setMarginPrice(newDiscountPrice);
      }
    } catch (error) {
      const errorMsg = "Failed to add discount.";
      setDiscountMessage(errorMsg);
      toast.error(errorMsg);
      console.error("Error adding discount:", error);
    } finally {
      setIsDiscountLoading(false);
    }
  };

  const getDiscounts = async () => {
    try {
      const res = await getDiscount();
    } catch (error) {
      toast.error(error || "Failed to get discounts");
    }
  };

  const handleAddMargin = async (e, triggered = false) => {
    if (!triggered && e?.preventDefault) e.preventDefault();
    const m = parseFloat(marginPercent) || 0;
    if (isNaN(m) || m < 0) {
      const msg = "Enter a valid margin (0 or greater).";
      setMarginMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsMarginLoading(true);

      // Calculate the current discounted price
      const basePrice = trueBasePrice || price;
      const currentDiscountPercent = parseFloat(discountPercent) || 0;
      const currentDiscountedPrice =
        basePrice - (basePrice * currentDiscountPercent) / 100;

      const res = await addMarginApi(
        product.meta.id,
        m,
        currentDiscountedPrice
      );
      setMarginMessage(res.data.message);
      toast.success(res.data.message || "Margin applied successfully!");

      // Update margin price
      const newMarginPrice =
        currentDiscountedPrice + (m * currentDiscountedPrice) / 100;
      setMarginPrice(newMarginPrice);

      // Refresh margin data
      await fetchMargin(product.meta.id);

      fetchInitialData();
    } catch (error) {
      const errorMsg = "Failed to add margin.";
      setMarginMessage(errorMsg);
      toast.error(errorMsg);
      console.error("Error adding margin:", error);
    } finally {
      setIsMarginLoading(false);
    }
  };

  // Function to handle supplier margin changes (this would be called from a supplier management component)
  const handleSupplierMarginChange = async (supplierId, newMargin) => {
    try {
      // Call the supplier margin API
      const response = await axios.post(
        `${backednUrl}/api/supplier-margin/add-margin`,
        { supplierId, margin: newMargin },
        { headers: { Authorization: `Bearer ${aToken}` } }
      );

      if (response.data.reapplicationResult) {
        const { successful, failed } =
          response.data.reapplicationResult.results;
        toast.success(
          `Supplier margin updated. Reapplied to ${successful} products. ${failed} failed.`
        );
      }
    } catch (error) {
      console.error("Error updating supplier margin:", error);
      toast.error("Failed to update supplier margin");
    }
  };

  if (initialLoading) {
    return (
      <p className="pt-32 text-5xl text-center text-gray-500">Loading...</p>
    );
  }

  return (
    <div className="mx-4 mt-20 mb-12 space-y-8 lg:mx-8 md:mx-6 sm:mx-4">
      {/* good designed back button to navigate(-1) */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Back</span>
      </button>

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Product Info */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            Product Details
          </h1>
        </div>

        <div className="p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">ID</span>
                <span className="font-semibold text-gray-800">
                  {product?.meta?.id || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Code</span>
                <span className="font-semibold text-gray-800">
                  {product?.overview?.code || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">
                  Supplier
                </span>
                <span className="font-semibold text-gray-800">
                  {product.supplier?.supplier || "Unknown"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  Base Price
                </span>
                <span className="text-xl font-bold text-blue-800">
                  ${newBasePrice?.toFixed(2)}
                </span>
              </div>

              {discountPercent !== "" && (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-sm font-medium text-red-700">
                    Discount
                  </span>
                  <span className="text-lg font-bold text-red-800">
                    {discountPercent}%
                  </span>
                </div>
              )}

              {discountPrice !== null && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-sm font-medium text-green-700">
                    Discounted Price
                  </span>
                  <span className="text-xl font-bold text-green-800">
                    ${discountPrice?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Discount Form */}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Apply Discount
            </h3>
            <form
              onSubmit={handleAddDiscount}
              className="flex flex-col space-y-4"
            >
              <input
                type="number"
                placeholder="Enter discount percentage"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full p-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                disabled={isDiscountLoading}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDiscountLoading}
                >
                  {isDiscountLoading ? "Applying..." : "Apply Discount"}
                </button>
              </div>
              {discountMessage && (
                <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  {discountMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Margin Section */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-2 h-7 bg-green-500 rounded-full"></div>
            Margin
          </h2>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marginPercent !== "" && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  Margin
                </span>
                <span className="text-lg font-bold text-green-800">
                  % {marginPercent}
                </span>
              </div>
            )}

            {marginPrice !== null && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-sm font-medium text-emerald-700">
                  Price with Margin
                </span>
                <span className="text-xl font-bold text-emerald-800">
                  ${marginPrice?.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Margin Form */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Apply Margin
            </h3>
            <form
              onSubmit={handleAddMargin}
              className="flex flex-col space-y-4"
            >
              <input
                type="number"
                placeholder="Enter margin amount in dollars"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
                className="w-full p-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                disabled={isMarginLoading}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isMarginLoading}
                >
                  {isMarginLoading ? "Applying..." : "Apply Margin"}
                </button>
              </div>
              {marginMessage && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  {marginMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
      {/* Product Specifications Section */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-2 h-7 bg-purple-500 rounded-full"></div>
            Product Specifications
          </h2>
        </div>

        <div className="p-8 space-y-4">
          {/* Name (editable) */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Name</h3>
              {!isEditingName && (
                <button
                  onClick={startEditName}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingName ? (
              <div className="mt-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={onNameKeyDown}
                  className="w-full p-3 border rounded text-sm"
                  placeholder="Enter product name..."
                  disabled={updatingName}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={saveName}
                    disabled={updatingName || !(editingName || "").trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {updatingName ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEditName}
                    disabled={updatingName}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm leading-relaxed mt-2">
                {prodName || localProduct?.overview?.name || "N/A"}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-600">Price</span>
            <span className="font-semibold text-gray-800 text-right">
              {product?.product?.prices?.price_groups[0]?.base_price
                ?.price_breaks[0]?.price || "N/A"}
            </span>
          </div>

          {/* Description (editable) */}
          {localProduct?.product?.description !== undefined && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Description
                </h3>
                {!isEditingDesc && (
                  <button
                    onClick={startEditDesc}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="mt-2">
                  <textarea
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    rows={6}
                    className="w-full p-3 border rounded resize-y"
                    placeholder="Enter custom description..."
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={saveDesc}
                      disabled={updatingDesc}
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      {updatingDesc ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditDesc}
                      disabled={updatingDesc}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 text-sm leading-relaxed mt-2">
                  {productDesc ||
                    localProduct.product.description ||
                    "No description available."}
                </p>
              )}
            </div>
          )}

          {/* Details List */}
          {product?.product?.details?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.product.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <span className="text-sm font-medium text-gray-600">
                    {detail.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 text-right">
                    {detail.detail}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Supplier Name */}
          {product?.product?.supplier_name && (
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-sm font-medium text-indigo-700">
                Supplier
              </span>
              <span className="text-sm font-semibold text-indigo-900">
                {product.product.supplier_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlProductDetail;
