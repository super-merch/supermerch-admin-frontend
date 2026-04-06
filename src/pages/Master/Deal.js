import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Label,
  Input,
  FormFeedback,
  Form,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import Select from "react-select";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import { api } from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const Deal = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");
  const [modal_delete, setmodal_delete] = useState(false);
  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState("1");

  const initialState = {
    dealCode: "",
    title: "",
    slug: "",
    description: "",
    dealType: "FIXED",
    basePrice: "",
    dealPrice: "",
    savingsAmount: "",
    savingsPercentage: "",
    isMultiplierEnabled: false,
    minMultiplier: 1,
    maxMultiplier: 10,
    includesCustomization: false,
    startDate: "",
    endDate: "",
    status: "DRAFT",
    isFeatured: false,
    sortOrder: 0,
    maxPurchasePerCustomer: 5,
    stockLimit: "",
    terms: "",
  };

  const [values, setValues] = useState(initialState);

  // Dropdown data states
  const [products, setProducts] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedSlotCategory, setSelectedSlotCategory] = useState(null);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productInputValue, setProductInputValue] = useState("");
  const [preloadedProducts, setPreloadedProducts] = useState([]); // For edit mode
  const [customizationMethods, setCustomizationMethods] = useState([]);
  const [customizationPositions, setCustomizationPositions] = useState([]);

  // Product slot states
  const [productSlots, setProductSlots] = useState([]);
  const [productSlotForm, setProductSlotForm] = useState({
    slotName: "",
    requiredQuantity: 1,
    minQuantity: 0,
    maxQuantity: "",
    isOptional: false,
    hasCustomization: false,
    isFreeCustomization: false,
    sortOrder: 0,
    allowedProductIds: [],
  });
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);

  // Product choice states for each slot
  const [productChoices, setProductChoices] = useState({});
  const [productColors, setProductColors] = useState({}); // Store available colors for each product
  const [selectedColors, setSelectedColors] = useState({}); // Store selected color IDs for each product choice
  const [productInfo, setProductInfo] = useState({}); // Store product name/code for display
  
  // Slot-level customization states (keyed by slot index)
  const [slotCustomizations, setSlotCustomizations] = useState({});

  // Deal banner image state
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [removeBanner, setRemoveBanner] = useState(false);

  // Delivery options state
  const [allDeliveryTypes, setAllDeliveryTypes] = useState([]);
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState([]);

  // Data table states
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);

  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

  const dealTypeOptions = [
    { value: "FIXED", label: "Fixed Deal" },
    { value: "FLEXIBLE", label: "Flexible Deal" },
    { value: "BUILD_YOUR_OWN", label: "Build Your Own" },
  ];

  const dealStatusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "EXPIRED", label: "Expired" },
    { value: "DISABLED", label: "Disabled" },
  ];

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "70px",
    },
    {
      name: "Deal Code",
      selector: (row) => <span className="text-wrap fw-semibold">{row.dealCode}</span>,
      sortable: true,
    },
    {
      name: "Title",
      selector: (row) => (
        <div className="text-wrap">
          <p className="mb-0 fw-medium">{row.title}</p>
          <small className="text-muted">{row.slug}</small>
        </div>
      ),
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "Type",
      selector: (row) => (
        <Badge 
          color={
            row.dealType === "FIXED" ? "primary" :
            row.dealType === "FLEXIBLE" ? "info" : "secondary"
          } 
          className="text-white"
        >
          {row.dealType}
        </Badge>
      ),
      sortable: true,
      width: "120px",
    },
    {
      name: "Pricing",
      selector: (row) => (
        <div>
          <p className="mb-0 fw-medium">A${parseFloat(row.dealPrice).toFixed(2)}</p>
          <small className="text-muted text-decoration-line-through">A${parseFloat(row.basePrice).toFixed(2)}</small>
        </div>
      ),
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge 
          color={
            row.status === "ACTIVE" ? "success" :
            row.status === "DRAFT" ? "warning" :
            row.status === "SCHEDULED" ? "info" :
            row.status === "EXPIRED" ? "danger" : "secondary"
          } 
          className="text-white"
        >
          {row.status}
        </Badge>
      ),
      sortable: true,
      width: "100px",
    },
    {
      name: "Featured",
      selector: (row) => (
        <Badge color={row.isFeatured ? "success" : "secondary"} className="text-white">
          {row.isFeatured ? "Yes" : "No"}
        </Badge>
      ),
      sortable: false,
      width: "90px",
    },
    {
      name: "Slots",
      selector: (row) => (
        <Badge color="info" className="badge-soft-info text-white">
          {row._count?.productSlots || 0}
        </Badge>
      ),
      sortable: false,
      width: "80px",
    },
    {
      name: "Orders",
      selector: (row) => (
        <Badge color="success" className="badge-soft-success text-white">
          {row._count?.orders || 0}
        </Badge>
      ),
      sortable: false,
      width: "80px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions?.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleTog_edit(row.id)}
                disabled={isLoading}
              >
                Edit
              </button>
            )}
            {currentPagePermissions?.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                onClick={() => tog_delete(row.id)}
                disabled={isLoading}
              >
                Remove
              </button>
            )}
            {!currentPagePermissions?.edit && !currentPagePermissions?.delete && (
              <span className="text-muted">No actions available</span>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  const exportColumns = [
    { header: "Deal Code", key: "dealCode" },
    { header: "Title", key: "title" },
    { header: "Deal Type", key: "dealType" },
    { header: "Base Price", key: "basePrice" },
    { header: "Deal Price", key: "dealPrice" },
    { header: "Status", key: "status" },
    { header: "Is Featured", key: "isFeatured" },
  ];

  const fetchAllForExport = async () => {
    const response = await axios.get(`/api/list-deals-by-params`, {
      params: { page: 1, limit: 10000, search: query },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data.data || [];
  };

  // Toggle tab
  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo + 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await axios.get(`/api/list-deals-by-params`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setData(response.data.data);
        setTotalRows(response.data.pagination.totalCount);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to fetch deals");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  // API function to search products by params
  const searchProductsByParams = async (searchText = "", categoryId = null, page = 1, limit = 50) => {
    try {
      setProductSearchLoading(true);
      const params = {
        page,
        limit,
        isActive: true
      };
      
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      
      if (categoryId) {
        params.mainCategoryId = categoryId;
      }
      
      const response = await axios.get('/api/list-products-by-params-dropdown', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    } finally {
      setProductSearchLoading(false);
    }
  };

  // Simple debounced search using useEffect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (selectedSlotCategory && productInputValue) {
        setProductSearchLoading(true);
        try {
          const products = await searchProductsByParams(productInputValue, selectedSlotCategory);
          setFilteredProducts(products);
        } catch (error) {
          console.error('Error in debounced search:', error);
        } finally {
          setProductSearchLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productInputValue, selectedSlotCategory]);

  // Function to preload specific products by IDs (for edit mode)
  const preloadProductsByIds = async (productIds) => {
    if (!productIds.length) return [];
    
    try {
      // Get products one by one since bulk API doesn't exist
      const productPromises = productIds.map(id => 
        axios.get(`/api/get-product/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      );
      
      const responses = await Promise.all(productPromises);
      return responses
        .filter(res => res.data.success)
        .map(res => res.data.data);
    } catch (error) {
      console.error("Error preloading products:", error);
      return [];
    }
  };

  const fetchProducts = useCallback(async () => {
    // Initially load a small set of products (first page) for fallback
    try {
      const products = await searchProductsByParams("", null, 1, 20);
      setProducts(products);
    } catch (error) {
      console.error("Error fetching initial products:", error);
      toast.error("Failed to fetch products");
    }
  }, []);

  const fetchMainCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/main-categories`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.data.success) {
        setMainCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching main categories:", error);
      toast.error("Failed to fetch main categories");
    }
  }, []);

  const fetchCustomizationMethods = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/customization-methods`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.data.success) {
        setCustomizationMethods(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching customization methods:", error);
      toast.error("Failed to fetch customization methods");
    }
  }, []);

  const fetchCustomizationPositions = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/customization-positions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.data.success) {
        setCustomizationPositions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching customization positions:", error);
      toast.error("Failed to fetch customization positions");
    }
  }, []);

  const fetchDeliveryTypes = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/delivery-types`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.data.success) {
        setAllDeliveryTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery types:", error);
      toast.error("Failed to fetch delivery types");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchMainCategories();
    fetchCustomizationMethods();
    fetchCustomizationPositions();
    fetchDeliveryTypes();
  }, [fetchProducts, fetchMainCategories, fetchCustomizationMethods, fetchCustomizationPositions, fetchDeliveryTypes]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "title") {
      setValues({
        ...values,
        [name]: value,
        slug: generateSlug(value),
      });
    } else if (name === "basePrice" || name === "dealPrice") {
      const basePrice = name === "basePrice" ? parseFloat(value) || 0 : parseFloat(values.basePrice) || 0;
      const dealPrice = name === "dealPrice" ? parseFloat(value) || 0 : parseFloat(values.dealPrice) || 0;
      
      const savingsAmount = basePrice > dealPrice ? basePrice - dealPrice : 0;
      const savingsPercentage = basePrice > 0 ? ((savingsAmount / basePrice) * 100).toFixed(2) : 0;
      
      setValues({
        ...values,
        [name]: value,
        savingsAmount: savingsAmount.toFixed(2),
        savingsPercentage: parseFloat(savingsPercentage),
      });
    } else {
      setValues({
        ...values,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Handle react-select changes
  const handleSelectChange = (selectedOption, actionMeta) => {
    setValues({
      ...values,
      [actionMeta.name]: selectedOption ? selectedOption.value : "",
    });
  };

  // Product slot handlers
  const handleProductSlotFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductSlotForm({
      ...productSlotForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSlotSelectChange = (selectedOptions, actionMeta) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    if (actionMeta.name === 'allowedProductIds') {
      setProductSlotForm({
        ...productSlotForm,
        allowedProductIds: values,
      });
    }
  };

  // Handle category selection for product slot
  // Handle category selection for product slot
  const handleSlotCategorySelect = async (categoryId) => {
    setSelectedSlotCategory(categoryId);
    setProductInputValue(""); // Reset search input
    
    if (categoryId) {
      // Load products for this category
      const categoryProducts = await searchProductsByParams("", categoryId);
      setFilteredProducts(categoryProducts);
    } else {
      setFilteredProducts([]);
    }
    
    // Reset selected products when category changes
    setProductSlotForm({
      ...productSlotForm,
      allowedProductIds: []
    });
    setPreloadedProducts([]); // Clear preloaded products
  };

  const addProductSlot = async () => {
    if (!productSlotForm.slotName.trim()) {
      toast.error("Slot name is required");
      return;
    }

    // Fetch colors for all products in this slot
    const fetchColorsForProducts = async (slotIndex, productIds) => {
      const newProductColors = { ...productColors };
      for (const productId of productIds) {
        const colors = await fetchProductColors(productId);
        newProductColors[`slot_${slotIndex}_product_${productId}`] = colors;
      }
      setProductColors(newProductColors);
    };

    if (editingSlotIndex !== null) {
      // Update existing slot
      const updatedSlots = [...productSlots];
      updatedSlots[editingSlotIndex] = { ...productSlotForm };
      setProductSlots(updatedSlots);
      
      // Update product choices for this slot - preserve existing selected colors
      const existingChoices = productChoices[`slot_${editingSlotIndex}`] || [];
      const productChoicesForSlot = productSlotForm.allowedProductIds.map(productId => {
        const existingChoice = existingChoices.find(c => c.productId === productId);
        return {
          productId: productId,
          isDefault: existingChoice?.isDefault || false,
          priceAdjustment: existingChoice?.priceAdjustment || 0,
          selectedColorIds: existingChoice?.selectedColorIds || []
        };
      });
      setProductChoices({
        ...productChoices,
        [`slot_${editingSlotIndex}`]: productChoicesForSlot
      });

      // Fetch colors for any new products
      await fetchColorsForProducts(editingSlotIndex, productSlotForm.allowedProductIds);
      
      setEditingSlotIndex(null);
    } else {
      // Add new slot
      const newSlotIndex = productSlots.length;
      setProductSlots([...productSlots, { ...productSlotForm }]);
      
      // Create product choices for this slot
      const productChoicesForSlot = productSlotForm.allowedProductIds.map(productId => ({
        productId: productId,
        isDefault: false,
        priceAdjustment: 0,
        selectedColorIds: []
      }));
      setProductChoices({
        ...productChoices,
        [`slot_${newSlotIndex}`]: productChoicesForSlot
      });

      // Fetch colors for all products in this slot
      await fetchColorsForProducts(newSlotIndex, productSlotForm.allowedProductIds);
    }

    // Reset form
    setProductSlotForm({
      slotName: "",
      requiredQuantity: 1,
      minQuantity: 0,
      maxQuantity: "",
      isOptional: false,
      hasCustomization: false,
      isFreeCustomization: false,
      sortOrder: 0,
      allowedProductIds: [],
    });
    setSelectedSlotCategory(null);
    setFilteredProducts([]);
    setPreloadedProducts([]);
  };

  const editProductSlot = async (index) => {
    const slot = productSlots[index];
    setProductSlotForm(slot);
    setEditingSlotIndex(index);
    
    // If the slot has products, preload them and set up the category
    if (slot.allowedProductIds.length > 0) {
      // Preload the specific products
      const preloaded = await preloadProductsByIds(slot.allowedProductIds);
      setPreloadedProducts(preloaded);
      
      // Set category based on first product
      const firstProduct = preloaded[0];
      if (firstProduct) {
        setSelectedSlotCategory(firstProduct.mainCategoryId);
        // Load products for this category + include preloaded products
        const categoryProducts = await searchProductsByParams("", firstProduct.mainCategoryId);
        
        // Merge category products with preloaded ones, removing duplicates
        const combinedProducts = [...preloaded];
        categoryProducts.forEach(product => {
          if (!combinedProducts.find(p => p.id === product.id)) {
            combinedProducts.push(product);
          }
        });
        
        setFilteredProducts(combinedProducts);
      }

      // Fetch colors for all products in this slot (if not already loaded)
      const newProductColors = { ...productColors };
      for (const productId of slot.allowedProductIds) {
        if (!newProductColors[`slot_${index}_product_${productId}`]) {
          const colors = await fetchProductColors(productId);
          newProductColors[`slot_${index}_product_${productId}`] = colors;
        }
      }
      setProductColors(newProductColors);
    } else {
      setSelectedSlotCategory(null);
      setFilteredProducts([]);
      setPreloadedProducts([]);
    }
  };

  const deleteProductSlot = (index) => {
    const updatedSlots = productSlots.filter((_, i) => i !== index);
    setProductSlots(updatedSlots);
    
    // Remove product choices for this slot
    const updatedChoices = { ...productChoices };
    delete updatedChoices[`slot_${index}`];
    setProductChoices(updatedChoices);
  };

  const cancelSlotEdit = () => {
    setProductSlotForm({
      slotName: "",
      requiredQuantity: 1,
      minQuantity: 0,
      maxQuantity: "",
      isOptional: false,
      hasCustomization: false,
      isFreeCustomization: false,
      sortOrder: 0,
      allowedProductIds: [],
    });
    setSelectedSlotCategory(null);
    setFilteredProducts([]);
    setPreloadedProducts([]);
    setProductInputValue("");
    setEditingSlotIndex(null);
  };

  // Handle product search input change
  const handleProductInputChange = (inputValue) => {
    setProductInputValue(inputValue);
    // The actual search is handled by the useEffect with debouncing
  };

  // Helper function to get product details for display
  const getProductDetails = (productIds) => {
    const productDetails = [];
    
    productIds.forEach(id => {
      // Check in productInfo first (from color fetch)
      let product = productInfo[id];
      
      if (product) {
        productDetails.push({
          id: product.id,
          name: product.name,
          code: product.code
        });
        return;
      }
      
      // Fallback: Check in preloaded products
      product = preloadedProducts.find(p => p.id === id);
      
      // If not found in preloaded, check in filtered products
      if (!product) {
        product = filteredProducts.find(p => p.id === id);
      }
      
      // If not found in filtered, check in main products list
      if (!product) {
        product = products.find(p => p.id === id);
      }
      
      if (product) {
        productDetails.push({
          id: product.id,
          name: product.name || product.productName || 'Unknown Product',
          code: product.productCode || product.code || 'N/A'
        });
      } else {
        // Still not found - show placeholder
        productDetails.push({
          id: id,
          name: 'Loading...',
          code: 'N/A'
        });
      }
    });
    
    return productDetails;
  };

  // Fetch product colors/variants with stock
  const fetchProductColors = async (productId) => {
    try {
      const response = await axios.get(`/api/get-product-colors/${productId}`);
      
      if (response.data.success) {
        const { product, colors } = response.data.data;
        
        // Store product info for display
        setProductInfo(prev => ({
          ...prev,
          [productId]: product
        }));
        
        return colors || [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching colors for product ${productId}:`, error);
      return [];
    }
  };

  // Product choice handlers
  const handleProductChoiceChange = async (slotIndex, selectedOptions) => {
    const productIds = selectedOptions ? selectedOptions.map(option => ({
      productId: option.value,
      isDefault: false,
      priceAdjustment: 0,
      selectedColorIds: []
    })) : [];
    
    setProductChoices({
      ...productChoices,
      [`slot_${slotIndex}`]: productIds
    });

    // Fetch colors for each selected product
    if (selectedOptions && selectedOptions.length > 0) {
      const colorPromises = selectedOptions.map(async (option) => {
        const colors = await fetchProductColors(option.value);
        return { productId: option.value, colors };
      });
      
      const colorResults = await Promise.all(colorPromises);
      const newProductColors = { ...productColors };
      
      colorResults.forEach(result => {
        newProductColors[`slot_${slotIndex}_product_${result.productId}`] = result.colors;
      });
      
      setProductColors(newProductColors);
    }
  };

  // Handle color selection for a specific product choice
  const handleColorSelection = (slotIndex, productId, selectedColorOptions) => {
    const colorIds = selectedColorOptions ? selectedColorOptions.map(opt => opt.value) : [];
    
    setSelectedColors({
      ...selectedColors,
      [`slot_${slotIndex}_product_${productId}`]: colorIds
    });

    // Update product choices with selected color IDs
    const updatedChoices = { ...productChoices };
    const slotChoices = updatedChoices[`slot_${slotIndex}`] || [];
    const choiceIndex = slotChoices.findIndex(c => c.productId === productId);
    
    if (choiceIndex !== -1) {
      slotChoices[choiceIndex].selectedColorIds = colorIds;
      setProductChoices(updatedChoices);
    }
  };

  // Slot-level customization handlers
  const handleSlotCustomizationChange = (slotIndex, methodId, positionId, checked) => {
    setSlotCustomizations(prev => {
      const slotKey = `slot_${slotIndex}`;
      const currentSlotCustomizations = prev[slotKey] || [];
      
      if (checked) {
        const customization = {
          customizationMethodId: methodId,
          positionId: positionId
        };
        return {
          ...prev,
          [slotKey]: [...currentSlotCustomizations, customization]
        };
      } else {
        return {
          ...prev,
          [slotKey]: currentSlotCustomizations.filter(
            c => !(c.customizationMethodId === methodId && c.positionId === positionId)
          )
        };
      }
    });
  };

  // Delivery type handlers
  const handleDeliveryTypeChange = (deliveryTypeId, checked) => {
    if (checked) {
      const isFirstDefault = selectedDeliveryTypes.length === 0;
      const deliveryType = {
        deliveryTypeId: deliveryTypeId,
        isDefault: isFirstDefault
      };
      setSelectedDeliveryTypes([...selectedDeliveryTypes, deliveryType]);
    } else {
      const updated = selectedDeliveryTypes.filter(dt => dt.deliveryTypeId !== deliveryTypeId);
      // If we removed the default, make the first remaining one the default
      if (updated.length > 0 && !updated.some(dt => dt.isDefault)) {
        updated[0].isDefault = true;
      }
      setSelectedDeliveryTypes(updated);
    }
  };

  const handleDeliveryTypeDefault = (deliveryTypeId) => {
    const updated = selectedDeliveryTypes.map(dt => ({
      ...dt,
      isDefault: dt.deliveryTypeId === deliveryTypeId
    }));
    setSelectedDeliveryTypes(updated);
  };

  // Banner image handlers
  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setRemoveBanner(false);
      const reader = new FileReader();
      reader.onload = (e) => setBannerPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeBannerImage = () => {
    setBannerImage(null);
    setBannerPreview("");
    setRemoveBanner(true);
    document.getElementById("bannerImage").value = "";
  };

  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setProductSlots([]);
    setProductChoices({});
    setProductColors({});
    setSelectedColors({});
    setProductInfo({});
    setSlotCustomizations({});
    setSelectedDeliveryTypes([]);
    setBannerImage(null);
    setBannerPreview("");
    setRemoveBanner(false);
    set_Id("");
    setFormErrors({});
  };

  // Open Add form with auto-selected delivery types
  const openAddForm = () => {
    // Reset all form state first
    setUpdateForm(false);
    setValues(initialState);
    setProductSlots([]);
    setProductChoices({});
    setProductColors({});
    setSelectedColors({});
    setProductInfo({});
    setSlotCustomizations({});
    setBannerImage(null);
    setBannerPreview("");
    setRemoveBanner(false);
    set_Id("");
    setFormErrors({});
    setActiveTab("1");

    // Auto-select delivery types with applyToAll = true
    const applyToAllDeliveryTypes = allDeliveryTypes
      .filter(dt => dt.applyToAll)
      .map((dt, index) => ({
        deliveryTypeId: dt.id,
        isDefault: index === 0,
      }));
    setSelectedDeliveryTypes(applyToAllDeliveryTypes);

    // Show form
    setShowForm(true);
  };

  const handleTog_edit = async (_id) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/get-deal/${_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const dealData = response.data.data;
        
        setValues({
          dealCode: dealData.dealCode,
          title: dealData.title,
          slug: dealData.slug,
          description: dealData.description || "",
          dealType: dealData.dealType,
          basePrice: dealData.basePrice,
          dealPrice: dealData.dealPrice,
          savingsAmount: dealData.savingsAmount || "",
          savingsPercentage: dealData.savingsPercentage || "",
          isMultiplierEnabled: dealData.isMultiplierEnabled,
          minMultiplier: dealData.minMultiplier,
          maxMultiplier: dealData.maxMultiplier,
          includesCustomization: dealData.includesCustomization,
          startDate: dealData.startDate ? new Date(dealData.startDate).toISOString().split('T')[0] : "",
          endDate: dealData.endDate ? new Date(dealData.endDate).toISOString().split('T')[0] : "",
          status: dealData.status,
          isFeatured: dealData.isFeatured,
          sortOrder: dealData.sortOrder,
          maxPurchasePerCustomer: dealData.maxPurchasePerCustomer,
          stockLimit: dealData.stockLimit || "",
          terms: dealData.terms || "",
        });

        // Set product slots
        if (dealData.productSlots) {
          const slots = dealData.productSlots.map(slot => ({
            slotName: slot.slotName,
            requiredQuantity: slot.requiredQuantity,
            minQuantity: slot.minQuantity,
            maxQuantity: slot.maxQuantity,
            isOptional: slot.isOptional,
            hasCustomization: slot.hasCustomization || false,
            isFreeCustomization: slot.isFreeCustomization || false,
            sortOrder: slot.sortOrder,
            allowedProductIds: slot.allowedProductIds || [],
          }));
          setProductSlots(slots);

          // Set product choices and load colors
          const choices = {};
          const colors = {};
          const selectedColorData = {};
          const slotCustoms = {};
          
          for (const [index, slot] of dealData.productSlots.entries()) {
            if (slot.productChoices) {
              choices[`slot_${index}`] = slot.productChoices.map(choice => ({
                productId: choice.productId,
                isDefault: choice.isDefault,
                priceAdjustment: choice.priceAdjustment,
                selectedColorIds: choice.selectedColorIds || []
              }));

              // Fetch colors for each product
              for (const choice of slot.productChoices) {
                const productColors = await fetchProductColors(choice.productId);
                colors[`slot_${index}_product_${choice.productId}`] = productColors;
                selectedColorData[`slot_${index}_product_${choice.productId}`] = choice.selectedColorIds || [];
              }
            }
            
            // Load slot-level customizations
            if (slot.customizations && slot.customizations.length > 0) {
              slotCustoms[`slot_${index}`] = slot.customizations.map(c => ({
                customizationMethodId: c.customizationMethodId,
                positionId: c.positionId
              }));
            }
          }
          
          setProductChoices(choices);
          setProductColors(colors);
          setSelectedColors(selectedColorData);
          setSlotCustomizations(slotCustoms);
        }

        // Set delivery types
        if (dealData.deliveryTypes) {
          setSelectedDeliveryTypes(dealData.deliveryTypes.map(dt => ({
            deliveryTypeId: dt.deliveryTypeId,
            isDefault: dt.isDefault
          })));
        }

        // Set banner image preview
        if (dealData.bannerImage) {
            console.log(dealData.bannerImage)
          setBannerPreview(`http://localhost:8000/${dealData.bannerImage}`);
        }

        setRemoveBanner(false);
        set_Id(_id);
        setUpdateForm(true);
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error fetching deal data:", error);
      toast.error("Failed to fetch deal data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);

    if (Object.keys(errors).length === 0) {
      try {
        setIsLoading(true);
        const formData = new FormData();

        // Auto-compute includesCustomization based on slots
        const hasAnySlotCustomization = productSlots.some(slot => slot.hasCustomization === true);
        const valuesToSubmit = {
          ...values,
          includesCustomization: hasAnySlotCustomization
        };

        // Append basic deal data
        Object.keys(valuesToSubmit).forEach(key => {
          if (valuesToSubmit[key] !== "" && valuesToSubmit[key] !== null && valuesToSubmit[key] !== undefined) {
            formData.append(key, valuesToSubmit[key]);
          }
        });

        // Append product slots data with slot-level customizations
        if (productSlots.length > 0) {
          const slotsWithChoices = productSlots.map((slot, index) => ({
            ...slot,
            productChoices: productChoices[`slot_${index}`] || [],
            customizations: slotCustomizations[`slot_${index}`] || []
          }));
          formData.append("productSlotsData", JSON.stringify(slotsWithChoices));
        }

        // Append delivery types data
        if (selectedDeliveryTypes.length > 0) {
          formData.append("deliveryTypesData", JSON.stringify(selectedDeliveryTypes));
        }

        // Append banner image if selected
        if (bannerImage) {
          formData.append("bannerImage", bannerImage);
        }

        // Append remove banner flag
        if (removeBanner) {
          formData.append("bannerImage", "");
        }

        const response = await axios.put(
          `/api/update-deal/${_id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Deal updated successfully");
          handleList();
          fetchDeals();
        }
      } catch (error) {
        console.error("Error updating deal:", error);
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to update deal");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      setIsDeleteLoading(true);
      const response = await axios.delete(
        `/api/delete-deal/${remove_id}`,
      );

      if (response.data.success) {
        toast.success("Deal deleted successfully");
        setmodal_delete(false);
        setRemove_id("");
        fetchDeals();
      }
    } catch (error) {
      console.error("Error deleting deal:", error);
      if (error.response?.status === 409) {
        setReferenceData(error.response.data);
        setReferenceModal(true);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to delete deal");
      }
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteClose = (e) => {
    setmodal_delete(false);
    setRemove_id("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);

    if (Object.keys(errors).length === 0) {
      try {
        setIsLoading(true);
        const formData = new FormData();

        // Auto-compute includesCustomization based on slots
        const hasAnySlotCustomization = productSlots.some(slot => slot.hasCustomization === true);
        const valuesToSubmit = {
          ...values,
          includesCustomization: hasAnySlotCustomization
        };

        // Append basic deal data
        Object.keys(valuesToSubmit).forEach(key => {
          if (valuesToSubmit[key] !== "" && valuesToSubmit[key] !== null && valuesToSubmit[key] !== undefined) {
            formData.append(key, valuesToSubmit[key]);
          }
        });

        // Append product slots data with slot-level customizations
        if (productSlots.length > 0) {
          const slotsWithChoices = productSlots.map((slot, index) => ({
            ...slot,
            productChoices: productChoices[`slot_${index}`] || [],
            customizations: slotCustomizations[`slot_${index}`] || []
          }));
          formData.append("productSlotsData", JSON.stringify(slotsWithChoices));
        }

        // Append delivery types data
        if (selectedDeliveryTypes.length > 0) {
          formData.append("deliveryTypesData", JSON.stringify(selectedDeliveryTypes));
        }

        // Append banner image if selected
        if (bannerImage) {
          formData.append("bannerImage", bannerImage);
        }

        // Append remove banner flag
        if (removeBanner) {
          formData.append("bannerImage", "");
        }

        const response = await axios.post(
          `/api/create-deal`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Deal created successfully");
          handleList();
          fetchDeals();
        }
      } catch (error) {
        console.error("Error creating deal:", error);
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to create deal");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.dealCode) errors.dealCode = "Deal code is required";
    if (!values.title) errors.title = "Title is required";
    if (!values.basePrice) errors.basePrice = "Base price is required";
    if (!values.dealPrice) errors.dealPrice = "Deal price is required";
    
    if (values.basePrice && values.dealPrice) {
      if (parseFloat(values.dealPrice) >= parseFloat(values.basePrice)) {
        errors.dealPrice = "Deal price must be less than base price";
      }
    }

    return errors;
  };

  const tog_delete = (_id) => {
    setRemove_id(_id);
    setmodal_delete(true);
  };

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.selector);
    setsortDirection(sortDirection);
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    setPageNo(1);
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  // Convert options for react-select
  const productOptions = products.map(product => ({ value: product.id, label: product.name }));
  const mainCategoryOptions = mainCategories.map(cat => ({ value: cat.id, label: cat.name }));

  const onEditCancel = () => {
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setFormErrors({});
    setIsSubmit(false);
    set_Id("");
    setProductSlots([]);
    setProductChoices({});
    setProductColors({});
    setSelectedColors({});
    setProductInfo({});
    // setSelectedCustomizations([]);
    setSelectedDeliveryTypes([]);
    setBannerImage(null);
    setBannerPreview("");
    setRemoveBanner(false);
    setActiveTab("1");
  };

  const renderForm = () => (
    <CardBody>
      <Row>
        <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                {/* Tab Navigation */}
                <Nav tabs className="nav-tabs-custom nav-success mb-3">
                  <NavItem>
                    <NavLink
                      style={{ cursor: "pointer" }}
                      className={classnames({ active: activeTab === "1" })}
                      onClick={() => toggleTab("1")}
                    >
                      <i className="ri-information-line align-middle me-1"></i>
                      Basic Information
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      style={{ cursor: "pointer" }}
                      className={classnames({ active: activeTab === "2" })}
                      onClick={() => toggleTab("2")}
                    >
                      <i className="ri-file-list-line align-middle me-1"></i>
                      Product Slots
                      {productSlots.length > 0 && (
                        <Badge color="info" className="ms-2">
                          {productSlots.length}
                      </Badge>
                      )}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      style={{ cursor: "pointer" }}
                      className={classnames({ active: activeTab === "3" })}
                      onClick={() => toggleTab("3")}
                    >
                      <i className="ri-brush-line align-middle me-1"></i>
                      Slot Customizations
                      {Object.values(slotCustomizations).flat().length > 0 && (
                        <Badge color="success" className="ms-2">
                          {Object.values(slotCustomizations).flat().length}
                        </Badge>
                      )}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      style={{ cursor: "pointer" }}
                      className={classnames({ active: activeTab === "4" })}
                      onClick={() => toggleTab("4")}
                    >
                      <i className="ri-truck-line align-middle me-1"></i>
                      Delivery Options
                      {selectedDeliveryTypes.length > 0 && (
                        <Badge color="warning" className="ms-2">
                          {selectedDeliveryTypes.length}
                        </Badge>
                      )}
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      style={{ cursor: "pointer" }}
                      className={classnames({ active: activeTab === "5" })}
                      onClick={() => toggleTab("5")}
                    >
                      <i className="ri-settings-line align-middle me-1"></i>
                      Banner & Settings
                    </NavLink>
                  </NavItem>
                </Nav>

                <TabContent activeTab={activeTab}>
                  {/* Basic Info Tab */}
                  <TabPane tabId="1">
                    <Row>
                      <Col lg={6}>
                        <div className="mb-3">
                          <Label htmlFor="dealCode" className="form-label">
                            Deal Code <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="dealCode"
                            placeholder="Enter deal code"
                            name="dealCode"
                            value={values.dealCode}
                            onChange={handleChange}
                            invalid={!!(formErrors.dealCode && isSubmit)}
                          />
                          {formErrors.dealCode && isSubmit && (
                            <FormFeedback>{formErrors.dealCode}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col lg={6}>
                        <div className="mb-3">
                          <Label htmlFor="dealType" className="form-label">
                            Deal Type
                          </Label>
                          <Select
                            name="dealType"
                            value={dealTypeOptions.find(option => option.value === values.dealType)}
                            onChange={handleSelectChange}
                            options={dealTypeOptions}
                            className={formErrors.dealType && isSubmit ? "is-invalid" : ""}
                          />
                          {formErrors.dealType && isSubmit && (
                            <div className="invalid-feedback">{formErrors.dealType}</div>
                          )}
                        </div>
                      </Col>

                      <Col lg={12}>
                        <div className="mb-3">
                          <Label htmlFor="title" className="form-label">
                            Title <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="title"
                            placeholder="Enter deal title"
                            name="title"
                            value={values.title}
                            onChange={handleChange}
                            invalid={!!(formErrors.title && isSubmit)}
                          />
                          {formErrors.title && isSubmit && (
                            <FormFeedback>{formErrors.title}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col lg={12}>
                        <div className="mb-3">
                          <Label htmlFor="slug" className="form-label">
                            Slug
                          </Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="slug"
                            placeholder="Deal slug (auto-generated)"
                            name="slug"
                            value={values.slug}
                            onChange={handleChange}
                            invalid={!!(formErrors.slug && isSubmit)}
                          />
                          {formErrors.slug && isSubmit && (
                            <FormFeedback>{formErrors.slug}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col lg={12}>
                        <div className="mb-3">
                          <Label htmlFor="description" className="form-label">
                            Description
                          </Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            id="description"
                            placeholder="Enter deal description"
                            name="description"
                            rows={3}
                            value={values.description}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="basePrice" className="form-label">
                            Base Price (A$) <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            className="form-control"
                            id="basePrice"
                            placeholder="Enter base price (e.g., 25.99)"
                            name="basePrice"
                            step="0.01"
                            min="0"
                            value={values.basePrice}
                            onChange={handleChange}
                            invalid={!!(formErrors.basePrice && isSubmit)}
                          />
                          {formErrors.basePrice && isSubmit && (
                            <FormFeedback>{formErrors.basePrice}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="dealPrice" className="form-label">
                            Deal Price (A$) <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            className="form-control"
                            id="dealPrice"
                            placeholder="Enter deal price (e.g., 19.99)"
                            name="dealPrice"
                            step="0.01"
                            min="0"
                            value={values.dealPrice}
                            onChange={handleChange}
                            invalid={!!(formErrors.dealPrice && isSubmit)}
                          />
                          {formErrors.dealPrice && isSubmit && (
                            <FormFeedback>{formErrors.dealPrice}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label className="form-label">Savings</Label>
                          <div className="d-flex gap-2">
                            <Input
                              type="number"
                              className="form-control"
                              placeholder="Amount (A$)"
                              value={values.savingsAmount}
                              readOnly
                            />
                            <Input
                              type="number"
                              className="form-control"
                              placeholder="Percentage"
                              value={values.savingsPercentage}
                              readOnly
                            />
                          </div>
                        </div>
                      </Col>

                      <Col lg={6}>
                        <div className="mb-3">
                          <Label htmlFor="startDate" className="form-label">
                            Start Date
                          </Label>
                          <Input
                            type="date"
                            className="form-control"
                            id="startDate"
                            name="startDate"
                            value={values.startDate}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>

                      <Col lg={6}>
                        <div className="mb-3">
                          <Label htmlFor="endDate" className="form-label">
                            End Date
                          </Label>
                          <Input
                            type="date"
                            className="form-control"
                            id="endDate"
                            name="endDate"
                            value={values.endDate}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Product Slots Tab */}
                  <TabPane tabId="2">
                    <Row>
                      <Col lg={12}>
                        <Card>
                          <CardHeader>
                            <h6 className="mb-0">Add Product Slot</h6>
                          </CardHeader>
                          <CardBody>
                            <Row>
                              <Col lg={4}>
                                <div className="mb-3">
                                  <Label htmlFor="slotName" className="form-label">
                                    Slot Name <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    type="text"
                                    className="form-control"
                                    id="slotName"
                                    placeholder="Enter slot name"
                                    name="slotName"
                                    value={productSlotForm.slotName}
                                    onChange={handleProductSlotFormChange}
                                  />
                                </div>
                              </Col>

                              <Col lg={2}>
                                <div className="mb-3">
                                  <Label htmlFor="requiredQuantity" className="form-label">
                                    Required Qty
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="requiredQuantity"
                                    name="requiredQuantity"
                                    value={productSlotForm.requiredQuantity}
                                    onChange={handleProductSlotFormChange}
                                  />
                                </div>
                              </Col>

                              <Col lg={2}>
                                <div className="mb-3">
                                  <Label htmlFor="minQuantity" className="form-label">
                                    Min Qty
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="minQuantity"
                                    name="minQuantity"
                                    value={productSlotForm.minQuantity}
                                    onChange={handleProductSlotFormChange}
                                  />
                                </div>
                              </Col>

                              <Col lg={2}>
                                <div className="mb-3">
                                  <Label htmlFor="maxQuantity" className="form-label">
                                    Max Qty
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="maxQuantity"
                                    name="maxQuantity"
                                    value={productSlotForm.maxQuantity}
                                    onChange={handleProductSlotFormChange}
                                  />
                                </div>
                              </Col>

                              <Col lg={2}>
                                <div className="mb-3">
                                  <Label htmlFor="sortOrder" className="form-label">
                                    Sort Order
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="sortOrder"
                                    name="sortOrder"
                                    value={productSlotForm.sortOrder}
                                    onChange={handleProductSlotFormChange}
                                  />
                                </div>
                              </Col>

                              <Col lg={6}>
                                <div className="mb-3">
                                  <Label className="form-label">Select Category First</Label>
                                  <Select
                                    name="slotMainCategory"
                                    value={mainCategoryOptions.find(option => option.value === selectedSlotCategory)}
                                    onChange={(option) => handleSlotCategorySelect(option?.value)}
                                    options={mainCategoryOptions}
                                    placeholder="Select category to load products..."
                                    isClearable
                                  />
                                </div>
                              </Col>

                              <Col lg={6}>
                                <div className="mb-3">
                                  <Label className="form-label">Allowed Products</Label>
                                  <Select
                                    isMulti
                                    name="allowedProductIds"
                                    value={[
                                      // First show preloaded products (for edit mode)
                                      ...preloadedProducts
                                        .filter(product => productSlotForm.allowedProductIds.includes(product.id))
                                        .map(product => ({ 
                                          value: product.id, 
                                          label: `${product.name} - ${product.productCode}` 
                                        })),
                                      // Then show filtered products that aren't already in preloaded
                                      ...filteredProducts
                                        .filter(product => 
                                          productSlotForm.allowedProductIds.includes(product.id) &&
                                          !preloadedProducts.find(p => p.id === product.id)
                                        )
                                        .map(product => ({ 
                                          value: product.id, 
                                          label: `${product.name} - ${product.productCode}` 
                                        }))
                                    ]}
                                    onChange={handleSlotSelectChange}
                                    options={[
                                      // Combine preloaded and filtered products for options
                                      ...preloadedProducts.map(product => ({ 
                                        value: product.id, 
                                        label: `${product.name} - ${product.productCode}` 
                                      })),
                                      ...filteredProducts
                                        .filter(product => !preloadedProducts.find(p => p.id === product.id))
                                        .map(product => ({ 
                                          value: product.id, 
                                          label: `${product.name} - ${product.productCode}` 
                                        }))
                                    ]}
                                    placeholder={selectedSlotCategory ? "Search products..." : "Select category first"}
                                    isDisabled={!selectedSlotCategory}
                                    isLoading={productSearchLoading}
                                    inputValue={productInputValue}
                                    onInputChange={handleProductInputChange}
                                    filterOption={null} // Disable client-side filtering since we're using server-side
                                    noOptionsMessage={() => 
                                      productSearchLoading ? "Searching..." : 
                                      selectedSlotCategory ? "No products found. Try a different search term." : "Select category first"
                                    }
                                  />
                                </div>
                              </Col>

                              <Col lg={12}>
                                <div className="mb-3">
                                  <div className="form-check">
                                    <Input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="isOptional"
                                      name="isOptional"
                                      checked={productSlotForm.isOptional}
                                      onChange={handleProductSlotFormChange}
                                    />
                                    <Label className="form-check-label" htmlFor="isOptional">
                                      Is Optional
                                    </Label>
                                  </div>
                                </div>
                              </Col>
                              
                              <Col lg={6}>
                                <div className="mb-3">
                                  <div className="form-check">
                                    <Input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="hasCustomization"
                                      name="hasCustomization"
                                      checked={productSlotForm.hasCustomization}
                                      onChange={handleProductSlotFormChange}
                                    />
                                    <Label className="form-check-label" htmlFor="hasCustomization">
                                      Has Customization (Enable logo/text customization for this slot)
                                    </Label>
                                  </div>
                                  {productSlotForm.hasCustomization && (
                                    <div className="form-check mt-2 ms-4">
                                      <Input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="isFreeCustomization"
                                        name="isFreeCustomization"
                                        checked={productSlotForm.isFreeCustomization}
                                        onChange={handleProductSlotFormChange}
                                      />
                                      <Label className="form-check-label text-success" htmlFor="isFreeCustomization">
                                        <i className="ri-gift-line me-1"></i>
                                        Free Customization (All customization options for this slot are free)
                                      </Label>
                                    </div>
                                  )}
                                </div>
                              </Col>

                              <Col lg={12}>
                                <div className="d-flex gap-2">
                                  <Button
                                    type="button"
                                    color="success"
                                    onClick={addProductSlot}
                                  >
                                    {editingSlotIndex !== null ? "Update Slot" : "Add Slot"}
                                  </Button>
                                  {editingSlotIndex !== null && (
                                    <Button
                                      type="button"
                                      color="secondary"
                                      onClick={cancelSlotEdit}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>

                        {/* Display Product Slots */}
                        {productSlots.length > 0 && (
                          <Card>
                            <CardHeader>
                              <h6 className="mb-0">Product Slots ({productSlots.length})</h6>
                            </CardHeader>
                            <CardBody>
                              {productSlots.map((slot, index) => (
                                <div key={index} className="border rounded p-3 mb-3">
                                  <Row>
                                    <Col lg={12}>
                                      <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                          <h6>{slot.slotName}</h6>
                                          <p className="mb-1">
                                            Required: {slot.requiredQuantity}, 
                                            Min: {slot.minQuantity}, 
                                            Max: {slot.maxQuantity || "Unlimited"}
                                            {slot.isOptional && <Badge color="info" className="ms-2">Optional</Badge>}
                                            {slot.hasCustomization && <Badge color="success" className="ms-2">Customizable</Badge>}
                                            {slot.isFreeCustomization && <Badge color="warning" className="ms-2">Free Customization</Badge>}
                                          </p>
                                        </div>
                                        <div>
                                          <Button
                                            size="sm"
                                            color="warning"
                                            className="me-2"
                                            onClick={() => editProductSlot(index)}
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            color="danger"
                                            onClick={() => deleteProductSlot(index)}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                  
                                  {slot.allowedProductIds.length > 0 ? (
                                    <Row>
                                      <Col lg={12}>
                                        <small className="text-muted d-block mb-2">
                                          Products & Colors:
                                        </small>
                                        {slot.allowedProductIds.map((productId) => {
                                          const product = getProductDetails([productId])[0];
                                          const availableColors = productColors[`slot_${index}_product_${productId}`] || [];
                                          const selectedColorIds = selectedColors[`slot_${index}_product_${productId}`] || [];
                                          return (
                                            <div key={productId} className="border rounded p-2 mb-2 bg-light">
                                              <div className="mb-2">
                                                <strong>{product?.name || 'Unknown Product'}</strong> - {product?.code || 'N/A'}
                                              </div>
                                              
                                              {availableColors.length > 0 ? (
                                                <div className="mb-2">
                                                  <Label className="form-label small mb-1">
                                                    Select Colors (Only colors with stock shown):
                                                  </Label>
                                                  <Select
                                                    isMulti
                                                    value={availableColors
                                                      .filter(color => selectedColorIds.includes(color.id))
                                                      .map(color => ({
                                                        value: color.id,
                                                        label: color.name
                                                      }))}
                                                    onChange={(selected) => handleColorSelection(index, productId, selected)}
                                                    options={availableColors.map(color => ({
                                                      value: color.id,
                                                      label: color.name
                                                    }))}
                                                    placeholder="Select colors for this product..."
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                  />
                                                </div>
                                              ) : (
                                                <small className="text-muted">No colors with stock available</small>
                                              )}
                                              
                                              {selectedColorIds.length > 0 && (
                                                <div className="d-flex flex-wrap gap-1 mt-2">
                                                  {availableColors
                                                    .filter(color => selectedColorIds.includes(color.id))
                                                    .map(color => (
                                                      <Badge key={color.id} color="primary">
                                                        {color.name}
                                                      </Badge>
                                                    ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </Col>
                                    </Row>
                                  ) : (
                                    <small className="text-muted d-block">
                                      No products selected
                                    </small>
                                  )}
                                  
                                  {/* Slot Customization Section */}
                                  {slot.hasCustomization && (
                                    <Row className="mt-3">
                                      <Col lg={12}>
                                        <div className="border-top pt-3">
                                          <h6 className="text-primary mb-2">
                                            <i className="ri-brush-line me-1"></i>
                                            Customization Options for this Slot
                                          </h6>
                                          <small className="text-muted d-block mb-2">
                                            Select which customization methods and positions are available for this slot
                                          </small>
                                          
                                          {customizationMethods.map((method) => (
                                            <div key={method.id} className="bg-light rounded p-2 mb-2">
                                              <div className="fw-semibold mb-2">
                                                {method.applicationMethod} - {method.applicationType}
                                                <small className="text-muted ms-2">(Setup: A${method.setupCharge})</small>
                                              </div>
                                              <div className="row">
                                                {customizationPositions.map((position) => {
                                                  const isChecked = (slotCustomizations[`slot_${index}`] || []).some(
                                                    c => c.customizationMethodId === method.id && c.positionId === position.id
                                                  );
                                                  return (
                                                    <div key={position.id} className="col-md-4 mb-1">
                                                      <div className="d-flex align-items-center gap-2">
                                                        <Input
                                                          className="form-check-input"
                                                          type="checkbox"
                                                          id={`slot_${index}_custom_${method.id}_${position.id}`}
                                                          checked={isChecked}
                                                          onChange={(e) => handleSlotCustomizationChange(index, method.id, position.id, e.target.checked)}
                                                        />
                                                        <Label 
                                                          className="form-check-label small mb-0" 
                                                          htmlFor={`slot_${index}_custom_${method.id}_${position.id}`}
                                                        >
                                                          {position.positionName}
                                                        </Label>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {(slotCustomizations[`slot_${index}`] || []).length > 0 && (
                                            <div className="mt-2">
                                              <small className="text-success">
                                                <i className="ri-check-line me-1"></i>
                                                {(slotCustomizations[`slot_${index}`] || []).length} customization option(s) selected
                                                {slot.isFreeCustomization && (
                                                  <span className="ms-2 badge bg-success-subtle text-success">FREE Customization</span>
                                                )}
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      </Col>
                                    </Row>
                                  )}
                                </div>
                              ))}
                            </CardBody>
                          </Card>
                        )}
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Customizations Tab - Now shows summary of slot customizations */}
                  <TabPane tabId="3">
                    <Row>
                      <Col lg={12}>
                        <Card>
                          <CardHeader>
                            <h6 className="mb-0">Slot Customization Summary</h6>
                            <small className="text-muted">Customization options are now configured per slot in the Product Slots tab</small>
                          </CardHeader>
                          <CardBody>
                            {productSlots.filter(s => s.hasCustomization).length === 0 ? (
                              <div className="text-center py-4">
                                <i className="ri-brush-line fs-1 text-muted mb-2 d-block"></i>
                                <p className="text-muted mb-0">No slots have customization enabled.</p>
                                <p className="text-muted small">Enable "Has Customization" when adding/editing slots to configure customization options.</p>
                              </div>
                            ) : (
                              productSlots.map((slot, index) => {
                                if (!slot.hasCustomization) return null;
                                const slotCustoms = slotCustomizations[`slot_${index}`] || [];
                                return (
                                  <div key={index} className="border rounded p-3 mb-3">
                                    <h6 className="mb-2">
                                      <i className="ri-price-tag-3-line me-1"></i>
                                      {slot.slotName}
                                    </h6>
                                    {slotCustoms.length === 0 ? (
                                      <small className="text-muted">No customization options selected for this slot</small>
                                    ) : (
                                      <div className="d-flex flex-wrap gap-2">
                                        {slotCustoms.map((custom, cIndex) => {
                                          const method = customizationMethods.find(m => m.id === custom.customizationMethodId);
                                          const position = customizationPositions.find(p => p.id === custom.positionId);
                                          return (
                                            <Badge 
                                              key={cIndex} 
                                              color={custom.isFree ? "success" : "primary"}
                                              className="px-2 py-1"
                                            >
                                              {method?.applicationMethod} - {position?.positionName}
                                              {custom.isFree && <span className="ms-1">(Free)</span>}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Delivery Options Tab */}
                  <TabPane tabId="4">
                    <Row>
                      <Col lg={12}>
                        <Card>
                          <CardHeader>
                            <h6 className="mb-0">Available Delivery Options</h6>
                            <small className="text-muted">Select which delivery options are available for this deal</small>
                          </CardHeader>
                          <CardBody>
                            {allDeliveryTypes.length === 0 ? (
                              <p className="text-muted">No delivery types available. Please create delivery types first.</p>
                            ) : (
                              <div className="row">
                                {allDeliveryTypes.map((deliveryType) => {
                                  const isSelected = selectedDeliveryTypes.some(dt => dt.deliveryTypeId === deliveryType.id);
                                  const selectedItem = selectedDeliveryTypes.find(dt => dt.deliveryTypeId === deliveryType.id);
                                  const isDefault = selectedItem?.isDefault || false;
                                  
                                  return (
                                    <div key={deliveryType.id} className="col-md-6 col-lg-4 mb-3">
                                      <div className={`border rounded p-3 h-100 ${isSelected ? 'border-primary bg-light' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <div className="form-check">
                                            <Input
                                              className="form-check-input"
                                              type="checkbox"
                                              id={`delivery_${deliveryType.id}`}
                                              checked={isSelected}
                                              onChange={(e) => handleDeliveryTypeChange(deliveryType.id, e.target.checked)}
                                            />
                                            <Label 
                                              className="form-check-label fw-semibold" 
                                              htmlFor={`delivery_${deliveryType.id}`}
                                            >
                                              {deliveryType.name}
                                            </Label>
                                          </div>
                                          {deliveryType.applyToAll && (
                                            <Badge color="primary" className="ms-2">Auto-select</Badge>
                                          )}
                                        </div>
                                        
                                        <small className="text-muted d-block mb-2">{deliveryType.code}</small>
                                        
                                        {deliveryType.estimatedDaysMin && deliveryType.estimatedDaysMax ? (
                                          <small className="d-block">
                                            <i className="ri-time-line me-1"></i>
                                            {deliveryType.estimatedDaysMin}-{deliveryType.estimatedDaysMax} days
                                          </small>
                                        ) : deliveryType.estimatedDays ? (
                                          <small className="d-block">
                                            <i className="ri-time-line me-1"></i>
                                            {deliveryType.estimatedDays} days
                                          </small>
                                        ) : null}
                                        
                                        <small className="d-block">
                                          {deliveryType.isChargeable ? (
                                            <>
                                              <i className="ri-money-pound-circle-line me-1"></i>
                                              A${parseFloat(deliveryType.deliveryCharge).toFixed(2)}
                                              {deliveryType.freeDeliveryMinOrder && (
                                                <span className="text-success ms-1">
                                                  (Free over A${parseFloat(deliveryType.freeDeliveryMinOrder).toFixed(2)})
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <Badge color="success">Free Delivery</Badge>
                                          )}
                                        </small>
                                        
                                        {isSelected && selectedDeliveryTypes.length > 1 && (
                                          <div className="mt-2 pt-2 border-top">
                                            <div className="form-check">
                                              <Input
                                                className="form-check-input"
                                                type="radio"
                                                name="defaultDeliveryType"
                                                id={`default_${deliveryType.id}`}
                                                checked={isDefault}
                                                onChange={() => handleDeliveryTypeDefault(deliveryType.id)}
                                              />
                                              <Label 
                                                className="form-check-label small" 
                                                htmlFor={`default_${deliveryType.id}`}
                                              >
                                                Set as Default
                                              </Label>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {selectedDeliveryTypes.length > 0 && (
                              <div className="mt-3 pt-3 border-top">
                                <h6 className="mb-2">Selected Delivery Options ({selectedDeliveryTypes.length})</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {selectedDeliveryTypes.map(dt => {
                                    const deliveryType = allDeliveryTypes.find(d => d.id === dt.deliveryTypeId);
                                    return (
                                      <Badge 
                                        key={dt.deliveryTypeId} 
                                        color={dt.isDefault ? "primary" : "secondary"}
                                        className="p-2"
                                      >
                                        {deliveryType?.name}
                                        {dt.isDefault && <small className="ms-1">(Default)</small>}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Banner & Settings Tab */}
                  <TabPane tabId="5">
                    <Row>
                      <Col lg={6}>
                        <Card>
                          <CardHeader>
                            <h6 className="mb-0">Banner Image</h6>
                          </CardHeader>
                          <CardBody>
                            <div className="mb-3">
                              <Label htmlFor="bannerImage" className="form-label">
                                Banner Image
                              </Label>
                              <Input
                                type="file"
                                className="form-control"
                                id="bannerImage"
                                accept="image/*"
                                onChange={handleBannerImageChange}
                              />
                            </div>
                            
                            {bannerPreview && (
                              <div className="position-relative">
                                <img
                                  src={bannerPreview}
                                  alt="Banner Preview"
                                  className="img-thumbnail"
                                  style={{ maxWidth: "100%", maxHeight: "200px" }}
                                />
                                <Button
                                  size="sm"
                                  color="danger"
                                  className="position-absolute top-0 end-0"
                                  onClick={removeBannerImage}
                                >
                                  ×
                                </Button>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </Col>

                      <Col lg={6}>
                        <Card>
                          <CardHeader>
                            <h6 className="mb-0">Deal Settings</h6>
                          </CardHeader>
                          <CardBody>
                            <Row>
                              <Col md={4} className="mb-3">
                                <label className="form-label">
                                  Status <span className="text-danger">*</span>
                                </label>
                                <Select
                                  id="status"
                                  name="status"
                                  value={dealStatusOptions.find(opt => opt.value === values.status)}
                                  onChange={handleSelectChange}
                                  options={dealStatusOptions}
                                  placeholder="Select status"
                                  // menuPortalTarget={document.body}
                                  // styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                  className="react-select-container w-100"
                                  classNamePrefix="react-select"
                                />
                              </Col>
                            </Row>
                            <Row>
                              <Col xs={4}>
                                <div className="mb-3">
                                  <Label htmlFor="sortOrder" className="form-label">
                                    Sort Order
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="sortOrder"
                                    name="sortOrder"
                                    value={values.sortOrder}
                                    onChange={handleChange}
                                  />
                                </div>
                              </Col>

                              <Col xs={4}>
                                <div className="mb-3">
                                  <Label htmlFor="maxPurchasePerCustomer" className="form-label">
                                    Max/Customer
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="maxPurchasePerCustomer"
                                    name="maxPurchasePerCustomer"
                                    min="1"
                                    value={values.maxPurchasePerCustomer}
                                    onChange={handleChange}
                                  />
                                </div>
                              </Col>

                              <Col xs={4}>
                                <div className="mb-3">
                                  <Label htmlFor="stockLimit" className="form-label">
                                    Stock Limit
                                  </Label>
                                  <Input
                                    type="number"
                                    className="form-control"
                                    id="stockLimit"
                                    name="stockLimit"
                                    min="0"
                                    placeholder="-"
                                    value={values.stockLimit}
                                    onChange={handleChange}
                                  />
                                </div>
                              </Col>
                              

                              <Col md={6} className="mb-3">
                                <div className="form-check">
                                  <Input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isFeatured"
                                    name="isFeatured"
                                    checked={values.isFeatured}
                                    onChange={handleChange}
                                  />
                                  <Label className="form-check-label" htmlFor="isFeatured">
                                    Featured Deal
                                  </Label>
                                </div>
                              </Col>
                            </Row>

                            <div className="mb-0">
                              <Label htmlFor="terms" className="form-label">
                                Terms & Conditions
                              </Label>
                              <Input
                                type="textarea"
                                className="form-control"
                                id="terms"
                                name="terms"
                                rows="3"
                                value={values.terms}
                                onChange={handleChange}
                                placeholder="Enter terms and conditions..."
                              />
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </TabPane>
                </TabContent>

                <FormsFooter 
                  handleSubmit={updateForm ? handleUpdate : handleSubmit}
                  handleSubmitCancel={handleList}
                />
              </Form>
            </div>
          </CardBody>
        </Card>
        </Col>
      </Row>
    </CardBody>
  );

  document.title = `Deal Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Deal" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <FormsHeader
                      formName="Deal"
                      filter={filter}
                      handleFilter={handleFilter}
                      tog_list={handleList}
                      setQuery={setSearchTerm}
                      initialState={initialState}
                      setValues={setValues}
                      updateForm={updateForm}
                      showForm={showForm}
                      setShowForm={setShowForm}
                      setUpdateForm={setUpdateForm}
                      openAddForm={openAddForm}
                      showAddButton={currentPagePermissions?.write}
                    />
                    <ExportButtons
                      data={data}
                      columns={exportColumns}
                      fileName="Deals"
                      fetchAll={fetchAllForExport}
                    />
                  </div>
                </CardHeader>

                {(showForm || updateForm) ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={columns}
                        data={data}
                        customStyles={tableCustomStyles}
                        progressPending={loading}
                        sortServer
                        onSort={(column, sortDirection) =>
                          handleSort(column, sortDirection)
                        }
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[
                          50,
                          100,
                          200,
                          300,
                          totalRows,
                        ]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <DeleteModal
        show={modal_delete && !isDeleteLoading}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Deal"
        referenceData={referenceData}
      />
    </React.Fragment>
  );
};

export default Deal;
