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
    createPolicy,
    deletePolicy,
    getPolicyById,
    updatePolicy,
    getPolicyList,
} from "../../functions/CMS/policyFunc";

const policyTypes = [
    { value: "privacy", label: "Privacy Policy" },
    { value: "terms", label: "Terms & Conditions" },
    { value: "refund", label: "Refund Policy" },
    { value: "artwork", label: "Artwork Guidelines" },
];

const Policy = () => {
    const { adminData } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [_id, set_Id] = useState("");

    const initialState = {
        type: "privacy",
        title: "",
        sections: [],
        isActive: true,
    };

    const initialSection = {
        heading: "",
        content: "",
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

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPolicyList(pageNo + 1, perPage, query);
            if (res.data.success) {
                setData(res.data.data || []);
                setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
            }
        } catch (err) {
            console.error("Error fetching policies:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query]);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSectionChange = (index, field, value) => {
        const newSections = [...values.sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setValues((prev) => ({ ...prev, sections: newSections }));
    };

    const addSection = () => {
        setValues((prev) => ({
            ...prev,
            sections: [...prev.sections, { ...initialSection }],
        }));
    };

    const removeSection = (index) => {
        setValues((prev) => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index),
        }));
    };

    const validateForm = () => {
        const errors = {};
        if (!values.title.trim()) errors.title = "Title is required";
        if (values.sections.length === 0) errors.sections = "At least one section is required";
        for (let i = 0; i < values.sections.length; i++) {
            if (!values.sections[i].heading.trim()) {
                errors[`section_${i}_heading`] = "Section heading is required";
            }
            if (!values.sections[i].content.trim()) {
                errors[`section_${i}_content`] = "Section content is required";
            }
        }
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            createPolicy({
                type: values.type,
                title: values.title,
                sections: values.sections,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Policy created successfully");
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchPolicies();
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
            updatePolicy(_id, {
                type: values.type,
                title: values.title,
                sections: values.sections,
                isActive: values.isActive,
            })
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Policy updated successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchPolicies();
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
        deletePolicy(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchPolicies();
                    toast.success("Policy deleted successfully");
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
        getPolicyById(_id)
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
            name: "Type",
            selector: (row) => policyTypes.find(p => p.value === row.type)?.label || row.type,
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
            name: "Sections",
            selector: (row) => row.sections?.length || 0,
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
                <BreadCrumb title="Policies" pageTitle="CMS" />
                <LoadingOverlay isLoading={isLoading} />

                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardHeader className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">Policies Management</h4>
                                <button
                                    onClick={() => {
                                        setShowForm(true);
                                        setUpdateForm(false);
                                        setValues(initialState);
                                        setFormErrors({});
                                    }}
                                    className="btn btn-primary btn-sm"
                                >
                                    <i className="ri-add-line"></i> Add Policy
                                </button>
                            </CardHeader>
                            <CardBody>
                                <div className="mb-3">
                                    <Input
                                        placeholder="Search policies..."
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
                                    <h4>{updateForm ? "Edit Policy" : "Add New Policy"}</h4>
                                </CardHeader>
                                <CardBody>
                                    <Form onSubmit={updateForm ? handleUpdate : handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label for="type">Policy Type *</Label>
                                                    <Input
                                                        type="select"
                                                        name="type"
                                                        id="type"
                                                        value={values.type}
                                                        onChange={handleChange}
                                                        disabled={updateForm}
                                                    >
                                                        {policyTypes.map((pt) => (
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
                                                        placeholder="Enter policy title"
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
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <Label>Sections *</Label>
                                                        <Button
                                                            type="button"
                                                            color="primary"
                                                            size="sm"
                                                            onClick={addSection}
                                                        >
                                                            <i className="ri-add-line"></i> Add Section
                                                        </Button>
                                                    </div>

                                                    {formErrors.sections && (
                                                        <div className="text-danger mb-2">
                                                            {formErrors.sections}
                                                        </div>
                                                    )}

                                                    {values.sections.map((section, index) => (
                                                        <Card key={index} className="mb-3 border-secondary">
                                                            <CardBody>
                                                                <Row>
                                                                    <Col md={11}>
                                                                        <div className="mb-2">
                                                                            <Label>Heading {index + 1}</Label>
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="Section heading"
                                                                                value={section.heading}
                                                                                onChange={(e) =>
                                                                                    handleSectionChange(index, "heading", e.target.value)
                                                                                }
                                                                                invalid={isSubmit && !!formErrors[`section_${index}_heading`]}
                                                                            />
                                                                            {isSubmit && formErrors[`section_${index}_heading`] && (
                                                                                <div className="invalid-feedback d-block">
                                                                                    {formErrors[`section_${index}_heading`]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <Label>Content {index + 1}</Label>
                                                                            <Input
                                                                                type="textarea"
                                                                                rows={4}
                                                                                placeholder="Section content"
                                                                                value={section.content}
                                                                                onChange={(e) =>
                                                                                    handleSectionChange(index, "content", e.target.value)
                                                                                }
                                                                                invalid={isSubmit && !!formErrors[`section_${index}_content`]}
                                                                            />
                                                                            {isSubmit && formErrors[`section_${index}_content`] && (
                                                                                <div className="invalid-feedback d-block">
                                                                                    {formErrors[`section_${index}_content`]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </Col>
                                                                    <Col md={1} className="d-flex align-items-end">
                                                                        <Button
                                                                            type="button"
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() => removeSection(index)}
                                                                        >
                                                                            <i className="ri-delete-bin-line"></i>
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </CardBody>
                                                        </Card>
                                                    ))}
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

export default Policy;
