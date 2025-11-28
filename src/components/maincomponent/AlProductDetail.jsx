import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDiscount, getDiscount } from "../apis/UserApi";
import { addMargin as addMarginApi } from "../apis/UserApi";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ArrowLeft,
  Package,
  DollarSign,
  Percent,
  Tag,
  Edit,
  Save,
  X,
  FileText,
  Building,
  Hash,
  Info,
  FileEdit,
} from "lucide-react";
import ActionButton from "../ui/ActionButton";

const AlProductDetail = () => {
  const id = useLocation().pathname.split("/")[2];
  const [product,setProduct]= useState({});
  const { aToken, backednUrl } = useContext(AdminContext);
  const [productDesc, setProductDesc] = useState("");
  const [prodName, setProdName] = useState("");
  const [loading, setLoading] = useState(false);

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
        `${backednUrl}/api/client-products/single/getPrice?productId=${id}`
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
  const [additionalMargin, setAdditionalMargin] = useState(0);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [discountMethod, setDiscountMethod] = useState("");
  const [marginMethod, setMarginMethod] = useState("");
  const fetchInitialData = async () => {
    if (id) {
      try {
        const res = await fetch(
          `${backednUrl}/api/single-product/${id}`
        )
        const data = await res.json();
        setProduct(data.data);
        // Fetch discount and margin data
        const discountData = {
          discount:  data?.data?.discountInfo?.type == "product" && data?.data?.discountInfo?.discount ||0,
        };
        const marginData = {
          margin: data?.data?.marginInfo?.appliedType == "product" && data?.data?.marginInfo?.productMargin || 0,
        };
        setDiscountMethod("product");
        setMarginMethod("product");
        setDiscountPercent(discountData.discount);
        setMarginPercent(marginData.margin);
        if(data?.data?.discountInfo?.type !== "product"){
          setDiscountMethod(data?.data?.discountInfo?.type);
          setAdditionalDiscount(data?.data?.discountInfo?.discount);
        }
        if(data?.data?.marginInfo?.appliedType !== "product"){
          setMarginMethod(data?.data?.marginInfo?.appliedType);
          setAdditionalMargin(data?.data?.marginInfo?.totalMargin);
        }


        let calculatedTrueBasePrice = newBasePrice;
        setTrueBasePrice(newBasePrice);

        let calculatedDiscountPrice = newBasePrice;
        if (discountData && discountData.discount > 0) {
          calculatedDiscountPrice =
            newBasePrice - (newBasePrice * discountData.discount) / 100;
        }
        setDiscountPrice(calculatedDiscountPrice);

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
    if (id && newBasePrice) {
      fetchInitialData();
    }
  }, [id, newBasePrice,discountPrice,marginPrice]);

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
      fetchInitialData();
    } catch (error) {
      const errorMsg = "Failed to add discount.";
      setDiscountMessage(errorMsg);
      toast.error(errorMsg);
      console.error("Error adding discount:", error);
    } finally {
      setIsDiscountLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200/50 hover:border-gray-300 hover:shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {prodName || localProduct?.overview?.name || "N/A"}
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Manage product information, pricing, and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing Configuration - Moved to Top */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Discount Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-red-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                    <Percent className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Apply Discount
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Set discount percentage
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddDiscount} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white font-medium"
                    disabled={isDiscountLoading}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Enter a value between 0 and 100
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <ActionButton
                    label={isDiscountLoading ? "Applying..." : "Apply Discount"}
                    onClick={handleAddDiscount}
                    disabled={isDiscountLoading}
                    loading={isDiscountLoading}
                    variant="danger"
                    size="md"
                    type="submit"
                  />
                </div>
                {discountMessage && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200 font-medium">
                    {discountMessage}
                  </div>
                )}
              </form>
            </div>

            {/* Margin Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Apply Margin
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Set profit margin
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddMargin} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Margin Percentage
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium"
                    disabled={isMarginLoading}
                    min="0"
                    step="0.01"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Percentage added to discounted price
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <ActionButton
                    label={isMarginLoading ? "Applying..." : "Apply Margin"}
                    onClick={handleAddMargin}
                    disabled={isMarginLoading}
                    loading={isMarginLoading}
                    variant="success"
                    size="md"
                    type="submit"
                  />
                </div>
                {marginMessage && (
                  <div className="p-3 text-xs text-green-700 bg-green-50 rounded-lg border border-green-200 font-medium">
                    {marginMessage}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Product Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Product Information
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Core product details and specifications
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Hash className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Website product SKU
                    </span>
                  </div>
                  <span className="text-base font-bold text-gray-900 font-mono">
                    {product?.overview?.sku_number || "N/A"}
                  </span>
                </div>

                <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Hash className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Supplier Code
                    </span>
                  </div>
                  <span className="text-base font-bold text-gray-900 font-mono">
                    {product?.overview?.code || "N/A"}
                  </span>
                </div>

                <div className="group p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Building className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Supplier
                    </span>
                  </div>
                  <span className="text-base font-bold text-gray-900">
                    {product.supplier?.supplier ||
                      product?.product?.supplier_name ||
                      "Unknown"}
                  </span>
                </div>
              </div>

              {/* Name Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Product Name
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Display name for this product
                      </p>
                    </div>
                  </div>
                  {!isEditingName && (
                    <ActionButton
                      icon={Edit}
                      label="Edit"
                      onClick={startEditName}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>

                {isEditingName ? (
                  <div className="space-y-3 p-4 bg-blue-50/30 rounded-lg border border-blue-200/50">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={onNameKeyDown}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                      placeholder="Enter product name..."
                      disabled={updatingName}
                    />
                    <div className="flex justify-end gap-2">
                      <ActionButton
                        icon={X}
                        label="Cancel"
                        onClick={cancelEditName}
                        disabled={updatingName}
                        variant="outline"
                        size="sm"
                      />
                      <ActionButton
                        icon={Save}
                        label="Save Changes"
                        onClick={saveName}
                        disabled={updatingName || !(editingName || "").trim()}
                        loading={updatingName}
                        variant="primary"
                        size="sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50">
                    <p className="text-base font-semibold text-gray-900">
                      {prodName || localProduct?.overview?.name || "N/A"}
                    </p>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {localProduct?.product?.description !== undefined && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <FileEdit className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Product Description
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Detailed product information
                        </p>
                      </div>
                    </div>
                    {!isEditingDesc && (
                      <ActionButton
                        icon={Edit}
                        label="Edit"
                        onClick={startEditDesc}
                        variant="outline"
                        size="sm"
                      />
                    )}
                  </div>

                  {isEditingDesc ? (
                    <div className="space-y-3 p-4 bg-purple-50/30 rounded-lg border border-purple-200/50">
                      <textarea
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white resize-none"
                        placeholder="Enter custom description..."
                      />
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={X}
                          label="Cancel"
                          onClick={cancelEditDesc}
                          disabled={updatingDesc}
                          variant="outline"
                          size="sm"
                        />
                        <ActionButton
                          icon={Save}
                          label="Save Changes"
                          onClick={saveDesc}
                          disabled={updatingDesc}
                          loading={updatingDesc}
                          variant="primary"
                          size="sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50 min-h-[100px]">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {productDesc ||
                          localProduct.product.description ||
                          "No description available."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information - Specifications */}
          {product?.product?.details?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Product Specifications
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Additional product details and specifications
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.product.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="group p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {detail.name}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {detail.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Price Summary */}
        <div className="space-y-6">
          {/* Price Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Price Summary
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complete pricing breakdown
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Base Price */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-200/50">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                    Base Price
                  </span>
                  <p className="text-xs text-gray-600">Original cost</p>
                </div>
                <span className="text-lg font-bold text-blue-900">
                  ${newBasePrice?.toFixed(2) || "0.00"}
                </span>
              </div>

              {/* Discount Row */}
              {(discountPercent !== 0)  && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-red-50 to-red-50/50 rounded-lg border border-red-200/50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block">
                        Discount ({discountPercent}%)
                      </span>
                    </div>
                    <span className="text-base font-bold text-red-900">
                      -$
                      {(
                        (newBasePrice * (discountPercent && parseFloat(discountPercent))) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                  {/* {discountPrice !== null && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg border border-green-200/50">
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                        After Discount
                      </span>
                      <span className="text-base font-bold text-green-900">
                        ${discountPrice?.toFixed(2)}
                      </span>
                    </div>
                  )} */}
                </div>
              )}

              {/* Margin Row */}
              {marginPercent !== 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-yellow-50 to-yellow-50/50 rounded-lg border border-yellow-200/50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wider block">
                        Margin ({marginPercent}%)
                      </span>
                    </div>
                    <span className="text-base font-bold text-yellow-900">
                      +$
                      {(
                        ((discountPrice || newBasePrice) *
                          ( marginPercent && parseFloat(marginPercent))) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}


              {(discountMethod !== "product" && discountMethod !== "none"  )&& (
                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50">
                    <div>
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                        Additional Discount ({discountMethod})
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {additionalDiscount} %
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                     - ${(newBasePrice * (additionalDiscount / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              {(marginMethod !== "product"&& marginMethod !== "none") && (
                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50">
                    <div>
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                        Additional Margin ({marginMethod})
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {additionalMargin} %
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                     + ${((discountPrice - (discountMethod !== "product" && (newBasePrice * (additionalDiscount / 100)) )) * (additionalMargin / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Original Price Reference */}
              {/* <div className="pt-4 mt-2 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-200/50">
                  <div>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                      Original Price
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">For Website</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    $
                    {product?.product?.prices?.price_groups[0]?.base_price
                      ?.price_breaks[0]?.price || "N/A"}
                  </span>
                </div>
              </div> */}
              {marginPrice !== null && (
                <div className="pt-4 mt-2 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-br from-purple-100 via-purple-50 to-purple-50/50 rounded-xl border-2 border-purple-300">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-purple-900 uppercase tracking-wider block">
                        Final Price
                      </span>
                      <p className="text-xs text-purple-700 font-medium">
                        Customer pays this
                      </p>
                    </div>
                    <span className="text-3xl font-bold text-purple-900">
                      ${product?.product?.prices?.price_groups[0]?.base_price
                      ?.price_breaks[0]?.price.toFixed(2) || "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlProductDetail;
