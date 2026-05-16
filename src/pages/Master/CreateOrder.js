import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Label,
  Badge,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import config from "../../config";

const apiUrl = config.api.API_URL;

// ── Color name → hex lookup for PromoData colors without hex codes ──
const COLOR_NAME_HEX = {
  black: "#000000", white: "#FFFFFF", navy: "#001F3F", red: "#FF0000",
  blue: "#0000FF", green: "#008000", grey: "#808080", gray: "#808080",
  olive: "#808000", sandstone: "#786D5F", orange: "#FF8C00", yellow: "#FFD700",
  pink: "#FFC0CB", purple: "#800080", brown: "#8B4513", beige: "#F5F5DC",
  maroon: "#800000", teal: "#008080", cyan: "#00FFFF", khaki: "#C3B091",
  charcoal: "#36454F", cream: "#FFFDD0", gold: "#FFD700", silver: "#C0C0C0",
  coral: "#FF7F50", burgundy: "#800020", lime: "#00FF00", tan: "#D2B48C",
  royal: "#4169E1", "royal blue": "#4169E1", "sky blue": "#87CEEB",
  "light blue": "#ADD8E6", "dark blue": "#00008B", "dark green": "#006400",
  "light grey": "#D3D3D3", "dark grey": "#A9A9A9", stone: "#928E85",
  aqua: "#00FFFF", magenta: "#FF00FF", indigo: "#4B0082", violet: "#EE82EE",
  peach: "#FFDAB9", mint: "#98FF98", lavender: "#E6E6FA", slate: "#708090",
  sand: "#C2B280", taupe: "#483C32", wine: "#722F37", rust: "#B7410E",
  sage: "#BCB88A", forest: "#228B22", emerald: "#50C878", cobalt: "#0047AB",
  crimson: "#DC143C", scarlet: "#FF2400", ivory: "#FFFFF0", pewter: "#899499",
};

/** Resolve a color name (possibly compound like "Black/White") to hex value(s) */
const resolveColorHex = (name, hex) => {
  if (hex) return [hex];
  if (!name) return ["#ccc"];
  const parts = name.split("/").map((s) => s.trim());
  return parts.map((part) => {
    const lower = part.toLowerCase();
    if (COLOR_NAME_HEX[lower]) return COLOR_NAME_HEX[lower];
    
    // Check for keyword matches (e.g. "Deep Black" -> "black")
    const match = Object.keys(COLOR_NAME_HEX).find(key => lower.includes(key));
    if (match) return COLOR_NAME_HEX[match];

    // Try CSS named color — browser will handle it
    return lower;
  });
};

/** Build CSS background for a color circle (supports single + dual/multi colors) */
const colorCircleBg = (hexList) => {
  if (!hexList || hexList.length === 0) return "#ccc";
  if (hexList.length === 1) return hexList[0];
  // Multi-color: split circle using linear-gradient
  const pct = 100 / hexList.length;
  const stops = hexList.map((h, i) => `${h} ${i * pct}% ${(i + 1) * pct}%`).join(", ");
  return `linear-gradient(135deg, ${stops})`;
};

