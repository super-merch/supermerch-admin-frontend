import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Input,
  Label,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Container,
  Row
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import PageHeader from "../../Components/Common/PageHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import config from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";
import AsyncSelect from "react-select/async";
import BrandPriceTierForm from "../../Components/Common/BrandPriceTierForm";


const apiUrl = config.api.API_URL;
const MAIN_CATEGORY_SEARCH_STORAGE_KEY = "supermerch-admin-main-category-search";

const MainCategory = () => {
  const { adminData } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();

  const isAddMode = location.pathname.endsWith("/add");
  const isEditMode = location.pathname.includes("/edit/");
  const isFormMode = isAddMode || isEditMode;
  const editingId = routeId || "";
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [searchInput, setSearchInput] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(MAIN_CATEGORY_SEARCH_STORAGE_KEY) || "";
  });

  const initialState = {
    name: "",
    slug: "",
    shortDescription: "",
    image: "",
    icon: "",
    sortOrder: 0,
    isActive: true,
    navGroup: "",
    artworkSource: "promodata",
    customizationMethodIds: [],
    allowedTypeGroupIds: [],
    menuColumnCount: 4,
    themes: "",
    compliances: "",
    tags: "",
    nameKeywords: "",
    firstTierMargin: 0,
    priceTiers: [],
  };

  // File upload related states
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedIconFile, setSelectedIconFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [iconPreview, setIconPreview] = useState("");
  const [showImageInput, setShowImageInput] = useState(true);
  const [showIconInput, setShowIconInput] = useState(true);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [iconRemoved, setIconRemoved] = useState(false);
  const imageRef = useRef(null);
  
  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);
  const [customizationMethodOptions, setCustomizationMethodOptions] = useState([]);
  const [selectedCustomizationMethods, setSelectedCustomizationMethods] = useState([]);
  const [isSelectingAllMethods, setIsSelectingAllMethods] = useState(false);
  const methodSearchDebounceRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [data, setData] = useState([]);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderRows, setReorderRows] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

  const {currentPagePermissions} = useContext(MenuContext);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      minWidth: "80px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      minWidth: "150px",
    },
    {
      name: "Slug",
      selector: (row) => <p className="text-wrap">{row.slug}</p>,
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Nav Group",
      selector: (row) => <p className="text-wrap">{row.navGroup || "—"}</p>,
      minWidth: "120px",
    },
    {
      name: "Artwork Source",
      selector: (row) => <p className="text-wrap">{row.artworkSource || "promodata"}</p>,
      minWidth: "140px",
    },
    {
      name: "Customization Methods",
      selector: (row) => {
        if (row.artworkSource !== "supermerch") {
          return <p className="text-muted mb-0">—</p>;
        }

        const methods = Array.isArray(row.customizationMethodIds)
          ? row.customizationMethodIds
          : [];

        if (!methods.length) {
          return <p className="text-muted mb-0">None</p>;
        }

        const labels = methods.map((m) => {
          if (!m) return "";
          if (typeof m === "string") return m;
          return [m.applicationMethod, m.applicationType].filter(Boolean).join(" - ");
        }).filter(Boolean);

        const displayText = labels.join(", ");
        return (
          <div
            className="text-truncate"
            style={{ maxWidth: "260px" }}
            title={displayText}
          >
            {displayText}
          </div>
        );
      },
      minWidth: "230px",
    },
    {
      name: "Sort Order",
      selector: (row) => <p className="text-wrap">{row.sortOrder}</p>,
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Actions",
      minWidth: "120px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <div className="edit d-flex gap-2">
            {currentPagePermissions?.edit !== false && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleTog_edit(row._id)}
              >
                Edit
              </button>
            )}
            {currentPagePermissions?.delete !== false && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                onClick={() => tog_delete(row._id)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Slug", key: "slug" },
    { header: "Sort Order", key: "sortOrder" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const response = await axios.get('/api/listbyparams/main-categories', {
        params: { page: 1, limit: 10000, isActive: filter },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Export fetch error:", error);
      return [];
    }
  };

  const fetchMainCategoriesMaster = useCallback(async () => {
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
      const response = await axios.get('/api/listbyparams/main-categories', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setData(response.data.data);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    if (!isFormMode) {
      fetchMainCategoriesMaster();
    }
  }, [fetchMainCategoriesMaster, isFormMode]);

  useEffect(() => {
    if (!isReorderMode) {
      setReorderRows(data);
    }
  }, [data, isReorderMode]);

  useEffect(() => () => {
    if (methodSearchDebounceRef.current) {
      clearTimeout(methodSearchDebounceRef.current);
    }
  }, []);

  const mapMethodOption = (method) => {
    const id = String(method?._id || method?.id || "");
    if (!id) return null;

    const methodName = method?.applicationMethod || "Method";
    const methodType = method?.applicationType || "";

    return {
      value: id,
      label: methodType ? `${methodName} (${methodType})` : methodName,
      raw: method,
    };
  };

  const fetchCustomizationMethods = useCallback(async (search = "") => {
    try {
      const response = await axios.get("/api/listbyparams/customization-methods", {
        params: {
          page: 1,
          limit: 50,
          isActive: true,
          ...(search ? { search } : {}),
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const list = response.data?.success ? (response.data.data || []) : [];
      const options = list.map(mapMethodOption).filter(Boolean);
      setCustomizationMethodOptions(options);
      return options;
    } catch (err) {
      console.error("Error fetching customization methods:", err);
      return [];
    }
  }, []);

  const loadCustomizationMethodOptions = (inputValue, callback) => {
    if (methodSearchDebounceRef.current) {
      clearTimeout(methodSearchDebounceRef.current);
    }

    methodSearchDebounceRef.current = setTimeout(async () => {
      const options = await fetchCustomizationMethods(inputValue || "");
      callback(options);
    }, 400);
  };

  const fetchCustomizationMethodsByIds = useCallback(async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];

    try {
      const requests = ids.map((id) =>
        axios.get(`/api/customization-methods/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
      );

      const responses = await Promise.all(requests);
      return responses
        .map((res) => (res.data?.success ? res.data?.data : null))
        .filter(Boolean)
        .map(mapMethodOption)
        .filter(Boolean);
    } catch (err) {
      console.error("Error fetching selected customization methods:", err);
      return [];
    }
  }, []);

  const loadMainCategoryForEdit = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/main-categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const mainCategory = response.data.data;
        const generatedSlug = mainCategory.name
          ? mainCategory.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : mainCategory.slug || "";

        setValues({
          name: mainCategory.name || "",
          slug: generatedSlug,
          shortDescription: mainCategory.shortDescription || "",
          image: mainCategory.image || "",
          icon: mainCategory.icon || "",
          sortOrder: mainCategory.sortOrder || 0,
          isActive: mainCategory.isActive,
          navGroup: mainCategory.navGroup || "",
          artworkSource: mainCategory.artworkSource || "promodata",
          customizationMethodIds: (mainCategory.customizationMethodIds || []).map((m) =>
            String(m?._id || m?.id || m)
          ).filter(Boolean),
          allowedTypeGroupIds: mainCategory.allowedTypeGroupIds || [],
          menuColumnCount: Number(mainCategory.menuColumnCount || 4),
          themes: (mainCategory.productMatchRules?.themes || []).join(", "),
          compliances: (mainCategory.productMatchRules?.compliances || []).join(", "),
          tags: (mainCategory.productMatchRules?.tags || []).join(", "),
          nameKeywords: (mainCategory.productMatchRules?.nameKeywords || []).join(", "),
          firstTierMargin: mainCategory.firstTierMargin || 0,
          priceTiers: mainCategory.priceTiers || [],
        });

        const methodsFromPayload = (mainCategory.customizationMethodIds || [])
          .map(mapMethodOption)
          .filter(Boolean);

        if (methodsFromPayload.length > 0) {
          setSelectedCustomizationMethods(methodsFromPayload);
        } else {
          const methodIds = (mainCategory.customizationMethodIds || []).map((m) => String(m));
          const selected = await fetchCustomizationMethodsByIds(methodIds);
          setSelectedCustomizationMethods(selected);
        }

        setSelectedImageFile(null);
        setSelectedIconFile(null);
        setImagePreview("");
        setIconPreview("");
        setShowImageInput(true);
        setShowIconInput(true);
        setImageRemoved(false);
        setIconRemoved(false);
      } else {
        toast.error("Failed to fetch main category details");
        navigate("/main-category");
      }
    } catch (err) {
      console.log(err);
      navigate("/main-category");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAddMode) {
      setValues(initialState);
      setFormErrors({});
      setIsSubmit(false);
      setSelectedImageFile(null);
      setSelectedIconFile(null);
      setImagePreview("");
      setIconPreview("");
      setShowImageInput(true);
      setShowIconInput(true);
      setImageRemoved(false);
      setIconRemoved(false);
      setSelectedCustomizationMethods([]);
      return;
    }

    if (isEditMode && editingId) {
      loadMainCategoryForEdit(editingId);
    }
  }, [isAddMode, isEditMode, editingId, loadMainCategoryForEdit]);

  useEffect(() => {
    if (!isFormMode) return;
    fetchCustomizationMethods("");
  }, [isFormMode, fetchCustomizationMethods]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setQuery(searchInput);
      setPageNo(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (searchInput) {
      localStorage.setItem(MAIN_CATEGORY_SEARCH_STORAGE_KEY, searchInput);
    } else {
      localStorage.removeItem(MAIN_CATEGORY_SEARCH_STORAGE_KEY);
    }
  }, [searchInput]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (values.artworkSource === "supermerch" && (!Array.isArray(values.customizationMethodIds) || values.customizationMethodIds.length === 0)) {
      errors.customizationMethodIds = "Select at least one customization method";
    }
    if (
      values.sortOrder !== "" &&
      values.sortOrder !== null &&
      values.sortOrder !== undefined &&
      (isNaN(values.sortOrder) || Number(values.sortOrder) < 0)
    ) {
      errors.sortOrder = "Sort order must be a non-negative number";
    }
    return errors;
  };

  const handleClick = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('slug', values.slug);
      formData.append('shortDescription', values.shortDescription);
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      formData.append('navGroup', values.navGroup || '');
      formData.append('artworkSource', values.artworkSource || 'promodata');
      formData.append('customizationMethodIds', JSON.stringify(values.customizationMethodIds || []));
      formData.append('allowedTypeGroupIds', JSON.stringify(values.allowedTypeGroupIds || []));
      formData.append('menuColumnCount', values.menuColumnCount || 4);
      formData.append('themes', values.themes || '');
      formData.append('compliances', values.compliances || '');
      formData.append('tags', values.tags || '');
      formData.append('nameKeywords', values.nameKeywords || '');
      formData.append('firstTierMargin', values.firstTierMargin || 0);
      formData.append('priceTiers', JSON.stringify(values.priceTiers || []));

      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      if (selectedIconFile) {
        formData.append('icon', selectedIconFile);
      }
      
      try {
        const response = await axios.post(
          `/api/main-categories`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Main Category Added Successfully");
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setSelectedIconFile(null);
          setImagePreview("");
          setIconPreview("");
          setShowImageInput(true);
          setShowIconInput(true);
          setImageRemoved(false);
          setIconRemoved(false);
          navigate("/main-category");
        } else {
          toast.error(response.data.message || "Cannot add Main Category");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding main category");
      }
      setIsLoading(false);
    }
  };

  const handleUpdate = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('slug', values.slug);
      formData.append('shortDescription', values.shortDescription);
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      formData.append('navGroup', values.navGroup || '');
      formData.append('artworkSource', values.artworkSource || 'promodata');
      formData.append('customizationMethodIds', JSON.stringify(values.customizationMethodIds || []));
      formData.append('allowedTypeGroupIds', JSON.stringify(values.allowedTypeGroupIds || []));
      formData.append('menuColumnCount', values.menuColumnCount || 4);
      formData.append('themes', values.themes || '');
      formData.append('compliances', values.compliances || '');
      formData.append('tags', values.tags || '');
      formData.append('nameKeywords', values.nameKeywords || '');
      formData.append('firstTierMargin', values.firstTierMargin || 0);
      formData.append('priceTiers', JSON.stringify(values.priceTiers || []));

      // Handle image removal
      if (imageRemoved) {
        formData.append('removeImage', 'true');
      }
      
      // Handle icon removal
      if (iconRemoved) {
        formData.append('removeIcon', 'true');
      }
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      if (selectedIconFile) {
        formData.append('icon', selectedIconFile);
      }

      try {
        const response = await axios.put(
          `/api/main-categories/${editingId}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success("Main Category Updated Successfully");
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setSelectedIconFile(null);
          setImagePreview("");
          setIconPreview("");
          setShowImageInput(true);
          setShowIconInput(true);
          setImageRemoved(false);
          setIconRemoved(false);
          navigate("/main-category");
        }
        else {
          toast.error(response.data.message || "Cannot update Main Category");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating main category");
      }
      setIsLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
    setSelectedImageFile(null);
    setSelectedIconFile(null);
    setImagePreview("");
    setIconPreview("");
    setShowImageInput(true);
    setShowIconInput(true);
    setImageRemoved(false);
    setIconRemoved(false);
    setSelectedCustomizationMethods([]);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
    navigate("/main-category");
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/main-categories/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Main Category Deleted Successfully");
            fetchMainCategoriesMaster();
        } else {
            if(response.status === 409){
                setReferenceData(response.data);
                setReferenceModal(true);
            }else{

                toast.error(response.data.message || "Cannot delete Main Category");
            }
        }
        setIsDeleteLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle reference error
            setReferenceData(error.response.data);
            setReferenceModal(true);
        } else {
        toast.error("Failed to delete main category. Please try again.");
        }
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = (_id) => {
    navigate(`/main-category/edit/${_id}`);
  };
  

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const handlePriceTiersChange = (priceTiersData) => {
    setValues((prev) => ({ ...prev, ...priceTiersData }));
  };

  const isApparelNavGroup =
    values.navGroup === "clothing" || values.navGroup === "headwear";

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if(name==="phone"){
        newValue = newValue.replace(/\D/g, ''); // Remove non-numeric characters
    }
    
    // Auto-generate slug based on name
    if (name === "name") {
      const generatedSlug = value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setValues({ ...values, [name]: newValue, slug: generatedSlug });
    } else if (name === "artworkSource") {
      const nextValues = { ...values, [name]: newValue };
      if (newValue !== "supermerch") {
        nextValues.customizationMethodIds = [];
        setSelectedCustomizationMethods([]);
      }
      setValues(nextValues);
    } else {
      setValues({ ...values, [name]: newValue });
    }
  };

  const handleCustomizationMethodsChange = (selected) => {
    const nextSelected = Array.isArray(selected) ? selected : [];
    setSelectedCustomizationMethods(nextSelected);
    setValues((prev) => ({
      ...prev,
      customizationMethodIds: nextSelected.map((opt) => opt.value),
    }));
  };

  const handleSelectAllCustomizationMethods = async () => {
    setIsSelectingAllMethods(true);
    try {
      const response = await axios.get("/api/listbyparams/customization-methods", {
        params: {
          page: 1,
          limit: 1000,
          isActive: true,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const list = response.data?.success ? (response.data.data || []) : [];
      const allOptions = list.map(mapMethodOption).filter(Boolean);
      setCustomizationMethodOptions(allOptions);
      setSelectedCustomizationMethods(allOptions);
      setValues((prev) => ({
        ...prev,
        customizationMethodIds: allOptions.map((opt) => opt.value),
      }));
    } catch (err) {
      console.error("Error selecting all customization methods:", err);
      toast.error("Failed to select all customization methods");
    } finally {
      setIsSelectingAllMethods(false);
    }
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const handleStartReorder = () => {
    setReorderRows(Array.isArray(data) ? [...data] : []);
    setDraggedIndex(null);
    setIsReorderMode(true);
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
    setDraggedIndex(null);
    setReorderRows([]);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDrop = (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    setReorderRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleSaveReorder = async () => {
    if (!Array.isArray(reorderRows) || reorderRows.length === 0) {
      setIsReorderMode(false);
      return;
    }

    setIsSavingOrder(true);
    try {
      const baseSortOrder = reorderRows.reduce((min, row) => {
        const current = Number(row?.sortOrder);
        if (!Number.isFinite(current)) return min;
        return min === null ? current : Math.min(min, current);
      }, null) ?? 1;

      await Promise.all(
        reorderRows.map((row, index) =>
          axios.put(
            `/api/main-categories/${row._id}`,
            { sortOrder: baseSortOrder + index },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          ),
        ),
      );

      toast.success("Main category order updated");
      setIsReorderMode(false);
      setDraggedIndex(null);
      await fetchMainCategoriesMaster();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setIsSavingOrder(false);
    }
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

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 500KB)
      const maxSize = 500 * 1024; // 500KB in bytes
      if (file.size > maxSize) {
        alert("Image file size must be less than 500KB");
        e.target.value = ""; // Clear the input
        return;
      }
      setSelectedImageFile(file);
      setImageRemoved(false); // Reset image removed flag when new file is selected
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 500KB)
      const maxSize = 500 * 1024; // 500KB in bytes
      if (file.size > maxSize) {
        alert("Icon file size must be less than 500KB");
        e.target.value = ""; // Clear the input
        return;
      }
      setSelectedIconFile(file);
      setIconRemoved(false); // Reset icon removed flag when new file is selected
      const reader = new FileReader();
      reader.onload = (e) => setIconPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setValues({ ...values, image: "" });
    setSelectedImageFile(null);
    setImagePreview("");
    setShowImageInput(true);
    setImageRemoved(true);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleRemoveIcon = () => {
    setValues({ ...values, icon: "" });
    setSelectedIconFile(null);
    setIconPreview("");
    setShowIconInput(true);
    setIconRemoved(true);
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Row>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.name}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="slug"
                          value={values.slug}
                          onChange={handleChange}
                          disabled
                          readOnly
                        />
                        <label className="form-label">
                          Slug <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.slug}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          required
                          name="sortOrder"
                          value={values.sortOrder}
                          onChange={handleChange}
                          min="0"
                        />
                        <label className="form-label">
                          Sort Order <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.sortOrder}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-control"
                          name="navGroup"
                          value={values.navGroup}
                          onChange={handleChange}
                        >
                          <option value="">-- None --</option>
                          <option value="promotional">Promotional</option>
                          <option value="clothing">Clothing</option>
                          <option value="headwear">Headwear</option>
                        </select>
                        <label className="form-label">Nav Group</label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-control"
                          name="artworkSource"
                          value={values.artworkSource}
                          onChange={handleChange}
                        >
                          <option value="promodata">Promodata</option>
                          <option value="supermerch">Supermerch</option>
                        </select>
                        <label className="form-label">
                          Artwork Source <span className="text-danger"> *</span>
                        </label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          name="menuColumnCount"
                          value={values.menuColumnCount}
                          onChange={handleChange}
                          min="1"
                          max="8"
                        />
                        <label className="form-label">
                          Mega Menu Columns
                        </label>
                      </div>
                    </Col>
                    {values.artworkSource === "supermerch" && (
                      <Col lg={6}>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="form-label mb-0">
                              Customization Methods <span className="text-danger"> *</span>
                            </Label>
                            <button
                              type="button"
                              className="btn btn-sm btn-soft-primary"
                              onClick={handleSelectAllCustomizationMethods}
                              disabled={isSelectingAllMethods}
                            >
                              {isSelectingAllMethods ? "Selecting..." : "Select All"}
                            </button>
                          </div>
                          <AsyncSelect
                            isMulti
                            cacheOptions
                            defaultOptions={customizationMethodOptions}
                            value={selectedCustomizationMethods}
                            loadOptions={loadCustomizationMethodOptions}
                            onChange={handleCustomizationMethodsChange}
                            placeholder="Search and select customization methods..."
                            noOptionsMessage={() => "No methods found"}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                            menuPortalTarget={document.body}
                          />
                          {isSubmit && values.artworkSource === "supermerch" && values.customizationMethodIds.length === 0 && (
                            <p className="text-danger mt-1">{formErrors.customizationMethodIds || "Select at least one customization method"}</p>
                          )}
                        </div>
                      </Col>
                    )}
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="mb-3">
                        <Label className="form-label">
                          Allowed Promodata Type Groups
                          <small className="text-muted ms-2">
                            (restricts keyword matching to these product types only — auto-inferred from Nav Group if left empty)
                          </small>
                        </Label>
                        <div className="d-flex flex-wrap gap-2">
                          {[
                            { id: "PA", label: "Bags" },
                            { id: "PB", label: "Bottoms" },
                            { id: "PC", label: "Clothing Accessories" },
                            { id: "PD", label: "Confectionery" },
                            { id: "PE", label: "Drinkware" },
                            { id: "PF", label: "Exhibitions & Events" },
                            { id: "PG", label: "Footwear" },
                            { id: "PH", label: "Fun & Games" },
                            { id: "PI", label: "Glassware" },
                            { id: "PJ", label: "Golf" },
                            { id: "PK", label: "Headwear" },
                            { id: "PL", label: "Health & Personal" },
                            { id: "PM", label: "Home & Living" },
                            { id: "PN", label: "Jackets" },
                            { id: "PO", label: "Jumpers" },
                            { id: "PP", label: "Keyrings & Tools" },
                            { id: "PQ", label: "Leisure & Outdoors" },
                            { id: "PR", label: "Office & Business" },
                            { id: "PS", label: "Phone & Technology" },
                            { id: "PT", label: "Print" },
                            { id: "PU", label: "Shirts" },
                            { id: "PV", label: "Sports Uniforms" },
                            { id: "PW", label: "Uniforms" },
                            { id: "PX", label: "Workwear" },
                            { id: "PY", label: "Writing" },
                          ].map((tg) => (
                            <label key={tg.id} className="d-flex align-items-center gap-1 border rounded px-2 py-1" style={{ cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={(values.allowedTypeGroupIds || []).includes(tg.id)}
                                onChange={(e) => {
                                  const current = values.allowedTypeGroupIds || [];
                                  const next = e.target.checked
                                    ? [...current, tg.id]
                                    : current.filter((id) => id !== tg.id);
                                  setValues({ ...values, allowedTypeGroupIds: next });
                                }}
                              />
                              <span className="small">{tg.label} ({tg.id})</span>
                            </label>
                          ))}
                        </div>
                        {values.navGroup && (values.allowedTypeGroupIds || []).length === 0 && (
                          <small className="text-info mt-1 d-block">
                            Auto-scoped to "{values.navGroup}" products via Nav Group.
                          </small>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="themes"
                          value={values.themes}
                          onChange={handleChange}
                          placeholder="healthcare, medical"
                        />
                        <label className="form-label">Auto-match Themes (comma separated)</label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="compliances"
                          value={values.compliances}
                          onChange={handleChange}
                          placeholder="TGA, ISO"
                        />
                        <label className="form-label">Auto-match Compliance (comma separated)</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="tags"
                          value={values.tags}
                          onChange={handleChange}
                          placeholder="healthwear, scrubs"
                        />
                        <label className="form-label">Auto-match Product Tags (comma separated)</label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="nameKeywords"
                          value={values.nameKeywords}
                          onChange={handleChange}
                          placeholder="nurse, medical, hospital"
                        />
                        <label className="form-label">Auto-match Name Keywords (comma separated)</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="shortDescription"
                          value={values.shortDescription}
                          onChange={handleChange}
                          style={{ height: "100px" }}
                        />
                        <label className="form-label">Short Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Image <span className="text-muted"> (Max 500KB)</span></Label>
                        
                        <div className="d-flex flex-column">
                          {values.image && !selectedImageFile && !imageRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.image}`}
                                alt="Current Image"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ms-2"
                                onClick={handleRemoveImage}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {imageRemoved && !selectedImageFile && (
                            <div className="mb-2">
                              <span className="text-muted">Image will be removed when you save</span>
                            </div>
                          )}
                          {imagePreview && selectedImageFile && (
                            <div className="mb-2">
                              <img
                                src={imagePreview}
                                alt="Image Preview"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          {showImageInput && (
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              ref={imageRef}
                            />
                          )}
                        </div>
                        {isSubmit && formErrors.image && (
                          <p className="text-danger">{formErrors.image}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Icon</Label>
                        <div className="d-flex flex-column">
                          {values.icon && !selectedIconFile && !iconRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.icon}`}
                                alt="Current Icon"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ms-2"
                                onClick={handleRemoveIcon}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {iconRemoved && !selectedIconFile && (
                            <div className="mb-2">
                              <span className="text-muted">Icon will be removed when you save</span>
                            </div>
                          )}
                          {iconPreview && selectedIconFile && (
                            <div className="mb-2">
                              <img
                                src={iconPreview}
                                alt="Icon Preview"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          {showIconInput && (
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleIconFileChange}
                            />
                          )}
                        </div>
                        {isSubmit && formErrors.icon && (
                          <p className="text-danger">{formErrors.icon}</p>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {isApparelNavGroup && (
                    <Row className="mt-4">
                      <Col lg={12}>
                        <BrandPriceTierForm
                          values={values}
                          onChange={handlePriceTiersChange}
                          isSubmit={isSubmit}
                          formErrors={formErrors}
                          entityLabel="category"
                        />
                      </Col>
                    </Row>
                  )}
                  
                  <div className="mt-3">
                    <Row>
                      <Col lg={2}>
                        <div className="form-check mb-2">
                          <Input
                            type="checkbox"
                            name="isActive"
                            value={values.isActive}
                            onChange={handlecheck}
                            checked={values.isActive}
                          />
                          <Label className="form-check-label">
                            Is Active
                          </Label>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <Col lg={12}>
                    <FormsFooter
                      handleSubmit={isEditMode ? handleUpdate : handleClick}
                      handleSubmitCancel={handleCancel}
                    />
                  </Col>
                </Row>
              </Form>
            </div>
          </CardBody>
        </Card>
      </Col>
    </CardBody>
  );
  
  const handleList = () => {
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
    setSelectedImageFile(null);
    setSelectedIconFile(null);
    setImagePreview("");
    setIconPreview("");
    setShowImageInput(true);
    setShowIconInput(true);
    setImageRemoved(false);
    setIconRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
    navigate("/main-category");
  }

  document.title = `Main Category Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Main Category" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <PageHeader
                    formName="Main Category"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={() => handleList()}
                    openAddForm={() => navigate("/main-category/add")}
                    setQuery={setSearchInput}
                    searchValue={searchInput}
                    initialState={initialState}
                    setValues={setValues}
                    updateForm={isEditMode}
                    showForm={isFormMode}
                    showAddButton={currentPagePermissions?.write !== false}
                    data={data}
                    exportColumns={exportColumns}
                    fileName="main_categories"
                    fetchAllForExport={fetchAllForExport}
                  />
                </CardHeader>

                {isFormMode && renderForm()}

                {!isFormMode && <CardBody>
                  <div className="d-flex justify-content-end gap-2 mb-3">
                    {!isReorderMode ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleStartReorder}
                        disabled={loading || !Array.isArray(data) || data.length < 2}
                      >
                        Drag Sort
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={handleSaveReorder}
                          disabled={isSavingOrder}
                        >
                          {isSavingOrder ? "Saving..." : "Save Order"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={handleCancelReorder}
                          disabled={isSavingOrder}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                  {isReorderMode ? (
                    <div className="border rounded p-3">
                      <p className="text-muted mb-3">
                        Drag rows to reorder, then click <strong>Save Order</strong>.
                      </p>
                      <div className="d-flex flex-column gap-2">
                        {reorderRows.map((row, index) => (
                          <div
                            key={row._id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(index)}
                            className="d-flex align-items-center justify-content-between border rounded px-3 py-2 bg-white"
                            style={{ cursor: "move" }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted">::</span>
                              <span>{row.name}</span>
                            </div>
                            <small className="text-muted">Current sort: {row.sortOrder}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
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
                  )}
                </CardBody>}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />

      <ReferenceErrorModal
        show={referenceModal}
        onClose={handleReferenceModalClose}
        data={referenceData}
      />
    </React.Fragment>
  );
};

export default MainCategory;
