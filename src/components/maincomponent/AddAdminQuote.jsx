import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  Edit,
  User,
  Package,
  Calculator,
  Save,
  Loader2,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { RiArrowGoBackFill } from "react-icons/ri";
import { toast } from "react-toastify";
import { FaFileUpload } from "react-icons/fa";

export default function AddQuotePage() {
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Company Details (Default)
  const [companyDetails] = useState({
    name: "SuperMerch Merchandise",
    address: "230 meurants lane, Glenwood, GLENWOOD, NSW, Australia, 2768",
    phone: "0466468528",
    email: "ankit@supermerch.com.au",
    logo: "",
  });

  // User/Customer Details
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerData, setCustomerData] = useState({
    userId: null,
    name: "",
    email: "",
    type: "",
    defaultAddress: {
      firstName: "",
      lastName: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      addressLine: "",
      additional: "",
      companyName: "",
    },
    defaultShippingAddress: {
      firstName: "",
      lastName: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      addressLine: "",
      companyName: "",
      email: "",
      phone: "",
    },
  });

  // Product Search
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Current Item Being Added
  const [currentItem, setCurrentItem] = useState({
    productId: null,
    productName: "",
    productCode: "",
    productImage: "",
    productSKU: "",
    color: "",
    size: "",
    decoration: {
      method: "",
      price: 0,
      description: "",
    },
    quantity: 50,
    unitPrice: 0,
    setup: 0,
    subtotal: 0,
    customDescription: "",
    groupId: "",
    groupName: "",
  });

  // Product Details for Selection
  const [productDetails, setProductDetails] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availablePrintMethods, setAvailablePrintMethods] = useState([]);
  const [selectedPrintMethod, setSelectedPrintMethod] = useState(null);
  const [isCustomProduct, setIsCustomProduct] = useState(false);

  // Quote Items
  const [quoteItems, setQuoteItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);

  // Quote Details
  const [quoteDetails, setQuoteDetails] = useState({
    reference: "",
    deadline: "",
    showReference: true,
    showDeadline: true,
    showTotalAmount: true,
  });

  // Discount
  const [discount, setDiscount] = useState({
    type: "fixed",
    value: 0,
    amount: 0,
  });

  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  // UI States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showShippingAddressForm, setShowShippingAddressForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams({});
  const [editLoading, setEditLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const id = searchParams.get("id");
  useEffect(() => {
    if (id) {
      const getQuoteById = async () => {
        try {
          setEditLoading(true);
          const response = await fetch(
            `${BACKEND_URL}/api/admin-quotes/get-quote/${id}`
          );
          const data = await response.json();
          setQuoteItems(data.data.items);
          setQuoteDetails(data.data);
          setDiscount(data.data.discount);
          setSubtotal(data.data.subtotal);
          setTotal(data.data.total);
          setCustomerData(data.data.customer);
        } catch (error) {
          console.error("Error fetching quote by ID:", error);
        } finally {
          setEditLoading(false);
        }
      };

      getQuoteById();
    }
  }, [id]);

  // Refs
  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);
  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_PRESET || "super_merch"
      ); // change this
      formData.append(
        "cloud_name",
        import.meta.env.VITE_CLOUDINARY_NAME || "desggvwcg"
      );
      const cloudname = import.meta.env.VITE_CLOUDINARY_NAME || "desggvwcg";

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudname}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      console.log("Uploaded Image URL:", data.secure_url);
      setUploadedImage(data.secure_url);
      setCurrentItem({
        ...currentItem,
        productImage: data.secure_url,
      });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Get logged-in admin details
  const [createdBy] = useState({
    name: localStorage.getItem("adminName") || "Admin User",
    email: localStorage.getItem("adminEmail") || "admin@supermerch.com.au",
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.trim().length >= 2) {
        searchCustomers(customerSearch);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch.trim().length >= 2) {
        searchProducts(productSearch);
      } else {
        setProductSuggestions([]);
        setShowProductDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // Calculate subtotal whenever items change
  useEffect(() => {
    const newSubtotal = quoteItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    setSubtotal(newSubtotal);
  }, [quoteItems]);

  // Calculate total whenever subtotal or discount changes
  useEffect(() => {
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value || 0;
    }

    setDiscount((prev) => ({ ...prev, amount: discountAmount }));
    setTotal(Math.max(0, subtotal - discountAmount));
  }, [subtotal, discount.type, discount.value]);

  // Recalculate current item subtotal
  useEffect(() => {
    if (currentItem.unitPrice >= 0 && currentItem.quantity > 0) {
      const decorationPrice = currentItem.decoration?.price || 0;
      const itemSubtotal =
        (currentItem.unitPrice + decorationPrice) * currentItem.quantity +
        currentItem.setup;
      setCurrentItem((prev) => ({ ...prev, subtotal: itemSubtotal }));
    }
  }, [
    currentItem.quantity,
    currentItem.unitPrice,
    currentItem.decoration?.price,
    currentItem.setup,
  ]);

  // Search customers
  const searchCustomers = async (searchTerm) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/search-user?name=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setCustomerSuggestions(data.suggestions);
        setShowCustomerDropdown(true);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerDropdown(false);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSuggestions([]);
    }
  };

  // Select customer
  const selectCustomer = async (customer) => {
    try {
      const aToken = localStorage.getItem("aToken");
      const response = await fetch(
        `${BACKEND_URL}/api/auth/users?search=${encodeURIComponent(
          customer.email
        )}`,
        {
          headers: { aToken },
        }
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const user = data.data[0];
        setSelectedCustomer(user);

        // Set customer data with full address objects
        setCustomerData({
          userId: user._id,
          name: user.name,
          email: user.email,
          type: user?.type,
          defaultAddress: user.defaultAddress || {
            firstName: "",
            lastName: "",
            country: "",
            state: "",
            city: "",
            postalCode: "",
            addressLine: "",
            additional: "",
            companyName: "",
          },
          defaultShippingAddress: user.defaultShippingAddress || {
            firstName: "",
            lastName: "",
            country: "",
            state: "",
            city: "",
            postalCode: "",
            addressLine: "",
            companyName: "",
            email: "",
            phone: "",
          },
        });

        setCustomerSearch(user.name);
        setShowCustomerDropdown(false);
        setShowAddressForm(false);
        setShowShippingAddressForm(false);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  // Search products
  const searchProducts = async (searchTerm) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/search-suggestion?q=${encodeURIComponent(
          searchTerm
        )}&limit=10`
      );
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setProductSuggestions(data.data);
        setShowProductDropdown(true);
      } else {
        setProductSuggestions([]);
        setShowProductDropdown(false);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setProductSuggestions([]);
    }
  };

  const getClothingAdditionalCost = (decorationMethod) => {
    const method = decorationMethod?.toLowerCase() || "";

    if (
      method.includes("pocket") &&
      method.includes("front") &&
      method.includes("print")
    ) {
      return 8; // Pocket size Front print
    }
    if (method.includes("pocket") && method.includes("embroidery")) {
      return 8; // Pocket size Front embroidery
    }
    if (method.includes("big") && method.includes("back")) {
      return 10; // Big Print in Back
    }
    if (method.includes("pocket") && method.includes("big")) {
      return 15; // Pocket size front + Big print back
    }
    if (method.includes("unbranded")) {
      return 0; // Unbranded
    }

    return 0;
  };

  // Helper function to get clothing-specific setup fees
  const getClothingSetupFee = (decorationMethod) => {
    const method = decorationMethod?.toLowerCase() || "";

    if (
      method.includes("pocket") &&
      method.includes("front") &&
      method.includes("print")
    ) {
      return 29;
    }
    if (method.includes("pocket") && method.includes("embroidery")) {
      return 49;
    }
    if (method.includes("big") && method.includes("back")) {
      return 29;
    }
    if (method.includes("pocket") && method.includes("big")) {
      return 49;
    }
    if (method.includes("unbranded")) {
      return 0;
    }

    return 0;
  };
  // Select product and fetch full details
  const selectProduct = async (product) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/single-product/${product.id}`
      );
      const data = await response.json();

      if (data) {
        const productData = data.data;
        setProductDetails(productData);
        setSelectedProduct(product);
        setProductSearch(product.name);
        setShowProductDropdown(false);

        // Extract colors
        const colorsList =
          productData.product?.colours?.list?.flatMap((c) => c.colours) || [];
        const uniqueColors = [...new Set(colorsList)];
        setAvailableColors(uniqueColors);

        // Extract sizes
        const sizeDetail = productData.product?.details?.find(
          (d) =>
            d.name?.toLowerCase() === "sizing" ||
            d.name?.toLowerCase() === "sizes" ||
            d.name?.toLowerCase() === "size" ||
            d.name?.toLowerCase() === "product sizes"
        );
        let sizes = sizeDetail?.detail?.split(",").map((s) => s.trim()) || [];
        if (!sizes.length > 1) {
          sizes = sizeDetail?.detail?.split(" | ").map((s) => s.trim()) || [];
        }
        sizes = sizes.length > 1 ? sizes : ["XS", "S", "M", "L", "XL", "2XL"];

        const isClothing =
          productData.product?.categorisation?.product_type?.type_group_name?.toLowerCase() ===
          "clothing";

        if (isClothing) {
          setAvailableSizes(sizes);
        } else {
          setAvailableSizes([]);
        }

        // Extract print methods from price groups
        const priceGroups = productData.product?.prices?.price_groups || [];
        const basePriceBreaks = priceGroups[0]?.base_price?.price_breaks || [];
        let methods = [];
        const baseGroup = priceGroups.find((g) => g.base_price);
        const supplier = productData.overview?.supplier;

        if (isClothing) {
          // Static clothing methods
          const clothingMethods = [
            {
              key: "pocket-size-front-print",
              description: "Pocket size Front print",
              type: "base",
              setup: 29,
              price_breaks: basePriceBreaks,
            },
            {
              key: "pocket-size-front-embroidery",
              description: "Pocket size Front embroidery",
              type: "base",
              setup: 49,
              price_breaks: basePriceBreaks,
            },
            {
              key: "big-print-in-back",
              description: "Big Print in Back",
              type: "base",
              setup: 29,
              price_breaks: basePriceBreaks,
            },
            {
              key: "pocket-front-big-back",
              description: "Pocket size front + Big print back",
              type: "base",
              setup: 49,
              price_breaks: basePriceBreaks,
            },
            {
              key: "unbranded",
              description: "Unbranded",
              type: "base",
              setup: 0,
              price_breaks: basePriceBreaks,
            },
          ];

          // Filter out "unbranded" for "AS Colour" supplier
          methods =
            supplier === "AS Colour"
              ? clothingMethods.filter((method) => method.key !== "unbranded")
              : clothingMethods;
        } else {
          // Dynamic methods for non-clothing
          if (baseGroup?.base_price) {
            methods.push({
              key: baseGroup.base_price.key,
              description: baseGroup.base_price.description || "Unbranded",
              type: "base",
              setup: baseGroup.base_price.setup || 0,
              price_breaks: baseGroup.base_price.price_breaks || [],
            });
          }

          // Add all decoration methods
          priceGroups.forEach((group) => {
            if (group.additions && Array.isArray(group.additions)) {
              group.additions.forEach((add) => {
                methods.push({
                  key: add.key,
                  description: add.description,
                  type: "addition",
                  setup: add.setup || 0,
                  price_breaks: add.price_breaks || [],
                });
              });
            }
          });
        }

        setAvailablePrintMethods(methods);

        // Initialize current item with first method and price break
        if (methods.length > 0) {
          const firstMethod = methods[0];
          const firstBreak = firstMethod.price_breaks?.[0] || {
            qty: 50,
            price: 0,
          };

          // Calculate initial prices for clothing
          let initialUnitPrice = firstBreak.price;
          let initialDecorationPrice = 0;

          if (isClothing) {
            // For clothing, decoration price is built into the method
            initialDecorationPrice = getClothingAdditionalCost(
              methods[0]?.description
            ); // Will be added via additional cost logic
          }
          setCurrentItem({
            productId: product.id,
            productName: product.name,
            productCode: productData.product?.code || "",
            productImage: productData.product?.images?.[0] || "",
            productSKU: productData.overview?.sku_number || "",
            color: uniqueColors[0] || "",
            size: sizes[0] || "",
            decoration: {
              method: firstMethod.description || "",
              price: initialDecorationPrice,
              description: firstMethod.description || "",
            },
            setup: firstMethod.setup || 0,
            quantity: firstBreak.qty,
            unitPrice: initialUnitPrice,
            subtotal: initialUnitPrice * firstBreak.qty + firstBreak.setup,
            customDescription: "",
            groupId: "",
            groupName: "",
            isClothing: isClothing, // Store clothing flag
          });

          setSelectedPrintMethod(firstMethod);
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };
  const handlePrintMethodChange = (methodKey) => {
    const method = availablePrintMethods.find((m) => m.key === methodKey);
    if (!method) return;

    setSelectedPrintMethod(method);

    const sortedBreaks = [...(method.price_breaks || [])].sort(
      (a, b) => a.qty - b.qty
    );
    const firstBreak = sortedBreaks[0] || { qty: 50, price: 0 };

    // Check if this is a clothing product
    const isClothing = currentItem.isClothing;

    let unitPrice = 0;
    let decorationPrice = 0;
    

    if (isClothing) {
      // For clothing: use base price, decoration cost is separate and editable
      unitPrice = firstBreak.price;
      decorationPrice = getClothingAdditionalCost(method.description);
    } else {
      // For non-clothing: original logic
      const basePrice =
        productDetails?.product?.prices?.price_groups?.[0]?.base_price
          ?.price_breaks?.[0]?.price || 0;

      if (method.type === "base") {
        unitPrice = firstBreak.price;
        decorationPrice = 0;
      } else {
        unitPrice = basePrice;
        decorationPrice = firstBreak.price;
      }
    }

    setCurrentItem((prev) => ({
      ...prev,
      decoration: {
        method: method.description,
        price: decorationPrice,
        description: method.description,
      },
      setup: method.setup || 0,
      quantity: firstBreak.qty,
      unitPrice: unitPrice,
    }));
  };
  // Handle quantity change
  const handleQuantityChange = (qty) => {
    const quantity = parseInt(qty) || 0;

    if (!selectedPrintMethod) return;

    // Find appropriate price break
    const sortedBreaks = [...(selectedPrintMethod.price_breaks || [])].sort(
      (a, b) => a.qty - b.qty
    );

    let selectedBreak = sortedBreaks[0];
    for (let i = 0; i < sortedBreaks.length; i++) {
      if (quantity >= sortedBreaks[i].qty) {
        selectedBreak = sortedBreaks[i];
      }
    }

    // Check if this is a clothing product
    const isClothing = currentItem.isClothing;

    let unitPrice = 0;
    let decorationPrice = 0;

    if (isClothing) {
      // For clothing: use price break for unit, keep existing decoration price or calculate new
      unitPrice = selectedBreak?.price || 0;
      // Keep the current decoration price if it's been manually edited, otherwise recalculate
      decorationPrice =
        currentItem.decoration.price ||
        getClothingAdditionalCost(selectedPrintMethod.description);
    } else {
      // For non-clothing: original logic
      const basePrice =
        productDetails?.product?.prices?.price_groups?.[0]?.base_price
          ?.price_breaks?.[0]?.price || 0;

      if (selectedPrintMethod.type === "base") {
        unitPrice = selectedBreak?.price || 0;
        decorationPrice = 0;
      } else {
        unitPrice = basePrice;
        decorationPrice = selectedBreak?.price || 0;
      }
    }

    setCurrentItem((prev) => ({
      ...prev,
      quantity,
      unitPrice,
      decoration: {
        ...prev.decoration,
        price: decorationPrice,
      },
    }));
  };

  // Add item to quote
  const addItemToQuote = () => {
    // Validation
    if (!currentItem.productName) {
      toast.error("Please select a product");
      return;
    }
    if (!currentItem.quantity || currentItem.quantity < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (editingItemId) {
      // Update existing item
      setQuoteItems((prev) =>
        prev.map((item) =>
          item._id === editingItemId
            ? { ...currentItem, _id: editingItemId }
            : item
        )
      );
      setEditingItemId(null);
    } else {
      // Add new item
      setQuoteItems((prev) => [...prev, { ...currentItem, _id: Date.now() }]);
    }

    // Reset current item
    resetCurrentItem();
    setUploadedImage(null)
  };

  // Edit item
  const editItem = (itemId) => {
    const item = quoteItems.find((i) => i._id === itemId);
    if (item) {
      setCurrentItem(item);
      setEditingItemId(itemId);
      if (!item.productId) {
        // It's a custom product
        setIsCustomProduct(true);
        setProductSearch("");
        setProductDetails(null);
        setSelectedProduct(null);
        setSelectedPrintMethod(null);
        setAvailableColors([]);
        setAvailableSizes([]);
        setAvailablePrintMethods([]);
      } else {
        // It's a product from API
        setIsCustomProduct(false);
        setCurrentItem(item);
        selectProduct({ id: item.productId, name: item.productName });
      }
    }
  };

  // Reset current item
  const resetCurrentItem = () => {
    setCurrentItem({
      productId: null,
      productName: "",
      productCode: "",
      productImage: "",
      productSKU: "",
      color: "",
      size: "",
      decoration: {
        method: "",
        price: 0,
        description: "",
      },
      setup: 0,
      quantity: 50,
      unitPrice: 0,
      subtotal: 0,
      customDescription: "",
      groupId: "",
      groupName: "",
    });
    setProductSearch("");
    setProductDetails(null);
    setSelectedProduct(null);
    setSelectedPrintMethod(null);
    setAvailableColors([]);
    setAvailableSizes([]);
    setAvailablePrintMethods([]);
    setEditingItemId(null);
  };

  // Remove item from quote
  const removeItem = (itemId) => {
    setQuoteItems((prev) => prev.filter((item) => item._id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
      resetCurrentItem();
    }
  };

  // Submit quote
  const handleSubmit = async () => {
    // Validation
    const newErrors = {};

    if (!customerData.name)
      newErrors.customerName = "Customer name is required";
    if (!customerData.email)
      newErrors.customerEmail = "Customer email is required";
    if (quoteItems.length === 0) newErrors.items = "Add at least one item";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const quotePayload = {
        customer: customerData,
        createdBy,
        companyDetails,
        items: quoteItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          productImage: item.productImage,
          productSKU: item.productSKU,
          color: item.color,
          size: item.size,
          decoration: item.decoration,
          setup: item.setup,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          customDescription: item.customDescription,
          groupId: item.groupId,
          groupName: item.groupName,
        })),
        subtotal,
        discount,
        total,
        reference: quoteDetails.reference,
        deadline: quoteDetails.deadline,
        showReference: quoteDetails.showReference,
        showDeadline: quoteDetails.showDeadline,
        showTotalAmount: quoteDetails.showTotalAmount,
      };

      const aToken = localStorage.getItem("aToken");
      const url = id
        ? `${BACKEND_URL}/api/admin-quotes/update-quote/${id}`
        : `${BACKEND_URL}/api/admin-quotes/add-quote`;
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          aToken,
        },
        body: JSON.stringify(quotePayload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Quote created and sent successfully!");
        window.location.href = "/admin-quotes";
      } else {
        toast.error(data.message || "Failed to create quote");
      }
    } catch (error) {
      console.error("Error creating quote:", error);
      toast.error("Error creating quote");
    } finally {
      setLoading(false);
    }
  };
  if (editLoading) {
    return (
      <div className="w-full h-[100vh] flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Create New Quote
            </h1>
            <p className="text-gray-600 mt-1">
              Fill in the details below to create a quote
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 flex items-center bg-gray-300 gap-1 text-gray-800 hover:bg-gray-400 rounded-lg transition"
          >
            <ArrowLeft className="w-4" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Company Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Company Name</p>
                  <p className="font-medium">{companyDetails.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{companyDetails.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{companyDetails.address}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{companyDetails.phone}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Customer Details
              </h2>

              {/* Customer Search */}
              <div className="mb-4 relative" ref={customerDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customer
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Customer Suggestions Dropdown */}
                {showCustomerDropdown && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerSuggestions.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => selectCustomer(customer)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Customer Entry */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.customerName ? "border-red-500" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerData.email}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        email: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.customerEmail ? "border-red-500" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type *
                  </label>
                  <select
                    name="customerType"
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        type: e.target.value,
                      });
                    }}
                    value={customerData.type}
                    a
                    id="customerType"
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.customerEmail ? "border-red-500" : ""
                    }`}
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>

              {/* Billing Address */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <MapPin size={16} className="inline mr-1" />
                    Billing Address
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {showAddressForm ? (
                      <>
                        <ChevronUp size={14} /> Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> Edit/Add
                      </>
                    )}
                  </button>
                </div>

                {!showAddressForm &&
                  customerData.defaultAddress.addressLine && (
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium">
                        {customerData.defaultAddress.firstName}{" "}
                        {customerData.defaultAddress.lastName}
                      </p>
                      <p>{customerData.defaultAddress.addressLine}</p>
                      <p>
                        {customerData.defaultAddress.city},{" "}
                        {customerData.defaultAddress.state}{" "}
                        {customerData.defaultAddress.postalCode}
                      </p>
                      <p>{customerData.defaultAddress.country}</p>
                      {customerData.defaultAddress.companyName && (
                        <p className="text-gray-600">
                          {customerData.defaultAddress.companyName}
                        </p>
                      )}
                    </div>
                  )}

                {showAddressForm && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={customerData.defaultAddress.firstName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            firstName: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={customerData.defaultAddress.lastName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            lastName: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Country *"
                      value={customerData.defaultAddress.country}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={customerData.defaultAddress.state}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={customerData.defaultAddress.city}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code *"
                      value={customerData.defaultAddress.postalCode}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            postalCode: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address Line *"
                      value={customerData.defaultAddress.addressLine}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            addressLine: e.target.value,
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Company Name (Optional)"
                      value={customerData.defaultAddress.companyName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            companyName: e.target.value,
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Additional Info (Optional)"
                      value={customerData.defaultAddress.additional}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultAddress: {
                            ...customerData.defaultAddress,
                            additional: e.target.value,
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 border rounded"
                    />
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-8">
                    <label className="block text-sm font-medium text-gray-700">
                      <Package size={16} className="inline mr-1" />
                      Shipping Address
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomerData({
                              ...customerData,
                              defaultShippingAddress: {
                                ...customerData.defaultShippingAddress,
                                firstName:
                                  customerData.defaultAddress.firstName,
                                lastName: customerData.defaultAddress.lastName,
                                country: customerData.defaultAddress.country,
                                state: customerData.defaultAddress.state,
                                city: customerData.defaultAddress.city,
                                postalCode:
                                  customerData.defaultAddress.postalCode,
                                addressLine:
                                  customerData.defaultAddress.addressLine,
                                companyName:
                                  customerData.defaultAddress.companyName,
                              },
                            });
                          } else {
                            setCustomerData({
                              ...customerData,
                              defaultShippingAddress: {
                                firstName: "",
                                lastName: "",
                                country: "",
                                state: "",
                                city: "",
                                postalCode: "",
                                addressLine: "",
                                companyName: "",
                              },
                            });
                          }
                        }}
                        type="checkbox"
                        id="copyBilling"
                      />
                      <label htmlFor="copyBilling" className="text-sm">
                        Copy Billing Address
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowShippingAddressForm(!showShippingAddressForm)
                    }
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {showShippingAddressForm ? (
                      <>
                        <ChevronUp size={14} /> Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> Edit/Add
                      </>
                    )}
                  </button>
                </div>

                {!showShippingAddressForm &&
                  customerData.defaultShippingAddress.addressLine && (
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <p className="font-medium">
                        {customerData.defaultShippingAddress.firstName}{" "}
                        {customerData.defaultShippingAddress.lastName}
                      </p>
                      <p>{customerData.defaultShippingAddress.addressLine}</p>
                      <p>
                        {customerData.defaultShippingAddress.city},{" "}
                        {customerData.defaultShippingAddress.state}{" "}
                        {customerData.defaultShippingAddress.postalCode}
                      </p>
                      <p>{customerData.defaultShippingAddress.country}</p>
                      {customerData.defaultShippingAddress.companyName && (
                        <p className="text-gray-600">
                          {customerData.defaultShippingAddress.companyName}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail size={12} />{" "}
                          {customerData.defaultShippingAddress.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} />{" "}
                          {customerData.defaultShippingAddress.phone}
                        </span>
                      </div>
                    </div>
                  )}

                {showShippingAddressForm && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={customerData.defaultShippingAddress.firstName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            firstName: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={customerData.defaultShippingAddress.lastName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            lastName: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Country *"
                      value={customerData.defaultShippingAddress.country}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={customerData.defaultShippingAddress.state}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={customerData.defaultShippingAddress.city}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code *"
                      value={customerData.defaultShippingAddress.postalCode}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            postalCode: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address Line *"
                      value={customerData.defaultShippingAddress.addressLine}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            addressLine: e.target.value,
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Company Name *"
                      value={customerData.defaultShippingAddress.companyName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            companyName: e.target.value,
                          },
                        })
                      }
                      className="col-span-2 px-3 py-2 border rounded"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={customerData.defaultShippingAddress.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            email: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={customerData.defaultShippingAddress.phone}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          defaultShippingAddress: {
                            ...customerData.defaultShippingAddress,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-2 border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Add Product Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Add Product
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomProduct(!isCustomProduct);
                    resetCurrentItem();
                    setProductSearch("");
                    setUploadedImage(null)
                  }}
                  className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                    isCustomProduct
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {isCustomProduct ? "Search Products" : "Custom Product"}
                </button>
              </div>

              {!isCustomProduct ? (
                <>
                  {/* Product Search */}
                  <div className="mb-4 relative" ref={productDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Product
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search by name or SKU..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Product Suggestions Dropdown */}
                    {showProductDropdown && productSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {productSuggestions.map((product, index) => (
                          <div
                            key={index}
                            onClick={() => selectProduct(product)}
                            className="px-4 py-3 hover:bg-blue-50 flex gap-5 items-center cursor-pointer border-b last:border-b-0 transition"
                          >
                            <img src={product.image} className="w-12" alt="" />
                            <div className="flex flex-col ">
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>
                              <p className=" text-gray-500">
                                {product.supplier}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details Form */}
                  {productDetails && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Product Image and Name */}
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        {uploadLoading ? (
                          <div className="w-20 h-20 flex justify-center items-center rounded border">
                            <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          (uploadedImage
                            ? uploadedImage
                            : currentItem.productImage) && (
                            <img
                              src={currentItem.productImage}
                              alt={currentItem.productName}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )
                        )}
                        <div>
                          <p className="font-medium text-lg">
                            {currentItem.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            SKU: {currentItem.productSKU}
                          </p>
                          <p className="text-sm text-gray-600">
                            Code: {currentItem.productCode}
                          </p>
                        </div>
                        <div>
                          <label
                            className="w-20 h-20 flex flex-col items-center justify-center 
                     bg-white border-2 border-dashed border-gray-300 rounded-xl
                     cursor-pointer hover:border-gray-400 transition"
                          >
                            <input
                              type="file"
                              onChange={handleAddImage}
                              className="hidden"
                            />

                            {/* Upload Icon */}
                            <FaFileUpload />

                            <span className="text-xs text-gray-500 mt-1">
                              Upload
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Color Selection */}
                      {availableColors.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                          </label>
                          <select
                            value={currentItem.color}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                color: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {availableColors.map((color, index) => (
                              <option key={index} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Size Selection */}
                      {availableSizes.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Size
                          </label>
                          <select
                            value={currentItem.size}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                size: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {availableSizes.map((size, index) => (
                              <option key={index} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Print Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Print Method / Decoration
                        </label>
                        <select
                          value={selectedPrintMethod?.key || ""}
                          onChange={(e) =>
                            handlePrintMethodChange(e.target.value)
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {availablePrintMethods.map((method) => (
                            <option key={method.key} value={method.key}>
                              {method.description}{" "}
                              {method.type === "base"
                                ? "(Unbranded)"
                                : "(Branded)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={currentItem.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          min="1"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {selectedPrintMethod &&
                          selectedPrintMethod.price_breaks.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Available price breaks:{" "}
                              {selectedPrintMethod.price_breaks
                                .map((pb) => pb.qty)
                                .join(", ")}
                            </p>
                          )}
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          value={currentItem.unitPrice}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Decoration Price */}
                      {((currentItem.decoration.method &&
                        selectedPrintMethod?.type === "addition") ||
                        currentItem.isClothing) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Decoration Price ($)
                          </label>
                          <input
                            type="number"
                            value={currentItem.decoration.price}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                decoration: {
                                  ...currentItem.decoration,
                                  price: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Setup Price ($)
                        </label>
                        <input
                          type="number"
                          value={currentItem.setup}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              setup: parseFloat(e.target.value) || 0,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Custom Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Description (Optional)
                        </label>
                        <textarea
                          value={currentItem.customDescription}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              customDescription: e.target.value,
                            })
                          }
                          rows="2"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Add any custom notes or description..."
                        />
                      </div>

                      {/* Subtotal Display */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Item Subtotal
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          ${currentItem.subtotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          ({currentItem.quantity} × $
                          {currentItem.unitPrice.toFixed(2)}
                          {currentItem.isClothing && selectedPrintMethod && (
                            <span className="text-blue-600">
                              {" "}
                              (incl. decoration cost)
                            </span>
                          )}
                          {!currentItem.isClothing &&
                            currentItem.decoration.price > 0 &&
                            ` + ${currentItem.decoration.price.toFixed(
                              2
                            )} decoration`}
                          )
                        </p>
                      </div>

                      {/* Add / Reset Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={addItemToQuote}
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          {editingItemId ? (
                            <>
                              <Save size={16} /> Update Item
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Add Item to Quote
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetCurrentItem}
                          type="button"
                          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                          <X size={16} /> Reset
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Custom Product Form */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800 font-medium">
                        ℹ️ Custom Product Mode - Manually enter all product
                        details
                      </p>
                    </div>

                    {/* Product Name */}
                    <div>
                      <label
                        className="w-20 relative h-20 flex flex-col items-center justify-center 
                     bg-white border-2 border-dashed border-gray-300 rounded-xl
                     cursor-pointer hover:border-gray-400 transition"
                      >
                        {uploadLoading ? (
                          <div className="w-20 h-20 absolute bg-white flex justify-center items-center rounded border">
                            <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          uploadedImage && (
                            <img
                              src={uploadedImage}
                              className="w-full h-full absolute"
                              alt=""
                            />
                          )
                        )}
                        <input
                          type="file"
                          onChange={handleAddImage}
                          className="hidden"
                        />

                        {/* Upload Icon */}
                        {!uploadedImage && (
                          <div className="flex flex-col justify-center items-center" >
                            <FaFileUpload />

                            <span className="text-xs text-gray-500 mt-1">
                              Upload
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={currentItem.productName}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            productName: e.target.value,
                          })
                        }
                        placeholder="Enter product name"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Product Code & SKU */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Code
                        </label>
                        <input
                          type="text"
                          value={currentItem.productCode}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              productCode: e.target.value,
                            })
                          }
                          placeholder="e.g., PROD-001"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={currentItem.productSKU}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              productSKU: e.target.value,
                            })
                          }
                          placeholder="e.g., SKU-001"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Color & Size */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <input
                          type="text"
                          value={currentItem.color}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              color: e.target.value,
                            })
                          }
                          placeholder="e.g., Black, White"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size
                        </label>
                        <input
                          type="text"
                          value={currentItem.size}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              size: e.target.value,
                            })
                          }
                          placeholder="e.g., S, M, L, XL"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Decoration Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decoration Method
                      </label>
                      <input
                        type="text"
                        value={currentItem.decoration.method}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            decoration: {
                              ...currentItem.decoration,
                              method: e.target.value,
                              description: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., Screen Print, Embroidery"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Decoration Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decoration Price ($)
                      </label>
                      <input
                        type="number"
                        value={currentItem.decoration.price}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            decoration: {
                              ...currentItem.decoration,
                              price: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Decoration Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decoration Description
                      </label>
                      <input
                        type="text"
                        value={currentItem.decoration.description}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            decoration: {
                              ...currentItem.decoration,
                              description: e.target.value,
                            },
                          })
                        }
                        placeholder="Additional decoration details"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: parseInt(e.target.value) || 0,
                          })
                        }
                        min="1"
                        placeholder="50"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price ($) *
                      </label>
                      <input
                        type="number"
                        value={currentItem.unitPrice}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Setup Price ($) *
                      </label>
                      <input
                        type="number"
                        value={currentItem.setup}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            setup: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Custom Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Description
                      </label>
                      <textarea
                        value={currentItem.customDescription}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            customDescription: e.target.value,
                          })
                        }
                        rows="3"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Add any custom notes or description..."
                      />
                    </div>

                    {/* Group Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={currentItem.groupName}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            groupName: e.target.value,
                            groupId: e.target.value
                              ? Date.now().toString()
                              : "",
                          })
                        }
                        placeholder="e.g., Batch A, Team Orders"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Subtotal Display */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Item Subtotal
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${currentItem.subtotal.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        ({currentItem.quantity} × $
                        {currentItem.unitPrice.toFixed(2)}
                        {currentItem.decoration.price > 0 &&
                          ` + ${currentItem.decoration.price.toFixed(
                            2
                          )} decoration`}
                        )
                      </p>
                    </div>

                    {/* Add / Reset Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={addItemToQuote}
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        {editingItemId ? (
                          <>
                            <Save size={16} /> Update Item
                          </>
                        ) : (
                          <>
                            <Plus size={16} /> Add Custom Item
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetCurrentItem}
                        type="button"
                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        <X size={16} /> Reset
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar / Summary */}
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6  top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-blue-600" />
                Quote Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={discount.type}
                      onChange={(e) =>
                        setDiscount((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="fixed">$ Fixed</option>
                      <option value="percentage">% Percent</option>
                    </select>
                    <input
                      type="number"
                      value={discount.value}
                      onChange={(e) =>
                        setDiscount((prev) => ({
                          ...prev,
                          value: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Discount amount:{" "}
                    <span className="font-medium text-red-600">
                      -${Number(discount.amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {id ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || quoteItems.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Edit & Send Quote
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || quoteItems.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save & Send Quote
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Reference & Deadline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Reference & Deadline</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={quoteDetails.reference}
                    onChange={(e) =>
                      setQuoteDetails((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g., Project XYZ"
                  />
                  <label className="inline-flex items-center mt-2 text-sm">
                    <input
                      type="checkbox"
                      checked={quoteDetails.showReference}
                      onChange={(e) =>
                        setQuoteDetails((prev) => ({
                          ...prev,
                          showReference: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-gray-600">Show to customer</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={
                      quoteDetails.deadline
                        ? quoteDetails.deadline.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setQuoteDetails((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <label className="inline-flex items-center mt-2 text-sm">
                    <input
                      type="checkbox"
                      checked={quoteDetails.showDeadline}
                      onChange={(e) =>
                        setQuoteDetails((prev) => ({
                          ...prev,
                          showDeadline: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-gray-600">Show to customer</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Display Options</h3>
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Show total amount in quote
                </span>
                <input
                  type="checkbox"
                  checked={quoteDetails.showTotalAmount}
                  onChange={(e) =>
                    setQuoteDetails((prev) => ({
                      ...prev,
                      showTotalAmount: e.target.checked,
                    }))
                  }
                  className="ml-2"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg mt-5 shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calculator size={20} className="text-blue-600" />
            Quote Items ({quoteItems.length})
          </h2>

          {quoteItems.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                No items added yet. Search and add products above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b-2">
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-2">Details</th>
                    <th className="py-3 px-2 text-right">Qty</th>
                    <th className="py-3 px-2 text-right">Unit Price</th>
                    <th className="py-3 px-2 text-right">Decoration</th>
                    <th className="py-3 px-2 text-right">Setup</th>
                    <th className="py-3 px-2 text-right">Subtotal</th>
                    <th className="py-3 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quoteItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.productName}
                            </div>
                            <div className="text-xs text-gray-500">
                              SKU: {item.productSKU}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-xs space-y-1">
                          {item.color && (
                            <div className="text-gray-600">
                              Color: {item.color}
                            </div>
                          )}
                          {item.size && (
                            <div className="text-gray-600">
                              Size: {item.size}
                            </div>
                          )}
                          {item.customDescription && (
                            <div className="text-gray-400 italic">
                              {item.customDescription}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {item.decoration?.method ? (
                          <div>
                            <div className="text-xs text-gray-600">
                              {item.decoration.method}
                            </div>
                            <div className="font-medium">
                              ${Number(item.decoration.price || 0).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right  text-gray-600">
                        ${Number(item.setup).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-blue-600">
                        ${Number(item.subtotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => editItem(item._id)}
                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                            title="Edit item"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setIsCustomProduct(true);
                              setCurrentItem(item);
                            }}
                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
                            title="Remove item"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => removeItem(item._id)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