const CreateOrder = () => {
  const navigate = useNavigate();
  const { adminData } = useContext(AuthContext);

  // ── Step management ────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Step 1: Customer ───────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [customerPhoneOverride, setCustomerPhoneOverride] = useState("");
  const [guestInfo, setGuestInfo] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  // ── Step 2: Products ───────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  // Product config modal
  const [configModal, setConfigModal] = useState(false);
  const [configProduct, setConfigProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  // Customization for config modal
  const [enableCustomization, setEnableCustomization] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [customizationFile, setCustomizationFile] = useState(null);
  const [customizationImageUrl, setCustomizationImageUrl] = useState("");
  const [addLogoLater, setAddLogoLater] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Global customization options (for products without mappings)
  const [globalMethods, setGlobalMethods] = useState([]);
  const [globalPositions, setGlobalPositions] = useState([]);

  // ── Step 3: Review & Delivery ──────────────────────
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "Australia",
  });
  const [notes, setNotes] = useState("");

  // ── Coupon ─────────────────────────────────────────
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // ══════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════

  // Debounced customer search
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/api/admin/orders/search-customers`, {
          params: { search: customerSearch, limit: 15 },
        });
        if (res.data?.success) setCustomers(res.data.data);
      } catch (err) {
        console.error("Customer search error:", err);
      } finally {
        setCustomerLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      setProductQuery(productSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch products
  useEffect(() => {
    if (currentStep !== 2) return;
    const fetchProducts = async () => {
      setProductLoading(true);
      try {
        const params = { limit: 30 };
        if (productQuery) params.search = productQuery;
        if (categoryFilter) params.categoryId = categoryFilter.value;
        const res = await axios.get(`${apiUrl}/api/admin/orders/search-products`, { params });
        if (res.data?.success) setProducts(res.data.data);
      } catch (err) {
        console.error("Product search error:", err);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProducts();
  }, [productQuery, categoryFilter, currentStep]);

  // Fetch categories, delivery types, coupons, customization options on mount
  useEffect(() => {
    const fetchAll = async () => {
      const [catRes, dtRes, coupRes, custRes] = await Promise.allSettled([
        axios.get(`${apiUrl}/api/admin/orders/categories`),
        axios.get(`${apiUrl}/api/admin/orders/delivery-types-list`),
        axios.get(`${apiUrl}/api/admin/orders/active-coupons`),
        axios.get(`${apiUrl}/api/admin/orders/customization-options`),
      ]);
      if (catRes.status === "fulfilled" && catRes.value.data?.success)
        setCategories(catRes.value.data.data);
      if (dtRes.status === "fulfilled" && dtRes.value.data?.success)
        setDeliveryTypes(dtRes.value.data.data);
      if (coupRes.status === "fulfilled" && coupRes.value.data?.success)
        setCoupons(coupRes.value.data.data);
      if (custRes.status === "fulfilled" && custRes.value.data?.success) {
        setGlobalMethods(custRes.value.data.data.methods || []);
        setGlobalPositions(custRes.value.data.data.positions || []);
      }
    };
    fetchAll();
  }, []);

  // ══════════════════════════════════════════════════════
  // PRODUCT CONFIGURATION HELPERS
  // ══════════════════════════════════════════════════════

  const [configLoading, setConfigLoading] = useState(false);
  const openConfigModal = async (product) => {
    // 1. Initial basic setup from search result (so modal opens quickly)
    setConfigProduct(product);
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedQuantity(product?.priceTiers?.[0]?.minQuantity || 1);
    setEnableCustomization(false);
    setSelectedMethod(null);
    setSelectedPositions([]);
    setCustomizationFile(null);
    setCustomizationImageUrl("");
    setAddLogoLater(false);
    setUploadingArtwork(false);
    setManualUnitPrice("");
    setConfigModal(true);

    // 2. Fetch FULL product details (all variants, sizes, etc.)
    setConfigLoading(true);
    try {
      const productId = product.id || product._id;
      const res = await axios.get(`${apiUrl}/api/admin/orders/product-details/${productId}`);
      if (res.data?.success) {
        const fullProduct = res.data.data;
        setConfigProduct(fullProduct);
        // Refresh default quantity if full data has better tiers
        if (fullProduct.priceTiers?.[0]?.minQuantity) {
          setSelectedQuantity(fullProduct.priceTiers[0].minQuantity);
        }
      }
    } catch (err) {
      console.error("Error fetching full product details:", err);
    } finally {
      setConfigLoading(false);
    }
  };


  const getUniqueColors = (product) => {
    if (!product?.variants) return [];
    const colorMap = {};
    product.variants.forEach((v) => {
      if (v.color && !colorMap[v.color.id]) {
        colorMap[v.color.id] = v.color;
      }
    });
    return Object.values(colorMap);
  };

  const getAvailableSizes = (product, colorId) => {
    if (!product?.variants || !colorId) return [];
    return product.variants
      .filter((v) => v.color?.id === colorId)
      .map((v) => ({
        variant: v,
        size: v.size,
        stock: v.stockQty,
      }));
  };

  const getSelectedVariant = () => {
    if (!configProduct || !selectedColor || !selectedSize) return null;
    return configProduct.variants.find(
      (v) => v.color?.id === selectedColor && v.size?.id === selectedSize
    );
  };

  /** Resolve unit price from tier list for a given quantity */
  const getUnitPrice = (priceTiers, quantity) => {
    if (!priceTiers?.length) return 0;
    // Sort descending by minQuantity to match largest qualifying tier
    const sorted = [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    for (const t of sorted) {
      if (quantity >= t.minQuantity) return t.unitPrice;
    }
    // Fallback: smallest tier
    return priceTiers[0].unitPrice;
  };

  const getCustomizationCharge = () => {
    if (!enableCustomization) return 0;
    if (configProduct?.artworkSource === "promodata") {
      if (!selectedMethod) return 0;
      // Find the method object in productCustomizationMethods to get priceTiers
      const methodObj = (configProduct.productCustomizationMethods || []).find(
        (m) => m.customizationMethod?.id === selectedMethod.id
      );
      if (!methodObj?.priceTiers) return 0;
      return getUnitPrice(methodObj.priceTiers, selectedQuantity);
    }
    if (!selectedPositions.length) return 0;
    return selectedPositions.reduce((sum, p) => sum + (p.priceAdjustment || 0), 0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCustomizationFile(file);
    setUploadingArtwork(true);

    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(`${apiUrl}/api/admin/orders/upload-artwork`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data.data?.url) {
        setCustomizationImageUrl(res.data.data.url);
        toast.success("Artwork uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload artwork");
    } finally {
      setUploadingArtwork(false);
    }
  };

  const addItemToOrder = () => {
    const variant = getSelectedVariant();
    if (!variant) {
      toast.error("Please select color and size");
      return;
    }

    const priceTiers = configProduct.priceTiers || [];
    const tierPrice = getUnitPrice(priceTiers, selectedQuantity);
    const unitPrice = (tierPrice > 0 ? tierPrice : parseFloat(manualUnitPrice) || 0) + (variant.priceAdjustment || 0);
    const customizationCharge = getCustomizationCharge();

    let customizationData = null;
    if (enableCustomization && selectedMethod) {
      customizationData = {
        applicationMethodName: selectedMethod.applicationMethod,
        applicationType: selectedMethod.applicationType,
        method: selectedMethod,
        positions: selectedPositions.map((p) => ({
          positionId: p.customizationPosition?.id || p.id,
          name: p.customizationPosition?.positionName || p.positionName,
          priceAdjustment: p.priceAdjustment || 0,
        })),
        pricing: {
          setupFee: selectedMethod.setupCharge || 0,
          positionCharges: customizationCharge,
        },
        content: {
          type: "IMAGE",
          imageUrl: customizationImageUrl || null,
        },
      };
    }

    const newItem = {
      id: Date.now(),
      productId: configProduct.id,
      variantId: variant.id,
      quantity: selectedQuantity,
      unitPrice,
      priceTiers, // store for recalculation on qty change
      variantPriceAdj: variant.priceAdjustment || 0,
      customizationCharge,
      hasCustomization: enableCustomization && !!selectedMethod,
      customizationData,
      customizationImageUrl: customizationImageUrl || null,
      addLogoLater,
      // Display info
      productName: configProduct.name,
      productCode: configProduct.productCode,
      colorName: variant.color?.name,
      sizeName: variant.size?.name,
      sku: variant.sku,
      imageUrl: configProduct.images?.[0]?.imageUrl,
      supplierName: configProduct.supplierName,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setConfigModal(false);
    toast.success(`${configProduct.name} added to order`);
  };

  const removeItem = (itemId) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  /** Update quantity AND recalculate unit price from stored price tiers */
  const updateItemQuantity = (itemId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newUnitPrice = getUnitPrice(item.priceTiers, qty) + (item.variantPriceAdj || 0);
        return { ...item, quantity: qty, unitPrice: newUnitPrice };
      })
    );
  };

  // ══════════════════════════════════════════════════════
  // CALCULATIONS
  // ══════════════════════════════════════════════════════

  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const customizationTotal = orderItems.reduce(
    (sum, item) => sum + (item.customizationCharge || 0) * item.quantity, 0
  );
  const setupFeeTotal = orderItems.reduce((sum, item) => {
    if (item.customizationData?.pricing?.setupFee) {
      return sum + parseFloat(item.customizationData.pricing.setupFee);
    }
    return sum;
  }, 0);

  const deliveryCharge = selectedDeliveryType?.isChargeable
    ? selectedDeliveryType.deliveryCharge || 0
    : 0;

  let discountAmount = 0;
  if (selectedCoupon) {
    discountAmount = (subtotal * selectedCoupon.discountPercentage) / 100;
    if (selectedCoupon.maxDiscountAmount && discountAmount > selectedCoupon.maxDiscountAmount) {
      discountAmount = selectedCoupon.maxDiscountAmount;
    }
  }

  const customizationCharges = customizationTotal + setupFeeTotal;
  const taxableAmount = subtotal + customizationCharges + deliveryCharge - discountAmount;
  const taxAmount = taxableAmount * 0.1;
  const totalAmount = taxableAmount + taxAmount;

  // ══════════════════════════════════════════════════════
  // SUBMIT ORDER
  // ══════════════════════════════════════════════════════

  const handleSubmitOrder = async () => {
    const customerName = guestMode
      ? guestInfo.customerName
      : `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`;
    const customerEmail = guestMode ? guestInfo.customerEmail : selectedCustomer?.email;
    const customerPhone = guestMode ? guestInfo.customerPhone : (selectedCustomer?.phone || customerPhoneOverride);

    if (!customerName || !customerEmail) {
      toast.error("Customer information is required");
      return;
    }
    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.pincode) {
      toast.error("Please fill shipping address (at least address, city, and postcode)");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        websiteUserId: guestMode ? null : selectedCustomer?.id,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        shippingAddress,
        deliveryTypeId: selectedDeliveryType?.id || null,
        couponId: selectedCoupon?.id || null,
        notes,
        items: orderItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          hasCustomization: item.hasCustomization,
          customizationData: item.customizationData,
          customizationImageUrl: item.customizationImageUrl,
          customizationCharge: item.customizationCharge,
          addLogoLater: item.addLogoLater,
        })),
      };

      const res = await axios.post(`${apiUrl}/api/admin/orders/create`, payload);
      if (res.data?.success) {
        toast.success(`Order ${res.data.data.orderNumber} created successfully!`);
        navigate(`/orders/${res.data.data.id}`);
      } else {
        toast.error(res.data?.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Create order error:", err);
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════
  // STEP NAVIGATION
  // ══════════════════════════════════════════════════════

  const canProceedStep1 = guestMode
    ? guestInfo.customerName && guestInfo.customerEmail
    : !!selectedCustomer;

  const canProceedStep2 = orderItems.length > 0;

  const steps = [
    { num: 1, label: "Customer", icon: "ri-user-line" },
    { num: 2, label: "Products", icon: "ri-shopping-bag-line" },
    { num: 3, label: "Review & Submit", icon: "ri-file-list-3-line" },
  ];

  // ══════════════════════════════════════════════════════
  // RENDER: STEP INDICATOR
  // ══════════════════════════════════════════════════════

  const renderStepIndicator = () => (
    <Card className="mb-3">
      <CardBody className="py-3">
        <div className="d-flex justify-content-center align-items-center">
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div
                className="d-flex align-items-center gap-2"
                style={{ cursor: currentStep > step.num ? "pointer" : "default" }}
                onClick={() => currentStep > step.num && setCurrentStep(step.num)}
              >
                <span
                  className={`d-inline-flex align-items-center justify-content-center rounded-circle ${
                    currentStep === step.num
                      ? "bg-primary text-white"
                      : currentStep > step.num
                      ? "bg-success text-white"
                      : "bg-light text-muted"
                  }`}
                  style={{ width: 36, height: 36, fontSize: 14, fontWeight: 600 }}
                >
                  {currentStep > step.num ? <i className="ri-check-line fs-5"></i> : step.num}
                </span>
                <span className={`fw-medium ${currentStep === step.num ? "text-primary" : currentStep > step.num ? "text-success" : "text-muted"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-3" style={{ width: 60, height: 2, background: currentStep > step.num ? "#0ab39c" : "#e9ebec" }}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  // ══════════════════════════════════════════════════════
  // RENDER: STEP 1 - SELECT CUSTOMER
  // ══════════════════════════════════════════════════════

  const renderStep1 = () => (
    <Card>
      <CardHeader className="d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">
          <i className="ri-user-line me-2"></i>Select Customer
        </h5>
        <div className="form-check form-switch mb-0">
          <Input
            type="switch"
            id="guestMode"
            checked={guestMode}
            onChange={() => {
              setGuestMode(!guestMode);
              setSelectedCustomer(null);
            }}
          />
          <Label htmlFor="guestMode" className="form-check-label mb-0">
            Guest Order
          </Label>
        </div>
      </CardHeader>
      <CardBody>
        {guestMode ? (
          <Row className="g-3">
            <Col md={4}>
              <Label className="form-label">Customer Name *</Label>
              <Input
                type="text"
                placeholder="Full name"
                value={guestInfo.customerName}
                onChange={(e) => setGuestInfo({ ...guestInfo, customerName: e.target.value })}
              />
            </Col>
            <Col md={4}>
              <Label className="form-label">Email *</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={guestInfo.customerEmail}
                onChange={(e) => setGuestInfo({ ...guestInfo, customerEmail: e.target.value })}
              />
            </Col>
            <Col md={4}>
              <Label className="form-label">Phone</Label>
              <Input
                type="text"
                placeholder="Phone number"
                value={guestInfo.customerPhone}
                onChange={(e) => setGuestInfo({ ...guestInfo, customerPhone: e.target.value })}
              />
            </Col>
          </Row>
        ) : (
          <>
            <div className="search-box mb-3">
              <Input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <i className="ri-search-line search-icon"></i>
            </div>

            {customerLoading && (
              <div className="text-center py-3">
                <Spinner size="sm" /> Searching...
              </div>
            )}

            {selectedCustomer && (
              <div className="mb-0">
                <Alert color="success" className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <i className="ri-user-fill me-2"></i>
                    <strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong>
                    <span className="ms-3 text-muted">{selectedCustomer.email}</span>
                    {selectedCustomer.companyName && (
                      <span className="ms-3 text-muted">
                        <i className="ri-building-line me-1"></i>{selectedCustomer.companyName}
                      </span>
                    )}
                  </div>
                  <Button size="sm" color="light" onClick={() => { setSelectedCustomer(null); setCustomerPhoneOverride(""); }}>
                    <i className="ri-close-line"></i> Change
                  </Button>
                </Alert>
              </div>
            )}

            {!selectedCustomer && customers.length > 0 && (
              <div className="table-responsive">
                <Table hover className="mb-0 table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Company</th>
                      <th style={{ width: 80 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-medium">{c.firstName} {c.lastName}</td>
                        <td>{c.email}</td>
                        <td>{c.phone || "-"}</td>
                        <td className="text-muted">{c.companyName || "-"}</td>
                        <td>
                          <Button
                            size="sm"
                            color="primary"
                            onClick={() => {
                              setSelectedCustomer(c);
                              if (c.addresses?.[0]) {
                                const addr = c.addresses[0];
                                setShippingAddress({
                                  addressLine1: addr.addressLine1 || "",
                                  addressLine2: addr.addressLine2 || "",
                                  city: addr.city || "",
                                  state: addr.state || "",
                                  pincode: addr.pincode || "",
                                  country: addr.country || "Australia",
                                });
                              }
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {!selectedCustomer && customerSearch.length >= 2 && !customerLoading && customers.length === 0 && (
              <div className="text-center py-4">
                <i className="ri-user-unfollow-line fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted mb-0">No customers found. Try a different search or use Guest Mode.</p>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );

  // ══════════════════════════════════════════════════════
  // RENDER: STEP 2 - SEARCH & ADD PRODUCTS
  // ══════════════════════════════════════════════════════

  const renderStep2 = () => (
    <>
      <Card>
        <CardHeader className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">
            <i className="ri-search-line me-2"></i>Search Products
          </h5>
          <Badge color="soft-primary" className="py-2 px-3 fs-6">
            <i className="ri-shopping-cart-line me-1"></i>
            {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
          </Badge>
        </CardHeader>
        <CardBody>
          <Row className="g-3 mb-4">
            <Col md={7}>
              <div className="search-box">
                <Input
                  type="text"
                  placeholder="Search by product name or code..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="form-control-lg"
                />
                <i className="ri-search-line search-icon"></i>
              </div>
            </Col>
            <Col md={5}>
              <Select
                isClearable
                placeholder="Filter by category..."
                options={categories.map((c) => ({
                  value: c.id,
                  label: `${c.mainCategory?.name ? c.mainCategory.name + " > " : ""}${c.name}`,
                }))}
                value={categoryFilter}
                onChange={setCategoryFilter}
                styles={{ control: (base) => ({ ...base, minHeight: 42 }) }}
              />
            </Col>
          </Row>

          {productLoading ? (
            <div className="text-center py-5"><Spinner /> Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <i className="ri-box-3-line fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted mb-0">
                {productQuery ? "No products found. Try a different search." : "Search for products above to get started."}
              </p>
            </div>
          ) : (
            <Row className="g-3">
              {products.map((p) => (
                <Col xs={6} sm={4} md={3} key={p.id}>
                  <Card
                    className="border shadow-none h-100 mb-0 product-card"
                    style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
                    onClick={() => openConfigModal(p)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                      {p.images?.[0]?.imageUrl ? (
                        <img
                          src={p.images[0].imageUrl}
                          alt={p.name}
                          style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
                          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }}
                        />
                      ) : null}
                      <div style={{ display: p.images?.[0]?.imageUrl ? "none" : "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                        <i className="ri-image-line text-muted" style={{ fontSize: 32 }}></i>
                      </div>
                    </div>
                    <CardBody className="p-2 d-flex flex-column">
                      <p className="fw-semibold mb-1 text-truncate" title={p.name} style={{ fontSize: 13 }}>
                        {p.name}
                      </p>
                      <small className="text-muted d-block mb-1">{p.productCode}</small>
                      {p.supplierName && (
                        <small className="text-info d-block mb-1" style={{ fontSize: 11 }}>
                          <i className="ri-store-2-line me-1"></i>{p.supplierName}
                        </small>
                      )}
                      <div className="mt-auto pt-1">
                        {p.priceTiers?.length > 0 ? (
                          <div className="d-flex align-items-baseline gap-1">
                            {p.priceTiers.length > 1 ? (
                              <>
                                <small className="text-muted">from</small>
                                <span className="text-success fw-bold" style={{ fontSize: 14 }}>
                                  A${Math.min(...p.priceTiers.map((t) => t.unitPrice)).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-success fw-bold" style={{ fontSize: 14 }}>
                                A${p.priceTiers[0].unitPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <small className="text-muted">Price on request</small>
                        )}
                      </div>
                      {p.isCustomizable && (
                        <Badge color="soft-warning" className="mt-1" style={{ fontSize: 10 }}>
                          <i className="ri-paint-brush-line me-1"></i>Customizable
                        </Badge>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </CardBody>
      </Card>

      {/* Order Items Table */}
      {orderItems.length > 0 && (
        <Card>
          <CardHeader className="bg-soft-success">
            <h5 className="card-title mb-0 text-success">
              <i className="ri-shopping-cart-line me-2"></i>
              Order Items ({orderItems.length})
            </h5>
          </CardHeader>
          <CardBody className="p-0">
            <Table responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 220 }}>Product</th>
                  <th>Color / Size</th>
                  <th>Unit Price</th>
                  <th style={{ width: 110 }}>Qty</th>
                  <th>Customization</th>
                  <th className="text-end">Line Total</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => {
                  const lineTotal = (item.unitPrice + (item.customizationCharge || 0)) * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt=""
                              style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 4, background: "#f8f9fa" }}
                            />
                          )}
                          <div>
                            <span className="fw-medium d-block" style={{ fontSize: 13 }}>{item.productName}</span>
                            <small className="text-muted">{item.productCode}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <small className="fw-medium">{item.colorName}</small>
                        {item.sizeName && item.sizeName !== "Standard" && (
                          <small className="text-muted"> / {item.sizeName}</small>
                        )}
                      </td>
                      <td className="fw-medium">A${item.unitPrice.toFixed(2)}</td>
                      <td>
                        <Input
                          type="number"
                          bsSize="sm"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        {item.hasCustomization ? (
                          <div className="d-flex flex-wrap gap-1">
                            <Badge color="info" className="fw-normal">
                              {item.customizationData?.applicationMethodName}
                            </Badge>
                            {item.customizationImageUrl && (
                              <Badge
                                color="success"
                                className="fw-normal"
                                style={{ cursor: "pointer" }}
                                onClick={() => setPreviewImageUrl(item.customizationImageUrl)}
                                title="Click to preview artwork"
                              >
                                <i className="ri-eye-line me-1"></i>Artwork
                              </Badge>
                            )}
                            {item.addLogoLater && (
                              <Badge color="warning" className="fw-normal">Logo Later</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end fw-semibold">A${lineTotal.toFixed(2)}</td>
                      <td>
                        <Button size="sm" color="soft-danger" className="btn-icon" onClick={() => removeItem(item.id)}>
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={5} className="text-end fw-medium">Subtotal</td>
                  <td className="text-end fw-semibold">A${subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </Table>
          </CardBody>
        </Card>
      )}
    </>
  );

  // ══════════════════════════════════════════════════════
  // RENDER: STEP 3 - REVIEW & SUBMIT
  // ══════════════════════════════════════════════════════

  const renderStep3 = () => (
    <Row>
      <Col lg={7}>
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <h5 className="card-title mb-0">
              <i className="ri-map-pin-line me-2"></i>Shipping Address
            </h5>
          </CardHeader>
          <CardBody>
            <Row className="g-3">
              <Col md={12}>
                <Label className="form-label">Address Line 1 *</Label>
                <Input
                  type="text"
                  value={shippingAddress.addressLine1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                  placeholder="Street address"
                />
              </Col>
              <Col md={12}>
                <Label className="form-label">Address Line 2</Label>
                <Input
                  type="text"
                  value={shippingAddress.addressLine2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                  placeholder="Apt, unit, building (optional)"
                />
              </Col>
              <Col md={4}>
                <Label className="form-label">City *</Label>
                <Input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Label className="form-label">State</Label>
                <Input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Label className="form-label">Postcode *</Label>
                <Input
                  type="text"
                  value={shippingAddress.pincode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Delivery Type */}
        <Card>
          <CardHeader>
            <h5 className="card-title mb-0">
              <i className="ri-truck-line me-2"></i>Delivery Type
            </h5>
          </CardHeader>
          <CardBody>
            {deliveryTypes.length === 0 ? (
              <p className="text-muted mb-0">No delivery types available.</p>
            ) : (
              <Row className="g-3">
                {deliveryTypes.map((dt) => (
                  <Col md={6} key={dt.id}>
                    <div
                      className={`border rounded p-3 h-100 ${
                        selectedDeliveryType?.id === dt.id
                          ? "border-primary bg-primary-subtle"
                          : "border-light"
                      }`}
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                      onClick={() => setSelectedDeliveryType(dt)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <strong>{dt.name}</strong>
                        {dt.isChargeable && dt.deliveryCharge > 0 ? (
                          <Badge color="warning">A${dt.deliveryCharge.toFixed(2)}</Badge>
                        ) : (
                          <Badge color="success">Free</Badge>
                        )}
                      </div>
                      {dt.description && <small className="text-muted d-block mt-1">{dt.description}</small>}
                      {(dt.estimatedDaysMin || dt.estimatedDaysMax) && (
                        <small className="text-muted d-block mt-1">
                          <i className="ri-time-line me-1"></i>
                          {dt.estimatedDaysMin && dt.estimatedDaysMax
                            ? `${dt.estimatedDaysMin}-${dt.estimatedDaysMax} days`
                            : `${dt.estimatedDaysMin || dt.estimatedDaysMax} days`}
                        </small>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </CardBody>
        </Card>

        {/* Coupon */}
        <Card>
          <CardHeader>
            <h5 className="card-title mb-0">
              <i className="ri-coupon-3-line me-2"></i>Discount Coupon
            </h5>
          </CardHeader>
          <CardBody>
            {selectedCoupon ? (
              <Alert color="success" className="d-flex align-items-center justify-content-between mb-0">
                <div>
                  <Badge color="success" className="me-2 fs-6">{selectedCoupon.code}</Badge>
                  <span>{selectedCoupon.title}</span>
                  <br />
                  <small className="text-muted">
                    {selectedCoupon.discountPercentage}% off
                    {selectedCoupon.maxDiscountAmount
                      ? ` (max A$${selectedCoupon.maxDiscountAmount.toFixed(2)})`
                      : ""}
                  </small>
                </div>
                <Button size="sm" color="light" onClick={() => setSelectedCoupon(null)}>
                  <i className="ri-close-line"></i> Remove
                </Button>
              </Alert>
            ) : coupons.length > 0 ? (
              <Select
                isClearable
                placeholder="Search and select a coupon..."
                options={coupons
                  .filter((c) => !c.maxRedemptions || c.totalRedemptions < c.maxRedemptions)
                  .map((c) => ({
                    value: c.id,
                    label: `${c.code} - ${c.title || c.code} (${c.discountPercentage}% off)`,
                    coupon: c,
                  }))}
                onChange={(opt) => setSelectedCoupon(opt?.coupon || null)}
              />
            ) : (
              <p className="text-muted mb-0">No active coupons available.</p>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardBody>
            <Label className="form-label">Order Notes (optional)</Label>
            <Input
              type="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this order..."
              rows={3}
            />
          </CardBody>
        </Card>
      </Col>

      {/* Right: Order Summary */}
      <Col lg={5}>
        <Card className="border-primary sticky-top" style={{ top: 90 }}>
          <CardHeader className="bg-primary text-white">
            <h5 className="card-title mb-0 text-white">
              <i className="ri-file-list-line me-2"></i>Order Summary
            </h5>
          </CardHeader>
          <CardBody>
            {/* Customer */}
            <div className="mb-3 pb-3 border-bottom">
              <small className="text-uppercase text-muted fw-medium d-block mb-1">Customer</small>
              <strong>
                {guestMode
                  ? guestInfo.customerName || "Guest"
                  : `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`}
              </strong>
              <br />
              <small className="text-muted">{guestMode ? guestInfo.customerEmail : selectedCustomer?.email}</small>
            </div>

            {/* Items */}
            <div className="mb-3 pb-3 border-bottom">
              <small className="text-uppercase text-muted fw-medium d-block mb-2">
                Items ({orderItems.length})
              </small>
              {orderItems.map((item) => (
                <div key={item.id} className="d-flex justify-content-between align-items-start mb-2">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <small className="fw-medium d-block text-truncate">{item.productName}</small>
                    <small className="text-muted">
                      {item.colorName}{item.sizeName && item.sizeName !== "Standard" ? ` / ${item.sizeName}` : ""} x{item.quantity}
                      {item.hasCustomization && " + customization"}
                    </small>
                  </div>
                  <small className="fw-medium ms-2 text-nowrap">
                    A${(item.unitPrice * item.quantity).toFixed(2)}
                  </small>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>A${subtotal.toFixed(2)}</span>
              </div>

              {customizationCharges > 0 && (
                <div className="d-flex justify-content-between mb-2 text-info">
                  <span>Customization</span>
                  <span>A${customizationCharges.toFixed(2)}</span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2">
                <span>Delivery</span>
                <span>{deliveryCharge > 0 ? `A$${deliveryCharge.toFixed(2)}` : "Free"}</span>
              </div>

              {discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-danger">
                  <span>Discount ({selectedCoupon?.code})</span>
                  <span>-A${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2">
                <span>GST (10%)</span>
                <span>A${taxAmount.toFixed(2)}</span>
              </div>

              <hr className="my-2" />

              <div className="d-flex justify-content-between">
                <strong className="fs-5">Total</strong>
                <strong className="fs-5 text-primary">A${totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <Alert color="info" className="mb-3 py-2">
              <small>
                <i className="ri-bank-card-line me-1"></i>
                This order will be marked as <strong>PAID</strong> (Bank Transfer). No payment gateway.
              </small>
            </Alert>

            <Button
              color="success"
              className="w-100"
              size="lg"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Spinner size="sm" className="me-2" />Creating Order...</>
              ) : (
                <><i className="ri-check-double-line me-2"></i>Create Order (A${totalAmount.toFixed(2)})</>
              )}
            </Button>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );

  // ══════════════════════════════════════════════════════
  // PRODUCT CONFIG MODAL
  // ══════════════════════════════════════════════════════

  const renderConfigModal = () => {
    if (!configProduct) return null;

    const colors = getUniqueColors(configProduct);
    const sizes = selectedColor ? getAvailableSizes(configProduct, selectedColor) : [];
    const variant = getSelectedVariant();
    const priceTiers = configProduct.priceTiers || [];
    const tierPrice = getUnitPrice(priceTiers, selectedQuantity);
    const unitPrice = (tierPrice > 0 ? tierPrice : parseFloat(manualUnitPrice) || 0) + (variant?.priceAdjustment || 0);
    const hasPriceTiers = priceTiers.length > 0;
    const customCharge = getCustomizationCharge();

    // Use product-specific customization mappings if available, otherwise fall back to global
    const hasMappedCustomization = (configProduct.productCustomizationMethods || []).length > 0;
    const methods = hasMappedCustomization
      ? (configProduct.productCustomizationMethods || [])
      : globalMethods.map((m) => ({ customizationMethod: m, positions: globalPositions.map((p) => ({ customizationPosition: p, priceAdjustment: 0 })) }));

    // Build positions list from the selected method's mapping
    const getPositionsForMethod = () => {
      if (!selectedMethod) return [];
      if (hasMappedCustomization) {
        // From product-specific mapping
        const mapping = methods.find((m) => m.customizationMethod?.id === selectedMethod.id);
        return mapping?.positions || [];
      }
      // From global positions
      return globalPositions.map((p) => ({
        customizationPosition: p,
        priceAdjustment: 0,
      }));
    };
    const availablePositions = getPositionsForMethod();

    return (
      <Modal isOpen={configModal} toggle={() => setConfigModal(false)} size="xl" centered>
        <ModalHeader toggle={() => setConfigModal(false)} className="bg-light">
          <i className="ri-settings-3-line me-2"></i>Configure Product
        </ModalHeader>
        <ModalBody>
          <Row>
            {/* Left: Product info */}
            <Col md={4} className="border-end">
              <div className="text-center mb-3">
                {configProduct.images?.[0]?.imageUrl ? (
                  <img
                    src={configProduct.images[0].imageUrl}
                    alt={configProduct.name}
                    style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, background: "#f8f9fa", padding: 8 }}
                  />
                ) : (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 8 }}>
                    <i className="ri-image-line text-muted" style={{ fontSize: 48 }}></i>
                  </div>
                )}
              </div>
              <h6 className="fw-semibold mb-1 d-flex align-items-center">
                {configProduct.name}
                {configLoading && <Spinner size="sm" className="ms-2" color="primary" />}
              </h6>
              <small className="text-muted d-block mb-1">{configProduct.productCode}</small>
              {configProduct.supplierName && (
                <small className="text-info d-block mb-2">
                  <i className="ri-store-2-line me-1"></i>{configProduct.supplierName}
                </small>
              )}


              {/* Price tiers table */}
              {priceTiers.length > 0 && (
                <div className="mt-3">
                  <small className="text-uppercase text-muted fw-medium d-block mb-2">Price Tiers</small>
                  <Table size="sm" bordered className="mb-0" style={{ fontSize: 12 }}>
                    <thead className="table-light">
                      <tr>
                        <th>Min Qty</th>
                        <th>Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...priceTiers].sort((a, b) => a.minQuantity - b.minQuantity).map((t, i, arr) => {
                        // Active = current qty >= this tier's min AND < next tier's min (or last tier)
                        const nextMin = arr[i + 1]?.minQuantity || Infinity;
                        const isActive = selectedQuantity >= t.minQuantity && selectedQuantity < nextMin;
                        return (
                          <tr key={i} className={isActive ? "table-success" : ""}>
                            <td>{t.minQuantity}+</td>
                            <td className={isActive ? "fw-bold text-success" : ""}>
                              A${t.unitPrice.toFixed(2)}
                              {isActive && " *"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {priceTiers.length > 1 && (
                    <small className="text-muted fst-italic">* Current tier for qty {selectedQuantity}</small>
                  )}
                </div>
              )}

              {/* Current price display */}
              {priceTiers.length > 0 && (
                <div className="mt-3 p-2 rounded" style={{ background: "#e8f5e9" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="fw-medium">Unit Price:</small>
                    <strong className="text-success fs-6">A${unitPrice.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className="text-muted">{selectedQuantity} pcs total:</small>
                    <strong>A${(unitPrice * selectedQuantity).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </Col>

            {/* Right: Configuration */}
            <Col md={8}>
              <div className="ps-md-3">
                {/* Color selection */}
                <div className="mb-3">
                  <Label className="fw-medium mb-2">
                    <i className="ri-palette-line me-1"></i>Color *
                  </Label>
                  <div className="d-flex flex-wrap gap-2">
                    {colors.map((c) => {
                      const hexList = c.primaryHexCode 
                        ? (c.secondaryHexCode ? [c.primaryHexCode, c.secondaryHexCode] : [c.primaryHexCode])
                        : resolveColorHex(c.name, c.hexCode || c.hex);
                      const bg = colorCircleBg(hexList);
                      const isGradient = hexList.length > 1;
                      return (
                        <div
                          key={c.id}
                          className={`border rounded p-2 text-center ${
                            selectedColor === c.id ? "border-primary border-2 bg-primary-subtle" : ""
                          }`}
                          style={{ cursor: "pointer", minWidth: 70, transition: "all 0.15s" }}
                          onClick={() => { setSelectedColor(c.id); setSelectedSize(null); }}
                        >
                          <div
                            style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: bg,
                              border: selectedColor === c.id ? "2px solid #405189" : "1px solid #ccc",
                              margin: "0 auto 4px",
                              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                            }}
                          ></div>
                          <small className="fw-medium" style={{ fontSize: 11 }}>{c.name}</small>
                        </div>
                      );
                    })}
                    {colors.length === 0 && (
                      <small className="text-muted">No color options available</small>
                    )}
                  </div>
                </div>

                {/* Size selection */}
                {selectedColor && (
                  <div className="mb-3">
                    <Label className="fw-medium mb-2">
                      <i className="ri-ruler-line me-1"></i>Size *
                    </Label>
                    <div className="d-flex flex-wrap gap-2">
                      {sizes.map((s) => (
                        <div
                          key={s.variant.id}
                          className={`border rounded px-3 py-2 text-center ${
                            selectedSize === s.size.id ? "border-primary border-2 bg-primary-subtle" : ""
                          }`}
                          style={{ cursor: "pointer", minWidth: 70, transition: "all 0.15s" }}
                          onClick={() => setSelectedSize(s.size.id)}
                        >
                          <small className="fw-medium d-block">{s.size.name}</small>
                        </div>
                      ))}
                      {sizes.length === 0 && (
                        <small className="text-danger">No sizes available for this color</small>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity + Price - shown once color is selected */}
                {selectedColor && (
                  <div className="mb-3 p-3 border rounded bg-white">
                    <Row className="g-3 align-items-end">
                      <Col sm={4}>
                        <Label className="fw-medium mb-2">
                          <i className="ri-hashtag me-1"></i>Quantity *
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="form-control-lg text-center"
                        />
                      </Col>
                      <Col sm={8}>
                        <div className="rounded p-3" style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}>
                          {!hasPriceTiers && (
                            <div className="mb-2">
                              <small className="text-muted d-block mb-1">No price tiers available — enter unit price:</small>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Unit price (A$)"
                                value={manualUnitPrice}
                                onChange={(e) => setManualUnitPrice(e.target.value)}
                                className="form-control-sm"
                                style={{ maxWidth: 160 }}
                              />
                            </div>
                          )}
                          <div className="d-flex justify-content-between">
                            <span>Unit Price:</span>
                            <strong className={unitPrice > 0 ? "text-success fs-5" : "text-muted fs-5"}>
                              {unitPrice > 0 ? `A$${unitPrice.toFixed(2)}` : "A$0.00"}
                            </strong>
                          </div>
                          {unitPrice > 0 && (
                            <>
                              <div className="d-flex justify-content-between mt-1">
                                <span>{selectedQuantity} pcs subtotal:</span>
                                <strong>A${(unitPrice * selectedQuantity).toFixed(2)}</strong>
                              </div>
                              {customCharge > 0 && (
                                <div className="d-flex justify-content-between mt-1 text-info">
                                  <span>+ Customization:</span>
                                  <span>A${(customCharge * selectedQuantity).toFixed(2)}</span>
                                </div>
                              )}
                              {enableCustomization && selectedMethod?.setupCharge > 0 && (
                                <div className="d-flex justify-content-between mt-1 text-muted">
                                  <span>+ Setup fee:</span>
                                  <span>A${parseFloat(selectedMethod.setupCharge).toFixed(2)}</span>
                                </div>
                              )}
                              <hr className="my-1" />
                              <div className="d-flex justify-content-between">
                                <strong>Item Total:</strong>
                                <strong className="text-primary fs-5">
                                  A${(
                                    (unitPrice + customCharge) * selectedQuantity +
                                    (enableCustomization && selectedMethod?.setupCharge ? parseFloat(selectedMethod.setupCharge) : 0)
                                  ).toFixed(2)}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Customization Section */}
                {selectedColor && (
                  <>
                    <hr />
                    {configProduct.artworkSource === "supermerch" ? (
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <Input
                            type="switch"
                            id="enableCustomization"
                            checked={enableCustomization}
                            onChange={() => {
                              setEnableCustomization(!enableCustomization);
                              if (enableCustomization) {
                                setSelectedMethod(null);
                                setSelectedPositions([]);
                                setCustomizationFile(null);
                                setCustomizationImageUrl("");
                                setAddLogoLater(false);
                              }
                            }}
                          />
                          <Label htmlFor="enableCustomization" className="fw-medium">
                            <i className="ri-paint-brush-line me-1"></i>Add Customization (Branding/Printing)
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <Label className="fw-medium mb-2">
                          <i className="ri-artboard-line me-1"></i>Select Artwork / Decoration Method *
                        </Label>
                        <Select
                          options={(configProduct.productCustomizationMethods || [])
                            .filter(m => m.customizationMethod)
                            .map(m => ({
                              value: m.customizationMethod?.id,
                              label: m.customizationMethod?.applicationMethod || "Unnamed Method",
                              method: m.customizationMethod
                            }))}
                          isClearable
                          placeholder="Choose artwork method..."
                          value={selectedMethod ? { value: selectedMethod.id, label: selectedMethod.applicationMethod } : null}
                          onChange={(opt) => {
                            if (opt) {
                              setSelectedMethod(opt.method);
                              setEnableCustomization(true);
                            } else {
                              setSelectedMethod(null);
                              setEnableCustomization(false);
                            }
                          }}
                        />
                      </div>
                    )}

                    {enableCustomization && (
                      <div className="border rounded p-3 bg-light mb-3">
                        {/* Method selection (Supermerch only) */}
                        {configProduct.artworkSource === "supermerch" && (
                          <div className="mb-3">
                            <Label className="fw-medium mb-2">Customization Method *</Label>
                            <div className="d-flex flex-wrap gap-2">
                              {methods.map((m) => {
                                const cm = m.customizationMethod;
                                if (!cm) return null;
                                return (
                                  <div
                                    key={cm.id}
                                    className={`border rounded p-2 bg-white ${
                                      selectedMethod?.id === cm.id ? "border-primary border-2 shadow-sm" : ""
                                    }`}
                                    style={{ cursor: "pointer", minWidth: 140, transition: "all 0.15s" }}
                                    onClick={() => { setSelectedMethod(cm); setSelectedPositions([]); }}
                                  >
                                    <strong className="small d-block">{cm.applicationMethod}</strong>
                                    <small className="text-muted">Type: {cm.applicationType}</small>
                                    <br />
                                    <small className="text-muted">
                                      Setup: A${parseFloat(cm.setupCharge || 0).toFixed(2)}
                                    </small>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Position selection (Supermerch only) */}
                        {configProduct.artworkSource === "supermerch" && selectedMethod && availablePositions.length > 0 && (
                          <div className="mb-3">
                            <Label className="fw-medium mb-2">Position(s)</Label>
                            <div className="d-flex flex-wrap gap-2">
                              {availablePositions.map((p) => {
                                const cp = p.customizationPosition;
                                if (!cp) return null;
                                const isSelected = selectedPositions.some(
                                  (sp) => (sp.customizationPosition?.id || sp.id) === cp.id
                                );
                                return (
                                  <div
                                    key={cp.id}
                                    className={`border rounded p-2 bg-white d-flex flex-column align-items-center justify-content-between ${
                                      isSelected ? "border-success border-2 shadow-sm" : ""
                                    }`}
                                    style={{ cursor: "pointer", width: 130, transition: "all 0.15s" }}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedPositions((prev) =>
                                          prev.filter((sp) => (sp.customizationPosition?.id || sp.id) !== cp.id)
                                        );
                                      } else {
                                        setSelectedPositions((prev) => [...prev, p]);
                                      }
                                    }}
                                  >
                                    <div className="text-center mb-2" style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {cp.imageUrl ? (
                                        <img
                                          src={cp.imageUrl.startsWith("http") ? cp.imageUrl : `${apiUrl}/${cp.imageUrl}`}
                                          alt={cp.positionName}
                                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                      ) : (
                                        <i className="ri-image-line text-muted" style={{ fontSize: 24 }}></i>
                                      )}
                                    </div>
                                    <div className="text-center">
                                      <strong className="small d-block">{cp.positionName}</strong>
                                      {p.priceAdjustment > 0 && (
                                        <small className="text-warning">+A${p.priceAdjustment.toFixed(2)}</small>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Artwork upload */}
                        {selectedMethod && (
                          <div>
                            <Label className="fw-medium mb-2">Artwork / Logo</Label>
                            <div className="d-flex align-items-start gap-3">
                              <div className="form-check">
                                <Input
                                  type="checkbox"
                                  id="addLogoLater"
                                  checked={addLogoLater}
                                  onChange={() => {
                                    setAddLogoLater(!addLogoLater);
                                    if (!addLogoLater) {
                                      setCustomizationFile(null);
                                      setCustomizationImageUrl("");
                                    }
                                  }}
                                />
                                <Label htmlFor="addLogoLater" className="form-check-label">
                                  Customer will provide logo later
                                </Label>
                              </div>
                            </div>
                            {!addLogoLater && (
                              <div className="mt-2">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  style={{ display: "none" }}
                                  accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                                  onChange={handleFileUpload}
                                />
                                <div className="d-flex align-items-center gap-3">
                                  <Button
                                    size="sm"
                                    color={customizationImageUrl ? "success" : "primary"}
                                    outline={!customizationImageUrl}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingArtwork}
                                  >
                                    {uploadingArtwork ? (
                                      <><Spinner size="sm" className="me-1" /> Uploading...</>
                                    ) : customizationImageUrl ? (
                                      <><i className="ri-check-line me-1"></i>Change Artwork</>
                                    ) : (
                                      <><i className="ri-upload-2-line me-1"></i>Upload Artwork</>
                                    )}
                                  </Button>
                                  {customizationFile && !customizationImageUrl && !uploadingArtwork && (
                                    <small className="text-muted">{customizationFile.name}</small>
                                  )}
                                </div>
                                {/* Preview uploaded image */}
                                {customizationImageUrl && (
                                  <div
                                    className="mt-2 p-2 border rounded bg-white d-inline-block"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setPreviewImageUrl(customizationImageUrl)}
                                    title="Click to preview"
                                  >
                                    <img
                                      src={customizationImageUrl}
                                      alt="Artwork preview"
                                      style={{ maxWidth: 120, maxHeight: 80, objectFit: "contain" }}
                                    />
                                    <small className="d-block text-success mt-1">
                                      <i className="ri-eye-line me-1"></i>
                                      {customizationFile?.name || "Click to preview"}
                                    </small>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Customization charge summary */}
                        {selectedMethod && (customCharge > 0 || selectedMethod.setupCharge > 0) && (
                          <div className="mt-3 p-2 bg-white border rounded">
                            <small className="fw-medium">Customization Cost:</small>
                            {selectedMethod.setupCharge > 0 && (
                              <small className="d-block text-muted">
                                Setup fee: A${parseFloat(selectedMethod.setupCharge).toFixed(2)} (one-time)
                              </small>
                            )}
                            {customCharge > 0 && (
                              <small className="d-block text-muted">
                                Position charges: A${customCharge.toFixed(2)} x {selectedQuantity} = A${(customCharge * selectedQuantity).toFixed(2)}
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light justify-content-between">
          <Button color="light" onClick={() => setConfigModal(false)}>
            <i className="ri-close-line me-1"></i>Cancel
          </Button>
          <Button
            color="success"
            size="lg"
            onClick={addItemToOrder}
            disabled={!variant}
          >
            <i className="ri-add-line me-1"></i>
            {variant
              ? `Add to Order${unitPrice > 0 ? ` - A$${((unitPrice + customCharge) * selectedQuantity).toFixed(2)}` : ""}`
              : "Select color & size to add"}
          </Button>
        </ModalFooter>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════

  document.title = `Create Order | ${adminData?.companyName || "Admin"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isSubmitting && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Orders" title="Create Order" pageTitle="Orders" />

          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-3 mb-4">
            <div>
              {currentStep > 1 && (
                <Button color="light" size="lg" onClick={() => setCurrentStep(currentStep - 1)}>
                  <i className="ri-arrow-left-line me-1"></i>Back
                </Button>
              )}
            </div>
            <div>
              {currentStep === 1 && (
                <Button
                  color="primary"
                  size="lg"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1}
                >
                  Next: Add Products <i className="ri-arrow-right-line ms-1"></i>
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  color="primary"
                  size="lg"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                >
                  Next: Review & Submit <i className="ri-arrow-right-line ms-1"></i>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>

      {renderConfigModal()}

      {/* ── Image Preview Lightbox ── */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.75)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={previewImageUrl}
              alt="Artwork preview"
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
              style={{
                position: "absolute", top: -12, right: -12,
                width: 32, height: 32, borderRadius: "50%",
                background: "#fff", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18,
              }}
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateOrder;
