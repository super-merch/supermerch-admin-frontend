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
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import JoditEditor from "jodit-react";
import {
    createCMSPage,
    deleteCMSPage,
    getCMSPageById,
    updateCMSPage,
} from "../../functions/CMS/cmsPageFunc";
import { MenuContext } from "../../context/MenuContext";

const CMSPage = () => {
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
        content: "",
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

    // Helper to generate slug from name (for preview)
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    // Jodit Editor Config
    const editorConfig = {
        readonly: false,
        height: 400,
        buttons: [
            "undo",
            "redo",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "|",
            "ul",
            "ol",
            "|",
            "paragraph",
            "fontsize",
            "font",
            "|",
            "link",
            "unlink",
            "|",
            "align",
            "brush",
            "|",
            "table",
            "hr",
            "|",
            "fullsize",
        ],
        toolbarAdaptive: true,
        showCharsCounter: true,
        showWordsCounter: true,
        showXPathInStatusbar: false,
        // Enable paste functionality
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: "insert_clear_html",
        defaultActionOnPasteFromWord: "insert_clear_html",
        processPasteHTML: true,
        nl2brInPlainText: true,
    };

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
            maxWidth: "80px",
        },
        {
            name: "Name",
            selector: (row) => <span className="text-wrap">{row.name}</span>,
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Slug",
            selector: (row) => (
                <span className="text-wrap text-muted">{row.slug}</span>
            ),
            sortable: true,
            minWidth: "200px",
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
            maxWidth: "100px",
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

    const fetchCMSPages = useCallback(async () => {
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
            .get(`/api/cms-page?${params}`, {
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
        fetchCMSPages();
    }, [pageNo, perPage, column, sortDirection, query, filter]);

    const validate = (values) => {
        const errors = {};
        if (!values.name) errors.name = "Name is required";
        if (
            !values.content ||
            values.content.trim() === "" ||
            values.content === "<p><br></p>"
        ) {
            errors.content = "Content is required";
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

            const dataToSend = {
                name: values.name,
                content: values.content,
                isActive: values.isActive,
            };

            createCMSPage(dataToSend)
                .then((res) => {
                    if (res.data.success) {
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchCMSPages();
                        toast.success("CMS Page Added Successfully");
                    } else {
                        toast.error(
                            res.data.message || "Failed to create CMS Page"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message || "Error creating CMS Page"
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

            const dataToSend = {
                name: values.name,
                content: values.content,
                isActive: values.isActive,
            };

            updateCMSPage(_id, dataToSend)
                .then((res) => {
                    if (res.data.success) {
                        toast.success("CMS Page Updated Successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchCMSPages();
                    } else {
                        toast.error(
                            res.data.message || "Failed to update CMS Page"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message || "Error updating CMS Page"
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
        setFormErrors({});
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        deleteCMSPage(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchCMSPages();
                    toast.success("CMS Page Deleted Successfully");
                } else {
                    toast.error(res.data.message || "Cannot delete CMS Page");
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Cannot delete CMS Page");
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
        getCMSPageById(_id)
            .then((res) => {
                if (res.data.success) {
                    const cmsData = res.data.data;
                    setValues({
                        name: cmsData.name,
                        content: cmsData.content || "",
                        isActive: cmsData.isActive,
                    });
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
                                    <Col lg={6}>
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
                                    <Col lg={6}>
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

                                    {/* Content - Jodit Editor */}
                                    <Col lg={12}>
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Content{" "}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <JoditEditor
                                                value={values.content}
                                                config={editorConfig}
                                                tabIndex={1}
                                                onBlur={(newContent) =>
                                                    setValues({
                                                        ...values,
                                                        content: newContent,
                                                    })
                                                }
                                            />
                                            {isSubmit && formErrors.content && (
                                                <p className="text-danger mt-2">
                                                    {formErrors.content}
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

    document.title = `CMS Pages | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="CMS"
                        title="CMS Pages"
                        pageTitle="CMS"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="CMS Page"
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
                                        currentPagePermissions={
                                            currentPagePermissions
                                        }
                                        showAddButton={
                                            currentPagePermissions.write
                                        }
                                    />
                                </CardHeader>

                                {showForm || updateForm ? (
                                    renderForm()
                                ) : (
                                    <CardBody>
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
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

export default CMSPage;
