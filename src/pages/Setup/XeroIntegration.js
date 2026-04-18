import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Row,
    Badge,
    Button,
    Spinner,
    Input,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import tableCustomStyles from "../../Components/Common/tableStyles";

const XeroIntegration = () => {
    const { adminData } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    // Connection status
    const [status, setStatus] = useState(null);

    // Sync logs
    const [syncLogs, setSyncLogs] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(20);
    const [pageNo, setPageNo] = useState(1);

    // Bulk sync
    const [bulkSyncing, setBulkSyncing] = useState(false);
    const [bulkStatus, setBulkStatus] = useState("");
    const [bulkFromDate, setBulkFromDate] = useState("");
    const [bulkToDate, setBulkToDate] = useState("");
    const [bulkLimit, setBulkLimit] = useState(50);

    // Fetch connection status
    const fetchStatus = useCallback(async () => {
        try {
            const response = await axios.get("/api/xero/status");
            if (response.data.success) {
                setStatus(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching Xero status:", error);
        }
    }, []);

    // Fetch sync logs
    const fetchSyncLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/xero/sync-logs", {
                params: { page: pageNo, limit: perPage },
            });
            if (response.data.success) {
                setSyncLogs(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);
            }
        } catch (error) {
            console.error("Error fetching sync logs:", error);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        fetchSyncLogs();
    }, [fetchSyncLogs]);

    // Connect to Xero
    const handleConnect = async () => {
        setConnecting(true);
        try {
            const response = await axios.get("/api/xero/connect");
            if (response.data.success && response.data.consentUrl) {
                window.location.href = response.data.consentUrl;
            } else {
                toast.error(response.data.message || "Failed to initiate Xero connection");
            }
        } catch (error) {
            toast.error("Failed to connect to Xero");
        } finally {
            setConnecting(false);
        }
    };

    // Disconnect from Xero
    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect Xero? Existing sync records will be preserved.")) {
            return;
        }
        setDisconnecting(true);
        try {
            const response = await axios.post("/api/xero/disconnect");
            if (response.data.success) {
                toast.success("Xero disconnected successfully");
                setStatus({ connected: false });
            } else {
                toast.error("Failed to disconnect Xero");
            }
        } catch (error) {
            toast.error("Failed to disconnect Xero");
        } finally {
            setDisconnecting(false);
        }
    };

    // Manual sync single order
    const handleSyncOrder = async (orderId) => {
        setLoading(true);
        try {
            const response = await axios.post(`/api/xero/sync-order/${orderId}`);
            if (response.data.success) {
                toast.success("Order synced to Xero successfully");
                fetchSyncLogs();
            } else {
                toast.error(response.data.message || "Sync failed");
            }
        } catch (error) {
            toast.error("Failed to sync order");
        } finally {
            setLoading(false);
        }
    };

    // Bulk sync
    const handleBulkSync = async () => {
        setBulkSyncing(true);
        try {
            const body = { limit: bulkLimit };
            if (bulkStatus) body.status = bulkStatus;
            if (bulkFromDate) body.fromDate = bulkFromDate;
            if (bulkToDate) body.toDate = bulkToDate;

            const response = await axios.post("/api/xero/sync-bulk", body);
            if (response.data.success) {
                const { synced, failed } = response.data.data;
                toast.success(`Bulk sync complete: ${synced} synced, ${failed} failed`);
                fetchSyncLogs();
            } else {
                toast.error(response.data.message || "Bulk sync failed");
            }
        } catch (error) {
            toast.error("Bulk sync failed");
        } finally {
            setBulkSyncing(false);
        }
    };

    const handlePageChange = (page) => setPageNo(page);
    const handlePerRowsChange = (newPerPage, page) => {
        setPerPage(newPerPage);
        setPageNo(page);
    };

    // Format date
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

    // Status badge
    const getStatusBadge = (syncStatus) => {
        const colors = {
            DRAFT: "secondary",
            SUBMITTED: "info",
            AUTHORISED: "primary",
            PAID: "success",
            VOIDED: "dark",
            DELETED: "dark",
            FAILED: "danger",
        };
        return (
            <Badge color={colors[syncStatus] || "secondary"}>
                {syncStatus}
            </Badge>
        );
    };

    // Sync log columns
    const columns = [
        {
            name: "Order #",
            selector: (row) => row.orderNumber,
            sortable: true,
            minWidth: "120px",
            cell: (row) => (
                <span className="fw-medium text-primary">{row.orderNumber}</span>
            ),
        },
        {
            name: "Xero Invoice #",
            selector: (row) => row.xeroInvoiceNumber,
            sortable: true,
            minWidth: "140px",
            cell: (row) => row.xeroInvoiceNumber || "—",
        },
        {
            name: "Status",
            selector: (row) => row.status,
            sortable: true,
            minWidth: "110px",
            cell: (row) => getStatusBadge(row.status),
        },
        {
            name: "Amount",
            selector: (row) => row.totalAmount,
            sortable: true,
            minWidth: "100px",
            cell: (row) =>
                row.totalAmount != null
                    ? `$${Number(row.totalAmount).toFixed(2)}`
                    : "—",
        },
        {
            name: "Last Sync",
            selector: (row) => row.lastSyncAt,
            sortable: true,
            minWidth: "160px",
            cell: (row) => formatDate(row.lastSyncAt),
        },
        {
            name: "Error",
            selector: (row) => row.syncError,
            minWidth: "200px",
            cell: (row) =>
                row.syncError ? (
                    <span
                        className="text-danger text-truncate d-inline-block"
                        style={{ maxWidth: "200px" }}
                        title={row.syncError}
                    >
                        {row.syncError}
                    </span>
                ) : (
                    "—"
                ),
        },
        {
            name: "Action",
            minWidth: "100px",
            cell: (row) =>
                row.status === "FAILED" ? (
                    <Button
                        color="warning"
                        size="sm"
                        onClick={() => handleSyncOrder(row.orderId)}
                        title="Retry sync"
                    >
                        <i className="ri-refresh-line"></i>
                    </Button>
                ) : null,
        },
    ];

    // Check URL params for callback result
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const xeroResult = params.get("xero");
        if (xeroResult === "connected") {
            toast.success("Xero connected successfully!");
            fetchStatus();
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (xeroResult === "error") {
            const reason = params.get("reason") || "Unknown error";
            toast.error(`Xero connection failed: ${reason}`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [fetchStatus]);

    document.title = `Xero Integration | ${adminData?.companyName || "SuperMerch"}`;

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Setup"
                        title="Xero Integration"
                        pageTitle="Setup"
                    />

                    {/* Connection Status Card */}
                    <Row className="mb-3">
                        <Col lg={6}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            <i className="ri-links-line me-2"></i>
                                            Xero Connection
                                        </h5>
                                        {status?.connected ? (
                                            <Badge color="success" className="fs-12">
                                                Connected
                                            </Badge>
                                        ) : (
                                            <Badge color="secondary" className="fs-12">
                                                Not Connected
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {status?.connected ? (
                                        <div>
                                            <div className="mb-3">
                                                <div className="mb-2">
                                                    <strong>Organisation:</strong>{" "}
                                                    {status.tenantName || "—"}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Connected:</strong>{" "}
                                                    {formatDate(status.connectedAt)}
                                                </div>
                                            </div>
                                            <Button
                                                color="danger"
                                                outline
                                                onClick={handleDisconnect}
                                                disabled={disconnecting}
                                            >
                                                {disconnecting ? (
                                                    <Spinner size="sm" className="me-1" />
                                                ) : (
                                                    <i className="ri-logout-box-line me-1"></i>
                                                )}
                                                Disconnect Xero
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-muted mb-3">
                                                Connect your Xero account to automatically sync
                                                orders as invoices.
                                            </p>
                                            <Button
                                                color="primary"
                                                onClick={handleConnect}
                                                disabled={connecting}
                                            >
                                                {connecting ? (
                                                    <Spinner size="sm" className="me-1" />
                                                ) : (
                                                    <i className="ri-link me-1"></i>
                                                )}
                                                Connect to Xero
                                            </Button>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Bulk Sync Card */}
                        <Col lg={6}>
                            <Card>
                                <CardHeader>
                                    <h5 className="card-title mb-0">
                                        <i className="ri-upload-cloud-2-line me-2"></i>
                                        Bulk Sync Orders
                                    </h5>
                                </CardHeader>
                                <CardBody>
                                    {status?.connected ? (
                                        <div>
                                            <Row className="g-2 mb-3">
                                                <Col md={6}>
                                                    <label className="form-label small">Order Status</label>
                                                    <Input
                                                        type="select"
                                                        bsSize="sm"
                                                        value={bulkStatus}
                                                        onChange={(e) => setBulkStatus(e.target.value)}
                                                    >
                                                        <option value="">All Statuses</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Delivered">Delivered</option>
                                                    </Input>
                                                </Col>
                                                <Col md={6}>
                                                    <label className="form-label small">Max Orders</label>
                                                    <Input
                                                        type="number"
                                                        bsSize="sm"
                                                        value={bulkLimit}
                                                        onChange={(e) => setBulkLimit(Number(e.target.value))}
                                                        min={1}
                                                        max={200}
                                                    />
                                                </Col>
                                                <Col md={6}>
                                                    <label className="form-label small">From Date</label>
                                                    <Input
                                                        type="date"
                                                        bsSize="sm"
                                                        value={bulkFromDate}
                                                        onChange={(e) => setBulkFromDate(e.target.value)}
                                                    />
                                                </Col>
                                                <Col md={6}>
                                                    <label className="form-label small">To Date</label>
                                                    <Input
                                                        type="date"
                                                        bsSize="sm"
                                                        value={bulkToDate}
                                                        onChange={(e) => setBulkToDate(e.target.value)}
                                                    />
                                                </Col>
                                            </Row>
                                            <Button
                                                color="primary"
                                                onClick={handleBulkSync}
                                                disabled={bulkSyncing}
                                            >
                                                {bulkSyncing ? (
                                                    <>
                                                        <Spinner size="sm" className="me-1" />
                                                        Syncing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-upload-cloud-2-line me-1"></i>
                                                        Start Bulk Sync
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-muted mb-0">
                                            Connect to Xero first to sync orders.
                                        </p>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Sync Logs Table */}
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            <i className="ri-file-list-3-line me-2"></i>
                                            Sync History
                                        </h5>
                                        <Button
                                            color="light"
                                            size="sm"
                                            onClick={fetchSyncLogs}
                                            title="Refresh"
                                        >
                                            <i className="ri-refresh-line"></i>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <DataTable
                                        columns={columns}
                                        data={syncLogs}
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
                                        responsive
                                        striped
                                        noDataComponent={
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-file-list-3-line fs-1 d-block mb-2"></i>
                                                No sync records found
                                            </div>
                                        }
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default XeroIntegration;
