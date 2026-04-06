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
    Button,
} from "reactstrap";
import Select from "react-select";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
    createGeneralCMS,
    deleteGeneralCMS,
    getGeneralCMSById,
    updateGeneralCMS,
} from "../../functions/CMS/generalCMSFunc";
import { MenuContext } from "../../context/MenuContext";
import { api } from "../../config";

// Remix Icon options for points (extracted from frontend codebase)
const ICON_OPTIONS = [
    { value: "", label: "No Icon" },
    { value: "ri-add-line", label: "Add" },
    { value: "ri-archive-line", label: "Archive" },
    { value: "ri-arrow-go-back-line", label: "Arrow Go Back" },
    { value: "ri-arrow-right-line", label: "Arrow Right" },
    { value: "ri-award-line", label: "Award" },
    { value: "ri-bank-card-line", label: "Bank Card" },
    { value: "ri-bar-chart-line", label: "Bar Chart" },
    { value: "ri-bookmark-line", label: "Bookmark" },
    { value: "ri-brush-line", label: "Brush" },
    { value: "ri-building-line", label: "Building" },
    { value: "ri-camera-line", label: "Camera" },
    { value: "ri-chat-3-line", label: "Chat" },
    { value: "ri-check-line", label: "Check" },
    { value: "ri-check-circle-fill", label: "Check Circle" },
    { value: "ri-close-line", label: "Close" },
    { value: "ri-coupon-3-line", label: "Coupon" },
    { value: "ri-customer-service-line", label: "Customer Service" },
    { value: "ri-dashboard-line", label: "Dashboard" },
    { value: "ri-delete-bin-line", label: "Delete" },
    { value: "ri-download-line", label: "Download" },
    { value: "ri-earth-line", label: "Earth" },
    { value: "ri-edit-line", label: "Edit" },
    { value: "ri-error-warning-line", label: "Error Warning" },
    { value: "ri-exchange-line", label: "Exchange" },
    { value: "ri-eye-line", label: "Eye" },
    { value: "ri-file-list-line", label: "File List" },
    { value: "ri-file-pdf-2-line", label: "PDF File" },
    { value: "ri-filter-line", label: "Filter" },
    { value: "ri-flashlight-line", label: "Flashlight" },
    { value: "ri-folder-line", label: "Folder" },
    { value: "ri-gift-line", label: "Gift" },
    { value: "ri-global-line", label: "Global" },
    { value: "ri-grid-line", label: "Grid" },
    { value: "ri-group-line", label: "Group" },
    { value: "ri-hand-heart-line", label: "Hand Heart" },
    { value: "ri-heart-line", label: "Heart" },
    { value: "ri-history-line", label: "History" },
    { value: "ri-home-4-line", label: "Home" },
    { value: "ri-image-line", label: "Image" },
    { value: "ri-information-line", label: "Information" },
    { value: "ri-key-line", label: "Key" },
    { value: "ri-leaf-line", label: "Leaf" },
    { value: "ri-lightbulb-line", label: "Lightbulb" },
    { value: "ri-link", label: "Link" },
    { value: "ri-lock-line", label: "Lock" },
    { value: "ri-mail-line", label: "Mail" },
    { value: "ri-mail-send-line", label: "Mail Send" },
    { value: "ri-map-pin-line", label: "Map Pin" },
    { value: "ri-menu-line", label: "Menu" },
    { value: "ri-message-2-line", label: "Message" },
    { value: "ri-notification-line", label: "Notification" },
    { value: "ri-palette-line", label: "Palette" },
    { value: "ri-pencil-line", label: "Pencil" },
    { value: "ri-percent-line", label: "Percent" },
    { value: "ri-phone-line", label: "Phone" },
    { value: "ri-plant-line", label: "Plant" },
    { value: "ri-price-tag-3-line", label: "Price Tag" },
    { value: "ri-printer-line", label: "Printer" },
    { value: "ri-profile-line", label: "Profile" },
    { value: "ri-question-line", label: "Question" },
    { value: "ri-refresh-line", label: "Refresh" },
    { value: "ri-refund-line", label: "Refund" },
    { value: "ri-robot-line", label: "Robot" },
    { value: "ri-ruler-line", label: "Ruler" },
    { value: "ri-scissors-line", label: "Scissors" },
    { value: "ri-search-line", label: "Search" },
    { value: "ri-send-plane-line", label: "Send" },
    { value: "ri-settings-3-line", label: "Settings" },
    { value: "ri-shield-check-line", label: "Shield Check" },
    { value: "ri-ship-line", label: "Ship" },
    { value: "ri-shirt-line", label: "Shirt" },
    { value: "ri-shopping-bag-line", label: "Shopping Bag" },
    { value: "ri-shopping-cart-line", label: "Shopping Cart" },
    { value: "ri-sparkle-line", label: "Sparkle" },
    { value: "ri-stack-line", label: "Stack" },
    { value: "ri-star-line", label: "Star" },
    { value: "ri-star-fill", label: "Star Filled" },
    { value: "ri-sun-line", label: "Sun" },
    { value: "ri-t-shirt-line", label: "T-Shirt" },
    { value: "ri-team-line", label: "Team" },
    { value: "ri-thumb-up-line", label: "Thumb Up" },
    { value: "ri-ticket-line", label: "Ticket" },
    { value: "ri-time-line", label: "Time" },
    { value: "ri-tools-line", label: "Tools" },
    { value: "ri-truck-line", label: "Truck" },
    { value: "ri-upload-line", label: "Upload" },
    { value: "ri-user-line", label: "User" },
    { value: "ri-user-heart-line", label: "User Heart" },
    { value: "ri-user-settings-line", label: "User Settings" },
    { value: "ri-verified-badge-fill", label: "Verified Badge" },
];

