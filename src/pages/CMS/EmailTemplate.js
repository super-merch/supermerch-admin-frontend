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
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { listAllEmailSetup } from "../../functions/CMS/emailSetupFunc";
import { listAllEmailFor } from "../../functions/CMS/emailForFunc";
import JoditEditor from "jodit-react";
import {
    createEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplateById,
    updateEmailTemplate,
} from "../../functions/CMS/emailTemplate";
import { MenuContext } from "../../context/MenuContext";

const EmailTemplate = () => {
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
        templateName: "",
        mailerName: "",
        emailCC: "",
        emailBCC: "",
        emailSubject: "",
        emailSignature: "",
        isActive: false,
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

    const [emailFromList, setEmailFromList] = useState([]);
    const [selectedEmailFrom, setSelectedEmailFrom] = useState(null);
    const [emailForList, setEmailForList] = useState([]);
    const [selectedEmailFor, setSelectedEmailFor] = useState(null);

    const fetchAllEmailSetup = async () => {
        try {
            const res = await listAllEmailSetup();
            if (res.data.success) {
                setEmailFromList(res.data.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchAllEmailFor = async () => {
        try {
            const res = await listAllEmailFor();
            if (res.data.success) {
                setEmailForList(res.data.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchAllEmailSetup();
        fetchAllEmailFor();
    }, []);

    const editorConfig = {
        uploader: {
            url: `/api/email-template/upload-signature`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            filesVariableName: () => "signatureImage",
            format: "json",
            isSuccess: (resp) => resp.success,
            getMessage: (resp) => resp.message,
            process: (resp) => {
                return {
                    files: [resp.data.link],
                    path: resp.url,
                    baseurl: "",
                    error: resp.success ? 0 : 1,
                    message: resp.message,
                };
            },
            defaultHandlerSuccess: function (data) {
                if (data.files && data.files.length) {
                    this.selection.insertImage(data.files[0]);
                }
            },
        },
        enableDragAndDropFileToEditor: true,
        imageDefaultWidth: "100%",
        sourceEditor: "area", // Use textarea for source editing (easier to copy-paste)

        // Paste configuration - allow HTML from external sources
        askBeforePasteHTML: false, // Don't ask, just paste
        askBeforePasteFromWord: false, // Don't ask for Word content
        defaultActionOnPaste: "insert_clear_html", // Insert HTML and clean it minimally
        defaultActionOnPasteFromWord: "insert_clear_html",

        // Allow all HTML elements and styles
        cleanHTML: {
            fillEmptyParagraph: false,
            removeEmptyElements: false,
            replaceNBSP: false,
        },

        // Preserve inline styles (important for email signatures)
        allowResizeX: true,
        allowResizeY: true,

        // Don't strip any tags or attributes
        disablePlugins: ["cleanHtml"],

        // Popup/Dialog configuration - prevent conflicts with parent modals
        zIndex: 10000,
        popupInBody: false, // Render popups inside the editor container instead of document.body
        globalFullSize: false,
        showPlaceholder: false,

        // Use inline dialogs
        dialogsInPlace: true,

        // Handle events to prevent propagation
        events: {
            afterOpenPopup: function (popup) {
                // Ensure clicks inside the popup don't bubble up to parent containers/modals
                if (popup && popup.container) {
                    popup.container.addEventListener("click", (e) =>
                        e.stopPropagation()
                    );
                    popup.container.addEventListener("mousedown", (e) =>
                        e.stopPropagation()
                    );
                }
            },
        },

        buttons: [
            "source", // Source code toggle button
            "|",
            "undo",
            "redo",
            "|",
            "bold",
            "italic",
            "underline",
            "indent",
            "|",
            "ul",
            "ol",
            "|",
            "link",
            "unlink",
            "|",
            "image",
            "video",
            "|",
            "align",
            "brush",
            "fontsize",
            "font",
            "|",
            "fullsize",
        ],
    };

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
            maxWidth: "10px",
        },
        {
            name: "Template Name",
            selector: (row) => (
                <span className="text-wrap">{row.templateName}</span>
            ),
            maxWidth: "150px",
        },
        {
            name: "Email From",
            selector: (row) => (
                <span className="text-wrap">{row.emailSetup?.email}</span>
            ),
            maxWidth: "250px",
        },
        {
            name: "Email For",
            selector: (row) => (
                <span className="text-wrap">{row.emailFor?.emailFor}</span>
            ),
            maxWidth: "150px",
        },
        {
            name: "Mailer Name",
            selector: (row) => (
                <span className="text-wrap">{row.mailerName}</span>
            ),
            maxWidth: "200px",
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

    const fetchEmployeeMaster = useCallback(async () => {
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
            .get(`/api/list/email-template?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((response) => {
                if (response.data.success) {
                    setData(response.data.data);
                    setTotalRows(response.data.total);
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
        fetchEmployeeMaster();
    }, [pageNo, perPage, column, sortDirection, query, filter]);

    const validate = (values) => {
        const errors = {};
        if (!values.templateName)
            errors.templateName = "Template Name is required";
        if (!selectedEmailFor) errors.emailFor = "Email For is required";
        if (!selectedEmailFrom) errors.emailFrom = "Email From is required";
        if (!values.mailerName) errors.mailerName = "Mailer Name is required";
        // if (!values.emailCC) errors.emailCC = "Email CC is required";
        if (!values.emailSubject)
            errors.emailSubject = "Email Subject is required";
        if (!values.emailSignature)
            errors.emailSignature = "Email Signature is required";
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
                ...values,
                emailFrom: selectedEmailFrom.value,
                emailForId: selectedEmailFor.value,
            };
            createEmailTemplate(dataToSend)
                .then((res) => {
                    if (res.data.success) {
                        setShowForm(false);
                        setValues(initialState);
                        setSelectedEmailFor(null);
                        setSelectedEmailFrom(null);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchEmployeeMaster();
                        toast.success("Email Template Added Successfully");
                    } else {
                        toast.error(
                            res.data.message ||
                                "Failed to create Email Template"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message ||
                            "Error creating Email Template"
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
                ...values,
                emailFrom: selectedEmailFrom.value,
                emailForId: selectedEmailFor.value,
            };
            updateEmailTemplate(_id, dataToSend)
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Email Template Updated Successfully");
                        setUpdateForm(false);
                        setShowForm(false);
                        setValues(initialState);
                        setSelectedEmailFor(null);
                        setSelectedEmailFrom(null);
                        setIsSubmit(false);
                        setFormErrors({});
                        fetchEmployeeMaster();
                    } else {
                        toast.error(
                            res.data.message ||
                                "Failed to update Email Template"
                        );
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast.error(
                        err.response?.data?.message ||
                            "Error updating Email Template"
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
        setSelectedEmailFor(null);
        setSelectedEmailFrom(null);
        setFormErrors({});
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        deleteEmailTemplate(remove_id)
            .then((res) => {
                if (res.data.success) {
                    setmodal_delete(!modal_delete);
                    fetchEmployeeMaster();
                    toast.success("Email Template Deleted Successfully");
                } else {
                    toast.error(
                        res.data.message || "Cannot delete Email Template"
                    );
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Cannot delete Email Template");
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
        getEmailTemplateById(_id)
            .then((res) => {
                if (res.data.success) {
                    setValues({
                        templateName: res.data.data.templateName,
                        mailerName: res.data.data.mailerName,
                        emailCC: res.data.data.emailCC,
                        emailBCC: res.data.data.emailBCC,
                        emailSubject: res.data.data.emailSubject,
                        emailSignature: res.data.data.emailSignature,
                        isActive: res.data.data.isActive,
                    });
                    setSelectedEmailFrom({
                        value: res.data.data.emailFrom,
                        label:
                            emailFromList.find(
                                (item) => item.id === res.data.data.emailFrom
                            )?.email || "",
                    });
                    setSelectedEmailFor({
                        value: res.data.data.emailForId,
                        label:
                            emailForList.find(
                                (item) => item.id === res.data.data.emailForId
                            )?.emailFor || "",
                    });
                }
            })
            .catch((err) => {
                console.log(err);
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
        setSelectedEmailFor(null);
        setSelectedEmailFrom(null);
        setFormErrors({});
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
                                        <Col lg={3}>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    required
                                                    name="templateName"
                                                    value={values.templateName}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Template Name{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {
                                                            formErrors.templateName
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="form-floating mb-3">
                                                <Select
                                                    className="basic-single"
                                                    classNamePrefix="select"
                                                    placeholder=""
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            minHeight: "58px",
                                                            height: "58px",
                                                            backgroundColor:
                                                                "transparent",
                                                        }),
                                                        placeholder: (
                                                            base
                                                        ) => ({
                                                            ...base,
                                                            marginTop: "8px",
                                                        }),
                                                        valueContainer: (
                                                            base
                                                        ) => ({
                                                            ...base,
                                                            marginTop: "8px",
                                                        }),
                                                    }}
                                                    options={emailFromList.map(
                                                        (branch) => ({
                                                            value: branch.id,
                                                            label: branch.email,
                                                        })
                                                    )}
                                                    value={selectedEmailFrom}
                                                    onChange={(
                                                        selectedOption
                                                    ) => {
                                                        setSelectedEmailFrom(
                                                            selectedOption
                                                        );
                                                    }}
                                                />
                                                <label
                                                    className="form-label"
                                                    style={{
                                                        opacity: 0.7,
                                                        transform:
                                                            "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                                    }}
                                                >
                                                    Email From{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.emailFrom}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="form-floating mb-3">
                                                <Select
                                                    className="basic-single"
                                                    classNamePrefix="select"
                                                    placeholder=""
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            minHeight: "58px",
                                                            height: "58px",
                                                            backgroundColor:
                                                                "transparent",
                                                        }),
                                                        placeholder: (
                                                            base
                                                        ) => ({
                                                            ...base,
                                                            marginTop: "8px",
                                                        }),
                                                        valueContainer: (
                                                            base
                                                        ) => ({
                                                            ...base,
                                                            marginTop: "8px",
                                                        }),
                                                    }}
                                                    options={emailForList.map(
                                                        (branch) => ({
                                                            value: branch.id,
                                                            label: branch.emailFor,
                                                        })
                                                    )}
                                                    value={selectedEmailFor}
                                                    onChange={(
                                                        selectedOption
                                                    ) => {
                                                        setSelectedEmailFor(
                                                            selectedOption
                                                        );
                                                    }}
                                                />
                                                <label
                                                    className="form-label"
                                                    style={{
                                                        opacity: 0.7,
                                                        transform:
                                                            "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                                    }}
                                                >
                                                    Email For{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.emailFor}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    required
                                                    name="mailerName"
                                                    value={values.mailerName}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Mailer Name{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {formErrors.mailerName}
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={4}>
                                            <div className="form-floating mb-3">
                                                <textarea
                                                    type="text"
                                                    className="form-control"
                                                    style={{ height: "100px" }}
                                                    // required
                                                    name="emailCC"
                                                    value={values.emailCC}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Email CC
                                                    {/* <span className="text-danger"> *</span> */}
                                                </label>
                                                {/* {isSubmit && (
                          <p className="text-danger">{formErrors.emailCC}</p>
                        )} */}
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="form-floating mb-3">
                                                <textarea
                                                    type="text"
                                                    className="form-control"
                                                    style={{ height: "100px" }}
                                                    // required
                                                    name="emailBCC"
                                                    value={values.emailBCC}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Email BCC
                                                    {/* <span className="text-danger"> *</span> */}
                                                </label>
                                                {/* {isSubmit && (
                          <p className="text-danger">{formErrors.emailCC}</p>
                        )} */}
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="form-floating mb-3">
                                                <textarea
                                                    type="text"
                                                    className="form-control"
                                                    style={{ height: "100px" }}
                                                    required
                                                    name="emailSubject"
                                                    value={values.emailSubject}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                    Email Subject{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {
                                                            formErrors.emailSubject
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={12}>
                                            <div className=" mb-3">
                                                <label className="form-label">
                                                    Email Signature{" "}
                                                    <span className="text-danger">
                                                        {" "}
                                                        *
                                                    </span>
                                                </label>
                                                <JoditEditor
                                                    value={
                                                        values.emailSignature
                                                    }
                                                    config={editorConfig}
                                                    tabIndex={1}
                                                    name="emailSignature"
                                                    onBlur={(newContent) =>
                                                        setValues({
                                                            ...values,
                                                            emailSignature:
                                                                newContent,
                                                        })
                                                    }
                                                />
                                                {isSubmit && (
                                                    <p className="text-danger">
                                                        {
                                                            formErrors.emailSignature
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="mt-5">
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

    document.title = `Email Template | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                {isDeleteLoading && <LoadingOverlay fullscreen />}
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Setup"
                        title="Email Template"
                        pageTitle="Setup"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="Email Template"
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

export default EmailTemplate;
