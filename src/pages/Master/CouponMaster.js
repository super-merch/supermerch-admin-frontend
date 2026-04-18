import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Label,
    Input,
    Row,
    Badge,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";

import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import tableCustomStyles from "../../Components/Common/tableStyles";
import PageHeader from "../../Components/Common/PageHeader";


const initialState = {
    title: "",
    code: "",
    discountPercentage: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    startDate: "",
    endDate: "",
    maxRedemptions: "",
    maxPerUser: "1",
    isActive: true,
    description: "",
    termsAndConditions: "",
};

const CouponMaster = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);
    const [query, setQuery] = useState("");

    const [_id, set_Id] = useState("");
    const [remove_id, setRemove_id] = useState("");

    const [coupons, setCoupons] = useState([]);

    useEffect(() => {
        if (Object.keys(formErrors).length === 0 && isSubmit) {
            console.log("no errors");
        }
    }, [formErrors, isSubmit]);

    const [modal_list, setmodal_list] = useState(false);
    const tog_list = () => {
        setmodal_list(!modal_list);
        setValues(initialState);
        setIsSubmit(false);
        setFormErrors({});
    };

    const [modal_delete, setmodal_delete] = useState(false);
    const tog_delete = (_id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(_id);
    };

    const [modal_edit, setmodal_edit] = useState(false);
    const handleTog_edit = (_id) => {
        setmodal_edit(!modal_edit);
        setIsSubmit(false);
        setFormErrors({});
        set_Id(_id);
        setLoading(true);
        axios
            .get(`/api/coupons/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => {
                if (res.data.success) {
                    const coupon = res.data.data;
                    setValues({
                        title: coupon.title || "",
                        code: coupon.code || "",
                        discountPercentage:
                            coupon.discountPercentage?.toString() || "",
                        maxDiscountAmount:
                            coupon.maxDiscountAmount?.toString() || "",
                        minOrderAmount: coupon.minOrderAmount?.toString() || "",
                        startDate: coupon.startDate
                            ? new Date(coupon.startDate)
                                  .toISOString()
                                  .slice(0, 16)
                            : "",
                        endDate: coupon.endDate
                            ? new Date(coupon.endDate)
                                  .toISOString()
                                  .slice(0, 16)
                            : "",
                        maxRedemptions: coupon.maxRedemptions?.toString() || "",
                        maxPerUser: coupon.maxPerUser?.toString() || "1",
                        isActive: coupon.isActive,
                        description: coupon.description || "",
                        termsAndConditions: coupon.termsAndConditions || "",
                    });
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Error fetching coupon data!");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleCheck = (e) => {
        setValues({ ...values, isActive: e.target.checked });
    };

    const handleSubmitCancel = () => {
        setmodal_list(false);
        setValues(initialState);
        setIsSubmit(false);
        setFormErrors({});
    };

    const handleClick = (e) => {
        e.preventDefault();
        setFormErrors({});
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);
        if (Object.keys(errors).length === 0) {
            setLoading(true);
            axios
                .post(
                    `/api/coupons`,
                    {
                        title: values.title,
                        code: values.code.toUpperCase(),
                        discountPercentage: parseFloat(
                            values.discountPercentage
                        ),
                        maxDiscountAmount: values.maxDiscountAmount
                            ? parseFloat(values.maxDiscountAmount)
                            : null,
                        minOrderAmount: values.minOrderAmount
                            ? parseFloat(values.minOrderAmount)
                            : null,
                        startDate: values.startDate,
                        endDate: values.endDate,
                        maxRedemptions: values.maxRedemptions
                            ? parseInt(values.maxRedemptions)
                            : null,
                        maxPerUser: values.maxPerUser
                            ? parseInt(values.maxPerUser)
                            : 1,
                        isActive: values.isActive,
                        description: values.description || null,
                        termsAndConditions: values.termsAndConditions || null,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                )
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Coupon Added Successfully!");
                        setmodal_list(!modal_list);
                        setValues(initialState);
                        fetchCoupons();
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast.error(
                        error.response?.data?.message || "Error adding coupon!"
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setLoading(true);
        axios
            .delete(`/api/coupons/${remove_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchCoupons();
                    toast.success("Coupon Removed Successfully!");
                }
            })
            .catch((err) => {
                console.log(err);
                setmodal_delete(false);
                toast.error(
                    err.response?.data?.message ||
                        "Failed to delete coupon. Please try again."
                );
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleUpdateCancel = (e) => {
        setmodal_edit(false);
        setIsSubmit(false);
        setFormErrors({});
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);
        if (Object.keys(errors).length === 0) {
            setLoading(true);
            axios
                .put(
                    `/api/coupons/${_id}`,
                    {
                        title: values.title,
                        code: values.code.toUpperCase(),
                        discountPercentage: parseFloat(
                            values.discountPercentage
                        ),
                        maxDiscountAmount: values.maxDiscountAmount
                            ? parseFloat(values.maxDiscountAmount)
                            : null,
                        minOrderAmount: values.minOrderAmount
                            ? parseFloat(values.minOrderAmount)
                            : null,
                        startDate: values.startDate,
                        endDate: values.endDate,
                        maxRedemptions: values.maxRedemptions
                            ? parseInt(values.maxRedemptions)
                            : null,
                        maxPerUser: values.maxPerUser
                            ? parseInt(values.maxPerUser)
                            : 1,
                        isActive: values.isActive,
                        description: values.description || null,
                        termsAndConditions: values.termsAndConditions || null,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                )
                .then((res) => {
                    if (res.data.success) {
                        setmodal_edit(!modal_edit);
                        fetchCoupons();
                        toast.success("Coupon Updated Successfully!");
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message || "Error updating coupon!"
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    const validate = (values) => {
        const errors = {};

        if (!values.title || values.title.trim() === "") {
            errors.title = "Title is required!";
        }

        if (!values.code || values.code.trim() === "") {
            errors.code = "Code is required!";
        } else if (!/^[A-Za-z0-9]+$/.test(values.code)) {
            errors.code = "Code must be alphanumeric only!";
        }

        if (!values.discountPercentage || values.discountPercentage === "") {
            errors.discountPercentage = "Discount percentage is required!";
        } else if (isNaN(values.discountPercentage)) {
            errors.discountPercentage = "Must be a valid number!";
        } else if (
            parseFloat(values.discountPercentage) <= 0 ||
            parseFloat(values.discountPercentage) > 100
        ) {
            errors.discountPercentage = "Must be between 0 and 100!";
        }

        if (values.maxDiscountAmount && isNaN(values.maxDiscountAmount)) {
            errors.maxDiscountAmount = "Must be a valid number!";
        }

        if (values.minOrderAmount && isNaN(values.minOrderAmount)) {
            errors.minOrderAmount = "Must be a valid number!";
        }

        if (!values.startDate) {
            errors.startDate = "Start date is required!";
        }

        if (!values.endDate) {
            errors.endDate = "End date is required!";
        }

        if (values.startDate && values.endDate) {
            const start = new Date(values.startDate);
            const end = new Date(values.endDate);
            if (end <= start) {
                errors.endDate = "End date must be after start date!";
            }
        }

        if (
            values.maxRedemptions &&
            (isNaN(values.maxRedemptions) ||
                parseInt(values.maxRedemptions) < 1)
        ) {
            errors.maxRedemptions = "Must be a positive number!";
        }

        if (
            values.maxPerUser &&
            (isNaN(values.maxPerUser) || parseInt(values.maxPerUser) < 1)
        ) {
            errors.maxPerUser = "Must be a positive number!";
        }

        return errors;
    };

    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(0);
    const [column, setcolumn] = useState();
    const [sortDirection, setsortDirection] = useState();

    const handleSort = (column, sortDirection) => {
        setcolumn(column.sortField);
        setsortDirection(sortDirection);
    };

    const fetchCoupons = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.post(
                `/api/coupons/list`,
                {
                    page: pageNo || 1,
                    limit: perPage || 100,
                    isActive: filter ? true : undefined,
                    search: query || undefined,
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
                setCoupons(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);
            } else {
                setCoupons([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
            setCoupons([]);
            setTotalRows(0);
            toast.error("Failed to fetch coupons!");
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, filter, query]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
    };

    const handleFilter = (e) => {
        setFilter(e.target.checked);
    };

    const getCouponStatus = (coupon) => {
        const now = new Date();
        const start = new Date(coupon.startDate);
        const end = new Date(coupon.endDate);

        if (!coupon.isActive) {
            return <Badge color="secondary">Inactive</Badge>;
        }
        if (now < start) {
            return <Badge color="info">Scheduled</Badge>;
        }
        if (now > end) {
            return <Badge color="danger">Expired</Badge>;
        }
        if (
            coupon.maxRedemptions &&
            coupon.totalRedemptions >= coupon.maxRedemptions
        ) {
            return <Badge color="warning">Limit Reached</Badge>;
        }
        return <Badge color="success">Active</Badge>;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const col = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
        },
        {
            name: "Code",
            selector: (row) => row.code,
            sortable: true,
            minWidth: "100px",
            cell: (row) => (
                <span className="fw-bold text-primary">{row.code}</span>
            ),
        },
        {
            name: "Title",
            selector: (row) => row.title,
            sortable: true,
            minWidth: "150px",
        },
        {
            name: "Discount",
            selector: (row) => `${row.discountPercentage}%`,
            sortable: true,
            minWidth: "80px",
            cell: (row) => (
                <div>
                    <span className="fw-bold">{row.discountPercentage}%</span>
                    {row.maxDiscountAmount && (
                        <small className="d-block text-muted">
                            Max: A${row.maxDiscountAmount}
                        </small>
                    )}
                </div>
            ),
        },
        {
            name: "Min Order",
            selector: (row) =>
                row.minOrderAmount ? `A$${row.minOrderAmount}` : "-",
            sortable: true,
            minWidth: "90px",
        },
        {
            name: "Validity",
            minWidth: "180px",
            cell: (row) => (
                <div className="small">
                    <div>{formatDate(row.startDate)}</div>
                    <div className="text-muted">to</div>
                    <div>{formatDate(row.endDate)}</div>
                </div>
            ),
        },
        {
            name: "Redemptions",
            minWidth: "100px",
            cell: (row) => (
                <div>
                    <span className="fw-bold">{row.totalRedemptions || 0}</span>
                    <span className="text-muted">
                        /{row.maxRedemptions || "∞"}
                    </span>
                </div>
            ),
        },
        {
            name: "Status",
            minWidth: "100px",
            cell: (row) => getCouponStatus(row),
        },
        {
            name: "Action",
            selector: (row) => {
                return (
                    <React.Fragment>
                        <div className="d-flex gap-2">
                            <div className="edit">
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
                            </div>
                            <div className="remove">
                                {currentPagePermissions.delete &&
                                    row._count?.redemptions === 0 && (
                                        <button
                                            className="btn btn-sm btn-danger remove-item-btn"
                                            data-bs-toggle="modal"
                                            data-bs-target="#deleteRecordModal"
                                            onClick={() => tog_delete(row.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                            </div>
                            {!currentPagePermissions.edit &&
                                !currentPagePermissions.delete && (
                                    <span className="text-muted">
                                        No actions available
                                    </span>
                                )}
                        </div>
                    </React.Fragment>
                );
            },
            sortable: false,
            minWidth: "180px",
        },
    ];

    const exportColumns = [
        { header: "Code", key: "code" },
        { header: "Title", key: "title" },
        { header: "Discount %", key: "discountPercentage" },
        { header: "Max Discount", key: "maxDiscountAmount" },
        { header: "Min Order", key: "minOrderAmount" },
        { header: "Start Date", key: "startDate" },
        { header: "End Date", key: "endDate" },
        { header: "Redemptions", key: "totalRedemptions" },
        { header: "Active", key: "isActive" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.post(
                `/api/coupons/list`,
                { page: 1, limit: 10000 },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (response.data.success) return response.data.data || [];
            return [];
        } catch { return []; }
    };

    document.title = `Coupon Master | ${adminData?.companyName}`;

    const renderForm = () => (
        <>
            <Row>
                <Col md={6}>
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
                            Title <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">{formErrors.title}</p>
                        )}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="text"
                            placeholder="Enter Code"
                            required
                            name="code"
                            value={values.code}
                            onChange={handleChange}
                            style={{ textTransform: "uppercase" }}
                        />
                        <Label>
                            Coupon Code <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">{formErrors.code}</p>
                        )}
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
                            max="100"
                            placeholder="Enter Discount %"
                            required
                            name="discountPercentage"
                            value={values.discountPercentage}
                            onChange={handleChange}
                        />
                        <Label>
                            Discount Percentage{" "}
                            <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.discountPercentage}
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
                            value={values.maxDiscountAmount}
                            onChange={handleChange}
                        />
                        <Label>Max Discount Amount (A$)</Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.maxDiscountAmount}
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
                            placeholder="Min Order Amount"
                            name="minOrderAmount"
                            value={values.minOrderAmount}
                            onChange={handleChange}
                        />
                        <Label>Min Order Amount (A$)</Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.minOrderAmount}
                            </p>
                        )}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="datetime-local"
                            required
                            name="startDate"
                            value={values.startDate}
                            onChange={handleChange}
                        />
                        <Label>
                            Start Date <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.startDate}
                            </p>
                        )}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="datetime-local"
                            required
                            name="endDate"
                            value={values.endDate}
                            onChange={handleChange}
                        />
                        <Label>
                            End Date <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">{formErrors.endDate}</p>
                        )}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="number"
                            min="1"
                            placeholder="Max Total Redemptions"
                            name="maxRedemptions"
                            value={values.maxRedemptions}
                            onChange={handleChange}
                        />
                        <Label>
                            Max Total Redemptions (leave empty for unlimited)
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.maxRedemptions}
                            </p>
                        )}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="number"
                            min="1"
                            placeholder="Max Per User"
                            name="maxPerUser"
                            value={values.maxPerUser}
                            onChange={handleChange}
                        />
                        <Label>Max Redemptions Per User</Label>
                        {isSubmit && (
                            <p className="text-danger">
                                {formErrors.maxPerUser}
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
                            value={values.description}
                            onChange={handleChange}
                            style={{ height: "80px" }}
                        />
                        <Label>Description (Internal Notes)</Label>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <div className="form-floating mb-3">
                        <Input
                            type="textarea"
                            placeholder="Enter Terms & Conditions"
                            name="termsAndConditions"
                            value={values.termsAndConditions}
                            onChange={handleChange}
                            style={{ height: "80px" }}
                        />
                        <Label>Terms & Conditions (Shown to customers)</Label>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <div className="form-check form-switch mb-3">
                        <Input
                            className="form-check-input"
                            type="checkbox"
                            id="isActive"
                            checked={values.isActive}
                            onChange={handleCheck}
                        />
                        <Label className="form-check-label" htmlFor="isActive">
                            Active
                        </Label>
                    </div>
                </Col>
            </Row>
        </>
    );

    return (
        <React.Fragment>
            <ToastContainer />
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Coupons"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <PageHeader
                    formName="Coupon"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    showAddButton={
                                            currentPagePermissions.write
                                        }
                    data={coupons}
                    exportColumns={exportColumns}
                    fileName="coupons"
                    fetchAllForExport={fetchAllForExport}
                  />
                                </CardHeader>

                                <CardBody>
                                    <div id="customerList">
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={col}
                                                data={coupons}
                                                progressPending={loading}
                                                customStyles={tableCustomStyles}
                                                sortServer
                                                onSort={(
                                                    column,
                                                    sortDirection,
                                                    sortedRows
                                                ) => {
                                                    handleSort(
                                                        column,
                                                        sortDirection
                                                    );
                                                }}
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
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={modal_list}
                toggle={() => {
                    tog_list();
                }}
                centered
                size="lg"
            >
                <ModalHeader
                    className="bg-light p-3"
                    toggle={() => {
                        setmodal_list(false);
                        setIsSubmit(false);
                    }}
                >
                    Add Coupon
                </ModalHeader>
                <form>
                    <ModalBody>{renderForm()}</ModalBody>
                    <ModalFooter>
                        <FormsFooter
                            handleSubmit={handleClick}
                            handleSubmitCancel={handleSubmitCancel}
                        />
                    </ModalFooter>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={modal_edit}
                toggle={() => {
                    handleTog_edit();
                }}
                centered
                size="lg"
            >
                <ModalHeader
                    className="bg-light p-3"
                    toggle={() => {
                        setmodal_edit(false);
                        setIsSubmit(false);
                    }}
                >
                    Edit Coupon
                </ModalHeader>
                <form>
                    <ModalBody>{renderForm()}</ModalBody>
                    <ModalFooter>
                        <FormUpdateFooter
                            handleUpdate={handleUpdate}
                            handleUpdateCancel={handleUpdateCancel}
                        />
                    </ModalFooter>
                </form>
            </Modal>

            <DeleteModal
                show={modal_delete}
                handleDelete={handleDelete}
                toggle={handleDeleteClose}
                setmodal_delete={setmodal_delete}
            />
        </React.Fragment>
    );
};

export default CouponMaster;