// Custom option component with icon preview
const IconOption = ({ data, ...props }) => (
    <div
        ref={props.innerRef}
        {...props.innerProps}
        className={`d-flex align-items-center px-2 py-1 ${
            props.isFocused ? "bg-light" : ""
        } ${props.isSelected ? "bg-primary text-white" : ""}`}
        style={{ cursor: "pointer" }}
    >
        {data.value && (
            <i
                className={`${data.value} me-2`}
                style={{ fontSize: "16px" }}
            ></i>
        )}
        <span>{data.label}</span>
    </div>
);

// Custom single value component with icon preview
const IconSingleValue = ({ data, ...props }) => (
    <div className="d-flex align-items-center" {...props.innerProps}>
        {data.value && (
            <i
                className={`${data.value} me-2`}
                style={{ fontSize: "16px" }}
            ></i>
        )}
        <span>{data.label}</span>
    </div>
);

const GeneralCMS = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    // Basic states
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);
    const [_id, set_Id] = useState("");

    const initialState = {
        name: "",
        header: "",
        description: "",
        points: [],
        isActive: true,
    };

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

    // Image states
    const [imageUrl, setImageUrl] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);

    // Helper to generate slug from name (for preview)
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
        },
        {
            name: "Name",
            selector: (row) => <span className="text-wrap">{row.name}</span>,
            sortable: true,
            minWidth: "150px",
        },
        {
            name: "Slug",
            selector: (row) => <span className="text-wrap">{row.slug}</span>,
            sortable: true,
            minWidth: "150px",
        },
        {
            name: "Header",
            selector: (row) => <span className="text-wrap">{row.header}</span>,
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Image",
            selector: (row) =>
                row.imageUrl ? (
                    <img
                        src={`${api.API_URL}/${row.imageUrl}`}
                        alt="cms"
                        style={{
                            width: "60px",
                            height: "40px",
                            objectFit: "cover",
                            margin: "5px 0",
                        }}
                    />
                ) : (
                    <span className="text-muted">No Image</span>
                ),
        },
        {
            name: "Points",
            selector: (row) => (
                <span className="badge bg-info">
                    {row.points ? row.points.length : 0} points
                </span>
            ),
        },
        {
            name: "Status",
            selector: (row) => (
                <span
                    className={`badge bg-${
                        row.isActive ? "success" : "danger"
                    }`}
                >
                    {row.isActive ? "Active" : "Inactive"}
                </span>
            ),
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

    const fetchGeneralCMS = useCallback(async () => {
        setLoading(true);
        let skip = pageNo;
        if (skip < 1) skip = 1;

        const params = new URLSearchParams({
            page: skip,
            limit: perPage,
            search: query,
            isActive: filter,
        });

        await axios
            .get(`/api/general-cms?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((response) => {
                if (response.data.success) {
                    setData(response.data.data);
                    setTotalRows(response.data.pagination.totalCount);
                } else {
                    setData([]);
                    setTotalRows(0);
                }
            })
            .catch((err) => {
                console.log(err);
                setData([]);
                setTotalRows(0);
            });
        setLoading(false);
    }, [pageNo, perPage, query, filter]);

    useEffect(() => {
        fetchGeneralCMS();
    }, [pageNo, perPage, column, sortDirection, query, filter]);

    const validateImageFile = (file) => {
        const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!validTypes.includes(file.type)) {
            toast.error("Only image files (JPEG, PNG, GIF, WebP) are allowed");
            return false;
        }

        if (file.size > maxSize) {
            toast.error("Image size must be less than 2MB");
            return false;
        }

        return true;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && validateImageFile(file)) {
            setImageUrl(file);
            setRemoveImage(false);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            e.target.value = null;
        }
    };

    const handleRemoveImage = () => {
        setImageUrl(null);
        setImagePreview(null);
        setRemoveImage(true);
        const fileInput = document.querySelector('input[name="imageUrl"]');
        if (fileInput) fileInput.value = null;
    };

    // Points management
    const handleAddPoint = () => {
        setValues({
            ...values,
            points: [
                ...values.points,
                { title: "", description: "", icon: "" },
            ],
        });
    };

    const handleRemovePoint = (index) => {
        const newPoints = values.points.filter((_, i) => i !== index);
        setValues({ ...values, points: newPoints });
    };

    const handlePointChange = (index, field, value) => {
        const newPoints = [...values.points];
        newPoints[index][field] = value;
        setValues({ ...values, points: newPoints });
    };

    const validate = (values) => {
        const errors = {};
        if (!values.name) errors.name = "Name is required";
        if (!values.header) errors.header = "Header is required";

        // Validate points - title is required if point exists
        if (values.points && values.points.length > 0) {
            const invalidPoints = values.points.some(
                (point, index) => !point.title
            );
            if (invalidPoints) {
                errors.points = "All points must have a title";
            }
        }

        return errors;
    };

    const handleClick = (e) => {
        e.preventDefault();
        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("header", values.header);
            // If description is empty or only whitespace, send empty string
            formData.append(
                "description",
                values.description && values.description.trim()
                    ? values.description
                    : ""
            );
            formData.append("points", JSON.stringify(values.points));
            formData.append("isActive", values.isActive);

            if (imageUrl) {
                formData.append("imageUrl", imageUrl);
            }

            createGeneralCMS(formData)
                .then((res) => {
                    if (res.data.success) {
                        setShowForm(false);
                        setValues(initialState);
                        setImageUrl(null);
                        setImagePreview(null);
                        setRemoveImage(false);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchGeneralCMS();
                        toast.success("General CMS Page Added Successfully");
                    } else {
                        toast.error(
                            res.data.message ||
                                "Failed to create General CMS Page"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message ||
                            "Error creating General CMS Page"
                    );
                })
                .finally(() => setIsLoading(false));
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("header", values.header);
            // If description is empty or only whitespace, send empty string
            formData.append(
                "description",
                values.description && values.description.trim()
                    ? values.description
                    : ""
            );
            formData.append("points", JSON.stringify(values.points));
            formData.append("isActive", values.isActive);
            formData.append("removeImage", removeImage);

            if (imageUrl && typeof imageUrl !== "string") {
                formData.append("imageUrl", imageUrl);
            }

            updateGeneralCMS(_id, formData)
                .then((res) => {
                    if (res.data.success) {
                        toast.success("General CMS Page Updated Successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setImageUrl(null);
                        setImagePreview(null);
                        setRemoveImage(false);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchGeneralCMS();
                    } else {
                        toast.error(
                            res.data.message ||
                                "Failed to update General CMS Page"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message ||
                            "Error updating General CMS Page"
                    );
                })
                .finally(() => setIsLoading(false));
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setIsSubmit(false);
        setShowForm(false);
        setUpdateForm(false);
        setValues(initialState);
        setImageUrl(null);
        setImagePreview(null);
        setRemoveImage(false);
        setFormErrors({});
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        deleteGeneralCMS(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchGeneralCMS();
                    toast.success("General CMS Page Deleted Successfully");
                } else {
                    toast.error(
                        res.data.message || "Cannot delete General CMS Page"
                    );
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Cannot delete General CMS Page");
            })
            .finally(() => setIsDeleteLoading(false));
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleTog_edit = (_id) => {
        setIsSubmit(false);
        setUpdateForm(true);
        set_Id(_id);
        setFormErrors({});
        setIsLoading(true);
        getGeneralCMSById(_id)
            .then((res) => {
                if (res.data.success) {
                    const cmsData = res.data.data;
                    setValues({
                        name: cmsData.name,
                        header: cmsData.header,
                        // If description is null/undefined, set to empty string for controlled textarea
                        description: cmsData.description
                            ? cmsData.description
                            : "",
                        points: cmsData.points || [],
                        isActive: cmsData.isActive,
                    });

                    if (cmsData.imageUrl) {
                        setImageUrl(cmsData.imageUrl);
                        setImagePreview(`${api.API_URL}/${cmsData.imageUrl}`);
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Error loading CMS data");
            })
            .finally(() => setIsLoading(false));
    };

    const [modal_delete, setmodal_delete] = useState(false);
    const tog_delete = (_id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(_id);
    };

    const handlecheck = (e) => {
        setValues({ ...values, [e.target.name]: e.target.checked });
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
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

    const tog_list = () => {
        setShowForm(false);
        setUpdateForm(false);
        setValues(initialState);
        setImageUrl(null);
        setImagePreview(null);
        setRemoveImage(false);
        setFormErrors({});
    };

    const renderForm = () => (
        <CardBody>
            <Col xxl={12}>
                {isDeleteLoading && <LoadingOverlay fullscreen={false} />}
                <Card>
                    <CardBody>
                        <div className="live-preview">
                            <Form>
                                <Row>
                                    {/* Name */}
                                    <Col lg={4}>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    formErrors.name
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                name="name"
                                                value={values.name}
                                                onChange={handleChange}
                                                placeholder="Page Name"
                                            />
                                            <label className="form-label">
                                                Name{" "}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            {isSubmit && formErrors.name && (
                                                <p className="text-danger">
                                                    {formErrors.name}
                                                </p>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Auto-generated Slug (Read-only) */}
                                    <Col lg={4}>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className="form-control bg-light"
                                                value={
                                                    values.name
                                                        ? generateSlug(
                                                              values.name
                                                          )
                                                        : ""
                                                }
                                                placeholder="Auto-generated slug"
                                                readOnly
                                                disabled
                                            />
                                            <label className="form-label">
                                                Slug{" "}
                                                <span className="text-muted">
                                                    (Auto-generated)
                                                </span>
                                            </label>
                                        </div>
                                    </Col>

                                    {/* Header */}
                                    <Col lg={4}>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Header{" "}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                className={`form-control ${
                                                    formErrors.header
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                name="header"
                                                value={values.header}
                                                onChange={handleChange}
                                                placeholder="Page Header"
                                                rows={3}
                                            />
                                            {isSubmit && formErrors.header && (
                                                <p className="text-danger">
                                                    {formErrors.header}
                                                </p>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Description */}
                                    <Col lg={12}>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Description{" "}
                                                <span className="text-muted">
                                                    (Optional)
                                                </span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={values.description}
                                                onChange={handleChange}
                                                placeholder="Page Description"
                                                rows={6}
                                            />
                                        </div>
                                    </Col>

                                    {/* Image Upload */}
                                    <Col lg={12}>
                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Image
                                                        <span className="text-muted">
                                                            {" "}
                                                            (Optional, Max 2MB)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        name="imageUrl"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={
                                                            handleImageChange
                                                        }
                                                    />
                                                </div>
                                            </Col>

                                            {imagePreview && (
                                                <Col lg={6}>
                                                    <div className="mb-3">
                                                        <label className="form-label">
                                                            Image Preview
                                                        </label>
                                                        <div className="position-relative d-inline-block w-100">
                                                            <img
                                                                src={
                                                                    imagePreview
                                                                }
                                                                alt="Preview"
                                                                style={{
                                                                    width: "100%",
                                                                    height: "auto",
                                                                    maxHeight:
                                                                        "200px",
                                                                    objectFit:
                                                                        "contain",
                                                                    border: "1px solid #ddd",
                                                                    borderRadius:
                                                                        "4px",
                                                                    padding:
                                                                        "5px",
                                                                    backgroundColor:
                                                                        "#f8f9fa",
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm position-absolute"
                                                                onClick={
                                                                    handleRemoveImage
                                                                }
                                                                style={{
                                                                    top: "10px",
                                                                    right: "10px",
                                                                    zIndex: 1,
                                                                }}
                                                            >
                                                                <i className="ri-close-line"></i>{" "}
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    </Col>

                                    {/* Points Section */}
                                    <Col lg={12}>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <label className="form-label mb-0">
                                                    Points{" "}
                                                    <span className="text-muted">
                                                        (Optional)
                                                    </span>
                                                </label>
                                                <Button
                                                    type="button"
                                                    color="primary"
                                                    size="sm"
                                                    onClick={handleAddPoint}
                                                >
                                                    <i className="ri-add-line me-1"></i>{" "}
                                                    Add Point
                                                </Button>
                                            </div>

                                            {isSubmit && formErrors.points && (
                                                <p className="text-danger">
                                                    {formErrors.points}
                                                </p>
                                            )}

                                            {values.points &&
                                                values.points.length > 0 && (
                                                    <div className="border rounded p-3 bg-light">
                                                        {values.points.map(
                                                            (point, index) => (
                                                                <Row
                                                                    key={index}
                                                                    className="mb-3 align-items-start"
                                                                >
                                                                    <Col lg={3}>
                                                                        <div>
                                                                            <label className="form-label small">
                                                                                Icon
                                                                                (Optional)
                                                                            </label>
                                                                            <Select
                                                                                options={
                                                                                    ICON_OPTIONS
                                                                                }
                                                                                value={
                                                                                    ICON_OPTIONS.find(
                                                                                        (
                                                                                            opt
                                                                                        ) =>
                                                                                            opt.value ===
                                                                                            point.icon
                                                                                    ) ||
                                                                                    ICON_OPTIONS[0]
                                                                                }
                                                                                onChange={(
                                                                                    selected
                                                                                ) =>
                                                                                    handlePointChange(
                                                                                        index,
                                                                                        "icon",
                                                                                        selected?.value ||
                                                                                            ""
                                                                                    )
                                                                                }
                                                                                placeholder="Select Icon..."
                                                                                isClearable
                                                                                isSearchable
                                                                                components={{
                                                                                    Option: IconOption,
                                                                                    SingleValue:
                                                                                        IconSingleValue,
                                                                                }}
                                                                                styles={{
                                                                                    control:
                                                                                        (
                                                                                            base
                                                                                        ) => ({
                                                                                            ...base,
                                                                                            minHeight:
                                                                                                "38px",
                                                                                        }),
                                                                                    menu: (
                                                                                        base
                                                                                    ) => ({
                                                                                        ...base,
                                                                                        zIndex: 9999,
                                                                                    }),
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </Col>
                                                                    <Col lg={3}>
                                                                        <div className="form-floating mt-4">
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                value={
                                                                                    point.title
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handlePointChange(
                                                                                        index,
                                                                                        "title",
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder="Point Title"
                                                                            />
                                                                            <label>
                                                                                Title{" "}
                                                                                <span className="text-danger">
                                                                                    *
                                                                                </span>
                                                                            </label>
                                                                        </div>
                                                                    </Col>
                                                                    <Col lg={5}>
                                                                        <div>
                                                                            <label className="form-label small">
                                                                                Description
                                                                                (Optional)
                                                                            </label>
                                                                            <textarea
                                                                                className="form-control"
                                                                                value={
                                                                                    point.description
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handlePointChange(
                                                                                        index,
                                                                                        "description",
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder="Point Description"
                                                                                rows={
                                                                                    2
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </Col>
                                                                    <Col lg={1}>
                                                                        <Button
                                                                            type="button"
                                                                            color="danger"
                                                                            size="sm"
                                                                            className="mt-4"
                                                                            onClick={() =>
                                                                                handleRemovePoint(
                                                                                    index
                                                                                )
                                                                            }
                                                                        >
                                                                            <i className="ri-delete-bin-line"></i>
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                            {(!values.points ||
                                                values.points.length === 0) && (
                                                <p className="text-muted mb-0">
                                                    No points added. Click "Add
                                                    Point" to add bullet points
                                                    with title and description.
                                                </p>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Is Active */}
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
                                                        defaultChecked={
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

    const exportColumns = [{header:"Title",key:"title"},{header:"Type",key:"type"},{header:"Active",key:"isActive"}];
    const fetchAllForExport = async () => { return data; };

    document.title = `General CMS | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="CMS"
                        title="General CMS"
                        pageTitle="CMS"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="General CMS"
                                        filter={filter}
                                        handleFilter={handleFilter}
                                        tog_list={tog_list}
                                        setQuery={setQuery}
                                        initialState={initialState}
                                        setValues={setValues}
                                        updateForm={updateForm}
                                        showForm={showForm}
                                        setShowForm={setShowForm}
                                        setUpdateForm={setUpdateForm}
                                    />
                                    <ExportButtons data={data} columns={exportColumns} fileName="general_cms" fetchAll={fetchAllForExport} />
                                </CardHeader>

                                {showForm || updateForm ? (
                                    renderForm()
                                ) : (
                                    <CardBody>
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                      customStyles={tableCustomStyles}
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
        </React.Fragment>
    );
};

export default GeneralCMS;
