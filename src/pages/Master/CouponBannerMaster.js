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
    Badge,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import PageHeader from "../../Components/Common/PageHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import classnames from "classnames";
import { api } from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";


const initialState = {
    title: "",
    description: "",
    buttonText: "Get My Discount",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    startDate: "",
    endDate: "",
    triggerType: "EXIT_INTENT",
    triggerDelay: "5",
    scrollPercent: "50",
    showOnPages: "",
    isActive: true,
    termsAndConditions: "",
};

const CouponBannerMaster = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);
    const [query, setQuery] = useState("");

    const [_id, set_Id] = useState("");
    const [remove_id, setRemove_id] = useState("");

    const [banners, setBanners] = useState([]);
    const [activeTab, setActiveTab] = useState("1");
    const [stats, setStats] = useState(null);
    const [leads, setLeads] = useState([]);
    const [selectedBannerId, setSelectedBannerId] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);

    // Form/List toggle states
    const [showForm, setShowForm] = useState(false);
    const [updateForm, setUpdateForm] = useState(false);

    const [modal_delete, setmodal_delete] = useState(false);
    const tog_delete = (_id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(_id);
    };

    const [modal_stats, setmodal_stats] = useState(false);

    // Fetch banners
    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `/api/coupon-banners/list`,
                {
                    page: pageNo,
                    limit: perPage,
                    search: query || undefined,
                    isActive: filter ? true : undefined,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (response.data.success) {
                setBanners(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);
            }
        } catch (err) {
            console.log(err);
            toast.error("Error fetching banners!");
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query, filter]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleViewStats = async (bannerId) => {
        setSelectedBannerId(bannerId);
        setIsLoading(true);
        try {
            const response = await axios.get(
                `/api/coupon-banners/${bannerId}/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (response.data.success) {
                setStats(response.data.data.stats);
                setLeads(response.data.data.recentLeads || []);
                setmodal_stats(true);
            }
        } catch (err) {
            console.log(err);
            toast.error("Error fetching banner stats!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportLeads = async () => {
        if (!selectedBannerId) return;
        try {
            window.open(
                `/api/coupon-banners/${selectedBannerId}/export?token=${localStorage.getItem(
                    "token"
                )}`,
                "_blank"
            );
        } catch (err) {
            toast.error("Error exporting leads!");
        }
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCheck = (e) => {
        setValues({ ...values, isActive: e.target.checked });
    };

    const handleTog_edit = async (_id) => {
        setIsSubmit(false);
        setUpdateForm(true);
        set_Id(_id);
        setFormErrors({});
        setImageFile(null);
        setImagePreview(null);
        setIsLoading(true);

        try {
            const response = await axios.get(`/api/coupon-banners/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const banner = response.data.data;
                setValues({
                    title: banner.title || "",
                    description: banner.description || "",
                    buttonText: banner.buttonText || "Get My Discount",
                    discountType: banner.discountType || "PERCENTAGE",
                    discountValue: banner.discountValue?.toString() || "",
                    maxDiscountAmount:
                        banner.maxDiscountAmount?.toString() || "",
                    minOrderAmount: banner.minOrderAmount?.toString() || "",
                    startDate: banner.startDate
                        ? new Date(banner.startDate).toISOString().slice(0, 16)
                        : "",
                    endDate: banner.endDate
                        ? new Date(banner.endDate).toISOString().slice(0, 16)
                        : "",
                    triggerType: banner.triggerType || "EXIT_INTENT",
                    triggerDelay: banner.triggerDelay?.toString() || "5",
                    scrollPercent: banner.scrollPercent?.toString() || "50",
                    showOnPages: banner.showOnPages || "",
                    isActive: banner.isActive,
                    termsAndConditions: banner.termsAndConditions || "",
                });
                // Set image preview if exists
                if (banner.imageUrl) {
                    setImagePreview(api.API_URL + banner.imageUrl);
                }
                setShowForm(true);
            } else {
                toast.error("Failed to fetch banner details");
            }
        } catch (err) {
            console.log(err);
            toast.error("Error fetching banner data!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = async (e) => {
        e.preventDefault();
        setFormErrors({});
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("title", values.title);
            if (values.description)
                formData.append("description", values.description);
            formData.append(
                "buttonText",
                values.buttonText || "Get My Discount"
            );
            formData.append("discountType", values.discountType);
            formData.append("discountValue", values.discountValue);
            if (values.maxDiscountAmount)
                formData.append("maxDiscountAmount", values.maxDiscountAmount);
            if (values.minOrderAmount)
                formData.append("minOrderAmount", values.minOrderAmount);
            formData.append("startDate", values.startDate);
            formData.append("endDate", values.endDate);
            formData.append("triggerType", values.triggerType);
            formData.append("triggerDelay", values.triggerDelay || "5");
            formData.append("scrollPercent", values.scrollPercent || "50");
            if (values.showOnPages)
                formData.append("showOnPages", values.showOnPages);
            formData.append("isActive", values.isActive);
            if (values.termsAndConditions)
                formData.append(
                    "termsAndConditions",
                    values.termsAndConditions
                );
            if (imageFile) formData.append("imageFile", imageFile);

            try {
                const response = await axios.post(
                    `/api/coupon-banners`,
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
                    toast.success("Coupon Banner Added Successfully!");
                    setShowForm(false);
                    setValues(initialState);
                    setImageFile(null);
                    setImagePreview(null);
                    setIsSubmit(false);
                    setFormErrors({});
                    fetchBanners();
                }
            } catch (error) {
                console.log(error);
                toast.error(
                    error.response?.data?.message || "Error adding banner!"
                );
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("title", values.title);
            if (values.description)
                formData.append("description", values.description);
            formData.append(
                "buttonText",
                values.buttonText || "Get My Discount"
            );
            formData.append("discountType", values.discountType);
            formData.append("discountValue", values.discountValue);
            if (values.maxDiscountAmount)
                formData.append("maxDiscountAmount", values.maxDiscountAmount);
            if (values.minOrderAmount)
                formData.append("minOrderAmount", values.minOrderAmount);
            formData.append("startDate", values.startDate);
            formData.append("endDate", values.endDate);
            formData.append("triggerType", values.triggerType);
            formData.append("triggerDelay", values.triggerDelay || "5");
            formData.append("scrollPercent", values.scrollPercent || "50");
            if (values.showOnPages)
                formData.append("showOnPages", values.showOnPages);
            formData.append("isActive", values.isActive);
            if (values.termsAndConditions)
                formData.append(
                    "termsAndConditions",
                    values.termsAndConditions
                );
            if (imageFile) formData.append("imageFile", imageFile);

            try {
                const response = await axios.put(
                    `/api/coupon-banners/${_id}`,
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
                    toast.success("Coupon Banner Updated Successfully!");
                    setShowForm(false);
                    setUpdateForm(false);
                    setValues(initialState);
                    setImageFile(null);
                    setImagePreview(null);
                    setIsSubmit(false);
                    setFormErrors({});
                    fetchBanners();
                }
            } catch (err) {
                console.log(err);
                toast.error(
                    err.response?.data?.message || "Error updating banner!"
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
                `/api/coupon-banners/${remove_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
            if (response.data.success) {
                setmodal_delete(false);
                fetchBanners();
                toast.success("Coupon Banner Deleted Successfully!");
            } else {
                toast.error(response.data.message || "Error deleting banner!");
            }
        } catch (error) {
            console.log(error);
            toast.error(
                error.response?.data?.message || "Error deleting banner!"
            );
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setIsSubmit(false);
        setShowForm(false);
        setUpdateForm(false);
        setValues(initialState);
        setFormErrors({});
        setImageFile(null);
        setImagePreview(null);
        setActiveTab("1");
    };

    const handleList = () => {
        setShowForm(false);
        setUpdateForm(false);
        setIsSubmit(false);
        setValues(initialState);
        setFormErrors({});
        setImageFile(null);
        setImagePreview(null);
        setActiveTab("1");
    };

    const validate = (values) => {
        const errors = {};
        if (!values.title || values.title.trim() === "") {
            errors.title = "Title is required!";
        }
        if (!values.discountValue || values.discountValue === "") {
            errors.discountValue = "Discount value is required!";
        }
        if (
            values.discountType === "PERCENTAGE" &&
            parseFloat(values.discountValue) > 100
        ) {
            errors.discountValue = "Percentage discount cannot exceed 100%!";
        }
        if (!values.startDate) {
            errors.startDate = "Start date is required!";
        }
        if (!values.endDate) {
            errors.endDate = "End date is required!";
        }
        if (values.startDate && values.endDate) {
            if (new Date(values.endDate) <= new Date(values.startDate)) {
                errors.endDate = "End date must be after start date!";
            }
        }
        return errors;
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

    const getBannerStatus = (banner) => {
        const now = new Date();
        const start = new Date(banner.startDate);
        const end = new Date(banner.endDate);

        if (!banner.isActive) {
            return <Badge color="secondary">Inactive</Badge>;
        }
        if (now < start) {
            return <Badge color="info">Scheduled</Badge>;
        }
        if (now > end) {
            return <Badge color="danger">Expired</Badge>;
        }
        return <Badge color="success">Active</Badge>;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
        },
        {
            name: "Title",
            selector: (row) => row.title,
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Discount",
            minWidth: "120px",
            cell: (row) => (
                <div>
                    <span className="fw-bold">
                        {row.discountType === "PERCENTAGE"
                            ? `${row.discountValue}%`
                            : `A$${row.discountValue}`}
                    </span>
                    {row.maxDiscountAmount && (
                        <small className="d-block text-muted">
                            Max: A${row.maxDiscountAmount}
                        </small>
                    )}
                </div>
            ),
        },
        {
            name: "Trigger",
            selector: (row) => row.triggerType,
            sortable: true,
            minWidth: "100px",
            cell: (row) => (
                <Badge color="light" className="text-dark">
                    {row.triggerType?.replace("_", " ")}
                </Badge>
            ),
        },
        {
            name: "Validity",
            minWidth: "160px",
            cell: (row) => (
                <div className="small">
                    <div>{formatDate(row.startDate)}</div>
                    <div className="text-muted">to</div>
                    <div>{formatDate(row.endDate)}</div>
                </div>
            ),
        },
        {
            name: "Leads",
            minWidth: "80px",
            cell: (row) => (
                <span className="fw-bold text-primary">
                    {row._count?.userCoupons || 0}
                </span>
            ),
        },
        {
            name: "Status",
            minWidth: "100px",
            cell: (row) => getBannerStatus(row),
        },
        {
            name: "Action",
            minWidth: "250px",
            cell: (row) => (
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewStats(row.id)}
                    >
                        <i className="ri-bar-chart-2-line"></i>
                    </button>
                    {currentPagePermissions?.edit && (
                        <button
                            className="btn btn-sm btn-success edit-item-btn"
                            onClick={() => handleTog_edit(row.id)}
                        >
                            Edit
                        </button>
                    )}
                    {currentPagePermissions?.delete && (
                        <button
                            className="btn btn-sm btn-danger remove-item-btn"
                            onClick={() => tog_delete(row.id)}
                        >
                            Remove
                        </button>
                    )}
                    {!currentPagePermissions?.edit &&
                        !currentPagePermissions?.delete && (
                            <span className="text-muted">No actions</span>
                        )}
                </div>
            ),
        },
    ];

    const leadsColumns = [
        {
            name: "Email",
            selector: (row) => row.email,
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Code",
            selector: (row) => row.uniqueCode,
            sortable: true,
            minWidth: "100px",
            cell: (row) => <code className="fw-bold">{row.uniqueCode}</code>,
        },
        {
            name: "Status",
            minWidth: "100px",
            cell: (row) =>
                row.isUsed ? (
                    <Badge color="success">Used</Badge>
                ) : (
                    <Badge color="warning">Pending</Badge>
                ),
        },
        {
            name: "Email Sent",
            minWidth: "100px",
            cell: (row) =>
                row.emailSent ? (
                    <i className="ri-check-line text-success fs-5"></i>
                ) : (
                    <i className="ri-close-line text-danger fs-5"></i>
                ),
        },
        {
            name: "Used At",
            selector: (row) => (row.usedAt ? formatDate(row.usedAt) : "-"),
            sortable: true,
            minWidth: "120px",
        },
        {
            name: "Order Amount",
            selector: (row) => (row.orderAmount ? `A$${row.orderAmount}` : "-"),
            sortable: true,
            minWidth: "120px",
        },
        {
            name: "Created",
            selector: (row) => formatDate(row.createdAt),
            sortable: true,
            minWidth: "120px",
        },
    ];

    const exportColumns = [
        { header: "Title", key: "title" },
        { header: "Discount Type", key: "discountType" },
        { header: "Discount Value", key: "discountValue" },
        { header: "Trigger", key: "triggerType" },
        { header: "Start Date", key: "startDate" },
        { header: "End Date", key: "endDate" },
        { header: "Active", key: "isActive" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.post(
                `/api/coupon-banners/list`,
                { page: 1, limit: 10000 },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (response.data.success) return response.data.data || [];
            return [];
        } catch { return []; }
    };

    document.title = `Coupon Banners | ${adminData?.companyName}`;

    const renderForm = () => (
        <CardBody>
            <Col xxl={12}>
                <Card>
                    <CardBody>
                        <div className="live-preview">
                            <Form>
                                <Nav tabs className="mb-3">
                                    <NavItem>
                                        <NavLink
                                            className={classnames({
                                                active: activeTab === "1",
                                            })}
                                            onClick={() => setActiveTab("1")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Basic Info
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({
                                                active: activeTab === "2",
                                            })}
                                            onClick={() => setActiveTab("2")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Display Settings
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTab}>
                                    <TabPane tabId="1">
                                        <Row>
                                            <Col md={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter Title"
                                                        required
                                                        name="title"
                                                        value={values.title}
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Banner Title{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit && (
                                                        <p className="text-danger">
                                                            {formErrors.title}
                                                        </p>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="textarea"
                                                        placeholder="Enter Description"
                                                        name="description"
                                                        value={
                                                            values.description
                                                        }
                                                        onChange={handleChange}
                                                        style={{
                                                            height: "80px",
                                                        }}
                                                    />
                                                    <Label>Description</Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="select"
                                                        name="discountType"
                                                        value={
                                                            values.discountType
                                                        }
                                                        onChange={handleChange}
                                                    >
                                                        <option value="PERCENTAGE">
                                                            Percentage (%)
                                                        </option>
                                                        <option value="FLAT">
                                                            Flat Amount (A$)
                                                        </option>
                                                    </Input>
                                                    <Label>Discount Type</Label>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Enter Discount Value"
                                                        required
                                                        name="discountValue"
                                                        value={
                                                            values.discountValue
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Discount Value{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit && (
                                                        <p className="text-danger">
                                                            {
                                                                formErrors.discountValue
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Max Discount Amount"
                                                        name="maxDiscountAmount"
                                                        value={
                                                            values.maxDiscountAmount
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Max Discount (A$)
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Min Order Amount"
                                                        name="minOrderAmount"
                                                        value={
                                                            values.minOrderAmount
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Min Order Amount (A$)
                                                    </Label>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="datetime-local"
                                                        required
                                                        name="startDate"
                                                        value={values.startDate}
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Start Date{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit && (
                                                        <p className="text-danger">
                                                            {
                                                                formErrors.startDate
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="datetime-local"
                                                        required
                                                        name="endDate"
                                                        value={values.endDate}
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        End Date{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </Label>
                                                    {isSubmit && (
                                                        <p className="text-danger">
                                                            {formErrors.endDate}
                                                        </p>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="textarea"
                                                        placeholder="Enter Terms and Conditions"
                                                        name="termsAndConditions"
                                                        value={
                                                            values.termsAndConditions
                                                        }
                                                        onChange={handleChange}
                                                        style={{
                                                            height: "60px",
                                                        }}
                                                    />
                                                    <Label>
                                                        Terms & Conditions
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="form-check form-switch mb-3">
                                                    <Input
                                                        type="checkbox"
                                                        role="switch"
                                                        name="isActive"
                                                        checked={
                                                            values.isActive
                                                        }
                                                        onChange={handleCheck}
                                                        className="form-check-input"
                                                    />
                                                    <Label className="form-check-label">
                                                        Active
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    <TabPane tabId="2">
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label className="form-label">
                                                        Banner Image
                                                    </Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleImageChange
                                                        }
                                                        className="form-control"
                                                    />
                                                    <small className="text-muted">
                                                        Image will be compressed
                                                        to max 100KB
                                                    </small>
                                                    {imagePreview && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={
                                                                    imagePreview
                                                                }
                                                                alt="Banner Preview"
                                                                style={{
                                                                    maxWidth:
                                                                        "200px",
                                                                    maxHeight:
                                                                        "120px",
                                                                    objectFit:
                                                                        "cover",
                                                                    borderRadius:
                                                                        "4px",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter Button Text"
                                                        name="buttonText"
                                                        value={
                                                            values.buttonText
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label>Button Text</Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="select"
                                                        name="triggerType"
                                                        value={
                                                            values.triggerType
                                                        }
                                                        onChange={handleChange}
                                                    >
                                                        <option value="EXIT_INTENT">
                                                            Exit Intent
                                                        </option>
                                                        <option value="TIME_DELAY">
                                                            Time Delay
                                                        </option>
                                                        <option value="SCROLL">
                                                            Scroll Percentage
                                                        </option>
                                                        <option value="MANUAL">
                                                            Manual Only
                                                        </option>
                                                    </Input>
                                                    <Label>Trigger Type</Label>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Delay in seconds"
                                                        name="triggerDelay"
                                                        value={
                                                            values.triggerDelay
                                                        }
                                                        onChange={handleChange}
                                                        disabled={
                                                            values.triggerType !==
                                                            "TIME_DELAY"
                                                        }
                                                    />
                                                    <Label>
                                                        Delay (seconds)
                                                    </Label>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        placeholder="Scroll percentage"
                                                        name="scrollPercent"
                                                        value={
                                                            values.scrollPercent
                                                        }
                                                        onChange={handleChange}
                                                        disabled={
                                                            values.triggerType !==
                                                            "SCROLL"
                                                        }
                                                    />
                                                    <Label>Scroll %</Label>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="form-floating mb-3">
                                                    <Input
                                                        type="text"
                                                        placeholder="Page slugs (comma-separated)"
                                                        name="showOnPages"
                                                        value={
                                                            values.showOnPages
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                    <Label>
                                                        Show on Pages (empty =
                                                        all)
                                                    </Label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </TabPane>
                                </TabContent>

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
                            </Form>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </CardBody>
    );

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                {isDeleteLoading && <LoadingOverlay fullscreen />}
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Setup"
                        title="Coupon Banners"
                        pageTitle="Lead Generation"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <PageHeader
                    formName="Coupon Banner"
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
                    data={banners}
                    exportColumns={exportColumns}
                    fileName="coupon-banners"
                    fetchAllForExport={fetchAllForExport}
                  />
                                </CardHeader>

                                {showForm || updateForm ? (
                                    renderForm()
                                ) : (
                                    <CardBody>
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={columns}
                                                data={banners}
                                                progressPending={loading}
                                                customStyles={tableCustomStyles}
                                                pagination
                                                paginationServer
                                                paginationTotalRows={totalRows}
                                                paginationDefaultPage={pageNo}
                                                onChangeRowsPerPage={
                                                    handlePerRowsChange
                                                }
                                                onChangePage={handlePageChange}
                                                highlightOnHover
                                                responsive
                                            />
                                        </div>
                                    </CardBody>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Container>

                {/* Delete Modal */}
                <DeleteModal
                    show={modal_delete}
                    handleClose={handleDeleteClose}
                    handleDelete={handleDelete}
                />

                {/* Stats Modal */}
                <Modal
                    isOpen={modal_stats}
                    toggle={() => setmodal_stats(!modal_stats)}
                    centered
                    size="xl"
                >
                    <ModalHeader
                        className="bg-light p-3"
                        toggle={() => setmodal_stats(!modal_stats)}
                    >
                        Banner Analytics
                    </ModalHeader>
                    <ModalBody>
                        {stats && (
                            <>
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="bg-primary text-white">
                                            <CardBody className="text-center">
                                                <h3 className="mb-1 text-white">
                                                    {stats.totalLeads}
                                                </h3>
                                                <p className="mb-0 text-white">
                                                    Total Leads
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="bg-success text-white">
                                            <CardBody className="text-center">
                                                <h3 className="mb-1 text-white">
                                                    {stats.usedCoupons}
                                                </h3>
                                                <p className="mb-0 text-white">
                                                    Conversions
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="bg-info text-white">
                                            <CardBody className="text-center">
                                                <h3 className="mb-1 text-white">
                                                    {stats.conversionRate}
                                                </h3>
                                                <p className="mb-0 text-white">
                                                    Conversion Rate
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="bg-warning text-white">
                                            <CardBody className="text-center">
                                                <h3 className="mb-1 text-white">
                                                    A$
                                                    {stats.totalRevenue?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </h3>
                                                <p className="mb-0 text-white">
                                                    Total Revenue
                                                </p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                <h5 className="mb-3">Recent Leads</h5>
                                <DataTable
                                    columns={leadsColumns}
                                    data={leads}
                                    pagination
                                    highlightOnHover
                                    responsive
                                />
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="secondary"
                            onClick={() => setmodal_stats(false)}
                        >
                            Close
                        </Button>
                        <Button color="primary" onClick={handleExportLeads}>
                            <i className="ri-download-2-line me-1"></i>
                            Export Leads
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default CouponBannerMaster;
