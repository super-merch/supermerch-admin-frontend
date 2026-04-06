import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from "react";
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
} from "reactstrap";
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
import BrandPriceTierForm from "../../Components/Common/BrandPriceTierForm";
import config from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const apiUrl = config.api.API_URL;

const Brand = () => {
    const { adminData } = useContext(AuthContext);
    // Basic states
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);
    const [_id, set_Id] = useState("");

    const initialState = {
        name: "",
        slug: "",
        logo: "",
        sizeGuide: "",
        description: "",
        website: "",
        isActive: true,
        firstTierMargin: 0,
        priceTiers: [],
    };

    // File upload related states
    const [selectedFile, setSelectedFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [showFileInput, setShowFileInput] = useState(true);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const imageRef = useRef(null);

    const [selectedSizeGuide, setSelectedSizeGuide] = useState(null);
    const [sizeGuideRemoved, setSizeGuideRemoved] = useState(false);
    const sizeGuideRef = useRef(null);

    const [remove_id, setRemove_id] = useState("");
    const [query, setQuery] = useState("");
    const [values, setValues] = useState(initialState);

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

    const { currentPagePermissions } = useContext(MenuContext);

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
            name: "Website",
            selector: (row) => (
                <p className="text-wrap">
                    {row.website ? (
                        <a
                            href={row.website}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {row.website}
                        </a>
                    ) : (
                        "-"
                    )}
                </p>
            ),
            sortable: true,
            minWidth: "200px",
        },
    ];

    const exportColumns = [
        { header: "Name", key: "name" },
        { header: "Slug", key: "slug" },
        { header: "Website", key: "website" },
        { header: "Active", key: "isActive" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.get("/api/listbyparams/brands", {
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

    const fetchBrandMaster = useCallback(async () => {
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
            const response = await axios.get("/api/listbyparams/brands", {
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
            console.error("Error fetching brands:", error);
            setData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query, filter]);

    useEffect(() => {
        fetchBrandMaster();
    }, [fetchBrandMaster]);

    const validate = (values) => {
        const errors = {};
        if (!values.name) errors.name = "Name is required";
        if (
            values.website &&
            !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(values.website)
        ) {
            errors.website =
                "Website must be a valid URL starting with http:// or https://";
        }
        return errors;
    };

    const handleClick = async (e) => {
        e.preventDefault();
        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);
        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("slug", values.slug);
            formData.append("description", values.description || "");
            formData.append("website", values.website || "");
            formData.append("isActive", values.isActive);
            formData.append("firstTierMargin", values.firstTierMargin || 0);
            
            // Add price tiers if they exist
            if (values.priceTiers && values.priceTiers.length > 0) {
                formData.append("priceTiers", JSON.stringify(values.priceTiers));
            }

            if (selectedFile) {
                formData.append("logo", selectedFile);
            }

            if (selectedSizeGuide) {
                formData.append("sizeGuide", selectedSizeGuide);
            }

            try {
                const response = await axios.post(`/api/brands`, formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.data.success) {
                    toast.success(
                        response.data.message || "Brand Added Successfully"
                    );
                    setShowForm(false);
                    setValues(initialState);
                    setIsSubmit(false);
                    setFormErrors({});
                    setSelectedFile(null);
                    setLogoPreview("");
                    setShowFileInput(true);
                    setLogoRemoved(false);
                    setSelectedSizeGuide(null);
                    setSizeGuideRemoved(false);
                    fetchBrandMaster();
                } else {
                    toast.error(response.data.message || "Cannot add Brand");
                }
            } catch (error) {
                toast.error(
                    error.response?.data?.message || "Error adding brand"
                );
            }
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);
        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("slug", values.slug);
            formData.append("description", values.description || "");
            formData.append("website", values.website || "");
            formData.append("isActive", values.isActive);
            formData.append("firstTierMargin", values.firstTierMargin || 0);
            
            // Add price tiers
            if (values.priceTiers && values.priceTiers.length > 0) {
                formData.append("priceTiers", JSON.stringify(values.priceTiers));
            } else {
                formData.append("priceTiers", JSON.stringify([]));
            }

            // Handle logo removal
            if (logoRemoved) {
                formData.append("removeLogo", "true");
            }

            if (selectedFile) {
                formData.append("logo", selectedFile);
            }

            if (selectedSizeGuide) {
                formData.append("sizeGuide", selectedSizeGuide);
            }

            if (sizeGuideRemoved) {
                formData.append("removeSizeGuide", "true");
            }

            try {
                const response = await axios.put(
                    `/api/brands/${_id}`,
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
                    toast.success("Brand Updated Successfully");
                    setUpdateForm(false);
                    setShowForm(false);
                    setValues(initialState);
                    setIsSubmit(false);
                    setFormErrors({});
                    setSelectedFile(null);
                    setLogoPreview("");
                    setShowFileInput(true);
                    setLogoRemoved(false);
                    setSelectedSizeGuide(null);
                    setSizeGuideRemoved(false);
                    fetchBrandMaster();
                } else {
                    toast.error(response.data.message || "Cannot update Brand");
                }
            } catch (error) {
                toast.error(
                    error.response?.data?.message || "Error updating brand"
                );
            }
            setIsLoading(false);
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setIsSubmit(false);
        setShowForm(false);
        setUpdateForm(false);
        setValues(initialState);
        setFormErrors({});
        setSelectedFile(null);
        setLogoPreview("");
        setShowFileInput(true);
        setLogoRemoved(false);
        if (imageRef.current) {
            imageRef.current.value = "";
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);

        try {
            const response = await axios.delete(`/api/brands/${remove_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setmodal_delete(!modal_delete);
                toast.success("Brand Deleted Successfully");
                fetchBrandMaster();
            } else {
                toast.error(response.data.message || "Cannot delete Brand");
            }
            setIsDeleteLoading(false);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Handle reference error
                setReferenceData(error.response.data);
                setReferenceModal(true);
            } else {
                toast.error("Failed to delete brand. Please try again.");
            }
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleTog_edit = async (_id) => {
        setIsSubmit(false);
        setUpdateForm(true);
        set_Id(_id);
        setFormErrors({});
        setIsLoading(true);

        try {
            const response = await axios.get(`/api/brands/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const brand = response.data.data;
                const generatedSlug = brand.name
                    ? brand.name
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "")
                    : brand.slug || "";
                setValues({
                    name: brand.name || "",
                    slug: generatedSlug,
                    description: brand.description || "",
                    website: brand.website || "",
                    logo: brand.logo || "",
                    sizeGuide: brand.sizeGuide || "",
                    isActive: brand.isActive,
                    firstTierMargin: brand.firstTierMargin || 0,
                    priceTiers: brand.brandPriceTiers || [],
                });
                setShowForm(true);
                setSelectedFile(null);
                setLogoPreview("");
                setShowFileInput(true);
                setLogoRemoved(false);
                setSelectedSizeGuide(null);
                setSizeGuideRemoved(false);
            } else {
                toast.error("Failed to fetch brand details");
            }
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    };

    const [modal_delete, setmodal_delete] = useState(false);
    const tog_delete = (_id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(_id);
    };

    const handlecheck = (e) => {
        setValues({ ...values, [e.target.name]: e.target.checked });
    };

    const handleReferenceModalClose = () => {
        setReferenceModal(false);
        setReferenceData(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === "phone") {
            newValue = newValue.replace(/\D/g, ""); // Remove non-numeric characters
        }

        // Auto-generate slug based on name
        if (name === "name") {
            const generatedSlug = value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
            setValues({ ...values, [name]: newValue, slug: generatedSlug });
        } else {
            setValues({ ...values, [name]: newValue });
        }
    };

    const handlePriceTierChange = (priceTierData) => {
        setValues({ ...values, ...priceTierData });
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                e.target.value = "";
                return;
            }
            setSelectedFile(file);
            setLogoRemoved(false); // Reset logo removed flag when new file is selected
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSizeGuideChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast.error("Size guide must be a PDF document");
                e.target.value = "";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                e.target.value = "";
                return;
            }
            setSelectedSizeGuide(file);
            setSizeGuideRemoved(false);
        }
    };

    const handleRemoveLogo = () => {
        setValues({ ...values, logo: "" });
        setSelectedFile(null);
        setLogoPreview("");
        setShowFileInput(true);
        setLogoRemoved(true);
        if (imageRef.current) {
            imageRef.current.value = "";
        }
    };

    const handleRemoveSizeGuide = () => {
        setValues({ ...values, sizeGuide: "" });
        setSelectedSizeGuide(null);
        setSizeGuideRemoved(true);
        if (sizeGuideRef.current) {
            sizeGuideRef.current.value = "";
        }
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
                                                    Name{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.name}
                                                    </p>
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
                                                    Slug{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.slug}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="website"
                                                    value={values.website}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Website
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.website}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={6}>
                                            <div className="form-floating mb-3">
                                                <textarea
                                                    className="form-control"
                                                    name="description"
                                                    value={values.description}
                                                    onChange={handleChange}
                                                    style={{
                                                        minHeight: "80px",
                                                    }}
                                                />
                                                <label className="form-label">
                                                    Description
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={6}>
                                            <div className="mb-3">
                                                <Label className="form-label">
                                                    Logo
                                                </Label>
                                                <div className="d-flex flex-column">
                                                    {values.logo &&
                                                        !selectedFile &&
                                                        !logoRemoved && (
                                                            <div className="mb-2">
                                                                <img
                                                                    src={`${apiUrl}/uploads/brandMaster/${values.logo}`}
                                                                    alt="Current Logo"
                                                                    style={{
                                                                        width: "100px",
                                                                        height: "100px",
                                                                        objectFit:
                                                                            "cover",
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger ms-2"
                                                                    onClick={
                                                                        handleRemoveLogo
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    {logoRemoved &&
                                                        !selectedFile && (
                                                            <div className="mb-2">
                                                                <span className="text-muted">
                                                                    Logo will be
                                                                    removed when
                                                                    you save
                                                                </span>
                                                            </div>
                                                        )}
                                                    {logoPreview &&
                                                        selectedFile && (
                                                            <div className="mb-2">
                                                                <img
                                                                    src={
                                                                        logoPreview
                                                                    }
                                                                    alt="Logo Preview"
                                                                    style={{
                                                                        width: "100px",
                                                                        height: "100px",
                                                                        objectFit:
                                                                            "cover",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    {showFileInput && (
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={
                                                                handleFileChange
                                                            }
                                                            ref={imageRef}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col lg={6}>
                                            <div className="mb-3">
                                                <Label className="form-label">
                                                    Size Guide (PDF, Max 5MB)
                                                </Label>
                                                <div className="d-flex flex-column">
                                                    {values.sizeGuide &&
                                                        !selectedSizeGuide &&
                                                        !sizeGuideRemoved && (
                                                            <div className="mb-2 d-flex align-items-center">
                                                                <div className="bg-light p-2 rounded border flex-grow-1">
                                                                    <i className="ri-file-pdf-line text-danger fs-3 me-2"></i>
                                                                    <span className="text-truncate">
                                                                        {
                                                                            values.sizeGuide
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <a
                                                                    href={`${apiUrl}/uploads/brandMaster/${values.sizeGuide}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-sm btn-info ms-2"
                                                                >
                                                                    View
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger ms-2"
                                                                    onClick={
                                                                        handleRemoveSizeGuide
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    {sizeGuideRemoved &&
                                                        !selectedSizeGuide && (
                                                            <div className="mb-2">
                                                                <span className="text-muted small">
                                                                    Size guide
                                                                    will be
                                                                    removed when
                                                                    you save
                                                                </span>
                                                            </div>
                                                        )}
                                                    {selectedSizeGuide && (
                                                        <div className="mb-2 d-flex align-items-center">
                                                            <div className="bg-light p-2 rounded border flex-grow-1">
                                                                <i className="ri-file-pdf-line text-danger fs-3 me-2"></i>
                                                                <span className="text-truncate">
                                                                    {
                                                                        selectedSizeGuide.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="application/pdf"
                                                        onChange={
                                                            handleSizeGuideChange
                                                        }
                                                        ref={sizeGuideRef}
                                                    />
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Brand Price Tier Configuration */}
                                    <Row className="mt-4">
                                        <Col lg={12}>
                                            <BrandPriceTierForm
                                                values={values}
                                                onChange={handlePriceTierChange}
                                                isSubmit={isSubmit}
                                                formErrors={formErrors}
                                            />
                                        </Col>
                                    </Row>

                                    <div className="mt-3">
                                        <Row>
                                            <Col lg={2}>
                                                <div className="form-check mb-2">
                                                    <Input
                                                        type="checkbox"
                                                        name="isActive"
                                                        value={values.isActive}
                                                        onChange={handlecheck}
                                                        checked={
                                                            values.isActive
                                                        }
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
                                            handleSubmit={
                                                updateForm
                                                    ? handleUpdate
                                                    : handleClick
                                            }
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
        setShowForm(false);
        setUpdateForm(false);
        setIsSubmit(false);
        setValues(initialState);
        setFormErrors({});
        setSelectedFile(null);
        setLogoPreview("");
        setShowFileInput(true);
        setLogoRemoved(false);
        setSelectedSizeGuide(null);
        setSizeGuideRemoved(false);
        if (imageRef.current) {
            imageRef.current.value = "";
        }
        if (sizeGuideRef.current) {
            sizeGuideRef.current.value = "";
        }
    };

    document.title = `Brand Master | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                {isDeleteLoading && <LoadingOverlay fullscreen />}
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Brand"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <FormsHeader
                                            formName="Brand"
                                            filter={filter}
                                            handleFilter={handleFilter}
                                            tog_list={() => handleList()}
                                            setQuery={setQuery}
                                            initialState={initialState}
                                            setValues={setValues}
                                            updateForm={updateForm}
                                            showForm={showForm}
                                            setShowForm={setShowForm}
                                            setUpdateForm={setUpdateForm}
                                            showAddButton={false}
                                        />
                                        <ExportButtons
                                            data={data}
                                            columns={exportColumns}
                                            fileName="brands"
                                            fetchAll={fetchAllForExport}
                                        />
                                    </div>
                                </CardHeader>

                                <CardBody>
                                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                                        <DataTable
                                            columns={columns}
                                            data={data}
                                            customStyles={tableCustomStyles}
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
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Brand;
