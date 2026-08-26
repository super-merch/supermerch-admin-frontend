import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Input,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Row,
    Badge,
    Table,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Button,
    Alert,
    Label,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import Select from "react-select";
import axios from "axios";
// Auth token is added by axios interceptor in api_helper.js
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import classnames from "classnames";
import config from "../../config";
import ExportButtons from "../../Components/Common/ExportButtons";
import tableCustomStyles from "../../Components/Common/tableStyles";
import {
    addProductMargin,
    getProductMargin,
} from "../../functions/Pricing/marginFunc";
import {
    addProductDiscount,
    getProductDiscount,
} from "../../functions/Pricing/discountFunc";

const apiUrl = config.api.API_URL;

const ProductMaster = () => {

    // ── List view states ─────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(50);
    const [pageNo, setPageNo] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [query, setQuery] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const suppliersFetched = useRef(false);
    const categoriesFetched = useRef(false);

    // ── Detail view states ───────────────────────────────────
    const [updateForm, setUpdateForm] = useState(false);
    const [productDetail, setProductDetail] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [activeTab, setActiveTab] = useState("1");

    // ── Customization states ─────────────────────────────────
    const [customizationMethods, setCustomizationMethods] = useState([]);
    const [customizationPositions, setCustomizationPositions] = useState([]);
    const [methodPositionMappings, setMethodPositionMappings] = useState([]);
    // Structure: [{ methodId: "objectId", positions: [{ positionId: "objectId", priceAdjustment: 0 }] }]
    const [existingMappingIds, setExistingMappingIds] = useState({});
    // { methodId: mappingDocId } — for DELETE when removing a method
    const [isSavingCustomization, setIsSavingCustomization] = useState(false);

    // ── Inline margin/discount for product list ──
    const [productMarginInputs, setProductMarginInputs] = useState({});
    const [productDiscountInputs, setProductDiscountInputs] = useState({});
    const [productMarginMap, setProductMarginMap] = useState({});
    const [productDiscountMap, setProductDiscountMap] = useState({});

    // ── Special Tags states ──────────────────────────────────
    const [manualTags, setManualTags] = useState([]);
    const [isSavingSpecialTags, setIsSavingSpecialTags] = useState(false);

    // ── Hero image override state ────────────────────────────
    const [isSavingHeroImage, setIsSavingHeroImage] = useState(false);


    // ── Lazy-fetch supplier + category lists for filter dropdowns ─
    const fetchSuppliers = useCallback(async (search = "") => {
        try {
            const res = await axios.get(`${apiUrl}/api/listbyparams/suppliers`, {
                params: { limit: 50, isActive: true, search },
            });
            const list = res.data?.data || res.data || [];
            setSuppliers(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
        }
    }, []);

    const fetchCategories = useCallback(async (search = "") => {
        try {
            const res = await axios.get(`${apiUrl}/api/listbyparams/sub-categories`, {
                params: { limit: 50, isActive: true, search },
            });
            const list = res.data?.data || res.data || [];
            setCategories(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    }, []);

    const handleSupplierMenuOpen = () => {
        if (!suppliersFetched.current) {
            suppliersFetched.current = true;
            fetchSuppliers();
        }
    };

    const handleCategoryMenuOpen = () => {
        if (!categoriesFetched.current) {
            categoriesFetched.current = true;
            fetchCategories();
        }
    };

    // Debounced search for supplier dropdown
    useEffect(() => {
        if (!suppliersFetched.current) return;
        const timer = setTimeout(() => fetchSuppliers(supplierSearch), 300);
        return () => clearTimeout(timer);
    }, [supplierSearch, fetchSuppliers]);

    // Debounced search for category dropdown
    useEffect(() => {
        if (!categoriesFetched.current) return;
        const timer = setTimeout(() => fetchCategories(categorySearch), 300);
        return () => clearTimeout(timer);
    }, [categorySearch, fetchCategories]);

    // ── Fetch products (category-first search) ────────────────
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: pageNo,
                limit: perPage,
                filter: "false",
            };
            if (supplierFilter) params.supplier = supplierFilter;
            if (categoryFilter) params.product_type_ids = categoryFilter;

            let endpoint = `${apiUrl}/api/client-products`;

            if (query) {
                // Category-first search: check if query matches any subcategories
                let matchedCategoryId = null;
                try {
                    const catRes = await axios.get(`${apiUrl}/api/listbyparams/sub-categories`, {
                        params: { search: query, limit: 1, isActive: true },
                    });
                    const catList = catRes.data?.data || catRes.data || [];
                    if (Array.isArray(catList) && catList.length > 0) {
                        matchedCategoryId = catList[0]._promodataTypeId || catList[0].id || catList[0]._id;
                    }
                } catch (catErr) {
                    console.warn("Category search failed, falling back to product search:", catErr);
                }

                if (matchedCategoryId && !categoryFilter) {
                    // Found a matching category — filter products by that category
                    params.product_type_ids = matchedCategoryId;
                } else {
                    // No matching category — fall back to product text search
                    endpoint = `${apiUrl}/api/client-products/search`;
                    params.searchTerm = query;
                }
            }

            const res = await axios.get(endpoint, { params });
            const resData = res.data;

            if (resData?.success === false || resData?.error) {
                toast.error(resData.error || "Failed to load products");
                setData([]);
                return;
            }

            if (resData?.data) {
                setData(resData.data);

                const count = resData.pagination?.totalCount ?? resData.item_count ?? resData.totalRows ?? resData.data.length;

                if (count > 0 || pageNo === 1) {
                    setTotalRows(count);
                }
            } else {
                setData([]);
                setTotalRows(0);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            toast.error("Failed to load products");
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [pageNo, perPage, query, supplierFilter, categoryFilter]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ── Search debounce ──────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchTerm);
            setPageNo(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ── Handlers ─────────────────────────────────────────────
    const handleViewProduct = async (productId) => {
        setIsLoadingDetail(true);
        setUpdateForm(true);
        setActiveTab("1");
        setMethodPositionMappings([]);
        setExistingMappingIds({});
        try {
            // Fetch product detail + customization data in parallel
            const [productRes, methodsRes, positionsRes] = await Promise.all([
                axios.get(`${apiUrl}/api/single-product/${productId}`),
                axios.get(`${apiUrl}/api/customization-methods`, { params: { limit: 100, isActive: true } }),
                axios.get(`${apiUrl}/api/customization-positions`, { params: { limit: 100, isActive: true } }),
            ]);

            const p = productRes.data?.data || productRes.data;
            setProductDetail(p);
            setManualTags(p.manualSpecialTags || []);


            const methods = methodsRes.data?.data || [];
            setCustomizationMethods(Array.isArray(methods) ? methods : []);
            const positions = positionsRes.data?.data || [];
            setCustomizationPositions(Array.isArray(positions) ? positions : []);

            // Fetch existing mappings using the MongoDB _id
            const mongoId = p?._id;
            if (mongoId) {
                try {
                    const mappingsRes = await axios.get(
                        `${apiUrl}/api/admin/products/${mongoId}/customization-mappings`
                    );
                    const mappings = mappingsRes.data?.data || [];
                    if (mappings.length > 0) {
                        const idMap = {};
                        const converted = mappings.map((m) => {
                            const methodId = m.customizationMethodId?._id || m.customizationMethodId;
                            idMap[methodId] = m._id; // mapping doc _id for DELETE
                            return {
                                methodId,
                                positions: (m.positions || []).map((pos) => ({
                                    positionId: pos.positionId?._id || pos.positionId,
                                    priceAdjustment: pos.priceAdjustment || 0,
                                })),
                            };
                        });
                        setMethodPositionMappings(converted);
                        setExistingMappingIds(idMap);
                    }
                } catch (mapErr) {
                    console.error("Error fetching customization mappings:", mapErr);
                }
            }
        } catch (err) {
            console.error("Error fetching product:", err);
            toast.error("Failed to load product details");
            setUpdateForm(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleIgnoreToggle = async (productId, isIgnored) => {
        const endpoint = isIgnored
            ? `${apiUrl}/api/promodata/unignore-product`
            : `${apiUrl}/api/promodata/ignore-product`;
        try {
            const res = await axios.post(endpoint, { productId });
            if (res.data?.success !== false) {
                toast.success(isIgnored ? "Product unignored" : "Product ignored");
                fetchProducts();
            }
        } catch (err) {
            console.error("Error toggling ignore:", err);
            toast.error("Failed to update product");
        }
    };

    const handleBackToList = () => {
        setUpdateForm(false);
        setProductDetail(null);
        setActiveTab("1");
        setMethodPositionMappings([]);
        setExistingMappingIds({});
    };

    // ── Fetch product margins/discounts when data changes ──
    useEffect(() => {
        if (!data.length) return;
        const fetchProductPricing = async () => {
            const mMap = {};
            const mInputs = {};
            const dMap = {};
            const dInputs = {};
            await Promise.all(
                data.map(async (row) => {
                    const pid = row.meta?.id || row._id || row.id;
                    if (!pid) return;
                    try {
                        const marginRes = await getProductMargin(pid);
                        const marginData = marginRes.data?.data;
                        // Only treat product-level values as explicit overrides.
                        if (marginRes.data?.success && marginData?.type === "product") {
                            mMap[pid] = marginData.margin;
                            mInputs[pid] = marginData.margin;
                        }

                        const discountRes = await getProductDiscount(pid);
                        const discountData = discountRes.data?.data;
                        // getProductDiscount can return global/supplier fallback values.
                        // Show override badges only for product-specific discounts.
                        if (discountRes.data?.success && discountData?.type === "product") {
                            dMap[pid] = discountData.discount;
                            dInputs[pid] = discountData.discount;
                        }
                    } catch {
                        // no margin set for this product
                    }
                })
            );
            setProductMarginMap(mMap);
            setProductMarginInputs((prev) => ({ ...prev, ...mInputs }));
            setProductDiscountMap(dMap);
            setProductDiscountInputs((prev) => ({ ...prev, ...dInputs }));
        };
        fetchProductPricing();
    }, [data]);

    const handleProductMarginSave = async (productId) => {
        const val = parseFloat(productMarginInputs[productId]);
        if (isNaN(val) || val < 0) {
            toast.error("Enter a valid margin %");
            return;
        }
        try {
            const res = await addProductMargin({ productId, margin: val });
            if (res.data?.success !== false) {
                toast.success("Product margin saved");
                setProductMarginMap((prev) => ({ ...prev, [productId]: val }));
                await fetchProducts();
            }
        } catch {
            toast.error("Failed to save product margin");
        }
    };

    const handleProductDiscountSave = async (productId) => {
        const val = parseFloat(productDiscountInputs[productId]);
        if (isNaN(val) || val < 0) {
            toast.error("Enter a valid discount %");
            return;
        }
        try {
            const res = await addProductDiscount({ productId, discount: val });
            if (res.data?.success !== false) {
                toast.success("Product discount saved");
                setProductDiscountMap((prev) => ({ ...prev, [productId]: val }));
                await fetchProducts();
            }
        } catch {
            toast.error("Failed to save product discount");
        }
    };

    // ── Export helpers ──
    const exportColumns = [
        { header: "Name", key: "overview.name" },
        { header: "Code", key: "overview.code" },
        { header: "Supplier", key: "supplier.supplier" },
        { header: "Category", key: "product.categorisation.promodata_product_type.type_name" },
        { header: "Status", key: "meta.discontinued" },
    ];

    const fetchAllForExport = async () => {
        try {
            const params = { page: 1, limit: 10000, filter: "false" };
            if (supplierFilter) params.supplier = supplierFilter;
            if (categoryFilter) params.product_type_ids = categoryFilter;
            const res = await axios.get(`${apiUrl}/api/client-products`, { params });
            return res.data?.data || data;
        } catch {
            return data;
        }
    };

    // ── Customization handlers ───────────────────────────────
    const handleMethodChange = (methodId) => {
        const existing = methodPositionMappings.find((m) => m.methodId === methodId);
        if (existing) {
            setMethodPositionMappings((prev) => prev.filter((m) => m.methodId !== methodId));
        } else {
            setMethodPositionMappings((prev) => [...prev, { methodId, positions: [] }]);
        }
    };

    const handlePositionChange = (methodId, positionId) => {
        setMethodPositionMappings((prev) => {
            const idx = prev.findIndex((m) => m.methodId === methodId);
            if (idx === -1) return prev;
            const updated = [...prev];
            const method = { ...updated[idx] };
            const posIdx = method.positions.findIndex((p) => p.positionId === positionId);
            if (posIdx !== -1) {
                method.positions = method.positions.filter((p) => p.positionId !== positionId);
            } else {
                method.positions = [...method.positions, { positionId, priceAdjustment: 0 }];
            }
            updated[idx] = method;
            return updated;
        });
    };

    const handlePositionPriceChange = (methodId, positionId, price) => {
        setMethodPositionMappings((prev) => {
            const idx = prev.findIndex((m) => m.methodId === methodId);
            if (idx === -1) return prev;
            const updated = [...prev];
            const method = { ...updated[idx] };
            method.positions = method.positions.map((p) =>
                p.positionId === positionId
                    ? { ...p, priceAdjustment: parseFloat(price) || 0 }
                    : p
            );
            updated[idx] = method;
            return updated;
        });
    };

    const handleSaveCustomizations = async () => {
        const mongoId = productDetail?._id;
        if (!mongoId) {
            toast.error("Product ID not available for saving customizations");
            return;
        }
        setIsSavingCustomization(true);
        try {
            const currentMethodIds = new Set(methodPositionMappings.map((m) => m.methodId));

            // DELETE removed methods (ones in existingMappingIds but not in current)
            const deletePromises = Object.entries(existingMappingIds)
                .filter(([methodId]) => !currentMethodIds.has(methodId))
                .map(([, mappingDocId]) =>
                    axios.delete(`${apiUrl}/api/admin/products/${mongoId}/customization-mappings/${mappingDocId}`)
                );

            // POST/upsert current methods
            const upsertPromises = methodPositionMappings.map((mapping) =>
                axios.post(`${apiUrl}/api/admin/products/${mongoId}/customization-mappings`, {
                    customizationMethodId: mapping.methodId,
                    positions: mapping.positions.map((p) => ({
                        positionId: p.positionId,
                        priceAdjustment: p.priceAdjustment,
                    })),
                    isActive: true,
                })
            );

            await Promise.all([...deletePromises, ...upsertPromises]);

            // Refresh existing mapping IDs
            const refreshRes = await axios.get(
                `${apiUrl}/api/admin/products/${mongoId}/customization-mappings`
            );
            const refreshed = refreshRes.data?.data || [];
            const newIdMap = {};
            refreshed.forEach((m) => {
                const mId = m.customizationMethodId?._id || m.customizationMethodId;
                newIdMap[mId] = m._id;
            });
            setExistingMappingIds(newIdMap);

            toast.success("Customizations saved successfully");
        } catch (err) {
            console.error("Error saving customizations:", err);
            toast.error("Failed to save customizations");
        } finally {
            setIsSavingCustomization(false);
        }
    };

    const handleSaveSpecialTags = async () => {
        const mongoId = productDetail?._id;
        if (!mongoId) {
            toast.error("Product ID not available");
            return;
        }
        setIsSavingSpecialTags(true);
        try {
            const res = await axios.post(`${apiUrl}/api/admin/products/${mongoId}/special-tags`, {
                specialTags: manualTags,
            });
            if (res.data?.success !== false) {
                toast.success("Special tags saved successfully");
                // Refresh product detail to get updated aggregated tags
                const detailRes = await axios.get(`${apiUrl}/api/single-product/${productDetail.meta?.id || productDetail._id || mongoId}`);
                setProductDetail(detailRes.data?.data || detailRes.data);
            }
        } catch (err) {
            console.error("Error saving special tags:", err);
            toast.error("Failed to save special tags");
        } finally {
            setIsSavingSpecialTags(false);
        }
    };

    const handleSetHeroImage = async (imageUrl) => {
        const productId = productDetail?.meta?.id;
        if (!productId) {
            toast.error("Product ID not available");
            return;
        }
        setIsSavingHeroImage(true);
        try {
            await axios.patch(`${apiUrl}/api/products/${productId}/hero-image`, { imageUrl });
            toast.success("Hero image updated");
            const detailRes = await axios.get(`${apiUrl}/api/single-product/${productId}`);
            setProductDetail(detailRes.data?.data || detailRes.data);
        } catch (err) {
            console.error("Error setting hero image:", err);
            toast.error("Failed to update hero image");
        } finally {
            setIsSavingHeroImage(false);
        }
    };

    const handleResetHeroImage = async () => {
        const productId = productDetail?.meta?.id;
        if (!productId) {
            toast.error("Product ID not available");
            return;
        }
        setIsSavingHeroImage(true);
        try {
            await axios.delete(`${apiUrl}/api/products/${productId}/hero-image`);
            toast.success("Hero image reverted to original");
            const detailRes = await axios.get(`${apiUrl}/api/single-product/${productId}`);
            setProductDetail(detailRes.data?.data || detailRes.data);
        } catch (err) {
            console.error("Error resetting hero image:", err);
            toast.error("Failed to reset hero image");
        } finally {
            setIsSavingHeroImage(false);
        }
    };

    const handlePageChange = (page) => setPageNo(page);

    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPageNo(1);
    };

    // ── Helper: get hero image ───────────────────────────────
    const getHeroImage = (row) => {
        return (
            row?.overview?.hero_image ||
            row?.product?.images?.[0] ||
            row?.product?.colours?.list?.[0]?.image ||
            null
        );
    };

    // ── Helper: get min price ────────────────────────────────
    const getMinPrice = (row) => {
        const summaryPrice = Number(row?.pricingSummary?.finalMinPrice);
        if (Number.isFinite(summaryPrice) && summaryPrice > 0) {
            return summaryPrice;
        }

        const groups = row?.product?.prices?.price_groups;
        if (!groups?.length) return null;
        let min = Infinity;
        groups.forEach((g) => {
            const breaks = g?.base_price?.price_breaks;
            if (breaks?.length) {
                breaks.forEach((b) => {
                    if (b.price < min) min = b.price;
                });
            }
        });
        return min === Infinity ? null : min;
    };

    // ── DataTable columns ────────────────────────────────────
    const columns = [
        {
            name: "#",
            width: "60px",
            cell: (row, index) => (pageNo - 1) * perPage + index + 1,
        },
        {
            name: "Image",
            width: "70px",
            cell: (row) => {
                const img = getHeroImage(row);
                return img ? (
                    <img
                        src={img}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 4 }}
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                ) : (
                    <div style={{ width: 40, height: 40, background: "#f3f3f3", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="ri-image-line text-muted"></i>
                    </div>
                );
            },
        },
        {
            name: "Product Name",
            sortable: true,
            minWidth: "250px",
            cell: (row) => (
                <span
                    className="text-primary fw-medium"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewProduct(row.meta?.id || row._id || row.id)}
                >
                    {row.overview?.name || row.product?.name || "-"}
                </span>
            ),
        },
        {
            name: "Code",
            sortable: true,
            width: "130px",
            selector: (row) => row.overview?.code || row.overview?.sku_number || "-",
        },
        {
            name: "Supplier",
            sortable: true,
            width: "150px",
            selector: (row) => row.supplier?.supplier || "-",
        },
        {
            name: "Category",
            width: "160px",
            selector: (row) =>
                row.product?.categorisation?.promodata_product_type?.type_name || "-",
        },
        {
            name: "Colors",
            width: "80px",
            center: true,
            cell: (row) => {
                const count = row.product?.colours?.list?.length || 0;
                return count > 0 ? (
                    <Badge color="soft-info" className="text-info">{count}</Badge>
                ) : (
                    <span className="text-muted">0</span>
                );
            },
        },
        {
            name: "Min Price",
            width: "140px",
            cell: (row) => {
                const finalPrice = Number(row?.pricingSummary?.finalMinPrice);
                const strikePrice = Number(row?.pricingSummary?.marginAdjustedMinPrice);
                const discountPct = Number(row?.pricingSummary?.discountPercent || 0);

                if (Number.isFinite(finalPrice) && finalPrice > 0) {
                    return (
                        <div className="d-flex flex-column" style={{ lineHeight: 1.15 }}>
                            {discountPct > 0 && Number.isFinite(strikePrice) && strikePrice > finalPrice && (
                                <small className="text-danger text-decoration-line-through">
                                    A${strikePrice.toFixed(2)}
                                </small>
                            )}
                            <span>A${finalPrice.toFixed(2)}</span>
                        </div>
                    );
                }

                const fallback = getMinPrice(row);
                return fallback != null ? `A$${fallback.toFixed(2)}` : "-";
            },
        },
        {
            name: "Status",
            width: "110px",
            center: true,
            cell: (row) => {
                const discontinued = row.meta?.discontinued;
                return discontinued ? (
                    <Badge color="soft-danger" className="text-danger">Discontinued</Badge>
                ) : (
                    <Badge color="soft-success" className="text-success">Active</Badge>
                );
            },
        },
        {
            name: "Margin %",
            width: "180px",
            cell: (row) => {
                const pid = row.meta?.id || row._id || row.id;
                return (
                    <div className="d-flex align-items-center gap-1">
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: 65 }}
                            step="0.01"
                            min="0"
                            placeholder="%"
                            value={productMarginInputs[pid] ?? ""}
                            onChange={(e) =>
                                setProductMarginInputs((prev) => ({ ...prev, [pid]: e.target.value }))
                            }
                        />
                        <Button color="success" size="sm" className="btn-icon" onClick={() => handleProductMarginSave(pid)} title="Save">
                            <i className="ri-save-line"></i>
                        </Button>
                        {productMarginMap[pid] !== undefined && (
                            <Badge color="soft-info" className="text-info">{productMarginMap[pid]}%</Badge>
                        )}
                    </div>
                );
            },
        },
        {
            name: "Discount %",
            width: "180px",
            cell: (row) => {
                const pid = row.meta?.id || row._id || row.id;
                return (
                    <div className="d-flex align-items-center gap-1">
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: 65 }}
                            step="0.01"
                            min="0"
                            placeholder="%"
                            value={productDiscountInputs[pid] ?? ""}
                            onChange={(e) =>
                                setProductDiscountInputs((prev) => ({ ...prev, [pid]: e.target.value }))
                            }
                        />
                        <Button color="success" size="sm" className="btn-icon" onClick={() => handleProductDiscountSave(pid)} title="Save">
                            <i className="ri-save-line"></i>
                        </Button>
                        {productDiscountMap[pid] !== undefined && (
                            <Badge color="soft-warning" className="text-warning">{productDiscountMap[pid]}%</Badge>
                        )}
                    </div>
                );
            },
        },
        {
            name: "Action",
            width: "180px",
            center: true,
            cell: (row) => {
                const productId = row.meta?.id || row._id || row.id;
                const isIgnored = row.meta?.ignored || row.ignored;
                return (
                    <div className="d-flex gap-2">
                        <Button
                            color="success"
                            size="sm"
                            onClick={() => handleViewProduct(productId)}
                        >
                            View
                        </Button>
                        <Button
                            color={isIgnored ? "warning" : "soft-danger"}
                            size="sm"
                            onClick={() => handleIgnoreToggle(productId, isIgnored)}
                        >
                            {isIgnored ? "Unignore" : "Ignore"}
                        </Button>
                    </div>
                );
            },
        },
    ];

    // ── Toggle tab ───────────────────────────────────────────
    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    // ══════════════════════════════════════════════════════════
    // DETAIL VIEW — 6 Tabs (Read-Only)
    // ══════════════════════════════════════════════════════════
    const renderDetailView = () => {
        if (isLoadingDetail) {
            return (
                <Card>
                    <CardBody className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading product details...</p>
                    </CardBody>
                </Card>
            );
        }

        if (!productDetail) return null;

        const p = productDetail;
        const product = p.product || {};
        const overview = p.overview || {};
        const supplier = p.supplier || {};
        const meta = p.meta || {};
        const colours = product.colours?.list || [];
        const details = product.details || [];
        const priceGroups = product.prices?.price_groups || [];
        const categorisation = product.categorisation || {};

        return (
            <>
                {/* Header card with back button and product summary */}
                <Card>
                    <CardBody>
                        <div className="d-flex align-items-start gap-3">
                            <Button
                                color="light"
                                size="sm"
                                className="me-2"
                                onClick={handleBackToList}
                            >
                                <i className="ri-arrow-left-line me-1"></i> Back
                            </Button>
                            {overview.hero_image && (
                                <img
                                    src={overview.hero_image}
                                    alt=""
                                    style={{ maxHeight: 100, maxWidth: 100, objectFit: "contain", borderRadius: 4, border: "1px solid #eee" }}
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                            )}
                            <div className="flex-grow-1">
                                <h5 className="mb-1">{overview.name || product.name || "Product"}</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {overview.code && <Badge color="soft-primary" className="text-primary">{overview.code}</Badge>}
                                    {supplier.supplier && <Badge color="soft-info" className="text-info">{supplier.supplier}</Badge>}
                                    {categorisation.promodata_product_type?.type_name && (
                                        <Badge color="soft-secondary" className="text-secondary">
                                            {categorisation.promodata_product_type.type_name}
                                        </Badge>
                                    )}
                                    {colours.length > 0 && (
                                        <Badge color="soft-warning" className="text-warning">{colours.length} colors</Badge>
                                    )}
                                    {meta.discontinued ? (
                                        <Badge color="soft-danger" className="text-danger">Discontinued</Badge>
                                    ) : (
                                        <Badge color="soft-success" className="text-success">Active</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* 6-Tab Navigation */}
                <Card>
                    <CardBody>
                        <Nav tabs className="nav-tabs-custom nav-success mb-3">
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "1" })}
                                    onClick={() => toggleTab("1")}
                                >
                                    <i className="ri-information-line align-middle me-1"></i>
                                    Basic Info
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "2" })}
                                    onClick={() => toggleTab("2")}
                                >
                                    <i className="ri-file-list-line align-middle me-1"></i>
                                    Product Details
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "3" })}
                                    onClick={() => toggleTab("3")}
                                >
                                    <i className="ri-brush-line align-middle me-1"></i>
                                    Customization
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "4" })}
                                    onClick={() => toggleTab("4")}
                                >
                                    <i className="ri-t-shirt-line align-middle me-1"></i>
                                    Variants
                                    {colours.length > 0 && (
                                        <Badge color="info" className="ms-1">{colours.length}</Badge>
                                    )}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "5" })}
                                    onClick={() => toggleTab("5")}
                                >
                                    <i className="ri-money-dollar-circle-line align-middle me-1"></i>
                                    Price Tiers
                                    {priceGroups.length > 0 && (
                                        <Badge color="info" className="ms-1">{priceGroups.length}</Badge>
                                    )}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "6" })}
                                    onClick={() => toggleTab("6")}
                                >
                                    <i className="ri-truck-line align-middle me-1"></i>
                                    Delivery
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: activeTab === "7" })}
                                    onClick={() => toggleTab("7")}
                                >
                                    <i className="ri-price-tag-3-line align-middle me-1"></i>
                                    Special Tags
                                </NavLink>
                            </NavItem>
                        </Nav>


                        <TabContent activeTab={activeTab}>
                            {/* ── Tab 1: Basic Information ── */}
                            <TabPane tabId="1">
                                <Table bordered responsive className="mb-0">
                                    <tbody>
                                        <tr>
                                            <th width="200">Product Name</th>
                                            <td>{overview.name || product.name || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Product Code</th>
                                            <td>{overview.code || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>SKU</th>
                                            <td>{overview.sku_number || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Supplier</th>
                                            <td>{supplier.supplier || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Brand</th>
                                            <td>{product.supplier_brand || supplier.supplier || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Category</th>
                                            <td>{categorisation.promodata_product_type?.type_name || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Type Group</th>
                                            <td>{categorisation.promodata_product_type?.type_group_name || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Country</th>
                                            <td>{meta.country || "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>Status</th>
                                            <td>
                                                {meta.discontinued ? (
                                                    <Badge color="danger">Discontinued</Badge>
                                                ) : (
                                                    <Badge color="success">Active</Badge>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>Description</th>
                                            <td style={{ whiteSpace: "pre-wrap" }}>
                                                {product.description || "-"}
                                            </td>
                                        </tr>
                                        {overview.hero_image && (
                                            <tr>
                                                <th>Hero Image</th>
                                                <td>
                                                    <img
                                                        src={overview.hero_image}
                                                        alt=""
                                                        style={{ maxHeight: 150, objectFit: "contain" }}
                                                        onError={(e) => { e.target.style.display = "none"; }}
                                                    />
                                                    {overview.original_hero_image && overview.original_hero_image !== overview.hero_image && (
                                                        <div className="mt-2">
                                                            <Button
                                                                size="sm"
                                                                color="link"
                                                                className="p-0"
                                                                disabled={isSavingHeroImage}
                                                                onClick={handleResetHeroImage}
                                                            >
                                                                Revert to original hero image
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </TabPane>

                            {/* ── Tab 2: Product Details ── */}
                            <TabPane tabId="2">
                                {details.length > 0 ? (
                                    <Table bordered responsive className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th width="200">Field</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.map((d, i) => (
                                                <tr key={i}>
                                                    <th>{d.name}</th>
                                                    <td style={{ whiteSpace: "pre-wrap" }}>
                                                        {d.detail || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted mb-0">No product details available.</p>
                                )}

                                {/* Product-level images */}
                                {product.images?.length > 0 && (
                                    <>
                                        <h6 className="mt-4 mb-3">Product Images</h6>
                                        <p className="text-muted small mb-2">
                                            Click an image to set it as the hero image shown on category pages.
                                        </p>
                                        <Row className="g-2">
                                            {product.images.map((img, i) => {
                                                const imageUrl = typeof img === "string" ? img : img.url || img.full_size;
                                                const isCurrentHero = imageUrl === overview.hero_image;
                                                return (
                                                    <Col xs={4} sm={3} md={2} key={i}>
                                                        <div
                                                            className="position-relative"
                                                            style={{ cursor: isSavingHeroImage ? "default" : "pointer" }}
                                                            onClick={() => !isSavingHeroImage && !isCurrentHero && handleSetHeroImage(imageUrl)}
                                                            title={isCurrentHero ? "Current hero image" : "Set as hero image"}
                                                        >
                                                            <img
                                                                src={imageUrl}
                                                                alt=""
                                                                className={`img-fluid rounded border ${isCurrentHero ? "border-success border-3" : ""}`}
                                                                style={{ height: 80, width: "100%", objectFit: "contain" }}
                                                                onError={(e) => { e.target.style.display = "none"; }}
                                                            />
                                                            {isCurrentHero && (
                                                                <Badge
                                                                    color="success"
                                                                    className="position-absolute top-0 end-0 m-1"
                                                                    style={{ fontSize: 10 }}
                                                                >
                                                                    Hero
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </>
                                )}

                                {product.image_data?.length > 0 && (
                                    <>
                                        <h6 className="mt-4 mb-3">Image Data</h6>
                                        <Table bordered responsive size="sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th width="80">Preview</th>
                                                    <th>Alt Text</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.image_data.map((img, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <img
                                                                src={img.url || img.full_size}
                                                                alt={img.alt_text || ""}
                                                                style={{ width: 50, height: 50, objectFit: "contain" }}
                                                                onError={(e) => { e.target.style.display = "none"; }}
                                                            />
                                                        </td>
                                                        <td>{img.alt_text || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </>
                                )}
                            </TabPane>

                            {/* ── Tab 3: Customization (Editable) ── */}
                            <TabPane tabId="3">
                                <Row>
                                    <Col lg={12}>
                                        <div className="alert alert-info mb-4">
                                            <i className="ri-information-line align-middle me-2"></i>
                                            <strong>Customization Setup:</strong>{" "}
                                            Select customization methods and assign specific positions to each method.
                                            Each method can have different positions with optional price adjustments.
                                        </div>
                                    </Col>

                                    {/* Step 1: Select Customization Methods */}
                                    <Col lg={12}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">
                                                    <i className="ri-contrast-2-line align-middle me-2"></i>
                                                    Step 1: Select Customization Methods
                                                </h6>
                                            </CardHeader>
                                            <CardBody>
                                                {customizationMethods.length === 0 ? (
                                                    <p className="text-muted mb-0">
                                                        No customization methods available.{" "}
                                                        <small>
                                                            Go to <strong>Products &rarr; Customization Method</strong> to create them.
                                                        </small>
                                                    </p>
                                                ) : (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {customizationMethods.map((method) => {
                                                            const mId = method._id || method.id;
                                                            const isSelected = methodPositionMappings.some(
                                                                (m) => m.methodId === mId
                                                            );
                                                            return (
                                                                <div
                                                                    key={mId}
                                                                    className={`form-check border rounded p-3 ${
                                                                        isSelected ? "border-primary bg-primary-subtle" : ""
                                                                    }`}
                                                                    style={{ minWidth: "280px" }}
                                                                >
                                                                    <Input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`method-${mId}`}
                                                                        checked={isSelected}
                                                                        onChange={() => handleMethodChange(mId)}
                                                                    />
                                                                    <Label className="form-check-label w-100" htmlFor={`method-${mId}`}>
                                                                        <div className="d-flex justify-content-between align-items-start">
                                                                            <div>
                                                                                <strong>{method.applicationMethod}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    Type: {method.applicationType}
                                                                                </small>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    Setup: A${parseFloat(method.setupCharge || 0).toFixed(2)}
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                    </Label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* Step 2: Assign Positions to Each Method */}
                                    {methodPositionMappings.length > 0 && (
                                        <Col lg={12}>
                                            <Card className="border border-success">
                                                <CardHeader className="bg-success-subtle">
                                                    <h6 className="mb-0 text-success">
                                                        <i className="ri-map-pin-line align-middle me-2"></i>
                                                        Step 2: Assign Positions to Each Method
                                                    </h6>
                                                </CardHeader>
                                                <CardBody>
                                                    {methodPositionMappings.map((mapping) => {
                                                        const method = customizationMethods.find(
                                                            (m) => (m._id || m.id) === mapping.methodId
                                                        );
                                                        if (!method) return null;
                                                        return (
                                                            <div key={mapping.methodId} className="mb-4 pb-4 border-bottom">
                                                                <h6 className="mb-3">
                                                                    <Badge color="primary" className="me-2">
                                                                        {method.applicationMethod} - {method.applicationType}
                                                                    </Badge>
                                                                    <small className="text-muted">
                                                                        ({mapping.positions.length} position
                                                                        {mapping.positions.length !== 1 ? "s" : ""} selected)
                                                                    </small>
                                                                </h6>
                                                                {customizationPositions.length === 0 ? (
                                                                    <p className="text-muted mb-0">
                                                                        No positions available.{" "}
                                                                        <small>
                                                                            Go to <strong>Products &rarr; Customization Position</strong> to create them.
                                                                        </small>
                                                                    </p>
                                                                ) : (
                                                                    <Row>
                                                                        {customizationPositions.map((position) => {
                                                                            const pId = position._id || position.id;
                                                                            const selectedPos = mapping.positions.find(
                                                                                (p) => p.positionId === pId
                                                                            );
                                                                            const isSelected = !!selectedPos;
                                                                            return (
                                                                                <Col lg={4} key={pId} className="mb-3">
                                                                                    <div
                                                                                        className={`border rounded p-3 h-100 ${
                                                                                            isSelected ? "border-success bg-success-subtle" : ""
                                                                                        }`}
                                                                                    >
                                                                                        <div className="form-check mb-2">
                                                                                            <Input
                                                                                                className="form-check-input"
                                                                                                type="checkbox"
                                                                                                id={`method-${mapping.methodId}-position-${pId}`}
                                                                                                checked={isSelected}
                                                                                                onChange={() =>
                                                                                                    handlePositionChange(mapping.methodId, pId)
                                                                                                }
                                                                                            />
                                                                                            <Label
                                                                                                className="form-check-label"
                                                                                                htmlFor={`method-${mapping.methodId}-position-${pId}`}
                                                                                            >
                                                                                                <strong>{position.positionName}</strong>
                                                                                                <br />
                                                                                                <small className="text-muted">
                                                                                                    Code: {position.positionCode}
                                                                                                </small>
                                                                                            </Label>
                                                                                        </div>
                                                                                        {isSelected && (
                                                                                            <div className="mt-2">
                                                                                                <div className="form-floating">
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        className="form-control form-control-sm"
                                                                                                        id={`method-${mapping.methodId}-pos-${pId}-price`}
                                                                                                        placeholder="0.00"
                                                                                                        step="0.01"
                                                                                                        value={selectedPos.priceAdjustment}
                                                                                                        onChange={(e) =>
                                                                                                            handlePositionPriceChange(
                                                                                                                mapping.methodId,
                                                                                                                pId,
                                                                                                                e.target.value
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                    <Label htmlFor={`method-${mapping.methodId}-pos-${pId}-price`}>
                                                                                                        Price Adjustment (A$)
                                                                                                    </Label>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </Col>
                                                                            );
                                                                        })}
                                                                    </Row>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    )}

                                    {/* Summary */}
                                    {methodPositionMappings.length > 0 && (
                                        <Col lg={12}>
                                            <Card className="border border-info">
                                                <CardBody className="bg-info-subtle">
                                                    <h6 className="text-info mb-3">
                                                        <i className="ri-checkbox-circle-line align-middle me-2"></i>
                                                        Customization Summary
                                                    </h6>
                                                    {methodPositionMappings.map((mapping) => {
                                                        const method = customizationMethods.find(
                                                            (m) => (m._id || m.id) === mapping.methodId
                                                        );
                                                        if (!method) return null;
                                                        return (
                                                            <div key={mapping.methodId} className="mb-3">
                                                                <p className="mb-2">
                                                                    <strong>
                                                                        {method.applicationMethod} - {method.applicationType}:
                                                                    </strong>
                                                                </p>
                                                                {mapping.positions.length > 0 ? (
                                                                    <ul className="mb-2">
                                                                        {mapping.positions.map((pos) => {
                                                                            const position = customizationPositions.find(
                                                                                (p) => (p._id || p.id) === pos.positionId
                                                                            );
                                                                            return (
                                                                                <li key={pos.positionId}>
                                                                                    {position?.positionName || "Unknown"}{" "}
                                                                                    {pos.priceAdjustment > 0 && (
                                                                                        <Badge color="warning" className="ms-1">
                                                                                            +A${pos.priceAdjustment.toFixed(2)}
                                                                                        </Badge>
                                                                                    )}
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-muted ms-3 mb-1">
                                                                        <small>No positions assigned yet</small>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    )}

                                    {/* Save Button */}
                                    <Col lg={12}>
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                color="success"
                                                onClick={handleSaveCustomizations}
                                                disabled={isSavingCustomization}
                                            >
                                                {isSavingCustomization ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-save-line me-1"></i>
                                                        Save Customizations
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* ── Tab 4: Variants (Colors & Sizes) ── */}
                            <TabPane tabId="4">
                                <Row>
                                    <Col lg={8}>
                                        <h6 className="mb-3">Colors ({colours.length})</h6>
                                        {colours.length > 0 ? (
                                            <Row className="g-3">
                                                {colours.map((c, i) => (
                                                    <Col xs={6} sm={4} md={3} key={i}>
                                                        <Card className="border shadow-none mb-0">
                                                            <CardBody className="p-2 text-center">
                                                                {c.image ? (
                                                                    <img
                                                                        src={c.image}
                                                                        alt={c.name}
                                                                        style={{ width: "100%", height: 80, objectFit: "contain" }}
                                                                        onError={(e) => { e.target.src = ""; e.target.style.display = "none"; }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 4 }}>
                                                                        <i className="ri-image-line text-muted fs-4"></i>
                                                                    </div>
                                                                )}
                                                                <div className="d-flex align-items-center justify-content-center gap-1 my-1">
                                                                    {c.swatch?.map((hex, j) => (
                                                                        <div
                                                                            key={j}
                                                                            title={hex}
                                                                            style={{
                                                                                width: 18,
                                                                                height: 18,
                                                                                borderRadius: "50%",
                                                                                background: hex,
                                                                                border: "1px solid #ccc",
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <small className="fw-semibold d-block text-truncate" title={c.name}>
                                                                    {c.name}
                                                                </small>
                                                                {c.appa_colours?.length > 0 && (
                                                                    <small className="text-muted d-block text-truncate" title={c.appa_colours.join(", ")}>
                                                                        {c.appa_colours.join(", ")}
                                                                    </small>
                                                                )}
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <p className="text-muted">No color options available.</p>
                                        )}
                                    </Col>
                                    <Col lg={4}>
                                        <h6 className="mb-3">Sizes</h6>
                                        {(() => {
                                            const sizeFields = details.filter((d) =>
                                                /sizing|sizes|product sizes/i.test(d.name)
                                            );
                                            return sizeFields.length > 0 ? (
                                                <Table bordered responsive size="sm">
                                                    <tbody>
                                                        {sizeFields.map((s, i) => (
                                                            <tr key={i}>
                                                                <th width="120">{s.name}</th>
                                                                <td style={{ whiteSpace: "pre-wrap" }}>
                                                                    {s.detail || "-"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted">No size information available.</p>
                                            );
                                        })()}
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* ── Tab 5: Price Tiers ── */}
                            <TabPane tabId="5">
                                {p.marginInfo && (
                                    <Alert color="info" className="mb-3">
                                        <strong>Applied Margin:</strong> {p.pricingSummary?.marginPercent ?? p.marginInfo.margin}% ({p.pricingSummary?.marginType ?? p.marginInfo.type})
                                        {p.discountInfo?.discount > 0 && (
                                            <>
                                                {" | "}
                                                <strong>Applied Discount:</strong> {p.discountInfo.discount}% ({p.discountInfo.type})
                                            </>
                                        )}
                                    </Alert>
                                )}

                                {priceGroups.length > 0 ? (
                                    priceGroups.map((pg, i) => (
                                        <Card key={i} className="border mb-3">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">
                                                    {pg.type || pg.decoration_type || `Price Group ${i + 1}`}
                                                </h6>
                                                <div className="d-flex gap-2 mt-1">
                                                    {pg.setup_cost && (
                                                        <Badge color="secondary">
                                                            Setup: A${pg.setup_cost}
                                                        </Badge>
                                                    )}
                                                    {pg.lead_time && (
                                                        <Badge color="info">{pg.lead_time}</Badge>
                                                    )}
                                                    {pg.description && (
                                                        <small className="text-muted">{pg.description}</small>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardBody>
                                                {pg.base_price?.price_breaks?.length > 0 ? (
                                                    <Table bordered responsive size="sm" className="mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Quantity</th>
                                                                <th>Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pg.base_price.price_breaks.map((pb, j) => (
                                                                <tr key={j}>
                                                                    <td>{pb.quantity ?? pb.qty ?? "-"}+</td>
                                                                    <td>A${typeof pb.price === "number" ? pb.price.toFixed(2) : pb.price}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-muted mb-0">No price breaks available.</p>
                                                )}

                                                {/* Decoration additions */}
                                                {pg.additions?.length > 0 && (
                                                    <>
                                                        <h6 className="mt-3 mb-2">Decoration Additions</h6>
                                                        {pg.additions.map((add, k) => (
                                                            <div key={k} className="mb-2 p-2 bg-light rounded">
                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                    <strong>{add.description || add.type || `Addition ${k + 1}`}</strong>
                                                                    {add.setup_cost && (
                                                                        <Badge color="secondary" className="ms-1">
                                                                            Setup: A${add.setup_cost}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {add.price_breaks?.length > 0 && (
                                                                    <Table bordered size="sm" className="mb-0 bg-white">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Qty</th>
                                                                                <th>Price</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {add.price_breaks.map((ab, l) => (
                                                                                <tr key={l}>
                                                                                    <td>{ab.quantity ?? ab.qty ?? "-"}+</td>
                                                                                    <td>A${typeof ab.price === "number" ? ab.price.toFixed(2) : ab.price}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </CardBody>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-muted mb-0">No pricing information available.</p>
                                )}
                            </TabPane>

                            {/* ── Tab 6: Delivery Options ── */}
                            <TabPane tabId="6">
                                {(() => {
                                    const leadTimes = priceGroups
                                        .map((pg, i) => ({
                                            group: pg.type || pg.decoration_type || `Group ${i + 1}`,
                                            leadTime: pg.lead_time,
                                        }))
                                        .filter((lt) => lt.leadTime);

                                    return leadTimes.length > 0 ? (
                                        <Table bordered responsive className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Price Group</th>
                                                    <th>Lead Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leadTimes.map((lt, i) => (
                                                    <tr key={i}>
                                                        <td>{lt.group}</td>
                                                        <td>{lt.leadTime}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <p className="text-muted mb-0">
                                    No delivery information available from PromoData.
                                        </p>
                                    );
                                })()}
                            </TabPane>

                            {/* ── Tab 7: Special Tags (Editable) ── */}
                            <TabPane tabId="7">
                                <Row>
                                    <Col lg={12}>
                                        <div className="alert alert-info mb-4">
                                            <i className="ri-information-line align-middle me-2"></i>
                                            <strong>Special Tags:</strong> These tags are for visual display on the product page (e.g., Trending, Australia Made).
                                            Manual tags added here will be combined with automated tags based on category and curation rules.
                                        </div>
                                    </Col>
                                    <Col lg={12}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Manage Special Tags</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <Label>Product Tags (Press Enter to add)</Label>
                                                        <div className="d-flex gap-2 mb-3">
                                                            <Input
                                                                type="text"
                                                                placeholder="Add a tag..."
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        const val = e.target.value.trim();
                                                                        if (val && !manualTags.includes(val)) {
                                                                            setManualTags([...manualTags, val]);
                                                                            e.target.value = "";
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                color="primary"
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.previousElementSibling;
                                                                    const val = input.value.trim();
                                                                    if (val && !manualTags.includes(val)) {
                                                                        setManualTags([...manualTags, val]);
                                                                        input.value = "";
                                                                    }
                                                                }}
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {manualTags.map((tag, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    color="primary"
                                                                    className="p-2 d-flex align-items-center gap-2"
                                                                >
                                                                    {tag}
                                                                    <i
                                                                        className="ri-close-line cursor-pointer"
                                                                        onClick={() => setManualTags(manualTags.filter((_, i) => i !== idx))}
                                                                    ></i>
                                                                </Badge>
                                                            ))}
                                                            {manualTags.length === 0 && (
                                                                <span className="text-muted">No manual tags added yet.</span>
                                                            )}
                                                        </div>
                                                    </Col>

                                                    {/* Preview of current aggregated tags */}
                                                    <Col md={12}>
                                                        <hr />
                                                        <h6>Current Combined Tags (Visible on Frontend)</h6>
                                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                                            {(p.specialTags || []).map((tag, idx) => (
                                                                <Badge key={idx} color="soft-success" className="text-success p-2">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                            {(p.specialTags || []).length === 0 && (
                                                                <span className="text-muted">No tags currently applied.</span>
                                                            )}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col lg={12}>
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                color="success"
                                                onClick={handleSaveSpecialTags}
                                                disabled={isSavingSpecialTags}
                                            >
                                                {isSavingSpecialTags ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-save-line me-1"></i>
                                                        Save Special Tags
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </TabPane>
                        </TabContent>

                    </CardBody>
                </Card>
            </>
        );
    };

    // ══════════════════════════════════════════════════════════
    // LIST VIEW
    // ══════════════════════════════════════════════════════════
    const renderListView = () => (
        <>
            <Card>
                <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="card-title mb-0">
                        Product Master{" "}
                        <small className="text-muted fw-normal">({totalRows} products)</small>
                    </h5>
                    <ExportButtons
                        data={data}
                        columns={exportColumns}
                        fileName="products"
                        fetchAll={fetchAllForExport}
                    />
                </CardHeader>
                <CardBody>
                    <Row className="g-3 mb-3">
                        <Col md={4}>
                            <Input
                                type="text"
                                placeholder="Search by name, code, or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Select
                                isClearable
                                placeholder="All Suppliers"
                                options={suppliers.map((s) => ({
                                    value: s.code,
                                    label: s.name,
                                }))}
                                value={supplierFilter ? suppliers.map((s) => ({ value: s.code, label: s.name })).find((o) => o.value === supplierFilter) || null : null}
                                onChange={(opt) => {
                                    setSupplierFilter(opt ? opt.value : "");
                                    setPageNo(1);
                                }}
                                onMenuOpen={handleSupplierMenuOpen}
                                onInputChange={(val) => setSupplierSearch(val)}
                                filterOption={null}
                            />
                        </Col>
                        <Col md={3}>
                            <Select
                                isClearable
                                placeholder="All Categories"
                                options={categories.map((c) => ({
                                    value: c._promodataTypeId || c.id || c._id,
                                    label: c.name,
                                }))}
                                value={categoryFilter ? categories.map((c) => ({ value: c._promodataTypeId || c.id || c._id, label: c.name })).find((o) => o.value === categoryFilter) || null : null}
                                onChange={(opt) => {
                                    setCategoryFilter(opt ? opt.value : "");
                                    setPageNo(1);
                                }}
                                onMenuOpen={handleCategoryMenuOpen}
                                onInputChange={(val) => setCategorySearch(val)}
                                filterOption={null}
                            />
                        </Col>
                    </Row>
                    {isLoading && <LoadingOverlay />}
                    <DataTable
                        columns={columns}
                        data={data}
                        customStyles={tableCustomStyles}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationDefaultPage={pageNo}
                        paginationComponentOptions={{
                            noRowsPerPage: false,
                            rangeSeparatorText: "of",
                            selectAllRowsItem: false,
                            selectAllRowsItemText: "All",
                        }}
                        onChangePage={(page) => {
                            console.log("DataTable onChangePage called with:", page);
                            setPageNo(page);
                        }}
                        paginationPerPage={perPage}
                        paginationRowsPerPageOptions={[50, 100, 200, 300]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        highlightOnHover
                        striped
                        responsive
                        dense
                    />
                </CardBody>
            </Card>
        </>
    );

    // ══════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Product Master"
                        pageTitle="Products"
                    />
                    {updateForm ? renderDetailView() : renderListView()}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ProductMaster;
