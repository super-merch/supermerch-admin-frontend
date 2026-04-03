import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    Input,
    Label,
    Card,
    CardBody,
    CardHeader,
    Col,
    Form,
    Container,
    Row,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Badge,
    FormFeedback,
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
import ProductPricingCalculator from "../../Components/Common/ProductPricingCalculator";

const Product = () => {
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
    const [searchTerm, setSearchTerm] = useState(""); // Immediate input value
    const [maxVal, setMaxVal] = useState(0);
    // Tab state
    const [activeTab, setActiveTab] = useState("1");

    const initialState = {
        productCode: "",
        name: "",
        slug: "",
        description: "",
        mainCategoryId: "",
        subCategoryId: "",
        collectionId: "",
        brandId: "",
        supplierId: "",
        genderId: "",
        materialIds: [],
        materialDescription: "",
        fabricWeight: "",
        features: "",
        commodityCode: "",
        countryOfOrigin: "",
        isCustomizable: false,
        isActive: true,
        isFeatured: false,
        isNew: false,
        isClearance: false,
        isVatFree: false,
        isBestSelling: false,
        isFasterDispatch: false,
        sortOrder: 0,
    };

    const [values, setValues] = useState(initialState);

    // Dropdown data states
    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [collections, setCollections] = useState([]);
    const [brands, setBrands] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [genders, setGenders] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [customizationMethods, setCustomizationMethods] = useState([]);
    const [customizationPositions, setCustomizationPositions] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizeCategories, setSizeCategories] = useState([]);
    const [selectedSizeCategory, setSelectedSizeCategory] = useState("");
    const [sizes, setSizes] = useState([]);
    const [deliveryTypes, setDeliveryTypes] = useState([]);

    // Product delivery options state
    const [productDeliveryOptions, setProductDeliveryOptions] = useState([]);
    // Structure: [{ deliveryTypeId, isDefault, priceOverride, isActive }]

    // Customization states - each method maps to multiple positions
    const [methodPositionMappings, setMethodPositionMappings] = useState([]);
    // Structure: [{ methodId: 1, positions: [{positionId: 1, priceAdjustment: 0}] }]

    // Variant states
    const [variants, setVariants] = useState([]);
    const [variantForm, setVariantForm] = useState({
        colorId: "",
        sizeId: "",
        sku: "",
        priceAdjustment: 0,
        stockQty: 0,
        isActive: true,
    });
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);

    // Product-color images state
    const [productColorImages, setProductColorImages] = useState({});
    const [uploadingColorImages, setUploadingColorImages] = useState(false);
    const [selectedColorForImages, setSelectedColorForImages] = useState(null);

    // Price Tier states (now at product level, not per variant)
    const [priceTiers, setPriceTiers] = useState([]);
    const [priceTierForm, setPriceTierForm] = useState({
        minQuantity: "",
        maxQuantity: "",
        unitPrice: "",
        discountPercent: "",
        tierLabel: "",
    });
    const [editingPriceTierIndex, setEditingPriceTierIndex] = useState(null);

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

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: false,
            width: "70px",
        },
        {
            name: "Product Code",
            selector: (row) => (
                <span className="text-wrap fw-semibold">{row.productCode}</span>
            ),
            sortable: true,
            maxWidth: "150px",
        },
        {
            name: "Name",
            selector: (row) => (
                <div className="text-wrap">
                    <p className="mb-0 fw-medium">{row.name}</p>
                    <small className="text-muted">{row.slug}</small>
                </div>
            ),
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Category",
            selector: (row) => (
                <div>
                    <p className="mb-0">{row.mainCategory?.name || "-"}</p>
                    {row.subCategory && (
                        <small className="text-muted">
                            {row.subCategory.name}
                        </small>
                    )}
                </div>
            ),
            sortable: true,
            minWidth: "120px",
        },
        {
            name: "Brand",
            selector: (row) => (
                <span className="text-wrap">{row.brand?.name || "-"}</span>
            ),
            sortable: true,
            width: "150px",
        },
        {
            name: "Variants",
            selector: (row) => (
                <Badge color="info" className="badge-soft-info text-white">
                    {row._count?.variants || 0}
                </Badge>
            ),
            sortable: false,
            width: "90px",
        },
        {
            name: "Customizable",
            selector: (row) => (
                <div className="text-white">
                    {row.isCustomizable ? (
                        <>
                            <Badge
                                color="success"
                                className="badge-soft-success mb-1 text-white"
                            >
                                <i className="ri-check-line align-middle me-1"></i>
                                Yes
                            </Badge>
                            <div className="d-flex gap-1 flex-wrap">
                                {row._count?.productCustomizationMethods >
                                    0 && (
                                        <Badge
                                            color="primary"
                                            pill
                                            className="badge-soft-primary text-white"
                                        >
                                            {row._count.productCustomizationMethods}{" "}
                                            method
                                            {row._count
                                                .productCustomizationMethods !== 1
                                                ? "s"
                                                : ""}
                                        </Badge>
                                    )}
                                {row._count?.productCustomizationPositions >
                                    0 && (
                                        <Badge
                                            color="secondary"
                                            pill
                                            className="badge-soft-secondary text-white"
                                        >
                                            {
                                                row._count
                                                    .productCustomizationPositions
                                            }{" "}
                                            position
                                            {row._count
                                                .productCustomizationPositions !== 1
                                                ? "s"
                                                : ""}
                                        </Badge>
                                    )}
                            </div>
                        </>
                    ) : (
                        <Badge
                            color="secondary"
                            className="badge-soft-secondary text-white"
                        >
                            No
                        </Badge>
                    )}
                </div>
            ),
            sortable: false,
            minWidth: "160px",
        },
        {
            name: "Sort Order",
            selector: (row) => (
                <span className="text-wrap">{row.sortOrder || "-"}</span>
            ),
            sortable: true,
            sortField: "sortOrder",
            width: "150px",
        },
        {
            name: "Action",
            selector: (row) => {
                return (
                    <div className="d-flex gap-2">
                        {currentPagePermissions.edit && (
                            <button
                                className="btn btn-sm btn-success edit-item-btn"
                                data-bs-toggle="modal"
                                data-bs-target="#showModal"
                                onClick={() => handleTog_edit(row.id)}
                            >
                                Edit
                            </button>
                        )}
                        {currentPagePermissions.delete && (
                            <button
                                className="btn btn-sm btn-danger remove-item-btn"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteRecordModal"
                                onClick={() => tog_delete(row.id)}
                            >
                                Remove
                            </button>
                        )}
                        {!currentPagePermissions.edit &&
                            !currentPagePermissions.delete && (
                                <span className="text-muted">
                                    No actions available
                                </span>
                            )}
                    </div>
                );
            },
            sortable: false,
            minWidth: "180px",
        },
    ];

    // Toggle tab
    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        let params = {
            page: pageNo || 1,
            limit: perPage,
            isActive: filter,
        };

        if (query) {
            params.search = query;
        }

        try {
            const response = await axios.get("/api/list-products-by-params", {
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
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
            setData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, filter, query]);

    const fetchMainCategories = async () => {
        try {
            const response = await axios.get("/api/main-categories", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                setMainCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching main categories:", error);
            toast.error("Failed to fetch main categories");
        }
    };

    const fetchSubCategoriesByMainCategory = async (mainCategoryId) => {
        try {
            const response = await axios.get(
                `/api/sub-categories/main-category/${mainCategoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                setSubCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            toast.error("Failed to fetch subcategories");
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await axios.get("/api/brands", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                setBrands(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching brands:", error);
            toast.error("Failed to fetch brands");
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("/api/suppliers", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setSuppliers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Failed to fetch suppliers");
        }
    };

    const fetchGenders = async () => {
        try {
            const response = await axios.get("/api/genders", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setGenders(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching genders:", error);
            toast.error("Failed to fetch genders");
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await axios.get("/api/materials", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setMaterials(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching materials:", error);
            toast.error("Failed to fetch materials");
        }
    };

    const fetchCollections = async () => {
        try {
            const response = await axios.get("/api/collections", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setCollections(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching collections:", error);
            toast.error("Failed to fetch collections");
        }
    };

    const fetchColors = async () => {
        try {
            const response = await axios.get("/api/list-all-colors", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setColors(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching colors:", error);
            toast.error("Failed to fetch colors");
        }
    };

    const fetchSizeCategories = async () => {
        try {
            const response = await axios.get("/api/size-categories", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setSizeCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching size categories:", error);
            toast.error("Failed to fetch size categories");
        }
    };

    const fetchSizesByCategory = async (categoryId) => {
        if (!categoryId) {
            setSizes([]);
            return;
        }

        try {
            const response = await axios.get(
                `/api/sizes/category/${categoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (response.data.success) {
                setSizes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching sizes:", error);
            toast.error("Failed to fetch sizes");
            setSizes([]);
        }
    };

    const fetchCustomizationMethods = async () => {
        try {
            const response = await axios.get("/api/customization-methods", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setCustomizationMethods(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching customization methods:", error);
            toast.error("Failed to fetch customization methods");
        }
    };

    const fetchCustomizationPositions = async () => {
        try {
            const response = await axios.get("/api/customization-positions", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setCustomizationPositions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching customization positions:", error);
            toast.error("Failed to fetch customization positions");
        }
    };

    const fetchDeliveryTypes = async () => {
        try {
            const response = await axios.get("/api/delivery-types", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setDeliveryTypes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching delivery types:", error);
            toast.error("Failed to fetch delivery types");
        }
    };

    useEffect(() => {
        fetchMainCategories();
        fetchBrands();
        fetchSuppliers();
        fetchGenders();
        fetchMaterials();
        fetchCollections();
        fetchColors();
        fetchSizeCategories();
        fetchCustomizationMethods();
        fetchCustomizationPositions();
        fetchDeliveryTypes();
    }, []);

    useEffect(() => {
        if (values.mainCategoryId) {
            fetchSubCategoriesByMainCategory(values.mainCategoryId);
        }
    }, [values.mainCategoryId]);

    useEffect(() => {
        if (selectedSizeCategory) {
            fetchSizesByCategory(selectedSizeCategory);
        } else {
            setSizes([]);
        }
    }, [selectedSizeCategory]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Debounce search term
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setQuery(searchTerm);
            setPageNo(0); // Reset to first page on new search
        }, 500); // 500ms debounce delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Generate slug from name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setValues({ ...values, [name]: checked });

            // If disabling customizable, clear method-position mappings
            if (name === "isCustomizable" && !checked) {
                setMethodPositionMappings([]);
            }
        } else {
            setValues({ ...values, [name]: value });

            // Auto-generate slug from name
            if (name === "name" && !updateForm) {
                setValues((prev) => ({ ...prev, slug: generateSlug(value) }));
            }

            // Clear subcategory if main category changes
            if (name === "mainCategoryId") {
                setValues((prev) => ({ ...prev, subCategoryId: "" }));
            }
        }
    };

    // Handle react-select changes
    const handleSelectChange = (selectedOption, actionMeta) => {
        const { name } = actionMeta;
        setValues({
            ...values,
            [name]: selectedOption ? selectedOption.value : "",
        });

        // Clear subcategory if main category changes
        if (name === "mainCategoryId") {
            setValues((prev) => ({ ...prev, subCategoryId: "" }));
        }
    };

    const handlecheck = (e) => {
        const { name, checked } = e.target;
        setValues({ ...values, [name]: checked });

        // If disabling customizable, clear method-position mappings
        if (name === "isCustomizable" && !checked) {
            setMethodPositionMappings([]);
        }
    };

    // Handle customization method selection
    const handleMethodChange = (methodId) => {
        const id = parseInt(methodId);
        const existingMethod = methodPositionMappings.find(
            (m) => m.methodId === id
        );

        if (existingMethod) {
            // Remove method and all its positions
            setMethodPositionMappings((prev) =>
                prev.filter((m) => m.methodId !== id)
            );
        } else {
            // Add method with empty positions array
            setMethodPositionMappings((prev) => [
                ...prev,
                { methodId: id, positions: [] },
            ]);
        }
    };

    // Handle position selection for a specific method
    const handlePositionChange = (
        methodId,
        positionId,
        priceAdjustment = 0
    ) => {
        const mId = parseInt(methodId);
        const pId = parseInt(positionId);

        setMethodPositionMappings((prev) => {
            const methodIndex = prev.findIndex((m) => m.methodId === mId);
            if (methodIndex === -1) return prev; // Method not selected

            const updatedMappings = [...prev];
            const method = updatedMappings[methodIndex];
            const positionIndex = method.positions.findIndex(
                (p) => p.positionId === pId
            );

            if (positionIndex !== -1) {
                // Remove position if already exists (unchecking)
                method.positions = method.positions.filter(
                    (p) => p.positionId !== pId
                );
            } else {
                // Add position with price adjustment
                method.positions.push({
                    positionId: pId,
                    priceAdjustment: parseFloat(priceAdjustment) || 0,
                });
            }

            updatedMappings[methodIndex] = method;
            return updatedMappings;
        });
    };

    // Update position price adjustment for a specific method
    const handlePositionPriceChange = (
        methodId,
        positionId,
        priceAdjustment
    ) => {
        const mId = parseInt(methodId);
        const pId = parseInt(positionId);

        setMethodPositionMappings((prev) => {
            const methodIndex = prev.findIndex((m) => m.methodId === mId);
            if (methodIndex === -1) return prev;

            const updatedMappings = [...prev];
            const method = updatedMappings[methodIndex];
            const positionIndex = method.positions.findIndex(
                (p) => p.positionId === pId
            );

            if (positionIndex !== -1) {
                method.positions[positionIndex].priceAdjustment =
                    parseFloat(priceAdjustment) || 0;
            }

            updatedMappings[methodIndex] = method;
            return updatedMappings;
        });
    };

    // Variant handlers
    const handleVariantFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVariantForm({
            ...variantForm,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleVariantSelectChange = (selectedOption, actionMeta) => {
        const { name } = actionMeta;
        setVariantForm({
            ...variantForm,
            [name]: selectedOption ? selectedOption.value : "",
        });
    };

    const addVariant = () => {
        // Validation
        if (!variantForm.colorId || !variantForm.sizeId || !variantForm.sku) {
            toast.error("Please fill all required variant fields");
            return;
        }

        // Check duplicate SKU
        const isDuplicate = variants.some(
            (v, index) =>
                v.sku === variantForm.sku && index !== editingVariantIndex
        );
        if (isDuplicate) {
            toast.error("SKU already exists");
            return;
        }

        if (editingVariantIndex !== null) {
            // Update existing variant
            const updatedVariants = [...variants];
            updatedVariants[editingVariantIndex] = {
                ...variantForm,
            };
            setVariants(updatedVariants);
            setEditingVariantIndex(null);
            toast.success("Variant updated");
        } else {
            // Add new variant
            setVariants([
                ...variants,
                {
                    ...variantForm,
                },
            ]);
            toast.success("Variant added");
        }

        // Reset form
        setVariantForm({
            colorId: "",
            sizeId: "",
            sku: "",
            priceAdjustment: 0,
            stockQty: 0,
            isActive: true,
        });
    };

    const editVariant = (index) => {
        setVariantForm(variants[index]);
        setEditingVariantIndex(index);
        setActiveTab("4"); // Switch to variants tab
    };

    const deleteVariant = (index) => {
        const variantToDelete = variants[index];
        setVariants(variants.filter((_, i) => i !== index));

        // Also remove price tiers for this variant
        const variantKey = `${variantToDelete.colorId}-${variantToDelete.sizeId}`;
        const newPriceTiers = { ...priceTiers };
        delete newPriceTiers[variantKey];
        setPriceTiers(newPriceTiers);

        toast.success("Variant removed");
    };

    const cancelVariantEdit = () => {
        setVariantForm({
            colorId: "",
            sizeId: "",
            sku: "",
            priceAdjustment: 0,
            stockQty: 0,
            isActive: true,
        });
        setEditingVariantIndex(null);
    };

    // Image upload handlers for product-color combinations
    const handleColorImageUpload = async (productId, colorId, files) => {
        if (!files || files.length === 0) return;

        setUploadingColorImages(true);
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append("colorId", colorId);

        Array.from(files).forEach((file) => {
            formData.append("images", file);
        });

        try {
            const response = await axios.post(
                `/api/upload-product-color-images`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                toast.success("Images uploaded successfully");
                // Refresh the product data to show new images
                if (_id) {
                    handleTog_edit(_id);
                }
            }
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error(
                error.response?.data?.message || "Failed to upload images"
            );
        } finally {
            setUploadingColorImages(false);
        }
    };

    const handleDeleteColorImage = async (imageId) => {
        if (!window.confirm("Are you sure you want to delete this image?"))
            return;

        try {
            const response = await axios.delete(
                `/api/delete-product-color-image/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Image deleted successfully");
                // Refresh the product data
                if (_id) {
                    handleTog_edit(_id);
                }
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            toast.error(
                error.response?.data?.message || "Failed to delete image"
            );
        }
    };

    const handleSetPrimaryColorImage = async (imageId) => {
        try {
            const response = await axios.put(
                `/api/set-primary-product-color-image/${imageId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Primary image set successfully");
                // Refresh the product data
                if (_id) {
                    handleTog_edit(_id);
                }
            }
        } catch (error) {
            console.error("Error setting primary image:", error);
            toast.error(
                error.response?.data?.message || "Failed to set primary image"
            );
        }
    };

    // Handler for ProductPricingCalculator component
    const handlePricingCalculatorChange = (calculatedTiers) => {
        setPriceTiers(calculatedTiers);
    };

    // Price Tier handlers (now at product level)
    const handlePriceTierFormChange = (e) => {
        const { name, value } = e.target;
        const tiersArray = Array.isArray(priceTiers) ? priceTiers : [];
        const isFirstTier =
            tiersArray.length === 0 && editingPriceTierIndex === null;
        const isEditingFirstTier = editingPriceTierIndex === 0;

        // For subsequent tiers, auto-calculate unitPrice when discountPercent changes
        if (
            name === "discountPercent" &&
            !isFirstTier &&
            !isEditingFirstTier &&
            tiersArray.length > 0
        ) {
            const firstTierPrice = tiersArray[0]?.unitPrice || 0;
            const discount = parseFloat(value) || 0;
            const calculatedPrice = firstTierPrice * (1 - discount / 100);
            setPriceTierForm({
                ...priceTierForm,
                discountPercent: value,
                unitPrice: calculatedPrice.toFixed(2),
            });
        } else {
            setPriceTierForm({ ...priceTierForm, [name]: value });
        }
    };

    const addPriceTier = () => {
        // Ensure priceTiers is an array
        const tiersArray = Array.isArray(priceTiers) ? priceTiers : [];
        const isFirstTier =
            tiersArray.length === 0 && editingPriceTierIndex === null;
        const isEditingFirstTier = editingPriceTierIndex === 0;

        // Validation - first tier needs unitPrice, subsequent tiers need discountPercent
        if (!priceTierForm.minQuantity) {
            toast.error("Min Quantity is required");
            return;
        }

        if ((isFirstTier || isEditingFirstTier) && !priceTierForm.unitPrice) {
            toast.error("Unit Price is required for the first tier");
            return;
        }

        if (
            !isFirstTier &&
            !isEditingFirstTier &&
            !priceTierForm.discountPercent
        ) {
            toast.error("Discount % is required for subsequent tiers");
            return;
        }

        // Check for overlapping ranges
        const minQty = parseInt(priceTierForm.minQuantity);
        const maxQty = priceTierForm.maxQuantity
            ? parseInt(priceTierForm.maxQuantity)
            : null;

        const hasOverlap = tiersArray.some((tier, index) => {
            if (editingPriceTierIndex === index) return false; // Skip current editing tier

            const tierMin = tier.minQuantity;
            const tierMax = tier.maxQuantity;

            if (maxQty) {
                if (tierMax) {
                    return minQty <= tierMax && maxQty >= tierMin;
                } else {
                    return minQty <= tierMin;
                }
            } else {
                return tierMax ? maxQty >= tierMin : true;
            }
        });

        if (hasOverlap) {
            toast.error("Quantity range overlaps with existing tier");
            return;
        }

        // Calculate unitPrice for non-first tiers based on discount from first tier
        let calculatedUnitPrice;
        if (isFirstTier || isEditingFirstTier) {
            calculatedUnitPrice = parseFloat(priceTierForm.unitPrice);
        } else {
            const firstTierPrice = tiersArray[0]?.unitPrice || 0;
            const discount = parseFloat(priceTierForm.discountPercent) || 0;
            calculatedUnitPrice = firstTierPrice * (1 - discount / 100);
        }

        const newTier = {
            minQuantity: minQty,
            maxQuantity: maxQty,
            unitPrice: parseFloat(calculatedUnitPrice.toFixed(2)),
            discountPercent: priceTierForm.discountPercent
                ? parseFloat(priceTierForm.discountPercent)
                : null,
            tierLabel: priceTierForm.tierLabel || null,
        };

        if (editingPriceTierIndex !== null) {
            // Update existing tier
            const updatedTiers = [...tiersArray];
            updatedTiers[editingPriceTierIndex] = newTier;
            setPriceTiers(updatedTiers);
            setEditingPriceTierIndex(null);
            toast.success("Price tier updated");
        } else {
            // Add new tier
            setPriceTiers([...tiersArray, newTier]);
            toast.success("Price tier added");
        }

        // Reset form
        setPriceTierForm({
            minQuantity: "",
            maxQuantity: "",
            unitPrice: "",
            discountPercent: "",
            tierLabel: "",
        });
    };

    const editPriceTier = (index) => {
        const tiersArray = Array.isArray(priceTiers) ? priceTiers : [];
        if (tiersArray[index]) {
            const tier = tiersArray[index];
            // For first tier, show the actual price; for others, show calculated price (read-only)
            setPriceTierForm({
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity || "",
                unitPrice: tier.unitPrice,
                discountPercent: tier.discountPercent || "",
                tierLabel: tier.tierLabel || "",
            });
            setEditingPriceTierIndex(index);
        }
    };

    const deletePriceTier = (index) => {
        const tiersArray = Array.isArray(priceTiers) ? priceTiers : [];
        const updatedTiers = tiersArray.filter((_, i) => i !== index);
        setPriceTiers(updatedTiers);
        toast.success("Price tier removed");
    };

    const cancelPriceTierEdit = () => {
        setPriceTierForm({
            minQuantity: "",
            maxQuantity: "",
            unitPrice: "",
            discountPercent: "",
            tierLabel: "",
        });
        setEditingPriceTierIndex(null);
    };

    // Delivery Options handlers
    const handleDeliveryOptionToggle = (deliveryTypeId) => {
        const id = parseInt(deliveryTypeId);
        const existingOption = productDeliveryOptions.find(
            (opt) => opt.deliveryTypeId === id
        );

        if (existingOption) {
            // Remove option
            setProductDeliveryOptions((prev) =>
                prev.filter((opt) => opt.deliveryTypeId !== id)
            );
        } else {
            // Add option with defaults
            setProductDeliveryOptions((prev) => [
                ...prev,
                {
                    deliveryTypeId: id,
                    isDefault: prev.length === 0, // First one is default
                    priceOverride: null,
                    isActive: true,
                },
            ]);
        }
    };

    const handleDeliveryOptionChange = (deliveryTypeId, field, value) => {
        const id = parseInt(deliveryTypeId);
        setProductDeliveryOptions((prev) => {
            return prev.map((opt) => {
                if (opt.deliveryTypeId === id) {
                    // If setting as default, unset others
                    if (field === "isDefault" && value) {
                        return { ...opt, [field]: value };
                    }
                    return { ...opt, [field]: value };
                }
                // Unset default on other options if this one is being set as default
                if (field === "isDefault" && value) {
                    return { ...opt, isDefault: false };
                }
                return opt;
            });
        });
    };

    const setDefaultDeliveryOption = (deliveryTypeId) => {
        const id = parseInt(deliveryTypeId);
        setProductDeliveryOptions((prev) => {
            return prev.map((opt) => ({
                ...opt,
                isDefault: opt.deliveryTypeId === id,
            }));
        });
    };

    const handleList = () => {
        setShowForm(false);
        setUpdateForm(false);
        setIsSubmit(false);
        setValues(initialState);
        setFormErrors({});
        setMethodPositionMappings([]);
        setVariants([]);
        setPriceTiers([]);
        setProductDeliveryOptions([]);
        setSelectedSizeCategory("");
        setSizes([]);
        setVariantForm({
            colorId: "",
            sizeId: "",
            sku: "",
            priceAdjustment: 0,
            stockQty: 0,
            isActive: true,
        });
        setPriceTierForm({
            minQuantity: "",
            maxQuantity: "",
            unitPrice: "",
            discountPercent: "",
            tierLabel: "",
        });
        setEditingVariantIndex(null);
        setEditingPriceTierIndex(null);
        setSelectedColorForImages(null);
        setUploadingColorImages(false);
        setProductColorImages({});
        setActiveTab("1");
    };

    // Open Add form with auto-selected delivery types
    const openAddForm = async () => {
        // Reset all form state first
        setUpdateForm(false);
        setIsSubmit(false);
        setValues(initialState);
        setFormErrors({});
        setMethodPositionMappings([]);
        setVariants([]);
        setPriceTiers([]);
        setSelectedSizeCategory("");
        setSizes([]);
        setVariantForm({
            colorId: "",
            sizeId: "",
            sku: "",
            priceAdjustment: 0,
            stockQty: 0,
            isActive: true,
        });
        setPriceTierForm({
            minQuantity: "",
            maxQuantity: "",
            unitPrice: "",
            discountPercent: "",
            tierLabel: "",
        });
        setEditingVariantIndex(null);
        setEditingPriceTierIndex(null);
        setSelectedColorForImages(null);
        setUploadingColorImages(false);
        setProductColorImages({});
        setActiveTab("1");

        // Auto-select delivery types with applyToAll = true
        const applyToAllDeliveryTypes = deliveryTypes
            .filter((dt) => dt.applyToAll)
            .map((dt, index) => ({
                deliveryTypeId: dt.id,
                isDefault: index === 0,
                priceOverride: null,
                isActive: true,
            }));
        setProductDeliveryOptions(applyToAllDeliveryTypes);

        // Fetch max sort order
        try {
            const response = await axios.get("/api/max-sort-order", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setMaxVal((response.data.data || 0));
            }
        } catch (error) {
            console.error("Error fetching max sort order:", error);
        }

        // Show form
        setShowForm(true);
    };

    const handleTog_edit = async (_id) => {
        setIsSubmit(false);
        setUpdateForm(true);
        set_Id(_id);
        setFormErrors({});
        setActiveTab("1");
        setIsLoading(true);
        setMaxVal(0);
        try {
            const response = await axios.get(`/api/get-product/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const product = response.data.data;

                // Extract material IDs from ProductMaterial junction table
                const materialIds =
                    product.products && product.products.length > 0
                        ? product.products.map((pm) => pm.materialId)
                        : [];

                setValues({
                    productCode: product.productCode || "",
                    name: product.name || "",
                    slug: product.slug || "",
                    description: product.description || "",
                    mainCategoryId: product.mainCategoryId?.toString() || "",
                    subCategoryId: product.subCategoryId?.toString() || "",
                    collectionId: product.collectionId?.toString() || "",
                    brandId: product.brandId?.toString() || "",
                    supplierId: product.supplierId?.toString() || "",
                    genderId: product.genderId?.toString() || "",
                    materialIds: materialIds,
                    materialDescription: product.materialDescription || "",
                    fabricWeight: product.fabricWeight || "",
                    features: product.features || "",
                    commodityCode: product.commodityCode || "",
                    countryOfOrigin: product.countryOfOrigin || "",
                    isCustomizable: product.isCustomizable || false,
                    isActive: product.isActive,
                    isFeatured: product.isFeatured || false,
                    isNew: product.isNew || false,
                    isClearance: product.isClearance || false,
                    isVatFree: product.isVatFree || false,
                    isBestSelling: product.isBestSelling || false,
                    isFasterDispatch: product.isFasterDispatch || false,
                    sortOrder: product.sortOrder || 0,
                });

                // Load method-position mappings
                // Each position now has a customizationMethodId that links it to a specific method
                if (
                    product.productCustomizationMethods &&
                    product.productCustomizationMethods.length > 0
                ) {
                    const mappings = product.productCustomizationMethods.map(
                        (method) => {
                            // Get only positions that belong to this specific method
                            const positions = (
                                product.productCustomizationPositions || []
                            )
                                .filter(
                                    (p) =>
                                        p.customizationMethodId ===
                                        method.customizationMethodId
                                )
                                .map((p) => ({
                                    positionId: p.customizationPositionId,
                                    priceAdjustment: p.priceAdjustment || 0,
                                }));

                            return {
                                methodId: method.customizationMethodId,
                                positions: positions,
                            };
                        }
                    );
                    setMethodPositionMappings(mappings);
                } else {
                    setMethodPositionMappings([]);
                }

                // Load existing variants
                if (product.variants && product.variants.length > 0) {
                    const loadedVariants = product.variants.map((v) => ({
                        colorId: v.colorId.toString(),
                        sizeId: v.sizeId.toString(),
                        sku: v.sku,
                        priceAdjustment: v.priceAdjustment || 0,
                        stockQty: v.stockQty,
                        isActive: v.isActive,
                        id: v.id, // Keep the variant ID for reference
                        size: v.size, // Preserve the full size object with name and category
                        color: v.color, // Preserve the full color object with name and codes
                    }));
                    setVariants(loadedVariants);
                } else {
                    setVariants([]);
                }

                // Load and organize images by color
                if (product.images && product.images.length > 0) {
                    const imagesByColor = product.images.reduce((acc, img) => {
                        const colorId = img.colorId;
                        if (!acc[colorId]) acc[colorId] = [];
                        acc[colorId].push(img);
                        return acc;
                    }, {});
                    // Sort images within each color by sortOrder
                    Object.keys(imagesByColor).forEach((colorId) => {
                        imagesByColor[colorId].sort(
                            (a, b) => a.sortOrder - b.sortOrder
                        );
                    });
                    setProductColorImages(imagesByColor);
                } else {
                    setProductColorImages({});
                }

                // Load price tiers at product level
                if (product.priceTiers && product.priceTiers.length > 0) {
                    const loadedPriceTiers = product.priceTiers.map((tier) => ({
                        minQuantity: tier.minQuantity,
                        maxQuantity: tier.maxQuantity,
                        unitPrice: tier.unitPrice,
                        discountPercent: tier.discountPercent,
                        tierLabel: tier.tierLabel,
                        id: tier.id, // Keep the tier ID for reference
                    }));
                    setPriceTiers(loadedPriceTiers);
                } else {
                    setPriceTiers([]);
                }

                // Load delivery options for product
                if (product.deliveryTypes && product.deliveryTypes.length > 0) {
                    const loadedDeliveryOptions = product.deliveryTypes.map(
                        (dt) => ({
                            deliveryTypeId: dt.deliveryTypeId,
                            isDefault: dt.isDefault,
                            priceOverride: dt.priceOverride,
                            isActive: dt.isActive,
                            id: dt.id, // Keep the mapping ID for reference
                        })
                    );
                    setProductDeliveryOptions(loadedDeliveryOptions);
                } else {
                    setProductDeliveryOptions([]);
                }
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Failed to fetch product details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setFormErrors({});

        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();

            // Append all product fields except materialIds (handle separately)
            Object.keys(values).forEach((key) => {
                if (key === "materialIds") {
                    // Handle materialIds as JSON string
                    if (values.materialIds && values.materialIds.length > 0) {
                        formData.append(
                            "materialIds",
                            JSON.stringify(values.materialIds)
                        );
                    }
                } else if (values[key] !== null && values[key] !== "") {
                    formData.append(key, values[key]);
                }
            });

            // Append variants data as JSON string
            if (variants && variants.length > 0) {
                formData.append("variantsData", JSON.stringify(variants));
            }

            // Append price tiers data as JSON string
            if (priceTiers && priceTiers.length > 0) {
                formData.append("priceTiersData", JSON.stringify(priceTiers));
            }

            // Append customization method-position mappings
            if (values.isCustomizable && methodPositionMappings.length > 0) {
                formData.append(
                    "customizationMappings",
                    JSON.stringify(methodPositionMappings)
                );
            }

            // Append delivery options data as JSON string
            if (productDeliveryOptions && productDeliveryOptions.length > 0) {
                formData.append(
                    "deliveryOptionsData",
                    JSON.stringify(productDeliveryOptions)
                );
            }

            try {
                // Update product with all variants, price tiers, and customizations in one API call
                const response = await axios.put(
                    `/api/update-product/${_id}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (response.data.success) {
                    toast.success("Product updated successfully");
                    setUpdateForm(false);
                    setShowForm(false);
                    setValues(initialState);
                    setIsSubmit(false);
                    setFormErrors({});
                    setMethodPositionMappings([]);
                    setVariants([]);
                    setPriceTiers([]);
                    setProductDeliveryOptions([]);
                    setProductColorImages({});
                    fetchProducts();
                } else {
                    toast.error(
                        response.data.message || "Cannot update Product"
                    );
                }
            } catch (error) {
                console.error("Error updating product:", error);
                toast.error(
                    error.response?.data?.message || "Failed to update product"
                );
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);

        try {
            const response = await axios.delete(
                `/api/delete-product/${remove_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                setmodal_delete(!modal_delete);
                toast.success("Product deleted successfully");
                fetchProducts();
            } else {
                if (response.status === 409) {
                    setReferenceData(response.data);
                    setReferenceModal(true);
                } else {
                    toast.error(
                        response.data.message || "Cannot delete Product"
                    );
                }
            }
            setIsDeleteLoading(false);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Handle reference error
                setReferenceData(error.response.data);
                setReferenceModal(true);
            } else {
                toast.error("Failed to delete product. Please try again.");
            }
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();

            // Append all product fields except materialIds (handle separately)
            Object.keys(values).forEach((key) => {
                if (key === "materialIds") {
                    // Handle materialIds as JSON string
                    if (values.materialIds && values.materialIds.length > 0) {
                        formData.append(
                            "materialIds",
                            JSON.stringify(values.materialIds)
                        );
                    }
                } else if (values[key] !== null && values[key] !== "") {
                    formData.append(key, values[key]);
                }
            });

            // Prepare variants data without imageFiles (we'll send images separately in FormData)
            const variantsDataForJson = variants.map((v) => ({
                sku: v.sku,
                sizeId: v.sizeId,
                colorId: v.colorId,
                priceAdjustment: v.priceAdjustment,
                stockQty: v.stockQty,
                isActive: v.isActive,
            }));

            // Append variants data as JSON string
            if (variantsDataForJson && variantsDataForJson.length > 0) {
                formData.append(
                    "variantsData",
                    JSON.stringify(variantsDataForJson)
                );
            }

            // Append images for each variant using field names like images_0, images_1, etc.
            // Note: Images are now per color, not per variant, but we send them indexed by variant
            // The backend will handle deduplication for same color
            variants.forEach((variant, index) => {
                if (variant.imageFiles && variant.imageFiles.length > 0) {
                    variant.imageFiles.forEach((file) => {
                        formData.append(`images_${index}`, file);
                    });
                }
            });

            try {
                // Create product with all variants and images in one API call
                const response = await axios.post(
                    `/api/create-product`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                if (response.data.success) {
                    const newProductId = response.data.data.id;

                    // Add customization method-position mappings if customizable
                    if (
                        values.isCustomizable &&
                        methodPositionMappings.length > 0
                    ) {
                        // Send method-position mappings to backend
                        await axios.post(
                            `/api/product/${newProductId}/customization-mappings`,
                            { mappings: methodPositionMappings },
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem(
                                        "token"
                                    )}`,
                                },
                            }
                        );
                    }

                    // Process price tiers at product level
                    if (priceTiers && priceTiers.length > 0) {
                        const tierPromises = priceTiers.map(async (tier) => {
                            const tierData = {
                                productId: newProductId,
                                minQuantity: tier.minQuantity,
                                maxQuantity: tier.maxQuantity || null,
                                unitPrice: tier.unitPrice,
                                discountPercent: tier.discountPercent || null,
                                tierLabel: tier.tierLabel || null,
                            };

                            return axios.post(
                                `/api/create-product-price-tier`,
                                tierData,
                                {
                                    headers: {
                                        Authorization: `Bearer ${localStorage.getItem(
                                            "token"
                                        )}`,
                                    },
                                }
                            );
                        });

                        await Promise.all(tierPromises);
                    }

                    // Process delivery options for the new product
                    if (
                        productDeliveryOptions &&
                        productDeliveryOptions.length > 0
                    ) {
                        await axios.post(
                            `/api/products/bulk-assign-delivery-types`,
                            {
                                productId: newProductId,
                                deliveryTypes: productDeliveryOptions,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem(
                                        "token"
                                    )}`,
                                },
                            }
                        );
                    }

                    toast.success(
                        response.data.message || "Product Added Successfully"
                    );
                    setShowForm(false);
                    setValues(initialState);
                    setIsSubmit(false);
                    setFormErrors({});
                    setMethodPositionMappings([]);
                    setVariants([]);
                    setPriceTiers([]);
                    setProductDeliveryOptions([]);
                    fetchProducts();
                } else {
                    toast.error(response.data.message || "Cannot add Product");
                }
            } catch (error) {
                console.error("Error creating product:", error);
                toast.error(
                    error.response?.data?.message || "Failed to create product"
                );
            } finally {
                setIsLoading(false);
            }
        }
    };

    const validate = (values) => {
        const errors = {};

        if (!values.productCode) {
            errors.productCode = "Product code is required";
        }

        if (!values.name) {
            errors.name = "Product name is required";
        }

        if (!values.slug) {
            errors.slug = "Product slug is required";
        }

        if (!values.mainCategoryId) {
            errors.mainCategoryId = "Main category is required";
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
        setmodal_delete(false);
    };

    const handleSort = (column, sortDirection) => {
        setcolumn(column.sortField);
        setsortDirection(sortDirection);
    };

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
    };

    const handleFilter = (e) => {
        setFilter(e.target.checked);
    };

    // Convert options for react-select
    const mainCategoryOptions = mainCategories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));
    const subCategoryOptions = subCategories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));
    const collectionOptions = collections.map((col) => ({
        value: col.id,
        label: col.name,
    }));
    const brandOptions = brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
    }));
    const supplierOptions = suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
    }));
    const genderOptions = genders.map((gender) => ({
        value: gender.id,
        label: gender.name,
    }));
    const materialOptions = materials.map((material) => ({
        value: material.id,
        label: material.name,
    }));
    const colorOptions = colors.map((color) => ({
        value: color.id,
        label: color.name,
    }));
    const sizeCategoryOptions = sizeCategories.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }));
    const sizeOptions = sizes.map((size) => ({
        value: size.id,
        label: size.name,
    }));

    const renderForm = () => (
        <CardBody>
            <Col xxl={12}>
                <Card>
                    <CardBody>
                        <div className="live-preview">
                            <Form>
                                {/* Tab Navigation */}
                                <Nav
                                    tabs
                                    className="nav-tabs-custom nav-success mb-3"
                                >
                                    <NavItem>
                                        <NavLink
                                            style={{ cursor: "pointer" }}
                                            className={classnames({
                                                active: activeTab === "1",
                                            })}
                                            onClick={() => toggleTab("1")}
                                        >
                                            <i className="ri-information-line align-middle me-1"></i>
                                            Basic Information
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            style={{ cursor: "pointer" }}
                                            className={classnames({
                                                active: activeTab === "2",
                                            })}
                                            onClick={() => toggleTab("2")}
                                        >
                                            <i className="ri-file-list-line align-middle me-1"></i>
                                            Product Details
                                        </NavLink>
                                    </NavItem>
                                    {values.isCustomizable && (
                                        <NavItem>
                                            <NavLink
                                                style={{ cursor: "pointer" }}
                                                className={classnames({
                                                    active: activeTab === "3",
                                                })}
                                                onClick={() => toggleTab("3")}
                                            >
                                                <i className="ri-brush-line align-middle me-1"></i>
                                                Customization
                                                {methodPositionMappings.length >
                                                    0 && (
                                                        <Badge
                                                            color="success"
                                                            className="ms-2"
                                                        >
                                                            {methodPositionMappings.reduce(
                                                                (total, m) =>
                                                                    total +
                                                                    m.positions
                                                                        .length,
                                                                0
                                                            )}
                                                        </Badge>
                                                    )}
                                            </NavLink>
                                        </NavItem>
                                    )}
                                    <NavItem>
                                        <NavLink
                                            style={{ cursor: "pointer" }}
                                            className={classnames({
                                                active: activeTab === "4",
                                            })}
                                            onClick={() => toggleTab("4")}
                                        >
                                            <i className="ri-t-shirt-line align-middle me-1"></i>
                                            Variants
                                            {variants.length > 0 && (
                                                <Badge
                                                    color="info"
                                                    className="ms-2"
                                                >
                                                    {variants.length}
                                                </Badge>
                                            )}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            style={{ cursor: "pointer" }}
                                            className={classnames({
                                                active: activeTab === "5",
                                            })}
                                            onClick={() => toggleTab("5")}
                                        >
                                            <i className="ri-money-dollar-circle-line align-middle me-1"></i>
                                            Price Tiers
                                            {priceTiers &&
                                                priceTiers.length > 0 && (
                                                    <Badge
                                                        color="warning"
                                                        className="ms-2"
                                                    >
                                                        {priceTiers.length}
                                                    </Badge>
                                                )}
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            style={{ cursor: "pointer" }}
                                            className={classnames({
                                                active: activeTab === "6",
                                            })}
                                            onClick={() => toggleTab("6")}
                                        >
                                            <i className="ri-truck-line align-middle me-1"></i>
                                            Delivery Options
                                            {productDeliveryOptions &&
                                                productDeliveryOptions.length >
                                                0 && (
                                                    <Badge
                                                        color="primary"
                                                        className="ms-2"
                                                    >
                                                        {
                                                            productDeliveryOptions.length
                                                        }
                                                    </Badge>
                                                )}
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTab}>
                                    {/* Basic Information Tab */}
                                    <TabPane tabId="1">
                                        {maxVal > 0 && <p className="text-muted text-end">Maximum Sort Order value is {maxVal}</p>}

                                        <Row>
                                            <Col lg={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="productCode"
                                                        name="productCode"
                                                        placeholder="Enter product code"
                                                        value={
                                                            values.productCode
                                                        }
                                                        onChange={handleChange}
                                                        invalid={
                                                            isSubmit &&
                                                            !!formErrors.productCode
                                                        }
                                                    />
                                                    <Label htmlFor="productCode">
                                                        Product Code{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit &&
                                                        formErrors.productCode && (
                                                            <FormFeedback>
                                                                {
                                                                    formErrors.productCode
                                                                }
                                                            </FormFeedback>
                                                        )}
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="name"
                                                        name="name"
                                                        placeholder="Enter product name"
                                                        value={values.name}
                                                        onChange={handleChange}
                                                        invalid={
                                                            isSubmit &&
                                                            !!formErrors.name
                                                        }
                                                    />
                                                    <Label htmlFor="name">
                                                        Product Name{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit &&
                                                        formErrors.name && (
                                                            <FormFeedback>
                                                                {
                                                                    formErrors.name
                                                                }
                                                            </FormFeedback>
                                                        )}
                                                </div>
                                            </Col>

                                            <Col lg={2}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        className="form-control"
                                                        id="sortOrder"
                                                        name="sortOrder"
                                                        placeholder="0"
                                                        value={values.sortOrder}
                                                        min="0"
                                                        onWheel={(e) => e.target.blur()}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "" || parseInt(val) >= 0) {
                                                                handleChange(e);
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor="sortOrder">
                                                        Sort Order
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>

                                            <Col lg={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="slug"
                                                        name="slug"
                                                        placeholder="product-slug"
                                                        value={values.slug}
                                                        onChange={handleChange}
                                                        invalid={
                                                            isSubmit &&
                                                            !!formErrors.slug
                                                        }
                                                    />
                                                    <Label htmlFor="slug">
                                                        Product Slug{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit &&
                                                        formErrors.slug && (
                                                            <FormFeedback>
                                                                {
                                                                    formErrors.slug
                                                                }
                                                            </FormFeedback>
                                                        )}
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="textarea"
                                                        className="form-control"
                                                        id="description"
                                                        name="description"
                                                        style={{
                                                            height: "100px",
                                                        }}
                                                        placeholder="Enter product description"
                                                        value={
                                                            values.description
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="description">
                                                        Description
                                                    </Label>
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Main Category{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Select
                                                        name="mainCategoryId"
                                                        value={mainCategoryOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.mainCategoryId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={
                                                            mainCategoryOptions
                                                        }
                                                        placeholder="Select Main Category"
                                                        isClearable
                                                        className={
                                                            isSubmit &&
                                                                formErrors.mainCategoryId
                                                                ? "is-invalid"
                                                                : ""
                                                        }
                                                    />
                                                    {isSubmit &&
                                                        formErrors.mainCategoryId && (
                                                            <div className="invalid-feedback d-block">
                                                                {
                                                                    formErrors.mainCategoryId
                                                                }
                                                            </div>
                                                        )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Sub Category
                                                    </Label>
                                                    <Select
                                                        name="subCategoryId"
                                                        value={subCategoryOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.subCategoryId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={
                                                            subCategoryOptions
                                                        }
                                                        placeholder="Select Sub Category"
                                                        isClearable
                                                        isDisabled={
                                                            !values.mainCategoryId
                                                        }
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Collection
                                                    </Label>
                                                    <Select
                                                        name="collectionId"
                                                        value={collectionOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.collectionId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={
                                                            collectionOptions
                                                        }
                                                        placeholder="Select Collection"
                                                        isClearable
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Brand
                                                    </Label>
                                                    <Select
                                                        name="brandId"
                                                        value={brandOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.brandId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={brandOptions}
                                                        placeholder="Select Brand"
                                                        isClearable
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Supplier
                                                    </Label>
                                                    <Select
                                                        name="supplierId"
                                                        value={supplierOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.supplierId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={
                                                            supplierOptions
                                                        }
                                                        placeholder="Select Supplier"
                                                        isClearable
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Gender
                                                    </Label>
                                                    <Select
                                                        name="genderId"
                                                        value={genderOptions.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                parseInt(
                                                                    values.genderId
                                                                )
                                                        )}
                                                        onChange={
                                                            handleSelectChange
                                                        }
                                                        options={genderOptions}
                                                        placeholder="Select Gender"
                                                        isClearable
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div className="mb-3">
                                                    <Label className="form-label d-block mb-2">
                                                        Product Flags
                                                    </Label>
                                                    <div className="d-flex gap-4 flex-wrap">
                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isActive"
                                                                name="isActive"
                                                                checked={
                                                                    values.isActive
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isActive"
                                                            >
                                                                Active
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isCustomizable"
                                                                name="isCustomizable"
                                                                checked={
                                                                    values.isCustomizable
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isCustomizable"
                                                            >
                                                                <i className="ri-brush-line align-middle me-1"></i>
                                                                Customizable
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isFeatured"
                                                                name="isFeatured"
                                                                checked={
                                                                    values.isFeatured
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isFeatured"
                                                            >
                                                                Featured
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isNew"
                                                                name="isNew"
                                                                checked={
                                                                    values.isNew
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isNew"
                                                            >
                                                                New Arrival
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isClearance"
                                                                name="isClearance"
                                                                checked={
                                                                    values.isClearance
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isClearance"
                                                            >
                                                                Clearance
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isVatFree"
                                                                name="isVatFree"
                                                                checked={
                                                                    values.isVatFree
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isVatFree"
                                                            >
                                                                VAT Free
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isBestSelling"
                                                                name="isBestSelling"
                                                                checked={
                                                                    values.isBestSelling
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isBestSelling"
                                                            >
                                                                <i className="ri-fire-line align-middle me-1"></i>
                                                                Best Selling
                                                            </Label>
                                                        </div>

                                                        <div className="form-check form-switch">
                                                            <Input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="isFasterDispatch"
                                                                name="isFasterDispatch"
                                                                checked={
                                                                    values.isFasterDispatch
                                                                }
                                                                onChange={
                                                                    handlecheck
                                                                }
                                                            />
                                                            <Label
                                                                className="form-check-label"
                                                                htmlFor="isFasterDispatch"
                                                            >
                                                                <i className="ri-flashlight-line align-middle me-1"></i>
                                                                Faster Dispatch
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Product Details Tab */}
                                    <TabPane tabId="2">
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Materials
                                                    </Label>
                                                    <Select
                                                        isMulti
                                                        name="materialIds"
                                                        value={materialOptions.filter(
                                                            (opt) =>
                                                                values.materialIds.includes(
                                                                    opt.value
                                                                )
                                                        )}
                                                        onChange={(
                                                            selectedOptions
                                                        ) => {
                                                            const materialIds =
                                                                selectedOptions
                                                                    ? selectedOptions.map(
                                                                        (
                                                                            opt
                                                                        ) =>
                                                                            opt.value
                                                                    )
                                                                    : [];
                                                            setValues({
                                                                ...values,
                                                                materialIds,
                                                            });
                                                        }}
                                                        options={
                                                            materialOptions
                                                        }
                                                        placeholder="Select Materials"
                                                        isClearable
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="materialDescription"
                                                        name="materialDescription"
                                                        placeholder="e.g., 100% Cotton"
                                                        value={
                                                            values.materialDescription
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="materialDescription">
                                                        Material Description
                                                    </Label>
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="fabricWeight"
                                                        name="fabricWeight"
                                                        placeholder="e.g., 280 GSM"
                                                        value={
                                                            values.fabricWeight
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="fabricWeight">
                                                        Fabric Weight
                                                    </Label>
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="textarea"
                                                        className="form-control"
                                                        id="features"
                                                        name="features"
                                                        style={{
                                                            height: "100px",
                                                        }}
                                                        placeholder="Key features"
                                                        value={values.features}
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="features">
                                                        Features
                                                    </Label>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="commodityCode"
                                                        name="commodityCode"
                                                        placeholder="HS/Commodity code"
                                                        value={
                                                            values.commodityCode
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="commodityCode">
                                                        Commodity Code
                                                    </Label>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        id="countryOfOrigin"
                                                        name="countryOfOrigin"
                                                        placeholder="e.g., United Kingdom"
                                                        value={
                                                            values.countryOfOrigin
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label htmlFor="countryOfOrigin">
                                                        Country of Origin
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Customization Tab */}
                                    {values.isCustomizable && (
                                        <TabPane tabId="3">
                                            <Row>
                                                <Col lg={12}>
                                                    <div className="alert alert-info mb-4">
                                                        <i className="ri-information-line align-middle me-2"></i>
                                                        <strong>
                                                            Customization Setup:
                                                        </strong>{" "}
                                                        Select customization
                                                        methods and assign
                                                        specific positions to
                                                        each method. Each method
                                                        can have different
                                                        positions.
                                                    </div>
                                                </Col>

                                                {/* Methods Selection */}
                                                <Col lg={12}>
                                                    <Card className="border">
                                                        <CardHeader className="bg-light">
                                                            <h6 className="mb-0">
                                                                <i className="ri-contrast-2-line align-middle me-2"></i>
                                                                Step 1: Select
                                                                Customization
                                                                Methods
                                                            </h6>
                                                        </CardHeader>
                                                        <CardBody>
                                                            {customizationMethods.length ===
                                                                0 ? (
                                                                <p className="text-muted mb-0">
                                                                    No
                                                                    customization
                                                                    methods
                                                                    available
                                                                </p>
                                                            ) : (
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {customizationMethods.map(
                                                                        (
                                                                            method
                                                                        ) => {
                                                                            const isSelected =
                                                                                methodPositionMappings.some(
                                                                                    (
                                                                                        m
                                                                                    ) =>
                                                                                        m.methodId ===
                                                                                        method.id
                                                                                );
                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        method.id
                                                                                    }
                                                                                    className={`form-check border rounded p-3 ${isSelected
                                                                                        ? "border-primary bg-primary-subtle"
                                                                                        : ""
                                                                                        }`}
                                                                                    style={{
                                                                                        minWidth:
                                                                                            "280px",
                                                                                    }}
                                                                                >
                                                                                    <Input
                                                                                        className="form-check-input"
                                                                                        type="checkbox"
                                                                                        id={`method-${method.id}`}
                                                                                        checked={
                                                                                            isSelected
                                                                                        }
                                                                                        onChange={() =>
                                                                                            handleMethodChange(
                                                                                                method.id
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <Label
                                                                                        className="form-check-label w-100"
                                                                                        htmlFor={`method-${method.id}`}
                                                                                    >
                                                                                        <div className="d-flex justify-content-between align-items-start">
                                                                                            <div>
                                                                                                <strong>
                                                                                                    {
                                                                                                        method.applicationMethod
                                                                                                    }
                                                                                                </strong>
                                                                                                <br />
                                                                                                <small className="text-muted">
                                                                                                    Type:{" "}
                                                                                                    {
                                                                                                        method.applicationType
                                                                                                    }
                                                                                                </small>
                                                                                                <br />
                                                                                                <small className="text-muted">
                                                                                                    Setup:
                                                                                                    A$
                                                                                                    {parseFloat(
                                                                                                        method.setupCharge
                                                                                                    ).toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </small>
                                                                                            </div>
                                                                                            {method.pricingTiers && (
                                                                                                <Badge
                                                                                                    color="primary"
                                                                                                    pill
                                                                                                >
                                                                                                    {
                                                                                                        method
                                                                                                            .pricingTiers
                                                                                                            .length
                                                                                                    }{" "}
                                                                                                    tier
                                                                                                    {method
                                                                                                        .pricingTiers
                                                                                                        .length !==
                                                                                                        1
                                                                                                        ? "s"
                                                                                                        : ""}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </Label>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                </Col>

                                                {/* Positions for Each Method */}
                                                {methodPositionMappings.length >
                                                    0 && (
                                                        <Col lg={12}>
                                                            <Card className="border border-success">
                                                                <CardHeader className="bg-success-subtle">
                                                                    <h6 className="mb-0 text-success">
                                                                        <i className="ri-map-pin-line align-middle me-2"></i>
                                                                        Step 2:
                                                                        Assign
                                                                        Positions to
                                                                        Each Method
                                                                    </h6>
                                                                </CardHeader>
                                                                <CardBody>
                                                                    {methodPositionMappings.map(
                                                                        (
                                                                            mapping
                                                                        ) => {
                                                                            const method =
                                                                                customizationMethods.find(
                                                                                    (
                                                                                        m
                                                                                    ) =>
                                                                                        m.id ===
                                                                                        mapping.methodId
                                                                                );
                                                                            if (
                                                                                !method
                                                                            )
                                                                                return null;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        mapping.methodId
                                                                                    }
                                                                                    className="mb-4 pb-4 border-bottom"
                                                                                >
                                                                                    <h6 className="mb-3">
                                                                                        <Badge
                                                                                            color="primary"
                                                                                            className="me-2"
                                                                                        >
                                                                                            {
                                                                                                method.applicationMethod
                                                                                            }{" "}
                                                                                            -{" "}
                                                                                            {
                                                                                                method.applicationType
                                                                                            }
                                                                                        </Badge>
                                                                                        <small className="text-muted">
                                                                                            (
                                                                                            {
                                                                                                mapping
                                                                                                    .positions
                                                                                                    .length
                                                                                            }{" "}
                                                                                            position
                                                                                            {mapping
                                                                                                .positions
                                                                                                .length !==
                                                                                                1
                                                                                                ? "s"
                                                                                                : ""}{" "}
                                                                                            selected)
                                                                                        </small>
                                                                                    </h6>

                                                                                    <Row>
                                                                                        {customizationPositions.map(
                                                                                            (
                                                                                                position
                                                                                            ) => {
                                                                                                const selectedPosition =
                                                                                                    mapping.positions.find(
                                                                                                        (
                                                                                                            p
                                                                                                        ) =>
                                                                                                            p.positionId ===
                                                                                                            position.id
                                                                                                    );
                                                                                                const isSelected =
                                                                                                    !!selectedPosition;

                                                                                                return (
                                                                                                    <Col
                                                                                                        lg={
                                                                                                            4
                                                                                                        }
                                                                                                        key={
                                                                                                            position.id
                                                                                                        }
                                                                                                        className="mb-3"
                                                                                                    >
                                                                                                        <div
                                                                                                            className={`border rounded p-3 h-100 ${isSelected
                                                                                                                ? "border-success bg-success-subtle"
                                                                                                                : ""
                                                                                                                }`}
                                                                                                        >
                                                                                                            <div className="form-check mb-2">
                                                                                                                <Input
                                                                                                                    className="form-check-input"
                                                                                                                    type="checkbox"
                                                                                                                    id={`method-${mapping.methodId}-position-${position.id}`}
                                                                                                                    checked={
                                                                                                                        isSelected
                                                                                                                    }
                                                                                                                    onChange={() =>
                                                                                                                        handlePositionChange(
                                                                                                                            mapping.methodId,
                                                                                                                            position.id
                                                                                                                        )
                                                                                                                    }
                                                                                                                />
                                                                                                                <Label
                                                                                                                    className="form-check-label"
                                                                                                                    htmlFor={`method-${mapping.methodId}-position-${position.id}`}
                                                                                                                >
                                                                                                                    <strong>
                                                                                                                        {
                                                                                                                            position.positionName
                                                                                                                        }
                                                                                                                    </strong>
                                                                                                                    <br />
                                                                                                                    <small className="text-muted">
                                                                                                                        Code:{" "}
                                                                                                                        {
                                                                                                                            position.positionCode
                                                                                                                        }
                                                                                                                    </small>
                                                                                                                </Label>
                                                                                                            </div>

                                                                                                            {isSelected && (
                                                                                                                <div className="mt-2">
                                                                                                                    <div className="form-floating">
                                                                                                                        <Input
                                                                                                                            type="number"
                                                                                                                            className="form-control form-control-sm"
                                                                                                                            id={`method-${mapping.methodId}-position-${position.id}-price`}
                                                                                                                            placeholder="0.00"
                                                                                                                            step="0.01"
                                                                                                                            value={
                                                                                                                                selectedPosition.priceAdjustment
                                                                                                                            }
                                                                                                                            onChange={(
                                                                                                                                e
                                                                                                                            ) =>
                                                                                                                                handlePositionPriceChange(
                                                                                                                                    mapping.methodId,
                                                                                                                                    position.id,
                                                                                                                                    e
                                                                                                                                        .target
                                                                                                                                        .value
                                                                                                                                )
                                                                                                                            }
                                                                                                                        />
                                                                                                                        <Label
                                                                                                                            htmlFor={`method-${mapping.methodId}-position-${position.id}-price`}
                                                                                                                        >
                                                                                                                            Price
                                                                                                                            Adjustment
                                                                                                                            (A$)
                                                                                                                        </Label>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </Col>
                                                                                                );
                                                                                            }
                                                                                        )}
                                                                                    </Row>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    )}

                                                {/* Summary */}
                                                {methodPositionMappings.length >
                                                    0 && (
                                                        <Col lg={12}>
                                                            <Card className="border border-info">
                                                                <CardBody className="bg-info-subtle">
                                                                    <h6 className="text-info mb-3">
                                                                        <i className="ri-checkbox-circle-line align-middle me-2"></i>
                                                                        Customization
                                                                        Summary
                                                                    </h6>
                                                                    {methodPositionMappings.map(
                                                                        (
                                                                            mapping
                                                                        ) => {
                                                                            const method =
                                                                                customizationMethods.find(
                                                                                    (
                                                                                        m
                                                                                    ) =>
                                                                                        m.id ===
                                                                                        mapping.methodId
                                                                                );
                                                                            if (
                                                                                !method
                                                                            )
                                                                                return null;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        mapping.methodId
                                                                                    }
                                                                                    className="mb-3"
                                                                                >
                                                                                    <p className="mb-2">
                                                                                        <strong>
                                                                                            {
                                                                                                method.applicationMethod
                                                                                            }{" "}
                                                                                            -{" "}
                                                                                            {
                                                                                                method.applicationType
                                                                                            }

                                                                                            :
                                                                                        </strong>
                                                                                    </p>
                                                                                    {mapping
                                                                                        .positions
                                                                                        .length >
                                                                                        0 ? (
                                                                                        <ul className="mb-2">
                                                                                            {mapping.positions.map(
                                                                                                (
                                                                                                    pos
                                                                                                ) => {
                                                                                                    const position =
                                                                                                        customizationPositions.find(
                                                                                                            (
                                                                                                                p
                                                                                                            ) =>
                                                                                                                p.id ===
                                                                                                                pos.positionId
                                                                                                        );
                                                                                                    return (
                                                                                                        <li
                                                                                                            key={
                                                                                                                pos.positionId
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                position?.positionName
                                                                                                            }
                                                                                                            {pos.priceAdjustment >
                                                                                                                0 &&
                                                                                                                ` (+A$${pos.priceAdjustment.toFixed(
                                                                                                                    2
                                                                                                                )})`}
                                                                                                        </li>
                                                                                                    );
                                                                                                }
                                                                                            )}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <p className="text-muted mb-2 ms-3">
                                                                                            No
                                                                                            positions
                                                                                            assigned
                                                                                            yet
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </CardBody>
                                                            </Card>
                                                        </Col>
                                                    )}
                                            </Row>
                                        </TabPane>
                                    )}

                                    {/* Variants Tab */}
                                    <TabPane tabId="4">
                                        <Row>
                                            <Col lg={12}>
                                                <div className="alert alert-info mb-4">
                                                    <i className="ri-information-line align-middle me-2"></i>
                                                    <strong>
                                                        Product Variants:
                                                    </strong>{" "}
                                                    Add different color and size
                                                    combinations for this
                                                    product. Each variant will
                                                    have its own SKU, stock, and
                                                    pricing.
                                                </div>
                                            </Col>

                                            {/* Size Category Selection */}
                                            <Col lg={12}>
                                                <Card className="border border-primary mb-3">
                                                    <CardBody>
                                                        <Row className="align-items-center">
                                                            <Col lg={6}>
                                                                <div className="mb-0">
                                                                    <Label className="form-label fw-semibold">
                                                                        <i className="ri-list-check align-middle me-2"></i>
                                                                        Select
                                                                        Size
                                                                        Category{" "}
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </Label>
                                                                    <Select
                                                                        value={sizeCategoryOptions.find(
                                                                            (
                                                                                opt
                                                                            ) =>
                                                                                opt.value ===
                                                                                parseInt(
                                                                                    selectedSizeCategory
                                                                                )
                                                                        )}
                                                                        onChange={(
                                                                            selectedOption
                                                                        ) => {
                                                                            setSelectedSizeCategory(
                                                                                selectedOption
                                                                                    ? selectedOption.value
                                                                                    : ""
                                                                            );
                                                                            // Clear selected size in variant form when category changes
                                                                            setVariantForm(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    sizeId: "",
                                                                                })
                                                                            );
                                                                        }}
                                                                        options={
                                                                            sizeCategoryOptions
                                                                        }
                                                                        placeholder="Choose a size category first..."
                                                                        isClearable
                                                                    />
                                                                    <small className="text-muted">
                                                                        Select a
                                                                        size
                                                                        category
                                                                        to load
                                                                        available
                                                                        sizes
                                                                        for
                                                                        variants
                                                                    </small>
                                                                </div>
                                                            </Col>
                                                            <Col lg={6}>
                                                                {selectedSizeCategory && (
                                                                    <div className="alert alert-success mb-0 py-2">
                                                                        <i className="ri-checkbox-circle-line align-middle me-2"></i>
                                                                        <strong>
                                                                            {
                                                                                sizes.length
                                                                            }
                                                                        </strong>{" "}
                                                                        sizes
                                                                        available
                                                                        in this
                                                                        category
                                                                    </div>
                                                                )}
                                                                {!selectedSizeCategory && (
                                                                    <div className="alert alert-warning mb-0 py-2">
                                                                        <i className="ri-alert-line align-middle me-2"></i>
                                                                        Please
                                                                        select a
                                                                        size
                                                                        category
                                                                        to
                                                                        continue
                                                                    </div>
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            {/* Variant Form */}
                                            <Col lg={12}>
                                                <Card className="border">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-add-line align-middle me-2"></i>
                                                            {editingVariantIndex !==
                                                                null
                                                                ? "Edit Variant"
                                                                : "Add New Variant"}
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <Row>
                                                            <Col lg={3}>
                                                                <div className="mb-3">
                                                                    <Label className="form-label">
                                                                        Color{" "}
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </Label>
                                                                    <Select
                                                                        name="colorId"
                                                                        value={colorOptions.find(
                                                                            (
                                                                                opt
                                                                            ) =>
                                                                                opt.value ===
                                                                                parseInt(
                                                                                    variantForm.colorId
                                                                                )
                                                                        )}
                                                                        onChange={
                                                                            handleVariantSelectChange
                                                                        }
                                                                        options={
                                                                            colorOptions
                                                                        }
                                                                        placeholder="Select Color"
                                                                        isClearable
                                                                    />
                                                                </div>
                                                            </Col>

                                                            <Col lg={3}>
                                                                <div className="mb-3">
                                                                    <Label className="form-label">
                                                                        Size{" "}
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </Label>
                                                                    <Select
                                                                        name="sizeId"
                                                                        value={sizeOptions.find(
                                                                            (
                                                                                opt
                                                                            ) =>
                                                                                opt.value ===
                                                                                parseInt(
                                                                                    variantForm.sizeId
                                                                                )
                                                                        )}
                                                                        onChange={
                                                                            handleVariantSelectChange
                                                                        }
                                                                        options={
                                                                            sizeOptions
                                                                        }
                                                                        placeholder={
                                                                            selectedSizeCategory
                                                                                ? "Select Size"
                                                                                : "Select size category first"
                                                                        }
                                                                        isClearable
                                                                        isDisabled={
                                                                            !selectedSizeCategory
                                                                        }
                                                                    />
                                                                    {!selectedSizeCategory && (
                                                                        <small className="text-danger">
                                                                            Please
                                                                            select
                                                                            a
                                                                            size
                                                                            category
                                                                            above
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </Col>

                                                            <Col lg={3}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="text"
                                                                        className="form-control"
                                                                        id="sku"
                                                                        name="sku"
                                                                        placeholder="Enter SKU"
                                                                        value={
                                                                            variantForm.sku
                                                                        }
                                                                        onChange={
                                                                            handleVariantFormChange
                                                                        }
                                                                    />
                                                                    <Label htmlFor="sku">
                                                                        SKU{" "}
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </Label>
                                                                </div>
                                                            </Col>

                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="priceAdjustment"
                                                                        name="priceAdjustment"
                                                                        placeholder="Price Adjustment"
                                                                        value={
                                                                            variantForm.priceAdjustment
                                                                        }
                                                                        onChange={
                                                                            handleVariantFormChange
                                                                        }
                                                                        step="0.01"
                                                                    />
                                                                    <Label htmlFor="priceAdjustment">
                                                                        Price
                                                                        Adj.{" "}
                                                                        <i
                                                                            className="ri-information-line"
                                                                            title="Additional price for this variant (e.g., +$2 for large sizes)"
                                                                        ></i>
                                                                    </Label>
                                                                </div>
                                                            </Col>

                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="stockQty"
                                                                        name="stockQty"
                                                                        placeholder="Stock"
                                                                        value={
                                                                            variantForm.stockQty
                                                                        }
                                                                        onChange={
                                                                            handleVariantFormChange
                                                                        }
                                                                        min="0"
                                                                    />
                                                                    <Label htmlFor="stockQty">
                                                                        Stock
                                                                        Qty
                                                                    </Label>
                                                                </div>
                                                            </Col>

                                                            <Col lg={1}>
                                                                <div className="form-check form-switch mt-2">
                                                                    <Input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        id="variantIsActive"
                                                                        name="isActive"
                                                                        checked={
                                                                            variantForm.isActive
                                                                        }
                                                                        onChange={
                                                                            handleVariantFormChange
                                                                        }
                                                                    />
                                                                    <Label
                                                                        className="form-check-label"
                                                                        htmlFor="variantIsActive"
                                                                    >
                                                                        Active
                                                                    </Label>
                                                                </div>
                                                            </Col>

                                                            <Col lg={12}>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-success"
                                                                        onClick={
                                                                            addVariant
                                                                        }
                                                                    >
                                                                        <i
                                                                            className={`ri-${editingVariantIndex !==
                                                                                null
                                                                                ? "save"
                                                                                : "add"
                                                                                }-line align-middle me-1`}
                                                                        ></i>
                                                                        {editingVariantIndex !==
                                                                            null
                                                                            ? "Update Variant"
                                                                            : "Add Variant"}
                                                                    </button>
                                                                    {editingVariantIndex !==
                                                                        null && (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-secondary"
                                                                                onClick={
                                                                                    cancelVariantEdit
                                                                                }
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            {/* Variants List */}
                                            {variants.length > 0 && (
                                                <Col lg={12}>
                                                    <Card className="border">
                                                        <CardHeader className="bg-light">
                                                            <h6 className="mb-0">
                                                                <i className="ri-list-check align-middle me-2"></i>
                                                                Added Variants (
                                                                {
                                                                    variants.length
                                                                }
                                                                ) - Grouped by
                                                                Color
                                                            </h6>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered table-hover mb-0">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>
                                                                                Color
                                                                                /
                                                                                Size
                                                                            </th>
                                                                            <th>
                                                                                SKU
                                                                            </th>
                                                                            <th>
                                                                                Price
                                                                                Adj.
                                                                            </th>
                                                                            <th>
                                                                                Stock
                                                                            </th>
                                                                            <th>
                                                                                Status
                                                                            </th>
                                                                            <th>
                                                                                Actions
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {/* Group variants by color */}
                                                                        {Object.entries(
                                                                            variants.reduce(
                                                                                (
                                                                                    acc,
                                                                                    variant
                                                                                ) => {
                                                                                    const colorId =
                                                                                        variant.colorId;
                                                                                    if (
                                                                                        !acc[
                                                                                        colorId
                                                                                        ]
                                                                                    )
                                                                                        acc[
                                                                                            colorId
                                                                                        ] =
                                                                                            [];
                                                                                    acc[
                                                                                        colorId
                                                                                    ].push(
                                                                                        variant
                                                                                    );
                                                                                    return acc;
                                                                                },
                                                                                {}
                                                                            )
                                                                        ).map(
                                                                            ([
                                                                                colorId,
                                                                                colorVariants,
                                                                            ]) => {
                                                                                const color =
                                                                                    colors.find(
                                                                                        (
                                                                                            c
                                                                                        ) =>
                                                                                            c.id ===
                                                                                            parseInt(
                                                                                                colorId
                                                                                            )
                                                                                    );
                                                                                const colorImages =
                                                                                    productColorImages[
                                                                                    colorId
                                                                                    ] ||
                                                                                    [];
                                                                                const selectedFiles =
                                                                                    colorVariants[0]
                                                                                        ?.imageFiles ||
                                                                                    [];
                                                                                const hasImages =
                                                                                    colorImages.length >
                                                                                    0 ||
                                                                                    selectedFiles.length >
                                                                                    0;

                                                                                return (
                                                                                    <React.Fragment
                                                                                        key={
                                                                                            colorId
                                                                                        }
                                                                                    >
                                                                                        {/* Color Header Row with Image Management */}
                                                                                        <tr className="table-primary">
                                                                                            <td colSpan="6">
                                                                                                <div className="d-flex justify-content-between align-items-start">
                                                                                                    <div className="flex-grow-1">
                                                                                                        <div className="mb-2">
                                                                                                            <strong className="fs-5">
                                                                                                                <i className="ri-palette-line me-2"></i>
                                                                                                                Color:{" "}
                                                                                                                {
                                                                                                                    color?.name
                                                                                                                }
                                                                                                            </strong>
                                                                                                            <Badge
                                                                                                                color="info"
                                                                                                                className="ms-2"
                                                                                                            >
                                                                                                                {
                                                                                                                    colorVariants.length
                                                                                                                }{" "}
                                                                                                                size
                                                                                                                variant
                                                                                                                {colorVariants.length !==
                                                                                                                    1
                                                                                                                    ? "s"
                                                                                                                    : ""}
                                                                                                            </Badge>
                                                                                                        </div>

                                                                                                        {/* Display Images for this Color */}
                                                                                                        {hasImages ? (
                                                                                                            <div className="d-flex gap-2 flex-wrap align-items-center">
                                                                                                                {/* Show existing images from server (for edit mode) */}
                                                                                                                {colorImages.map(
                                                                                                                    (
                                                                                                                        image
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={
                                                                                                                                image.id
                                                                                                                            }
                                                                                                                            className="position-relative"
                                                                                                                            style={{
                                                                                                                                width: "70px",
                                                                                                                                height: "70px",
                                                                                                                                border: image.isPrimary
                                                                                                                                    ? "3px solid #0ab39c"
                                                                                                                                    : "2px solid #e9ebec",
                                                                                                                                borderRadius:
                                                                                                                                    "6px",
                                                                                                                                overflow:
                                                                                                                                    "hidden",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            <img
                                                                                                                                src={`${image.imageUrl.includes(
                                                                                                                                    "http"
                                                                                                                                )
                                                                                                                                    ? ""
                                                                                                                                    : `${axios.defaults.baseURL}/`
                                                                                                                                    }${image.imageUrl
                                                                                                                                    }`}
                                                                                                                                alt={
                                                                                                                                    color?.name
                                                                                                                                }
                                                                                                                                style={{
                                                                                                                                    width: "100%",
                                                                                                                                    height: "100%",
                                                                                                                                    objectFit:
                                                                                                                                        "cover",
                                                                                                                                }}
                                                                                                                            />
                                                                                                                            {/* Delete button */}
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className="btn btn-danger btn-sm position-absolute"
                                                                                                                                style={{
                                                                                                                                    top: "-6px",
                                                                                                                                    right: "-6px",
                                                                                                                                    width: "22px",
                                                                                                                                    height: "22px",
                                                                                                                                    padding:
                                                                                                                                        "0",
                                                                                                                                    borderRadius:
                                                                                                                                        "50%",
                                                                                                                                    fontSize:
                                                                                                                                        "11px",
                                                                                                                                }}
                                                                                                                                onClick={() =>
                                                                                                                                    handleDeleteColorImage(
                                                                                                                                        image.id
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                title="Delete image"
                                                                                                                            >
                                                                                                                                <i className="ri-close-line"></i>
                                                                                                                            </button>
                                                                                                                            {/* Primary badge or set primary button */}
                                                                                                                            {image.isPrimary ? (
                                                                                                                                <span
                                                                                                                                    className="badge bg-success position-absolute"
                                                                                                                                    style={{
                                                                                                                                        bottom: "3px",
                                                                                                                                        left: "3px",
                                                                                                                                        fontSize:
                                                                                                                                            "9px",
                                                                                                                                        padding:
                                                                                                                                            "3px 5px",
                                                                                                                                    }}
                                                                                                                                >
                                                                                                                                    <i className="ri-star-fill me-1"></i>
                                                                                                                                    Primary
                                                                                                                                </span>
                                                                                                                            ) : (
                                                                                                                                <button
                                                                                                                                    type="button"
                                                                                                                                    className="btn btn-sm btn-warning position-absolute"
                                                                                                                                    style={{
                                                                                                                                        bottom: "3px",
                                                                                                                                        left: "3px",
                                                                                                                                        fontSize:
                                                                                                                                            "9px",
                                                                                                                                        padding:
                                                                                                                                            "3px 5px",
                                                                                                                                    }}
                                                                                                                                    onClick={() =>
                                                                                                                                        handleSetPrimaryColorImage(
                                                                                                                                            image.id
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                    title="Set as primary"
                                                                                                                                >
                                                                                                                                    <i className="ri-star-line"></i>{" "}
                                                                                                                                    Set
                                                                                                                                </button>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                )}

                                                                                                                {/* Show preview of newly selected files (for create mode) */}
                                                                                                                {selectedFiles.map(
                                                                                                                    (
                                                                                                                        file,
                                                                                                                        index
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={`file-${index}`}
                                                                                                                            className="position-relative"
                                                                                                                            style={{
                                                                                                                                width: "70px",
                                                                                                                                height: "70px",
                                                                                                                                border:
                                                                                                                                    index ===
                                                                                                                                        0
                                                                                                                                        ? "3px solid #0ab39c"
                                                                                                                                        : "2px solid #e9ebec",
                                                                                                                                borderRadius:
                                                                                                                                    "6px",
                                                                                                                                overflow:
                                                                                                                                    "hidden",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            <img
                                                                                                                                src={URL.createObjectURL(
                                                                                                                                    file
                                                                                                                                )}
                                                                                                                                alt={`Preview ${index +
                                                                                                                                    1
                                                                                                                                    }`}
                                                                                                                                style={{
                                                                                                                                    width: "100%",
                                                                                                                                    height: "100%",
                                                                                                                                    objectFit:
                                                                                                                                        "cover",
                                                                                                                                }}
                                                                                                                            />
                                                                                                                            {/* Delete button */}
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                className="btn btn-danger btn-sm position-absolute"
                                                                                                                                style={{
                                                                                                                                    top: "-6px",
                                                                                                                                    right: "-6px",
                                                                                                                                    width: "22px",
                                                                                                                                    height: "22px",
                                                                                                                                    padding:
                                                                                                                                        "0",
                                                                                                                                    borderRadius:
                                                                                                                                        "50%",
                                                                                                                                    fontSize:
                                                                                                                                        "11px",
                                                                                                                                }}
                                                                                                                                onClick={() => {
                                                                                                                                    // Remove this file from the variant
                                                                                                                                    const updatedVariants =
                                                                                                                                        variants.map(
                                                                                                                                            (
                                                                                                                                                v
                                                                                                                                            ) => {
                                                                                                                                                if (
                                                                                                                                                    parseInt(
                                                                                                                                                        v.colorId
                                                                                                                                                    ) ===
                                                                                                                                                    parseInt(
                                                                                                                                                        colorId
                                                                                                                                                    )
                                                                                                                                                ) {
                                                                                                                                                    const newFiles =
                                                                                                                                                        (
                                                                                                                                                            v.imageFiles ||
                                                                                                                                                            []
                                                                                                                                                        ).filter(
                                                                                                                                                            (
                                                                                                                                                                _,
                                                                                                                                                                i
                                                                                                                                                            ) =>
                                                                                                                                                                i !==
                                                                                                                                                                index
                                                                                                                                                        );
                                                                                                                                                    return {
                                                                                                                                                        ...v,
                                                                                                                                                        imageFiles:
                                                                                                                                                            newFiles,
                                                                                                                                                    };
                                                                                                                                                }
                                                                                                                                                return v;
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    setVariants(
                                                                                                                                        updatedVariants
                                                                                                                                    );
                                                                                                                                }}
                                                                                                                                title="Remove image"
                                                                                                                            >
                                                                                                                                <i className="ri-close-line"></i>
                                                                                                                            </button>
                                                                                                                            {/* Primary badge for first image */}
                                                                                                                            {index ===
                                                                                                                                0 && (
                                                                                                                                    <span
                                                                                                                                        className="badge bg-success position-absolute"
                                                                                                                                        style={{
                                                                                                                                            bottom: "3px",
                                                                                                                                            left: "3px",
                                                                                                                                            fontSize:
                                                                                                                                                "9px",
                                                                                                                                            padding:
                                                                                                                                                "3px 5px",
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        <i className="ri-star-fill me-1"></i>
                                                                                                                                        Primary
                                                                                                                                    </span>
                                                                                                                                )}
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="text-muted fst-italic">
                                                                                                                <i className="ri-image-line me-1"></i>
                                                                                                                No
                                                                                                                images
                                                                                                                uploaded
                                                                                                                for
                                                                                                                this
                                                                                                                color
                                                                                                                yet
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>

                                                                                                    {/* Image Upload Button */}
                                                                                                    <div>
                                                                                                        {_id ? (
                                                                                                            // For existing products: Upload to server immediately
                                                                                                            <>
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    id={`color-images-${colorId}`}
                                                                                                                    multiple
                                                                                                                    accept="image/*"
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "none",
                                                                                                                    }}
                                                                                                                    onChange={(
                                                                                                                        e
                                                                                                                    ) =>
                                                                                                                        handleColorImageUpload(
                                                                                                                            _id,
                                                                                                                            colorId,
                                                                                                                            e
                                                                                                                                .target
                                                                                                                                .files
                                                                                                                        )
                                                                                                                    }
                                                                                                                />
                                                                                                                <label
                                                                                                                    htmlFor={`color-images-${colorId}`}
                                                                                                                    className="btn btn-primary mb-0"
                                                                                                                    style={{
                                                                                                                        cursor: uploadingColorImages
                                                                                                                            ? "not-allowed"
                                                                                                                            : "pointer",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <i className="ri-upload-2-line me-1"></i>
                                                                                                                    {uploadingColorImages
                                                                                                                        ? "Uploading..."
                                                                                                                        : "Upload Images"}
                                                                                                                </label>
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            // For new products: Store files to send with product creation
                                                                                                            <>
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    id={`color-images-new-${colorId}`}
                                                                                                                    multiple
                                                                                                                    accept="image/*"
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "none",
                                                                                                                    }}
                                                                                                                    onChange={(
                                                                                                                        e
                                                                                                                    ) => {
                                                                                                                        const files =
                                                                                                                            Array.from(
                                                                                                                                e
                                                                                                                                    .target
                                                                                                                                    .files
                                                                                                                            );
                                                                                                                        // Store files in all variants of this color
                                                                                                                        const updatedVariants =
                                                                                                                            variants.map(
                                                                                                                                (
                                                                                                                                    v
                                                                                                                                ) => {
                                                                                                                                    if (
                                                                                                                                        parseInt(
                                                                                                                                            v.colorId
                                                                                                                                        ) ===
                                                                                                                                        parseInt(
                                                                                                                                            colorId
                                                                                                                                        )
                                                                                                                                    ) {
                                                                                                                                        return {
                                                                                                                                            ...v,
                                                                                                                                            imageFiles:
                                                                                                                                                files,
                                                                                                                                        };
                                                                                                                                    }
                                                                                                                                    return v;
                                                                                                                                }
                                                                                                                            );
                                                                                                                        setVariants(
                                                                                                                            updatedVariants
                                                                                                                        );
                                                                                                                    }}
                                                                                                                />
                                                                                                                <label
                                                                                                                    htmlFor={`color-images-new-${colorId}`}
                                                                                                                    className="btn btn-primary mb-0"
                                                                                                                    style={{
                                                                                                                        cursor: "pointer",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <i className="ri-upload-2-line me-1"></i>
                                                                                                                    Select
                                                                                                                    Images
                                                                                                                </label>
                                                                                                                {colorVariants[0]
                                                                                                                    ?.imageFiles &&
                                                                                                                    colorVariants[0]
                                                                                                                        .imageFiles
                                                                                                                        .length >
                                                                                                                    0 && (
                                                                                                                        <div className="mt-2">
                                                                                                                            <small className="text-success">
                                                                                                                                <i className="ri-checkbox-circle-line me-1"></i>
                                                                                                                                {
                                                                                                                                    colorVariants[0]
                                                                                                                                        .imageFiles
                                                                                                                                        .length
                                                                                                                                }{" "}
                                                                                                                                image(s)
                                                                                                                                selected
                                                                                                                            </small>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>

                                                                                        {/* Size Variant Rows for this Color */}
                                                                                        {colorVariants.map(
                                                                                            (
                                                                                                variant
                                                                                            ) => {
                                                                                                // Check if size is already embedded in variant (from API response) or needs to be looked up
                                                                                                const size =
                                                                                                    variant.size ||
                                                                                                    sizes.find(
                                                                                                        (
                                                                                                            s
                                                                                                        ) =>
                                                                                                            s.id ===
                                                                                                            parseInt(
                                                                                                                variant.sizeId
                                                                                                            )
                                                                                                    );
                                                                                                const variantIndex =
                                                                                                    variants.findIndex(
                                                                                                        (
                                                                                                            v
                                                                                                        ) =>
                                                                                                            v.sku ===
                                                                                                            variant.sku
                                                                                                    );

                                                                                                return (
                                                                                                    <tr
                                                                                                        key={`${colorId}-${variant.sku}`}
                                                                                                    >
                                                                                                        <td className="ps-4">
                                                                                                            <i className="ri-arrow-right-s-line text-muted me-1"></i>
                                                                                                            <strong>
                                                                                                                Size:
                                                                                                            </strong>{" "}
                                                                                                            {size?.name ||
                                                                                                                "-"}
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <code>
                                                                                                                {
                                                                                                                    variant.sku
                                                                                                                }
                                                                                                            </code>
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            {variant.priceAdjustment &&
                                                                                                                variant.priceAdjustment !==
                                                                                                                0 ? (
                                                                                                                <Badge
                                                                                                                    color={
                                                                                                                        variant.priceAdjustment >
                                                                                                                            0
                                                                                                                            ? "warning"
                                                                                                                            : "info"
                                                                                                                    }
                                                                                                                >
                                                                                                                    {variant.priceAdjustment >
                                                                                                                        0
                                                                                                                        ? "+"
                                                                                                                        : ""}

                                                                                                                    A$
                                                                                                                    {
                                                                                                                        variant.priceAdjustment
                                                                                                                    }
                                                                                                                </Badge>
                                                                                                            ) : (
                                                                                                                <span className="text-muted">
                                                                                                                    A$0
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <Badge
                                                                                                                color={
                                                                                                                    variant.stockQty >
                                                                                                                        0
                                                                                                                        ? "success"
                                                                                                                        : "danger"
                                                                                                                }
                                                                                                                className="badge-soft-success text-white"
                                                                                                            >
                                                                                                                {
                                                                                                                    variant.stockQty
                                                                                                                }{" "}
                                                                                                                units
                                                                                                            </Badge>
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            {variant.isActive ? (
                                                                                                                <Badge
                                                                                                                    color="success"
                                                                                                                    className="badge-soft-success text-white"
                                                                                                                >
                                                                                                                    <i className="ri-check-line me-1"></i>
                                                                                                                    Active
                                                                                                                </Badge>
                                                                                                            ) : (
                                                                                                                <Badge
                                                                                                                    color="secondary"
                                                                                                                    className="badge-soft-secondary text-white"
                                                                                                                >
                                                                                                                    <i className="ri-close-line me-1"></i>
                                                                                                                    Inactive
                                                                                                                </Badge>
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <div className="d-flex gap-2">
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="btn btn-sm btn-success"
                                                                                                                    onClick={() =>
                                                                                                                        editVariant(
                                                                                                                            variantIndex
                                                                                                                        )
                                                                                                                    }
                                                                                                                    title="Edit variant"
                                                                                                                >
                                                                                                                    <i className="ri-edit-line"></i>
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    className="btn btn-sm btn-danger"
                                                                                                                    onClick={() =>
                                                                                                                        deleteVariant(
                                                                                                                            variantIndex
                                                                                                                        )
                                                                                                                    }
                                                                                                                    title="Delete variant"
                                                                                                                >
                                                                                                                    <i className="ri-delete-bin-line"></i>
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                );
                                                                                            }
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            )}
                                        </Row>
                                    </TabPane>

                                    {/* Price Tiers Tab */}
                                    <TabPane tabId="5">
                                        <Row>
                                            <Col lg={12}>
                                                <div className="alert alert-info mb-4">
                                                    <i className="ri-information-line align-middle me-2"></i>
                                                    <strong>
                                                        Product-Level Price
                                                        Tiers:
                                                    </strong>{" "}
                                                    Define bulk pricing tiers
                                                    for this product. Variant
                                                    price adjustments will be
                                                    added to these base prices.
                                                </div>

                                                {/* Product Pricing Calculator Component */}
                                                <ProductPricingCalculator
                                                    brandId={values.brandId}
                                                    priceTiers={priceTiers}
                                                    onChange={handlePricingCalculatorChange}
                                                    isSubmit={isSubmit}
                                                    formErrors={formErrors}
                                                />

                                                {/* Manual Price Tier Form (Fallback/Advanced) */}
                                                <Card className="border">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-add-line align-middle me-2"></i>
                                                            {editingPriceTierIndex !==
                                                                null
                                                                ? "Edit Price Tier"
                                                                : "Add New Price Tier"}
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        {/* Show info message based on whether this is first tier or not */}
                                                        {(priceTiers.length ===
                                                            0 &&
                                                            editingPriceTierIndex ===
                                                            null) ||
                                                            editingPriceTierIndex ===
                                                            0 ? (
                                                            <div className="alert alert-primary mb-3">
                                                                <i className="ri-price-tag-3-line align-middle me-2"></i>
                                                                <strong>
                                                                    First Tier:
                                                                </strong>{" "}
                                                                Enter the base
                                                                unit price.
                                                                Subsequent tier
                                                                prices will be
                                                                calculated based
                                                                on discount
                                                                percentages.
                                                            </div>
                                                        ) : (
                                                            <div className="alert alert-warning mb-3">
                                                                <i className="ri-percent-line align-middle me-2"></i>
                                                                <strong>
                                                                    Tier{" "}
                                                                    {editingPriceTierIndex !==
                                                                        null
                                                                        ? editingPriceTierIndex +
                                                                        1
                                                                        : priceTiers.length +
                                                                        1}
                                                                    :
                                                                </strong>{" "}
                                                                Enter the
                                                                discount %.
                                                                Price will be
                                                                calculated from
                                                                the first tier's
                                                                price (A$
                                                                {(typeof priceTiers[0]?.unitPrice === 'number' 
                                                                    ? priceTiers[0].unitPrice.toFixed(2) 
                                                                    : parseFloat(priceTiers[0]?.unitPrice || 0).toFixed(2))}
                                                                ).
                                                            </div>
                                                        )}
                                                        <Row>
                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="minQuantity"
                                                                        name="minQuantity"
                                                                        placeholder="Min Qty"
                                                                        value={
                                                                            priceTierForm.minQuantity
                                                                        }
                                                                        onChange={
                                                                            handlePriceTierFormChange
                                                                        }
                                                                        min="1"
                                                                    />
                                                                    <Label htmlFor="minQuantity">
                                                                        Min
                                                                        Quantity{" "}
                                                                        <span className="text-danger">
                                                                            *
                                                                        </span>
                                                                    </Label>
                                                                </div>
                                                            </Col>

                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="maxQuantity"
                                                                        name="maxQuantity"
                                                                        placeholder="Max Qty"
                                                                        value={
                                                                            priceTierForm.maxQuantity
                                                                        }
                                                                        onChange={
                                                                            handlePriceTierFormChange
                                                                        }
                                                                        min={
                                                                            priceTierForm.minQuantity ||
                                                                            1
                                                                        }
                                                                    />
                                                                    <Label htmlFor="maxQuantity">
                                                                        Max
                                                                        Quantity
                                                                        (Optional)
                                                                    </Label>
                                                                    <small className="text-muted">
                                                                        Leave
                                                                        empty
                                                                        for
                                                                        unlimited
                                                                    </small>
                                                                </div>
                                                            </Col>

                                                            {/* Unit Price - Only editable for first tier */}
                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="unitPrice"
                                                                        name="unitPrice"
                                                                        placeholder="Unit Price"
                                                                        value={
                                                                            priceTierForm.unitPrice
                                                                        }
                                                                        onChange={
                                                                            handlePriceTierFormChange
                                                                        }
                                                                        step="0.01"
                                                                        min="0"
                                                                        disabled={
                                                                            !(
                                                                                (priceTiers.length ===
                                                                                    0 &&
                                                                                    editingPriceTierIndex ===
                                                                                    null) ||
                                                                                editingPriceTierIndex ===
                                                                                0
                                                                            )
                                                                        }
                                                                    />
                                                                    <Label htmlFor="unitPrice">
                                                                        Unit
                                                                        Price
                                                                        (A$){" "}
                                                                        {((priceTiers.length ===
                                                                            0 &&
                                                                            editingPriceTierIndex ===
                                                                            null) ||
                                                                            editingPriceTierIndex ===
                                                                            0) && (
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            )}
                                                                    </Label>
                                                                    {!(
                                                                        (priceTiers.length ===
                                                                            0 &&
                                                                            editingPriceTierIndex ===
                                                                            null) ||
                                                                        editingPriceTierIndex ===
                                                                        0
                                                                    ) && (
                                                                            <small className="text-muted">
                                                                                Auto-calculated
                                                                            </small>
                                                                        )}
                                                                </div>
                                                            </Col>

                                                            {/* Discount % - Only shown/required for non-first tiers */}
                                                            <Col lg={2}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="number"
                                                                        className="form-control"
                                                                        id="discountPercent"
                                                                        name="discountPercent"
                                                                        placeholder="Discount %"
                                                                        value={
                                                                            priceTierForm.discountPercent
                                                                        }
                                                                        onChange={
                                                                            handlePriceTierFormChange
                                                                        }
                                                                        step="0.01"
                                                                        min="0"
                                                                        max="100"
                                                                        disabled={
                                                                            (priceTiers.length ===
                                                                                0 &&
                                                                                editingPriceTierIndex ===
                                                                                null) ||
                                                                            editingPriceTierIndex ===
                                                                            0
                                                                        }
                                                                    />
                                                                    <Label htmlFor="discountPercent">
                                                                        Discount
                                                                        %{" "}
                                                                        {!(
                                                                            (priceTiers.length ===
                                                                                0 &&
                                                                                editingPriceTierIndex ===
                                                                                null) ||
                                                                            editingPriceTierIndex ===
                                                                            0
                                                                        ) && (
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            )}
                                                                    </Label>
                                                                    {((priceTiers.length ===
                                                                        0 &&
                                                                        editingPriceTierIndex ===
                                                                        null) ||
                                                                        editingPriceTierIndex ===
                                                                        0) && (
                                                                            <small className="text-muted">
                                                                                N/A
                                                                                for
                                                                                first
                                                                                tier
                                                                            </small>
                                                                        )}
                                                                </div>
                                                            </Col>

                                                            <Col lg={3}>
                                                                <div className="form-floating mb-3">
                                                                    <Input
                                                                        type="text"
                                                                        className="form-control"
                                                                        id="tierLabel"
                                                                        name="tierLabel"
                                                                        placeholder="Tier Label"
                                                                        value={
                                                                            priceTierForm.tierLabel
                                                                        }
                                                                        onChange={
                                                                            handlePriceTierFormChange
                                                                        }
                                                                    />
                                                                    <Label htmlFor="tierLabel">
                                                                        Tier
                                                                        Label
                                                                        (Optional)
                                                                    </Label>
                                                                    <small className="text-muted">
                                                                        e.g.,
                                                                        "Bulk
                                                                        Order",
                                                                        "Wholesale"
                                                                    </small>
                                                                </div>
                                                            </Col>

                                                            <Col lg={12}>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-success"
                                                                        onClick={
                                                                            addPriceTier
                                                                        }
                                                                    >
                                                                        <i
                                                                            className={`ri-${editingPriceTierIndex !==
                                                                                null
                                                                                ? "save"
                                                                                : "add"
                                                                                }-line align-middle me-1`}
                                                                        ></i>
                                                                        {editingPriceTierIndex !==
                                                                            null
                                                                            ? "Update Tier"
                                                                            : "Add Tier"}
                                                                    </button>
                                                                    {editingPriceTierIndex !==
                                                                        null && (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-secondary"
                                                                                onClick={
                                                                                    cancelPriceTierEdit
                                                                                }
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>

                                                {/* Price Tiers List */}
                                                {priceTiers.length > 0 && (
                                                    <Card className="border mt-3">
                                                        <CardHeader className="bg-light">
                                                            <h6 className="mb-0">
                                                                <i className="ri-list-check align-middle me-2"></i>
                                                                Added Price
                                                                Tiers (
                                                                {
                                                                    priceTiers.length
                                                                }
                                                                )
                                                            </h6>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered table-striped table-hover mb-0">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>
                                                                                Quantity
                                                                                Range
                                                                            </th>
                                                                            <th>
                                                                                Unit
                                                                                Price
                                                                            </th>
                                                                            <th>
                                                                                Discount
                                                                                %
                                                                            </th>
                                                                            <th>
                                                                                Label
                                                                            </th>
                                                                            <th>
                                                                                Actions
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {priceTiers.map(
                                                                            (
                                                                                tier,
                                                                                index
                                                                            ) => (
                                                                                <tr
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                >
                                                                                    <td>
                                                                                        <strong>
                                                                                            {
                                                                                                tier.minQuantity
                                                                                            }
                                                                                        </strong>{" "}
                                                                                        -{" "}
                                                                                        {tier.maxQuantity ||
                                                                                            "∞"}
                                                                                    </td>
                                                                                    <td>
                                                                                        <Badge color="success">
                                                                                            A$
                                                                                            {tier.unitPrice.toFixed(
                                                                                                2
                                                                                            )}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td>
                                                                                        {tier.discountPercent ? (
                                                                                            <Badge color="warning">
                                                                                                {
                                                                                                    tier.discountPercent
                                                                                                }

                                                                                                %
                                                                                            </Badge>
                                                                                        ) : (
                                                                                            <span className="text-muted">
                                                                                                -
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>
                                                                                        {tier.tierLabel || (
                                                                                            <span className="text-muted">
                                                                                                -
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="d-flex gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn btn-sm btn-success"
                                                                                                onClick={() =>
                                                                                                    editPriceTier(
                                                                                                        index
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <i className="ri-edit-line"></i>
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn btn-sm btn-danger"
                                                                                                onClick={() =>
                                                                                                    deletePriceTier(
                                                                                                        index
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <i className="ri-delete-bin-line"></i>
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Delivery Options Tab */}
                                    <TabPane tabId="6">
                                        <Row>
                                            <Col lg={12}>
                                                <div className="alert alert-info mb-4">
                                                    <i className="ri-information-line align-middle me-2"></i>
                                                    <strong>
                                                        Delivery Options:
                                                    </strong>{" "}
                                                    Select available delivery
                                                    options for this product.
                                                    You can set one as default
                                                    and optionally override the
                                                    delivery charge for specific
                                                    products.
                                                </div>

                                                {deliveryTypes.length === 0 ? (
                                                    <div className="alert alert-warning">
                                                        <i className="ri-alert-line align-middle me-2"></i>
                                                        No delivery types
                                                        available. Please add
                                                        delivery types in the{" "}
                                                        <strong>
                                                            Delivery Type
                                                        </strong>{" "}
                                                        master first.
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Delivery Options Selection */}
                                                        <Card className="border">
                                                            <CardHeader className="bg-light">
                                                                <h6 className="mb-0">
                                                                    <i className="ri-truck-line align-middle me-2"></i>
                                                                    Available
                                                                    Delivery
                                                                    Options
                                                                </h6>
                                                            </CardHeader>
                                                            <CardBody>
                                                                <Row>
                                                                    {deliveryTypes.map(
                                                                        (
                                                                            deliveryType
                                                                        ) => {
                                                                            const selectedOption =
                                                                                productDeliveryOptions.find(
                                                                                    (
                                                                                        opt
                                                                                    ) =>
                                                                                        opt.deliveryTypeId ===
                                                                                        deliveryType.id
                                                                                );
                                                                            const isSelected =
                                                                                !!selectedOption;

                                                                            return (
                                                                                <Col
                                                                                    lg={
                                                                                        6
                                                                                    }
                                                                                    xl={
                                                                                        4
                                                                                    }
                                                                                    key={
                                                                                        deliveryType.id
                                                                                    }
                                                                                    className="mb-3"
                                                                                >
                                                                                    <div
                                                                                        className={`border rounded p-3 h-100 ${isSelected
                                                                                            ? "border-primary bg-primary-subtle"
                                                                                            : ""
                                                                                            }`}
                                                                                    >
                                                                                        <div className="form-check mb-2">
                                                                                            <Input
                                                                                                className="form-check-input"
                                                                                                type="checkbox"
                                                                                                id={`delivery-${deliveryType.id}`}
                                                                                                checked={
                                                                                                    isSelected
                                                                                                }
                                                                                                onChange={() =>
                                                                                                    handleDeliveryOptionToggle(
                                                                                                        deliveryType.id
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                            <Label
                                                                                                className="form-check-label w-100"
                                                                                                htmlFor={`delivery-${deliveryType.id}`}
                                                                                            >
                                                                                                <div className="d-flex justify-content-between align-items-start">
                                                                                                    <div>
                                                                                                        <strong>
                                                                                                            {
                                                                                                                deliveryType.name
                                                                                                            }
                                                                                                        </strong>
                                                                                                        <br />
                                                                                                        <small className="text-muted">
                                                                                                            Code:{" "}
                                                                                                            {
                                                                                                                deliveryType.code
                                                                                                            }
                                                                                                        </small>
                                                                                                    </div>
                                                                                                    {selectedOption?.isDefault && (
                                                                                                        <Badge
                                                                                                            color="success"
                                                                                                            className="text-white"
                                                                                                        >
                                                                                                            <i className="ri-star-fill me-1"></i>
                                                                                                            Default
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </div>
                                                                                            </Label>
                                                                                        </div>

                                                                                        {/* Delivery Info */}
                                                                                        <div className="mb-2">
                                                                                            {deliveryType.estimatedDaysMin &&
                                                                                                deliveryType.estimatedDaysMax ? (
                                                                                                <small className="text-muted">
                                                                                                    <i className="ri-time-line me-1"></i>
                                                                                                    {
                                                                                                        deliveryType.estimatedDaysMin
                                                                                                    }

                                                                                                    -
                                                                                                    {
                                                                                                        deliveryType.estimatedDaysMax
                                                                                                    }{" "}
                                                                                                    days
                                                                                                </small>
                                                                                            ) : deliveryType.estimatedDays ? (
                                                                                                <small className="text-muted">
                                                                                                    <i className="ri-time-line me-1"></i>
                                                                                                    {
                                                                                                        deliveryType.estimatedDays
                                                                                                    }{" "}
                                                                                                    days
                                                                                                </small>
                                                                                            ) : null}
                                                                                        </div>

                                                                                        {/* Charge Info */}
                                                                                        <div className="mb-2">
                                                                                            {deliveryType.isChargeable ? (
                                                                                                <>
                                                                                                    <Badge
                                                                                                        color="warning"
                                                                                                        className="text-white me-2"
                                                                                                    >
                                                                                                        A$
                                                                                                        {parseFloat(
                                                                                                            deliveryType.deliveryCharge
                                                                                                        ).toFixed(
                                                                                                            2
                                                                                                        )}
                                                                                                    </Badge>
                                                                                                    {deliveryType.freeDeliveryMinOrder && (
                                                                                                        <small className="text-success">
                                                                                                            Free
                                                                                                            over
                                                                                                            A$
                                                                                                            {parseFloat(
                                                                                                                deliveryType.freeDeliveryMinOrder
                                                                                                            ).toFixed(
                                                                                                                2
                                                                                                            )}
                                                                                                        </small>
                                                                                                    )}
                                                                                                </>
                                                                                            ) : (
                                                                                                <Badge
                                                                                                    color="success"
                                                                                                    className="text-white"
                                                                                                >
                                                                                                    Free
                                                                                                    Delivery
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Options when selected */}
                                                                                        {isSelected && (
                                                                                            <div className="mt-3 pt-3 border-top">
                                                                                                <Row>
                                                                                                    <Col
                                                                                                        lg={
                                                                                                            12
                                                                                                        }
                                                                                                        className="mb-2"
                                                                                                    >
                                                                                                        <div className="form-check form-switch">
                                                                                                            <Input
                                                                                                                className="form-check-input"
                                                                                                                type="checkbox"
                                                                                                                id={`delivery-default-${deliveryType.id}`}
                                                                                                                checked={
                                                                                                                    selectedOption.isDefault
                                                                                                                }
                                                                                                                onChange={() =>
                                                                                                                    setDefaultDeliveryOption(
                                                                                                                        deliveryType.id
                                                                                                                    )
                                                                                                                }
                                                                                                            />
                                                                                                            <Label
                                                                                                                className="form-check-label"
                                                                                                                htmlFor={`delivery-default-${deliveryType.id}`}
                                                                                                            >
                                                                                                                Set
                                                                                                                as
                                                                                                                Default
                                                                                                            </Label>
                                                                                                        </div>
                                                                                                    </Col>

                                                                                                    {deliveryType.isChargeable && (
                                                                                                        <Col
                                                                                                            lg={
                                                                                                                12
                                                                                                            }
                                                                                                        >
                                                                                                            <div className="form-floating">
                                                                                                                <Input
                                                                                                                    type="number"
                                                                                                                    className="form-control form-control-sm"
                                                                                                                    id={`delivery-price-${deliveryType.id}`}
                                                                                                                    placeholder="Override Price"
                                                                                                                    step="0.01"
                                                                                                                    min="0"
                                                                                                                    value={
                                                                                                                        selectedOption.priceOverride ||
                                                                                                                        ""
                                                                                                                    }
                                                                                                                    onChange={(
                                                                                                                        e
                                                                                                                    ) =>
                                                                                                                        handleDeliveryOptionChange(
                                                                                                                            deliveryType.id,
                                                                                                                            "priceOverride",
                                                                                                                            e
                                                                                                                                .target
                                                                                                                                .value
                                                                                                                                ? parseFloat(
                                                                                                                                    e
                                                                                                                                        .target
                                                                                                                                        .value
                                                                                                                                )
                                                                                                                                : null
                                                                                                                        )
                                                                                                                    }
                                                                                                                />
                                                                                                                <Label
                                                                                                                    htmlFor={`delivery-price-${deliveryType.id}`}
                                                                                                                >
                                                                                                                    Price
                                                                                                                    Override
                                                                                                                    (A$)
                                                                                                                </Label>
                                                                                                                <small className="text-muted">
                                                                                                                    Leave
                                                                                                                    empty
                                                                                                                    to
                                                                                                                    use
                                                                                                                    default
                                                                                                                    charge
                                                                                                                </small>
                                                                                                            </div>
                                                                                                        </Col>
                                                                                                    )}
                                                                                                </Row>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </Col>
                                                                            );
                                                                        }
                                                                    )}
                                                                </Row>
                                                            </CardBody>
                                                        </Card>

                                                        {/* Selected Delivery Options Summary */}
                                                        {productDeliveryOptions.length >
                                                            0 && (
                                                                <Card className="border border-success mt-3">
                                                                    <CardHeader className="bg-success-subtle">
                                                                        <h6 className="mb-0 text-success">
                                                                            <i className="ri-checkbox-circle-line align-middle me-2"></i>
                                                                            Selected
                                                                            Delivery
                                                                            Options
                                                                            (
                                                                            {
                                                                                productDeliveryOptions.length
                                                                            }
                                                                            )
                                                                        </h6>
                                                                    </CardHeader>
                                                                    <CardBody>
                                                                        <div className="table-responsive">
                                                                            <table className="table table-bordered table-hover mb-0">
                                                                                <thead className="table-light">
                                                                                    <tr>
                                                                                        <th>
                                                                                            Delivery
                                                                                            Type
                                                                                        </th>
                                                                                        <th>
                                                                                            Estimated
                                                                                            Delivery
                                                                                        </th>
                                                                                        <th>
                                                                                            Charge
                                                                                        </th>
                                                                                        <th>
                                                                                            Price
                                                                                            Override
                                                                                        </th>
                                                                                        <th>
                                                                                            Default
                                                                                        </th>
                                                                                        <th>
                                                                                            Action
                                                                                        </th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {productDeliveryOptions.map(
                                                                                        (
                                                                                            option
                                                                                        ) => {
                                                                                            const deliveryType =
                                                                                                deliveryTypes.find(
                                                                                                    (
                                                                                                        dt
                                                                                                    ) =>
                                                                                                        dt.id ===
                                                                                                        option.deliveryTypeId
                                                                                                );
                                                                                            if (
                                                                                                !deliveryType
                                                                                            )
                                                                                                return null;

                                                                                            return (
                                                                                                <tr
                                                                                                    key={
                                                                                                        option.deliveryTypeId
                                                                                                    }
                                                                                                >
                                                                                                    <td>
                                                                                                        <strong>
                                                                                                            {
                                                                                                                deliveryType.name
                                                                                                            }
                                                                                                        </strong>
                                                                                                        <br />
                                                                                                        <small className="text-muted">
                                                                                                            {
                                                                                                                deliveryType.code
                                                                                                            }
                                                                                                        </small>
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {deliveryType.estimatedDaysMin &&
                                                                                                            deliveryType.estimatedDaysMax
                                                                                                            ? `${deliveryType.estimatedDaysMin}-${deliveryType.estimatedDaysMax} days`
                                                                                                            : deliveryType.estimatedDays
                                                                                                                ? `${deliveryType.estimatedDays} days`
                                                                                                                : "-"}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {deliveryType.isChargeable ? (
                                                                                                            <span>
                                                                                                                A$
                                                                                                                {parseFloat(
                                                                                                                    deliveryType.deliveryCharge
                                                                                                                ).toFixed(
                                                                                                                    2
                                                                                                                )}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <Badge
                                                                                                                color="success"
                                                                                                                className="text-white"
                                                                                                            >
                                                                                                                Free
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {option.priceOverride ? (
                                                                                                            <Badge
                                                                                                                color="info"
                                                                                                                className="text-white"
                                                                                                            >
                                                                                                                A$
                                                                                                                {parseFloat(
                                                                                                                    option.priceOverride
                                                                                                                ).toFixed(
                                                                                                                    2
                                                                                                                )}
                                                                                                            </Badge>
                                                                                                        ) : (
                                                                                                            <span className="text-muted">
                                                                                                                -
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        {option.isDefault ? (
                                                                                                            <Badge
                                                                                                                color="success"
                                                                                                                className="text-white"
                                                                                                            >
                                                                                                                <i className="ri-star-fill me-1"></i>
                                                                                                                Yes
                                                                                                            </Badge>
                                                                                                        ) : (
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                className="btn btn-sm btn-outline-primary"
                                                                                                                onClick={() =>
                                                                                                                    setDefaultDeliveryOption(
                                                                                                                        option.deliveryTypeId
                                                                                                                    )
                                                                                                                }
                                                                                                            >
                                                                                                                Set
                                                                                                                Default
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="btn btn-sm btn-danger"
                                                                                                            onClick={() =>
                                                                                                                handleDeliveryOptionToggle(
                                                                                                                    option.deliveryTypeId
                                                                                                                )
                                                                                                            }
                                                                                                            title="Remove delivery option"
                                                                                                        >
                                                                                                            <i className="ri-delete-bin-line"></i>
                                                                                                        </button>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        }
                                                                                    )}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </CardBody>
                                                                </Card>
                                                            )}
                                                    </>
                                                )}
                                            </Col>
                                        </Row>
                                    </TabPane>
                                </TabContent>

                                <Col lg={12}>
                                    <FormsFooter
                                        handleSubmit={
                                            updateForm
                                                ? handleUpdate
                                                : handleSubmit
                                        }
                                        handleSubmitCancel={handleList}
                                    />
                                </Col>
                            </Form>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </CardBody>
    );

    document.title = `Product Master | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                {isDeleteLoading && <LoadingOverlay fullscreen />}
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Product"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="Product"
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
                                    // showAddButton={currentPagePermissions.write}
                                    />
                                </CardHeader>

                                {showForm || updateForm ? (
                                    renderForm()
                                ) : (
                                    <CardBody>
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={columns}
                                                data={data}
                                                progressPending={loading}
                                                sortServer
                                                onSort={(
                                                    column,
                                                    sortDirection
                                                ) =>
                                                    handleSort(
                                                        column,
                                                        sortDirection
                                                    )
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
                                                onChangeRowsPerPage={
                                                    handlePerRowsChange
                                                }
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
                title="Cannot Delete Product"
                referenceData={referenceData}
            />
        </React.Fragment>
    );
};

export default Product;
