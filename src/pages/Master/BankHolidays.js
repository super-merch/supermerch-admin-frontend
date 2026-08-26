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
    Button,
    Alert,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { MenuContext } from "../../context/MenuContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";


// Australian states and territories. "australia" is what the backend writes
// for nationwide holidays; the rest are the state codes the sync accepts.
const AU_REGIONS = [
    { value: "australia", label: "Australia (nationwide)" },
    { value: "nsw", label: "New South Wales" },
    { value: "vic", label: "Victoria" },
    { value: "qld", label: "Queensland" },
    { value: "sa", label: "South Australia" },
    { value: "wa", label: "Western Australia" },
    { value: "tas", label: "Tasmania" },
    { value: "nt", label: "Northern Territory" },
    { value: "act", label: "Australian Capital Territory" },
];

const REGION_LABELS = AU_REGIONS.reduce((acc, r) => {
    acc[r.value] = r.label;
    return acc;
}, {});

const initialState = {
    date: "",
    name: "",
    region: "australia",
};

const BankHolidays = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);
    const [syncing, setSyncing] = useState(false);
    // Which state or territory's holidays to pull. Defaulting to NSW rather
    // than nationwide because that is where we dispatch from, and a
    // nationwide-only sync leaves out the local ones: Labour Day falls on a
    // different date in almost every jurisdiction, several have holidays
    // nobody else observes, and where a national holiday lands on a weekend it
    // is each jurisdiction that decides whether to observe a substitute day.
    //
    // An earlier version of this comment said Anzac Day and the King's
    // Birthday "fall on different dates in each state". That is wrong. Anzac
    // Day is 25 April everywhere; what varies is the substitute day when it
    // falls on a weekend. The King's Birthday is shared by most jurisdictions
    // on one date, with WA and QLD the exceptions.
    const [syncRegion, setSyncRegion] = useState("nsw");

    const [query, setQuery] = useState("");
    const [remove_id, setRemove_id] = useState("");
    const [holidays, setHolidays] = useState([]);

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

    const handleChange = (e) => {
        let { name, value } = e.target;
        setValues({ ...values, [name]: value });
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
                    `/api/admin/bank-holidays`,
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
                    fetchHolidays();
                    toast.success(response.data.message);
                    setValues(initialState);
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                console.log(error);
                toast.error(
                    error.response?.data?.message ||
                        "Error adding bank holiday!"
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
                `/api/admin/bank-holidays/${remove_id}`,
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
                fetchHolidays();
                toast.success(response.data.message);
            } else {
                toast.error(
                    response.data.message || "Error deleting bank holiday!"
                );
            }
        } catch (err) {
            console.log(err);
            setmodal_delete(false);
            toast.error(
                err.response?.data?.message ||
                    "Failed to delete bank holiday. Please try again."
            );
        }
        setLoading(false);
    };

    const handleDeleteClose = (e) => {
        e.preventDefault();
        setmodal_delete(false);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await axios.post(
                `/api/admin/bank-holidays/sync`,
                { region: syncRegion },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                // Guard the count: the currently deployed backend is a
                // placeholder that answers { success: true } with no message
                // and no count, which produced the memorable
                // "Synced undefined public holidays." Say nothing rather than
                // report a number we were not given.
                const count = response.data.count;
                if (response.data.message) {
                    toast.success(response.data.message);
                } else if (Number.isFinite(count)) {
                    toast.success(`Synced ${count} public holidays.`);
                } else {
                    // Neither a message nor a count: we have been told nothing
                    // except that something answered. The deployed placeholder
                    // does exactly this while writing no rows, so calling it a
                    // completed sync would be a confident false report.
                    toast.warning(
                        "The server accepted the request but did not say what it synced. Check the table below."
                    );
                }
                fetchHolidays();
            } else {
                toast.error(response.data.message || "Sync failed");
            }
        } catch (error) {
            console.error("Sync error:", error);
            toast.error(
                error.response?.data?.message || "Failed to sync bank holidays"
            );
        }
        setSyncing(false);
    };

    const validate = (values) => {
        const errors = {};

        if (!values.date || values.date.trim() === "") {
            errors.date = "Date is required!";
        }

        if (!values.name || values.name.trim() === "") {
            errors.name = "Holiday Name is required!";
        }

        return errors;
    };

    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(0);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                year: new Date().getFullYear(),
                isActive: filter,
            };

            const response = await axios.get(`/api/admin/bank-holidays`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                let data = response.data.data;

                // Filter by search query
                if (query) {
                    data = data.filter(
                        (h) =>
                            h.name
                                .toLowerCase()
                                .includes(query.toLowerCase()) ||
                            h.date.includes(query)
                    );
                }

                setHolidays(data);
                setTotalRows(data.length);
            } else {
                setHolidays([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching bank holidays:", error);
            setHolidays([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [query, filter]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
    };

    const handleFilter = (e) => {
        setFilter(e.target.checked);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const isUpcoming = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };

    const col = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: true,
        },
        {
            name: "Date",
            selector: (row) => (
                <div>
                    <strong>{formatDate(row.date)}</strong>
                    {isUpcoming(row.date) && (
                        <Badge color="success" className="ms-2">
                            Upcoming
                        </Badge>
                    )}
                </div>
            ),
            sortable: true,
            sortFunction: (a, b) => new Date(a.date) - new Date(b.date),
            minWidth: "200px",
        },
        {
            name: "Holiday Name",
            selector: (row) => row.name,
            sortable: true,
            minWidth: "200px",
        },
        {
            name: "Region",
            selector: (row) => (
                <Badge color="info">
                    {/* Fall through to the raw value so a legacy or unexpected
                        code is still visible, then to a word — without the
                        last fallback a row with no region at all renders an
                        empty badge, which is what every one of the 21 rows
                        currently in the table would do. */}
                    {REGION_LABELS[row.region] || row.region || "Not specified"}
                </Badge>
            ),
            minWidth: "150px",
        },
        {
            name: "Action",
            selector: (row) => {
                return (
                    <React.Fragment>
                        <div className="d-flex gap-2">
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
                                {!currentPagePermissions.delete && (
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
            minWidth: "120px",
        },
    ];

    const exportColumns = [
        { header: "Date", key: "date" },
        { header: "Holiday Name", key: "name" },
        { header: "Region", key: "region" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.get(`/api/admin/bank-holidays`, {
                params: { year: new Date().getFullYear(), isActive: filter },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (response.data.success) return response.data.data;
            return [];
        } catch { return []; }
    };

    document.title = `Bank Holidays | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Bank Holidays"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <Row className="align-items-center">
                                        <Col md={8}>
                                            <FormsHeader
                                                formName="Australian Public Holidays"
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
                                        </Col>
                                        <Col md={4} className="text-end d-flex justify-content-end align-items-center gap-2">
                                            <ExportButtons
                                                data={holidays}
                                                columns={exportColumns}
                                                fileName="bank-holidays"
                                                fetchAll={fetchAllForExport}
                                            />
                                            <Input
                                                type="select"
                                                value={syncRegion}
                                                onChange={(e) =>
                                                    setSyncRegion(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={syncing}
                                                style={{ width: "auto" }}
                                                aria-label="State or territory to sync holidays for"
                                            >
                                                {/* "australia", not "national" — the backend accepts
                                                    both, but the add form writes "australia", and a
                                                    second identifier for one concept would fail any
                                                    future validation against AU_REGIONS and render
                                                    as a raw word in the badge. (The 21 rows already
                                                    stored carry no region at all — checked against
                                                    the collection — which is why the badge needs its
                                                    "Not specified" fallback. A sync repairs them:
                                                    it upserts on date and sets the region.) */}
                                                <option value="australia">
                                                    Nationwide only
                                                </option>
                                                {AU_REGIONS.filter(
                                                    (r) => r.value !== "australia"
                                                ).map((r) => (
                                                    <option
                                                        key={r.value}
                                                        value={r.value}
                                                    >
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </Input>
                                            <Button
                                                color="primary"
                                                onClick={handleSync}
                                                disabled={syncing}
                                            >
                                                {syncing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Syncing...
                                                    </>
                                                ) : (
                                                    <>🔄 Sync Holidays</>
                                                )}
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardHeader>

                                <CardBody>
                                    <Alert color="info" className="mb-3">
                                        <i className="ri-information-line me-2"></i>
                                        Public holidays are used to calculate
                                        accurate delivery estimates. Pick the state or
                                        territory you dispatch from and click
                                        "Sync Holidays" to load Australian public
                                        holidays for this year and the next two.
                                        Public holidays and substitute
                                        days differ between states and
                                        territories, so "Nationwide only"
                                        leaves the local ones out.
                                    </Alert>

                                    <div id="customerList">
                                        <div className="table-responsive table-card mt-1 mb-1 text-right">
                                            <DataTable
                                                columns={col}
                                                data={holidays}
                                                progressPending={loading}
                                                customStyles={tableCustomStyles}
                                                pagination
                                                paginationServer={false}
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
                                                defaultSortFieldId={2}
                                                defaultSortAsc={true}
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
                size="md"
            >
                <ModalHeader
                    className="bg-light p-3"
                    toggle={() => {
                        setmodal_list(false);
                        setIsSubmit(false);
                    }}
                >
                    Add Custom Bank Holiday
                </ModalHeader>
                <form>
                    <ModalBody>
                        <div className="form-floating mb-3">
                            <Input
                                type="date"
                                placeholder="Select Date"
                                required
                                name="date"
                                value={values.date}
                                onChange={handleChange}
                            />
                            <Label>
                                Date <span className="text-danger">*</span>
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">{formErrors.date}</p>
                            )}
                        </div>

                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                placeholder="Enter Holiday Name"
                                required
                                name="name"
                                value={values.name}
                                onChange={handleChange}
                            />
                            <Label>
                                Holiday Name{" "}
                                <span className="text-danger">*</span>
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="form-floating mb-3">
                            <Input
                                type="select"
                                name="region"
                                value={values.region}
                                onChange={handleChange}
                            >
                                {AU_REGIONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </Input>
                            <Label>Region</Label>
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

            <DeleteModal
                show={modal_delete}
                handleDelete={handleDelete}
                toggle={handleDeleteClose}
                setmodal_delete={setmodal_delete}
            />
        </React.Fragment>
    );
};

export default BankHolidays;
