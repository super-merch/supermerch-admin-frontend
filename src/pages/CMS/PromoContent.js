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
    createPromoContent,
    deletePromoContent,
    getPromoContentById,
    updatePromoContent,
    getPromoContentList,
} from "../../functions/CMS/promoContentFunc";

const promoTypes = [
    { value: "promotional-benefits", label: "Promotional Benefits" },
    { value: "footer-info", label: "Footer Information" },
];

const PromoContent = () => {
    const { adminData } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [_id, set_Id] = useState("");

    const initialState = {
        type: "promotional-benefits",
        title: "",
        content: [],
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

    const fetchPromoContent = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPromoContentList(pageNo + 1, perPage, query);
            if (res.data.success) {
                setData(res.data.data || []);
                setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
            }
        } catch (err) {
            console.error("Error fetching promo content:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query]);

    useEffect(() => {
        fetchPromoContent();
    }, [fetchPromoContent]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleContentChange = (value) => {
        setValues((prev) => ({ ...prev, content: value }));
    };

    const validateForm = () => {
        const errors = {};
        if (!values.title.trim()) errors.title = "Title is required";
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            
            let contentData = values.content;
            try {
                if (typeof values.content === "string") {
                    contentData = JSON.parse(values.content);
                }
            } catch (e) {
                console.warn("Could not parse content as JSON, sending as is");
            }

            createPromoContent({
                type: values.type,
                title: values.title,
                content: contentData,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Promo content created successfully");
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchPromoContent();
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
            
            let contentData = values.content;
            try {
                if (typeof values.content === "string") {
                    contentData = JSON.parse(values.content);
                }
            } catch (e) {
                console.warn("Could not parse content as JSON, sending as is");
            }

            updatePromoContent(_id, {
                type: values.type,
                title: values.title,
                content: contentData,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Promo content updated successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchPromoContent();
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
        deletePromoContent(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchPromoContent();
                    toast.success("Promo content deleted successfully");
                }
            })
            .catch((err) => {
                throw err;
            })
            .finally(() => setIsLoading(false));
    };

    const handleEdit = (_id) => {
        set_Id(_id);
        setIsLoading(true);
        getPromoContentById(_id)
            .then((res) => {
                if (res.data.success) {
                    const data = res.data.data;
                    setValues({
                        ...data,
                        content: typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2),
                    });
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
            name: "Type",
            selector: (row) => promoTypes.find(p => p.value === row.type)?.label || row.type,
            sortable: true,
            width: "150px",
        },
        {
            name: "Title",
            selector: (row) => <span className="text-wrap">{row.title}</span>,
            sortable: true,
            minWidth: "250px",
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
                <BreadCrumb title="Promo Content" pageTitle="CMS" />
                <LoadingOverlay isLoading={isLoading} />

                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">Promo Content Management</h4>
                                <button
                                    onClick={() => {
                                        setShowForm(true);
                                        setUpdateForm(false);
                                        setValues(initialState);
                                        setFormErrors({});
                                    }}
                                    className="btn btn-primary btn-sm"
                                >
                                    <i className="ri-add-line"></i> Add Content
                                </button>
                            </CardHeader>
                            <CardBody>
                                <div className="mb-3">
                                    <Input
                                        placeholder="Search content..."
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
                                    <h4>{updateForm ? "Edit Promo Content" : "Add New Promo Content"}</h4>
                                </CardHeader>
                                <CardBody>
                                    <Form onSubmit={updateForm ? handleUpdate : handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label for="type">Content Type *</Label>
                                                    <Input
                                                        type="select"
                                                        name="type"
                                                        id="type"
                                                        value={values.type}
                                                        onChange={handleChange}
                                                        disabled={updateForm}
                                                    >
                                                        {promoTypes.map((pt) => (
                                                            <option key={pt.value} value={pt.value}>
                                                                {pt.label}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label for="title">Title *</Label>
                                                    <Input
                                                        type="text"
                                                        name="title"
                                                        id="title"
                                                        value={values.title}
                                                        onChange={handleChange}
                                                        placeholder="Enter title"
                                                        invalid={isSubmit && !!formErrors.title}
                                                    />
                                                    {isSubmit && formErrors.title && (
                                                        <div className="invalid-feedback d-block">
                                                            {formErrors.title}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label for="content">Content (JSON Format)</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="content"
                                                        id="content"
                                                        rows={8}
                                                        value={typeof values.content === "string" ? values.content : JSON.stringify(values.content, null, 2)}
                                                        onChange={(e) => handleContentChange(e.target.value)}
                                                        placeholder="Enter content as JSON"
                                                    />
                                                    <small className="form-text text-muted">
                                                        Enter the content as valid JSON. Example for benefits: [{"name":"Benefit 1"},{"name":"Benefit 2"}]
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <div className="form-check form-switch">
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

export default PromoContent;
