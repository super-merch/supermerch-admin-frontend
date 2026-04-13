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
    Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
    createFAQ,
    deleteFAQ,
    getFAQById,
    updateFAQ,
    getFAQList,
} from "../../functions/CMS/faqFunc";

const FAQ = () => {
    const { adminData } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);
    const [_id, set_Id] = useState("");

    const initialState = {
        question: "",
        answer: "",
        sortOrder: 0,
        isActive: true,
    };

    const [remove_id, setRemove_id] = useState("");
    const [query, setQuery] = useState("");
    const [values, setValues] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [updateForm, setUpdateForm] = useState(false);
    const [data, setData] = useState([]);
    const [modal_delete, setmodal_delete] = useState(false);
    const [isSubmit, setIsSubmit] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const authHeaders = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    };

    const fetchFAQs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFAQList(pageNo + 1, perPage, query);
            if (res.data.success) {
                setData(res.data.data || []);
                setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
            }
        } catch (err) {
            console.error("Error fetching FAQs:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query]);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const validateForm = () => {
        const errors = {};
        if (!values.question.trim()) errors.question = "Question is required";
        if (!values.answer.trim()) errors.answer = "Answer is required"; 
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            createFAQ({
                question: values.question,
                answer: values.answer,
                sortOrder: parseInt(values.sortOrder) || 0,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("FAQ created successfully");
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchFAQs();
                    }
                })
                .catch((err) => {
                    throw err;
                })
                .finally(() => setIsLoading(false));
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            updateFAQ(_id, {
                question: values.question,
                answer: values.answer,
                sortOrder: parseInt(values.sortOrder) || 0,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("FAQ updated successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchFAQs();
                    }
                })
                .catch((err) => {
                    throw err;
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
        setFormErrors({});
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setIsLoading(true);
        deleteFAQ(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchFAQs();
                    toast.success("FAQ deleted successfully");
                }
            })
            .catch((err) => {
                throw err;
            })
            .finally(() => setIsLoading(false));
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleEdit = (_id) => {
        set_Id(_id);
        setIsLoading(true);
        getFAQById(_id)
            .then((res) => {
                if (res.data.success) {
                    setValues(res.data.data);
                    setUpdateForm(true);
                    setShowForm(true);
                }
            })
            .catch((err) => {
                throw err;
            })
            .finally(() => setIsLoading(false));
    };

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
            width: "60px",
        },
        {
            name: "Question",
            selector: (row) => <span className="text-wrap">{row.question}</span>,
            sortable: true,
            minWidth: "300px",
        },
        {
            name: "Sort Order",
            selector: (row) => row.sortOrder,
            sortable: true,
            width: "100px",
        },
        {
            name: "Status",
            selector: (row) => (
                <Badge color={row.isActive ? "success" : "danger"}>
                    {row.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
            sortable: true,
            width: "80px",
        },
        {
            name: "Action",
            cell: (row) => (
                <div className="d-flex gap-2">
                    <button
                        onClick={() => handleEdit(row._id)}
                        className="btn btn-sm btn-info"
                        title="Edit"
                    >
                        <i className="ri-edit-line"></i>
                    </button>
                    <button
                        onClick={() => {
                            setRemove_id(row._id);
                            setmodal_delete(true);
                        }}
                        className="btn btn-sm btn-danger"
                        title="Delete"
                    >
                        <i className="ri-delete-bin-line"></i>
                    </button>
                </div>
            ),
            width: "100px",
        },
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="FAQs" pageTitle="CMS" />
                <LoadingOverlay isLoading={isLoading} />

                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">FAQs Management</h4>
                                <button
                                    onClick={() => {
                                        setShowForm(true);
                                        setUpdateForm(false);
                                        setValues(initialState);
                                        setFormErrors({});
                                    }}
                                    className="btn btn-primary btn-sm"
                                >
                                    <i className="ri-add-line"></i> Add FAQ
                                </button>
                            </CardHeader>
                            <CardBody>
                                <div className="mb-3">
                                    <Input
                                        placeholder="Search questions..."
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            setPageNo(0);
                                        }}
                                    />
                                </div>
                                <DataTable
                                    columns={columns}
                                    data={data}
                                    progressPending={loading}
                                    customStyles={tableCustomStyles}
                                    pagination
                                    paginationServer
                                    paginationTotalRows={totalRows}
                                    onChangeRowsPerPage={(newPerPage) => setPerPage(newPerPage)}
                                    onChangePage={(newPageNo) => setPageNo(newPageNo - 1)}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {showForm && (
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardHeader>
                                    <h4>{updateForm ? "Edit FAQ" : "Add New FAQ"}</h4>
                                </CardHeader>
                                <CardBody>
                                    <Form onSubmit={updateForm ? handleUpdate : handleSubmit}>
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label for="question">Question *</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="question"
                                                        id="question"
                                                        rows={2}
                                                        value={values.question}
                                                        onChange={handleChange}
                                                        placeholder="Enter question"
                                                        invalid={isSubmit && !!formErrors.question}
                                                    />
                                                    {isSubmit && formErrors.question && (
                                                        <div className="invalid-feedback d-block">
                                                            {formErrors.question}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label for="answer">Answer *</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="answer"
                                                        id="answer"
                                                        rows={4}
                                                        value={values.answer}
                                                        onChange={handleChange}
                                                        placeholder="Enter answer"
                                                        invalid={isSubmit && !!formErrors.answer}
                                                    />
                                                    {isSubmit && formErrors.answer && (
                                                        <div className="invalid-feedback d-block">
                                                            {formErrors.answer}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label for="sortOrder">Sort Order</Label>
                                                    <Input
                                                        type="number"
                                                        name="sortOrder"
                                                        id="sortOrder"
                                                        value={values.sortOrder}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <div className="form-check form-switch pt-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="isActive"
                                                            name="isActive"
                                                            checked={values.isActive}
                                                            onChange={handleChange}
                                                        />
                                                        <Label className="form-check-label" for="isActive">
                                                            Active
                                                        </Label>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        <FormsFooter
                                            handleCancel={handleCancel}
                                            isLoading={isLoading}
                                        />
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                )}

                <DeleteModal
                    isOpen={modal_delete}
                    toggle={() => setmodal_delete(!modal_delete)}
                    handleDelete={handleDelete}
                    close={handleDeleteClose}
                    isLoading={isLoading}
                />
            </Container>
        </div>
    );
};

export default FAQ;
