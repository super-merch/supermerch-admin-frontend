import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
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
    Row,
    Badge,
    Button,
    Input,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import tableCustomStyles from "../../Components/Common/tableStyles";

const STATUS_OPTIONS = ["PENDING", "SENDING", "RETRYING", "SENT", "FAILED", "RESOLVED", "CANCELLED"];
const ENTITY_TYPE_OPTIONS = ["Quote", "UserQuery"];
const RESENDABLE_STATUSES = new Set(["FAILED", "CANCELLED"]);
const REFERENCE_SEARCH_DEBOUNCE_MS = 400;

const STATUS_COLORS = {
    PENDING: "secondary",
    SENDING: "info",
    RETRYING: "warning",
    SENT: "success",
    FAILED: "danger",
    RESOLVED: "success",
    CANCELLED: "dark",
};

// Never log the full Axios error — it can carry the admin auth header.
const logSafeApiError = (label, error) => {
    console.error(label, {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
    });
};

const NotificationDeliveryHistory = () => {
    const { adminData } = useContext(AuthContext);
    const {
        isAdmin,
        loading: menuLoading,
        findMenuIdByUrl,
        getPermissionsForMenu,
    } = useContext(MenuContext);

    // currentPagePermissions from MenuContext defaults to all-true and only
    // updates once a Menu Master record exists for this URL — until then (or
    // for an employee role with no explicit grant) it would fail OPEN. Resolve
    // permissions for this exact page ourselves and fail closed by default.
    const pagePermissions = useMemo(() => {
        if (isAdmin) return { read: true, write: true };
        const menuId = findMenuIdByUrl(window.location.pathname);
        if (!menuId) return { read: false, write: false };
        const resolved = getPermissionsForMenu(menuId);
        return { read: !!resolved.read, write: !!resolved.write };
    }, [isAdmin, findMenuIdByUrl, getPermissionsForMenu]);

    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(20);
    const [pageNo, setPageNo] = useState(1);

    const [referenceNumber, setReferenceNumber] = useState("");
    const [debouncedReferenceNumber, setDebouncedReferenceNumber] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [entityTypeFilter, setEntityTypeFilter] = useState("");

    const [viewModal, setViewModal] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const [resendModal, setResendModal] = useState(false);
    const [resendTarget, setResendTarget] = useState(null);
    const [resending, setResending] = useState(false);

    const requestSequenceRef = useRef(0);

    const authHeaders = {
        headers: { atoken: localStorage.getItem("aToken") || "" },
    };

    // Debounce the reference-number search so every keystroke doesn't fire a request.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedReferenceNumber(referenceNumber);
        }, REFERENCE_SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [referenceNumber]);

    // Any filter change invalidates the current page — a filter that matches
    // only 1-2 records should not silently show "no results" because the
    // request is still asking for page 5.
    useEffect(() => {
        setPageNo(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, entityTypeFilter, debouncedReferenceNumber]);

    const fetchDeliveries = useCallback(async () => {
        if (!pagePermissions.read) return;
        const requestId = ++requestSequenceRef.current;
        setLoading(true);
        try {
            const params = {
                page: pageNo,
                limit: perPage,
                status: statusFilter || undefined,
                entityType: entityTypeFilter || undefined,
                referenceNumber: debouncedReferenceNumber || undefined,
            };

            const response = await axios.get("/api/notification-deliveries", {
                params,
                ...authHeaders,
            });

            // A slower earlier request can resolve after a newer one — ignore it.
            if (requestId !== requestSequenceRef.current) return;

            if (response.data.success) {
                setDeliveries(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);
            } else {
                setDeliveries([]);
                setTotalRows(0);
            }
        } catch (error) {
            if (requestId !== requestSequenceRef.current) return;
            logSafeApiError("Error fetching notification deliveries:", error);
            setDeliveries([]);
            setTotalRows(0);
            toast.error("Failed to fetch notification delivery history!");
        } finally {
            if (requestId === requestSequenceRef.current) setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNo, perPage, statusFilter, entityTypeFilter, debouncedReferenceNumber, pagePermissions.read]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const handleViewDelivery = async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/notification-deliveries/${id}`, authHeaders);
            if (response.data.success) {
                setSelectedDelivery(response.data.data);
                setViewModal(true);
            } else {
                toast.error("Failed to load delivery details");
            }
        } catch (error) {
            logSafeApiError("Error fetching notification delivery:", error);
            toast.error("Failed to load delivery details");
        }
        setLoading(false);
    };

    const openResendConfirm = (delivery) => {
        if (!pagePermissions.write) return;
        setResendTarget(delivery);
        setResendModal(true);
    };

    const handleResend = async () => {
        if (!resendTarget || !pagePermissions.write) return;
        setResending(true);
        try {
            const response = await axios.post(
                `/api/notification-deliveries/${resendTarget.id}/resend`,
                {},
                authHeaders,
            );
            if (response.data.success) {
                toast.success("Notification queued for resend");
                setResendModal(false);
                fetchDeliveries();
                // Re-fetch rather than patch in the immediate response status —
                // the outbox worker can already have moved it past PENDING by
                // the time this resolves.
                if (selectedDelivery && selectedDelivery.id === resendTarget.id) {
                    await handleViewDelivery(resendTarget.id);
                }
                setResendTarget(null);
            } else {
                toast.error(response.data.message || "Could not queue notification resend");
            }
        } catch (error) {
            logSafeApiError("Error queuing notification resend:", error);
            toast.error(error.response?.data?.message || "Could not queue notification resend");
        }
        setResending(false);
    };

    const handlePageChange = (page) => setPageNo(page);
    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
        setPageNo(page);
    };

    const clearFilters = () => {
        setReferenceNumber("");
        setDebouncedReferenceNumber("");
        setStatusFilter("");
        setEntityTypeFilter("");
        setPageNo(1);
    };
    const hasFilters = referenceNumber || statusFilter || entityTypeFilter;

    const getStatusBadge = (status) => (
        <Badge color={STATUS_COLORS[status] || "secondary"}>{status}</Badge>
    );

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const columns = [
        {
            name: "Reference",
            selector: (row) => row.referenceNumber || "",
            minWidth: "140px",
            cell: (row) => (
                <span className="fw-medium text-primary">{row.referenceNumber || "—"}</span>
            ),
        },
        {
            name: "Type / Event",
            selector: (row) => row.entityType,
            minWidth: "160px",
            cell: (row) => (
                <div>
                    <div className="fw-medium">{row.entityType}</div>
                    <small className="text-muted">{row.eventKey}</small>
                </div>
            ),
        },
        {
            name: "Audience",
            selector: (row) => row.audience,
            minWidth: "110px",
            cell: (row) => (
                <Badge color={row.audience === "INTERNAL" ? "info" : "light"} className={row.audience === "INTERNAL" ? "" : "text-dark"}>
                    {row.audience}
                </Badge>
            ),
        },
        {
            name: "Recipient",
            selector: (row) => row.recipient,
            minWidth: "160px",
        },
        {
            name: "Status",
            selector: (row) => row.status,
            minWidth: "120px",
            cell: (row) => getStatusBadge(row.status),
        },
        {
            name: "Attempts",
            selector: (row) => row.attemptCount,
            minWidth: "90px",
            cell: (row) => (
                <span>
                    {row.attemptCount} / {row.maxAttempts}
                </span>
            ),
        },
        {
            // Server always sorts by createdAt desc; DataTable's client-side
            // sortable would only reorder the currently loaded page, which is
            // misleading under server pagination — so this column, like the
            // others, is deliberately not marked sortable.
            name: "Last Attempt",
            selector: (row) => (row.lastAttemptAt ? new Date(row.lastAttemptAt).getTime() : 0),
            minWidth: "150px",
            cell: (row) => <small>{formatDate(row.lastAttemptAt)}</small>,
        },
        {
            name: "Created",
            selector: (row) => new Date(row.createdAt).getTime(),
            minWidth: "150px",
            cell: (row) => <small>{formatDate(row.createdAt)}</small>,
        },
        {
            name: "Action",
            minWidth: "120px",
            cell: (row) => (
                <div className="d-flex gap-1">
                    <Button color="primary" size="sm" onClick={() => handleViewDelivery(row.id)} title="View details">
                        <i className="ri-eye-line"></i>
                    </Button>
                    {pagePermissions.write && RESENDABLE_STATUSES.has(row.status) && (
                        <Button color="warning" size="sm" onClick={() => openResendConfirm(row)} title="Resend">
                            <i className="ri-refresh-line"></i>
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    document.title = `Notification Delivery History | ${adminData?.companyName}`;

    if (menuLoading) {
        return <LoadingOverlay />;
    }

    if (!pagePermissions.read) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Notification Delivery History" pageTitle="Notifications" />
                    <Card>
                        <CardBody className="text-center py-5">
                            <i className="ri-lock-2-line fs-1 text-danger"></i>
                            <h5 className="mt-3">Access Denied</h5>
                            <p className="text-muted mb-0">
                                You don't have permission to view notification delivery history.
                                Contact an administrator if you believe this is incorrect.
                            </p>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Notification Delivery History" pageTitle="Notifications" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <Row className="g-3 align-items-center">
                                        <Col xl={3} lg={4} md={6}>
                                            <div className="search-box">
                                                <Input
                                                    type="text"
                                                    placeholder="Search reference number..."
                                                    value={referenceNumber}
                                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">All Status</option>
                                                {STATUS_OPTIONS.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="select"
                                                value={entityTypeFilter}
                                                onChange={(e) => setEntityTypeFilter(e.target.value)}
                                            >
                                                <option value="">All Types</option>
                                                {ENTITY_TYPE_OPTIONS.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col
                                            xl="auto"
                                            lg={4}
                                            md={6}
                                            className="d-flex align-items-center justify-content-xl-end flex-wrap gap-2"
                                        >
                                            {hasFilters && (
                                                <Button color="light" onClick={clearFilters} title="Clear Filters">
                                                    <i className="ri-filter-off-line"></i>
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                </CardHeader>

                                <CardBody>
                                    <DataTable
                                        columns={columns}
                                        data={deliveries}
                                        progressPending={loading}
                                        customStyles={tableCustomStyles}
                                        pagination
                                        paginationServer
                                        paginationTotalRows={totalRows}
                                        paginationDefaultPage={pageNo}
                                        paginationPerPage={perPage}
                                        paginationRowsPerPageOptions={[10, 20, 50, 100]}
                                        onChangeRowsPerPage={handlePerRowsChange}
                                        onChangePage={handlePageChange}
                                        highlightOnHover
                                        pointerOnHover
                                        responsive
                                        striped
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* View Delivery Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" scrollable>
                <ModalHeader toggle={() => setViewModal(false)}>
                    {selectedDelivery && (
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-bold">{selectedDelivery.referenceNumber || selectedDelivery.entityType}</span>
                                {getStatusBadge(selectedDelivery.status)}
                            </div>
                            <small className="text-muted">Created: {formatDate(selectedDelivery.createdAt)}</small>
                        </div>
                    )}
                </ModalHeader>
                <ModalBody>
                    {selectedDelivery && (
                        <Row>
                            <Col md={6}>
                                <div className="mb-2">
                                    <strong>Event:</strong> {selectedDelivery.eventKey}
                                </div>
                                <div className="mb-2">
                                    <strong>Entity:</strong> {selectedDelivery.entityType} ({selectedDelivery.entityId})
                                </div>
                                <div className="mb-2">
                                    <strong>Audience:</strong> {selectedDelivery.audience}
                                </div>
                                <div className="mb-2">
                                    <strong>Recipient:</strong> {selectedDelivery.recipient}
                                </div>
                                <div className="mb-2">
                                    <strong>Template:</strong> {selectedDelivery.templateKey} (v{selectedDelivery.templateVersion})
                                </div>
                                <div className="mb-2">
                                    <strong>Provider message:</strong>{" "}
                                    {selectedDelivery.providerMessageId ? "Recorded" : "Not recorded"}
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="mb-2">
                                    <strong>Attempts:</strong> {selectedDelivery.attemptCount} / {selectedDelivery.maxAttempts}
                                </div>
                                <div className="mb-2">
                                    <strong>First attempt:</strong> {formatDate(selectedDelivery.firstAttemptAt)}
                                </div>
                                <div className="mb-2">
                                    <strong>Last attempt:</strong> {formatDate(selectedDelivery.lastAttemptAt)}
                                </div>
                                <div className="mb-2">
                                    <strong>Next attempt:</strong> {formatDate(selectedDelivery.nextAttemptAt)}
                                </div>
                                <div className="mb-2">
                                    <strong>Sent at:</strong> {formatDate(selectedDelivery.sentAt)}
                                </div>
                                <div className="mb-2">
                                    <strong>Resolved:</strong>{" "}
                                    {selectedDelivery.resolvedAt
                                        ? `${formatDate(selectedDelivery.resolvedAt)} by ${selectedDelivery.resolvedBy || "—"}`
                                        : "—"}
                                </div>
                            </Col>
                            {(selectedDelivery.failureCategory || selectedDelivery.sanitizedError) && (
                                <Col md={12} className="mt-2">
                                    <Card className="bg-light border-danger-subtle">
                                        <CardBody>
                                            <h6 className="text-danger mb-2">
                                                <i className="ri-error-warning-line me-2"></i>
                                                Failure details
                                            </h6>
                                            {selectedDelivery.failureCategory && (
                                                <div className="mb-1">
                                                    <strong>Category:</strong> {selectedDelivery.failureCategory}
                                                </div>
                                            )}
                                            {selectedDelivery.sanitizedError && (
                                                <div style={{ whiteSpace: "pre-wrap" }}>{selectedDelivery.sanitizedError}</div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter>
                    {pagePermissions.write &&
                        selectedDelivery &&
                        RESENDABLE_STATUSES.has(selectedDelivery.status) && (
                            <Button color="warning" onClick={() => openResendConfirm(selectedDelivery)}>
                                <i className="ri-refresh-line me-1"></i>
                                Resend
                            </Button>
                        )}
                    <Button color="secondary" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Resend Confirmation Modal */}
            <Modal isOpen={resendModal} toggle={() => setResendModal(false)} centered>
                <ModalHeader toggle={() => setResendModal(false)}>Confirm Resend</ModalHeader>
                <ModalBody>
                    {resendTarget && (
                        <p className="mb-0">
                            Resend the <strong>{resendTarget.templateKey}</strong> notification to{" "}
                            <strong>{resendTarget.recipient}</strong>
                            {resendTarget.referenceNumber ? ` for ${resendTarget.referenceNumber}` : ""}?
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setResendModal(false)} disabled={resending}>
                        Cancel
                    </Button>
                    <Button color="warning" onClick={handleResend} disabled={resending}>
                        {resending ? "Resending..." : "Resend"}
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default NotificationDeliveryHistory;
