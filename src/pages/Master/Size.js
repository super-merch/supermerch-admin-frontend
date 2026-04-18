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
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import Select from "react-select";
import tableCustomStyles from "../../Components/Common/tableStyles";
import PageHeader from "../../Components/Common/PageHeader";


const initialState = {
    name: "",
    category: null,
    sortOrder: 0,
    isActive: true,
};

const Size = () => {
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

    const [sizes, setSizes] = useState([]);
    const [sizeCategories, setSizeCategories] = useState([]);

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
        setmodal_edit(!modal_edit);
        setIsSubmit(false);
        set_Id(_id);
        setLoading(true);

        try {
            const response = await axios.get(`/api/sizes/${_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const data = response.data.data;

                // Find the matching category option
                const selectedCategory = sizeCategories.find(
                    (cat) => cat.value === data.category
                );

                setValues({
                    ...values,
                    name: data.name,
                    category: selectedCategory,
                    sortOrder: data.sortOrder || 0,
                    isActive: data.isActive,
                });
            } else {
                toast.error("Error fetching size data!");
            }
        } catch (error) {
            console.error("Error fetching size:", error);
            toast.error("Error fetching size data!");
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "name") {
            value = value.replace(/[^a-zA-Z0-9\s]/g, "");
        }
        setValues({ ...values, [e.target.name]: value });
    };

    const handleCategoryChange = (selectedOption) => {
        setValues({ ...values, category: selectedOption });
    };

    const handleCheck = (e) => {
        setValues({ ...values, isActive: e.target.checked });
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
                const payload = {
                    name: values.name,
                    category: values.category?.value,
                    sortOrder: parseInt(values.sortOrder) || 0,
                    isActive: values.isActive,
                };

                const response = await axios.post(`/api/sizes`, payload, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                });

                if (response.data.success) {
                    toast.success(response.data.message);
                    setmodal_list(!modal_list);
                    setValues(initialState);
                    fetchSizes();
                } else {
                    toast.error("Error adding size!");
                }
            } catch (error) {
                console.log(error);
                toast.error(
                    error.response?.data?.message || "Error adding size!"
                );
            }
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.delete(`/api/sizes/${remove_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setmodal_delete(!modal_delete);
                fetchSizes();
                toast.success(response.data.message);
            } else {
                if (response.status === 409) {
                    setReferenceData(response.data);
                    setReferenceModal(true);
                } else {
                    toast.error("Error deleting size!");
                }
            }
        } catch (err) {
            console.log(err);
            setmodal_delete(false);

            if (err.response && err.response.status === 409) {
                // Handle reference error
                setReferenceData(err.response.data);
                setReferenceModal(true);
            } else {
                toast.error("Failed to delete size. Please try again.");
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
        let erros = validate(values);
        setFormErrors(erros);
        setIsSubmit(true);
        if (Object.keys(erros).length === 0) {
            setLoading(true);

            try {
                const payload = {
                    name: values.name,
                    category: values.category?.value,
                    sortOrder: parseInt(values.sortOrder) || 0,
                    isActive: values.isActive,
                };

                const response = await axios.put(`/api/sizes/${_id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                });

                if (response.data.success) {
                    toast.success(response.data.message);
                    setmodal_edit(!modal_edit);
                    setValues(initialState);
                    fetchSizes();
                } else {
                    toast.error("Error updating size!");
                }
            } catch (error) {
                console.log(error);
                toast.error(
                    error.response?.data?.message || "Error updating size!"
                );
            }

            setLoading(false);
        }
    };

    const validate = (values) => {
        const errors = {};

        if (values.name === "") {
            errors.name = "Size name is required!";
        }

        if (!values.category) {
            errors.category = "Size category is required!";
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

    const fetchSizes = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page: pageNo || 1,
                limit: perPage || 100,
                search: query || "",
                isActive: filter,
            };

            const response = await axios.get(`/api/listbyparams/sizes`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                params,
            });

            if (response.data.success) {
                setSizes(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);
            } else {
                setSizes([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching sizes:", error);
            setSizes([]);
            setTotalRows(0);
            toast.error("Failed to fetch sizes!");
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query, filter]);

    const fetchSizeCategories = useCallback(async () => {
        try {
            const response = await axios.get("/api/size-categories", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                const categoryOptions = response.data.data.map((category) => ({
                    value: category.id,
                    label: category.name,
                }));
                setSizeCategories(categoryOptions);
            }
        } catch (error) {
            console.error("Error fetching size categories:", error);
            setSizeCategories([]);
        }
    }, []);

    useEffect(() => {
        fetchSizes();
        fetchSizeCategories();
    }, [fetchSizes, fetchSizeCategories]);

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
            minWidth: "80px",
        },
        {
            name: "Size",
            selector: (row) => row.name,
            minWidth: "130px",
        },
        {
            name: "Category",
            selector: (row) => row.sizeCategory?.name || "N/A",
            minWidth: "130px",
        },
        {
            name: "Sort Order",
            selector: (row) => row.sortOrder,
            sortable: true,
            minWidth: "120px",
        },
    ];

    const exportColumns = [
        { header: "Size", key: "name" },
        { header: "Category", key: "sizeCategory.name" },
        { header: "Sort Order", key: "sortOrder" },
        { header: "Active", key: "isActive" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.get(`/api/listbyparams/sizes`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                params: { page: 1, limit: 10000, isActive: filter },
            });
            return response.data.success ? response.data.data : [];
        } catch (error) {
            console.error("Export fetch error:", error);
            return [];
        }
    };

    document.title = `Sizes | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Sizes"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <PageHeader
                    formName="Sizes"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    showAddButton={false}
                    data={sizes}
                    exportColumns={exportColumns}
                    fileName="sizes"
                    fetchAllForExport={fetchAllForExport}
                  />
                                </CardHeader>

                                <CardBody>
                                    <div id="customerList">
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={col}
                                                data={sizes}
                                                customStyles={tableCustomStyles}
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
            >
                <ModalHeader
                    className="bg-light p-3"
                    toggle={() => {
                        setmodal_list(false);
                        setIsSubmit(false);
                    }}
                >
                    Add Size
                </ModalHeader>
                <form>
                    <ModalBody>
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                placeholder="Enter Size Name"
                                required
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                            />
                            <Label>
                                Size Name <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="mb-3">
                            <Label>
                                Size Category{" "}
                                <span className="text-danger">*</span>
                            </Label>
                            <Select
                                value={values.category}
                                onChange={handleCategoryChange}
                                options={sizeCategories}
                                placeholder="Select Size Category"
                                isClearable
                                isSearchable
                            />
                            {isSubmit && formErrors.category && (
                                <p className="text-danger">
                                    {formErrors.category}
                                </p>
                            )}
                        </div>

                        <div className="form-floating mb-3">
                            <Input
                                type="number"
                                placeholder="Enter Sort Order"
                                name="sortOrder"
                                value={values.sortOrder}
                                onChange={handleChange}
                            />
                            <Label>Sort Order</Label>
                        </div>

                        <div className=" mb-3">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                name="isActive"
                                value={values.isActive}
                                defaultChecked={values.isActive}
                                onChange={handleCheck}
                            />
                            <Label className="form-check-label ms-1">
                                Is Active
                            </Label>
                        </div>
                    </ModalBody>
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
            >
                <ModalHeader
                    className="bg-light p-3"
                    toggle={() => {
                        setmodal_edit(false);
                        setIsSubmit(false);
                    }}
                >
                    Edit Size
                </ModalHeader>
                <form>
                    <ModalBody>
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                placeholder="Enter Size Name"
                                required
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                            />
                            <Label>
                                Size Name <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="mb-3">
                            <Label>
                                Size Category{" "}
                                <span className="text-danger">*</span>
                            </Label>
                            <Select
                                value={values.category}
                                onChange={handleCategoryChange}
                                options={sizeCategories}
                                placeholder="Select Size Category"
                                isClearable
                                isSearchable
                            />
                            {isSubmit && formErrors.category && (
                                <p className="text-danger">
                                    {formErrors.category}
                                </p>
                            )}
                        </div>

                        <div className="form-floating mb-3">
                            <Input
                                type="number"
                                placeholder="Enter Sort Order"
                                name="sortOrder"
                                value={values.sortOrder}
                                onChange={handleChange}
                            />
                            <Label>Sort Order</Label>
                        </div>

                        <div className=" mb-3">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                name="isActive"
                                value={values.isActive}
                                checked={values.isActive}
                                onChange={handleCheck}
                            />
                            <Label className="form-check-label ms-1">
                                Is Active
                            </Label>
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <FormUpdateFooter
                            handleUpdate={handleUpdate}
                            handleUpdateCancel={handleUpdateCancel}
                        />
                    </ModalFooter>
                </form>
            </Modal>

        </React.Fragment>
    );
};

export default Size;
