import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Col,
    Container,
    CardHeader,
    Row,
    Label,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { MenuContext } from "../../context/MenuContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import DeleteModal from "../../Components/Common/DeleteModal";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";

const initialState = {
    name: "",
    code: "",
    description: "",
    estimatedDays: "",
    estimatedDaysMin: "",
    estimatedDaysMax: "",
    // New fields for customized items
    estimatedDaysCustomizedMin: "",
    estimatedDaysCustomizedMax: "",
    dispatchCutoffHour: "13",
    dispatchCutoffTimezone: "Europe/London",
    isChargeable: false,
    deliveryCharge: "0",
    freeDeliveryMinOrder: "",
    sortOrder: "0",
    applyToAll: false,
    isActive: true,
};

const DeliveryType = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);

    const [referenceModal, setReferenceModal] = useState(false);
    const [referenceData, setReferenceData] = useState(null);

    const [query, setQuery] = useState("");

    const [_id, set_Id] = useState("");
    const [remove_id, setRemove_id] = useState("");

    const [deliveryTypes, setDeliveryTypes] = useState([]);

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
    };

    const [modal_delete, setmodal_delete] = useState(false);
    const tog_delete = (_id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(_id);
    };

    const [modal_edit, setmodal_edit] = useState(false);
    const handleTog_edit = async (_id) => {
        // If closing the modal (no ID provided), just toggle and reset
        if (!_id) {
            setmodal_edit(false);
            setIsSubmit(false);
            setValues(initialState);
            return;
        }

        // Opening the modal with an ID
        setmodal_edit(true);
        setIsSubmit(false);
        set_Id(_id);
        setLoading(true);

        try {
            const response = await axios.get(`/api/delivery-types/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const data = response.data.data;
                setValues({
                    name: data.name || "",
                    code: data.code || "",
                    description: data.description || "",
                    estimatedDays: data.estimatedDays?.toString() || "",
                    estimatedDaysMin: data.estimatedDaysMin?.toString() || "",
                    estimatedDaysMax: data.estimatedDaysMax?.toString() || "",
                    estimatedDaysCustomizedMin:
                        data.estimatedDaysCustomizedMin?.toString() || "",
                    estimatedDaysCustomizedMax:
                        data.estimatedDaysCustomizedMax?.toString() || "",
                    dispatchCutoffHour:
                        data.dispatchCutoffHour?.toString() || "13",
                    dispatchCutoffTimezone:
                        data.dispatchCutoffTimezone || "Europe/London",
                    isChargeable: data.isChargeable || false,
                    deliveryCharge: data.deliveryCharge?.toString() || "0",
                    freeDeliveryMinOrder:
                        data.freeDeliveryMinOrder?.toString() || "",
                    sortOrder: data.sortOrder?.toString() || "0",
                    applyToAll: data.applyToAll || false,
                    isActive: data.isActive,
                });
            } else {
                toast.error("Error fetching delivery type data!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching delivery type data!");
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        let { name, value } = e.target;
        setValues({ ...values, [name]: value });

        // Auto-generate code from name
        if (name === "name") {
            const code = value
                .toUpperCase()
                .replace(/[^A-Z0-9\s]/g, "")
                .replace(/\s+/g, "_")
                .substring(0, 20);
            setValues((prev) => ({ ...prev, name: value, code }));
        }
    };

    const handleCheck = (e) => {
        const { name, checked } = e.target;
        setValues({ ...values, [name]: checked });
    };

    const handleSubmitCancel = () => {
        setmodal_list(false);
        setValues(initialState);
        setIsSubmit(false);
    };

    const handleClick = async (e) => {
        e.preventDefault();
        setFormErrors({});
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setLoading(true);
            try {
                const response = await axios.post(
                    `/api/delivery-types`,
                    values,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );

                if (response.data.success) {
                    setmodal_list(!modal_list);
                    fetchDeliveryTypes();
                    toast.success(response.data.message);
                    setValues(initialState);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                console.log(error);
                toast.error(
                    error.response?.data?.message ||
                        "Error adding delivery type!"
                );
            }
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.delete(
                `/api/delivery-types/${remove_id}`,
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
                fetchDeliveryTypes();
                toast.success(response.data.message);
            } else if (response.status === 409) {
                setReferenceData(response.data);
                setReferenceModal(true);
            } else {
                toast.error(
                    response.data.message || "Error deleting delivery type!"
                );
            }
        } catch (err) {
            console.log(err);
            setmodal_delete(false);

            if (err.response && err.response.status === 409) {
                setReferenceData(err.response.data);
                setReferenceModal(true);
            } else {
                toast.error(
                    err.response?.data?.message ||
                        "Failed to delete delivery type. Please try again."
                );
            }
        }
        setLoading(false);
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        let errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setLoading(true);
            try {
                const response = await axios.put(
                    `/api/delivery-types/${_id}`,
                    values,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );

                if (response.data.success) {
                    toast.success(response.data.message);
                    setmodal_edit(!modal_edit);
                    fetchDeliveryTypes();
                    setValues(initialState);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                console.error(error);
                toast.error(
                    error.response?.data?.message ||
                        "Error updating delivery type!"
                );
            }
            setLoading(false);
        }
    };

    const validate = (values) => {
        const errors = {};

        if (!values.name || values.name.trim() === "") {
            errors.name = "Delivery Type Name is required!";
        }

        if (!values.code || values.code.trim() === "") {
            errors.code = "Delivery Type Code is required!";
        }

        if (
            values.isChargeable &&
            (!values.deliveryCharge || parseFloat(values.deliveryCharge) < 0)
        ) {
            errors.deliveryCharge = "Please enter a valid delivery charge!";
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

    const fetchDeliveryTypes = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page: pageNo || 1,
                limit: perPage || 100,
                search: query || "",
                isActive: filter,
            };

            const response = await axios.get(
                `/api/listbyparams/delivery-types`,
                {
                    params,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                setDeliveryTypes(response.data.data);
                setTotalRows(response.data.pagination.totalCount);
            } else {
                setDeliveryTypes([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching delivery types:", error);
            setDeliveryTypes([]);
            setTotalRows(0);
            toast.error("Failed to fetch delivery types!");
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query, filter]);

    useEffect(() => {
        fetchDeliveryTypes();
    }, [fetchDeliveryTypes]);

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handleReferenceModalClose = () => {
        setReferenceModal(false);
        setReferenceData(null);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
    };

    const handleFilter = (e) => {
        setFilter(e.target.checked);
    };

    const col = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
            maxWidth: "70px",
        },
        {
            name: "Name",
            selector: (row) => (
                <div>
                    <strong>{row.name}</strong>
                    {row.applyToAll && (
                        <Badge color="primary" className="ms-2">
                            Apply to All
                        </Badge>
                    )}
                    <br />
                    <small className="text-muted">Code: {row.code}</small>
                </div>
            ),
            minWidth: "220px",
        },
        {
            name: "Estimated Delivery",
            selector: (row) => {
                if (row.estimatedDaysMin && row.estimatedDaysMax) {
                    return `${row.estimatedDaysMin}-${row.estimatedDaysMax} days`;
                } else if (row.estimatedDays) {
                    return `${row.estimatedDays} days`;
                }
                return "-";
            },
            minWidth: "130px",
        },
        {
            name: "Charge",
            selector: (row) => (
                <div>
                    {row.isChargeable ? (
                        <>
                            <Badge color="warning" className="text-white">
                                A${parseFloat(row.deliveryCharge).toFixed(2)}
                            </Badge>
                            {row.freeDeliveryMinOrder && (
                                <div>
                                    <small className="text-success">
                                        Free over A$
                                        {parseFloat(
                                            row.freeDeliveryMinOrder
                                        ).toFixed(2)}
                                    </small>
                                </div>
                            )}
                        </>
                    ) : (
                        <Badge color="success" className="text-white">
                            Free
                        </Badge>
                    )}
                </div>
            ),
            minWidth: "130px",
        },
        {
            name: "Sort Order",
            selector: (row) => row.sortOrder,
            maxWidth: "100px",
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
                        </div>
                    </React.Fragment>
                );
            },
            sortable: false,
            minWidth: "180px",
        },
    ];

    const renderFormFields = () => (
        <>
            <Row>
                <Col lg={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="text"
                            placeholder="Enter Delivery Type Name"
                            required
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                        />
                        <Label>
                            Delivery Type Name{" "}
                            <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">{formErrors.name}</p>
                        )}
                    </div>
                </Col>
                <Col lg={6}>
                    <div className="form-floating mb-3">
                        <Input
                            type="text"
                            placeholder="Enter Code"
                            required
                            name="code"
                            value={values.code}
                            onChange={handleChange}
                        />
                        <Label>
                            Code <span className="text-danger">*</span>
                        </Label>
                        {isSubmit && (
                            <p className="text-danger">{formErrors.code}</p>
                        )}
                    </div>
                </Col>
            </Row>

            <div className="form-floating mb-3">
                <Input
                    type="textarea"
                    placeholder="Enter Description"
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    style={{ height: "80px" }}
                />
                <Label>Description</Label>
            </div>

            <Row>
                <Col lg={4}>
                    <div className="form-floating mb-3">
                        <Input
                            type="number"
                            placeholder="Min Days"
                            name="estimatedDaysMin"
                            value={values.estimatedDaysMin}
                            onChange={handleChange}
                            min="0"
                        />
                        <Label>Standard Delivery (Min Days)</Label>
                    </div>
                </Col>
                <Col lg={4}>
                    <div className="form-floating mb-3">
                        <Input
                            type="number"
                            placeholder="Max Days"
                            name="estimatedDaysMax"
                            value={values.estimatedDaysMax}
                            onChange={handleChange}
                            min="0"
                        />
                        <Label>Standard Delivery (Max Days)</Label>
                    </div>
                </Col>
                <Col lg={4}>
                    <div className="form-floating mb-3">
                        <Input
                            type="number"
                            placeholder="Sort Order"
                            name="sortOrder"
                            value={values.sortOrder}
                            onChange={handleChange}
                            min="0"
                        />
                        <Label>Sort Order</Label>
                    </div>
                </Col>
            </Row>

            {/* Customized Item Delivery Estimates */}
            <div className="mb-3 p-3 border rounded bg-light-subtle">
                <h6 className="mb-3">📦 Customized Item Delivery</h6>
                <small className="text-muted d-block mb-3">
                    Separate delivery estimates for items with customization
                    (embroidery/printing)
                </small>
                <Row>
                    <Col lg={6}>
                        <div className="form-floating mb-3">
                            <Input
                                type="number"
                                placeholder="Min Days for Customized"
                                name="estimatedDaysCustomizedMin"
                                value={values.estimatedDaysCustomizedMin}
                                onChange={handleChange}
                                min="0"
                            />
                            <Label>Customized Delivery (Min Days)</Label>
                        </div>
                    </Col>
                    <Col lg={6}>
                        <div className="form-floating mb-3">
                            <Input
                                type="number"
                                placeholder="Max Days for Customized"
                                name="estimatedDaysCustomizedMax"
                                value={values.estimatedDaysCustomizedMax}
                                onChange={handleChange}
                                min="0"
                            />
                            <Label>Customized Delivery (Max Days)</Label>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Dispatch Cut-off Settings */}
            <div className="mb-3 p-3 border rounded bg-info-subtle">
                <h6 className="mb-3">⏰ Dispatch Cut-off Settings</h6>
                <small className="text-muted d-block mb-3">
                    Orders placed before the cut-off time are dispatched the
                    same day
                </small>
                <Row>
                    <Col lg={6}>
                        <div className="form-floating mb-3">
                            <Input
                                type="select"
                                name="dispatchCutoffHour"
                                value={values.dispatchCutoffHour}
                                onChange={handleChange}
                            >
                                {[...Array(24)].map((_, i) => (
                                    <option key={i} value={i}>
                                        {i === 0
                                            ? "12:00 AM (Midnight)"
                                            : i < 12
                                            ? `${i}:00 AM`
                                            : i === 12
                                            ? "12:00 PM (Noon)"
                                            : `${i - 12}:00 PM`}
                                    </option>
                                ))}
                            </Input>
                            <Label>Dispatch Cut-off Time</Label>
                        </div>
                    </Col>
                    <Col lg={6}>
                        <div className="form-floating mb-3">
                            <Input
                                type="select"
                                name="dispatchCutoffTimezone"
                                value={values.dispatchCutoffTimezone}
                                onChange={handleChange}
                            >
                                <option value="Europe/London">
                                    UK (Europe/London)
                                </option>
                                <option value="UTC">UTC</option>
                            </Input>
                            <Label>Timezone</Label>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="mb-3 p-3 border rounded bg-light">
                <div className="form-check form-switch mb-3">
                    <Input
                        type="checkbox"
                        className="form-check-input"
                        id="isChargeable"
                        name="isChargeable"
                        checked={values.isChargeable}
                        onChange={handleCheck}
                    />
                    <Label className="form-check-label" htmlFor="isChargeable">
                        <strong>Is Chargeable?</strong>
                    </Label>
                </div>

                {values.isChargeable && (
                    <Row>
                        <Col lg={6}>
                            <div className="form-floating mb-3">
                                <Input
                                    type="number"
                                    placeholder="Delivery Charge"
                                    name="deliveryCharge"
                                    value={values.deliveryCharge}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                                <Label>
                                    Delivery Charge (A$){" "}
                                    <span className="text-danger">*</span>
                                </Label>
                                {isSubmit && (
                                    <p className="text-danger">
                                        {formErrors.deliveryCharge}
                                    </p>
                                )}
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="form-floating mb-3">
                                <Input
                                    type="number"
                                    placeholder="Min Order for Free Delivery"
                                    name="freeDeliveryMinOrder"
                                    value={values.freeDeliveryMinOrder}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                                <Label>Free Delivery Min Order (A$)</Label>
                                <small className="text-muted">
                                    Leave empty if no free threshold
                                </small>
                            </div>
                        </Col>
                    </Row>
                )}
            </div>

            <div className="mb-3">
                <Input
                    type="checkbox"
                    className="form-check-input"
                    id="applyToAll"
                    name="applyToAll"
                    checked={values.applyToAll}
                    onChange={handleCheck}
                />
                <Label className="form-check-label ms-2" htmlFor="applyToAll">
                    <strong>Apply to All Products</strong>
                    <small className="d-block text-muted">
                        When enabled, this delivery type will be automatically
                        pre-selected when adding new products or deals in the
                        admin panel
                    </small>
                </Label>
            </div>

            <div className="mb-3">
                <Input
                    type="checkbox"
                    className="form-check-input"
                    id="isActive"
                    name="isActive"
                    checked={values.isActive}
                    onChange={handleCheck}
                />
                <Label className="form-check-label ms-2" htmlFor="isActive">
                    Is Active
                </Label>
            </div>
        </>
    );

    document.title = `Delivery Type | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Delivery Type"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="Delivery Type"
                                        filter={filter}
                                        handleFilter={handleFilter}
                                        tog_list={tog_list}
                                        setQuery={setQuery}
                                        currentPagePermissions={
                                            currentPagePermissions
                                        }
                                        showAddButton={
                                            currentPagePermissions.write
                                        }
                                    />
                                </CardHeader>

                                <CardBody>
                                    <div id="customerList">
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={col}
                                                data={deliveryTypes}
                                                progressPending={loading}
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
                    Add Delivery Type
                </ModalHeader>
                <form>
                    <ModalBody>{renderFormFields()}</ModalBody>
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
                    Edit Delivery Type
                </ModalHeader>
                <form>
                    <ModalBody>{renderFormFields()}</ModalBody>
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

            <ReferenceErrorModal
                isOpen={referenceModal}
                toggle={handleReferenceModalClose}
                title="Cannot Delete Delivery Type"
                referenceData={referenceData}
            />
        </React.Fragment>
    );
};

export default DeliveryType;
