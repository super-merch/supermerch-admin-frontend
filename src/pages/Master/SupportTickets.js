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
    Badge,
    Button,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const SupportTickets = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(20);
    const [pageNo, setPageNo] = useState(1);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Status counts for summary
    const [statusCounts, setStatusCounts] = useState({
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
        total: 0,
    });

    // View ticket modal
    const [viewModal, setViewModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        setLoading(true);

        try {
            const params = {
                page: pageNo,
                limit: perPage,
                search: query || "",
                status: statusFilter || undefined,
                category: categoryFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            };

            const response = await axios.get(`/api/admin/support-tickets`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                setTickets(response.data.data || []);
                setTotalRows(response.data.pagination?.totalCount || 0);

                // Calculate status counts from available data
                const data = response.data.data || [];
                const counts = {
                    OPEN: data.filter((t) => t.status === "OPEN").length,
                    IN_PROGRESS: data.filter((t) => t.status === "IN_PROGRESS")
                        .length,
                    RESOLVED: data.filter((t) => t.status === "RESOLVED")
                        .length,
                    CLOSED: data.filter((t) => t.status === "CLOSED").length,
                    total: response.data.pagination?.totalCount || 0,
                };
                setStatusCounts(counts);
            } else {
                setTickets([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setTickets([]);
            setTotalRows(0);
            toast.error("Failed to fetch support tickets!");
        } finally {
            setLoading(false);
        }
    }, [
        pageNo,
        perPage,
        query,
        statusFilter,
        categoryFilter,
        dateFrom,
        dateTo,
    ]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // View ticket details
    const handleViewTicket = async (ticketId) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/admin/support-tickets/${ticketId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                setSelectedTicket(response.data.data);
                setViewModal(true);
            } else {
                toast.error("Failed to load ticket details");
            }
        } catch (error) {
            console.error("Error fetching ticket:", error);
            toast.error("Failed to load ticket details");
        }
        setLoading(false);
    };

    // Send reply
    const handleSendReply = async () => {
        if (!replyMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setSendingReply(true);
        try {
            const response = await axios.post(
                `/api/admin/support-tickets/${selectedTicket.id}/reply`,
                { message: replyMessage },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Reply sent successfully");
                setReplyMessage("");
                // Reload ticket details
                handleViewTicket(selectedTicket.id);
                fetchTickets();
            } else {
                toast.error("Failed to send reply");
            }
        } catch (error) {
            console.error("Error sending reply:", error);
            toast.error("Failed to send reply");
        }
        setSendingReply(false);
    };

    // Update ticket status
    const handleStatusChange = async (ticketId, newStatus) => {
        setLoading(true);
        try {
            const response = await axios.patch(
                `/api/admin/support-tickets/${ticketId}/status`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Status updated successfully");
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                }
                fetchTickets();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
        setLoading(false);
    };

    // Delete ticket
    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.delete(
                `/api/admin/support-tickets/${deleteId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Ticket deleted successfully");
                setDeleteModal(false);
                setDeleteId(null);
                fetchTickets();
            } else {
                toast.error("Failed to delete ticket");
            }
        } catch (error) {
            console.error("Error deleting ticket:", error);
            toast.error("Failed to delete ticket");
        }
        setLoading(false);
    };

    const handleDeleteClose = () => {
        setDeleteModal(false);
        setDeleteId(null);
    };

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
        setPageNo(page);
    };

    // Clear all filters
    const clearFilters = () => {
        setQuery("");
        setStatusFilter("");
        setCategoryFilter("");
        setDateFrom("");
        setDateTo("");
        setPageNo(1);
    };

    // Check if filters are applied
    const hasFilters =
        query || statusFilter || categoryFilter || dateFrom || dateTo;

    // Get status badge
    const getStatusBadge = (status) => {
        const statusColors = {
            OPEN: "warning",
            IN_PROGRESS: "info",
            RESOLVED: "success",
            CLOSED: "secondary",
        };
        return (
            <Badge color={statusColors[status] || "secondary"}>
                {status.replace("_", " ")}
            </Badge>
        );
    };

    // Get category badge
    const getCategoryBadge = (category) => {
        const categoryColors = {
            ORDERS: "primary",
            PAYMENT: "success",
            TECHNICAL: "danger",
            PRODUCT: "info",
            RETURNS: "warning",
            OTHER: "secondary",
        };
        return (
            <Badge
                color={categoryColors[category] || "secondary"}
                className="me-1"
            >
                {category}
            </Badge>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format relative time
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800)
            return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });
    };

    const columns = [
        {
            name: "Ticket #",
            selector: (row) => row.ticketNumber,
            sortable: true,
            minWidth: "130px",
            cell: (row) => (
                <div className="d-flex align-items-center">
                    <span className="fw-medium text-primary">
                        {row.ticketNumber}
                    </span>
                    {row.hasUnreadMessages && (
                        <Badge color="danger" className="ms-2" pill>
                            New
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            name: "User",
            selector: (row) =>
                `${row.websiteUser?.firstName || ""} ${
                    row.websiteUser?.lastName || ""
                }`.trim(),
            sortable: true,
            minWidth: "150px",
            cell: (row) => (
                <div>
                    <div className="fw-medium">
                        {row.websiteUser?.firstName || ""}{" "}
                        {row.websiteUser?.lastName || ""}
                    </div>
                    <small className="text-muted">
                        {row.websiteUser?.email}
                    </small>
                </div>
            ),
        },
        {
            name: "Category",
            selector: (row) => row.category,
            sortable: true,
            minWidth: "120px",
            cell: (row) => getCategoryBadge(row.category),
        },
        {
            name: "Subject",
            selector: (row) => row.subject,
            sortable: true,
            minWidth: "220px",
            cell: (row) => (
                <div
                    className="text-truncate"
                    style={{ maxWidth: "220px" }}
                    title={row.subject}
                >
                    {row.subject}
                </div>
            ),
        },
        {
            name: "Status",
            selector: (row) => row.status,
            sortable: true,
            minWidth: "120px",
            cell: (row) => getStatusBadge(row.status),
        },
        {
            name: "Messages",
            selector: (row) => row._count?.messages || 0,
            sortable: true,
            cell: (row) => (
                <Badge color="light" className="text-dark">
                    <i className="ri-chat-3-line me-1"></i>
                    {row._count?.messages || 0}
                </Badge>
            ),
        },
        {
            name: "Created",
            selector: (row) => new Date(row.createdAt).getTime(),
            sortable: true,
            minWidth: "130px",
            cell: (row) => (
                <div>
                    <div className="small">{formatTimeAgo(row.createdAt)}</div>
                    <small className="text-muted">
                        {formatDate(row.createdAt).split(",")[0]}
                    </small>
                </div>
            ),
        },
        {
            name: "Action",
            cell: (row) => (
                <div className="d-flex gap-1">
                    <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleViewTicket(row.id)}
                    >
                        <i className="ri-eye-line"></i>
                    </Button>
                    {currentPagePermissions?.delete && (
                        <Button
                            color="danger"
                            size="sm"
                            onClick={() => {
                                setDeleteId(row.id);
                                setDeleteModal(true);
                            }}
                        >
                            <i className="ri-delete-bin-line"></i>
                        </Button>
                    )}
                </div>
            ),
            minWidth: "100px",
        },
    ];

    // Status summary card component
    const StatusCard = ({ title, count, color, icon, onClick, active }) => (
        <Col xs={6} md={3} lg={true}>
            <Card
                className={`mb-2 cursor-pointer ${
                    active ? "border-2 border-" + color : ""
                }`}
                onClick={onClick}
                style={{ cursor: "pointer" }}
            >
                <CardBody className="p-3">
                    <div className="d-flex align-items-center">
                        <div
                            className={`avatar-sm rounded bg-${color}-subtle flex-shrink-0`}
                        >
                            <span
                                className={`avatar-title rounded text-${color}`}
                            >
                                <i className={`${icon} fs-4`}></i>
                            </span>
                        </div>
                        <div className="flex-grow-1 ms-3">
                            <p className="text-uppercase fw-medium text-muted mb-1 fs-12">
                                {title}
                            </p>
                            <h4 className="mb-0">
                                <span className="counter-value">{count}</span>
                            </h4>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </Col>
    );

    const exportColumns = [
        { header: "Ticket #", key: "ticketNumber" },
        { header: "Category", key: "category" },
        { header: "Subject", key: "subject" },
        { header: "Status", key: "status" },
        { header: "Created", key: "createdAt" },
    ];

    const fetchAllForExport = async () => {
        try {
            const response = await axios.get(`/api/admin/support-tickets`, {
                params: { page: 1, limit: 10000 },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (response.data.success) return response.data.data || [];
            return [];
        } catch { return []; }
    };

    document.title = `Support Tickets | ${adminData?.companyName}`;

    return (
        <React.Fragment>
            {loading && <LoadingOverlay />}
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Support"
                        title="Support Tickets"
                        pageTitle="Support"
                    />

                    {/* Status Summary Cards */}
                    <Row className="mb-3">
                        <StatusCard
                            title="Total"
                            count={statusCounts.total}
                            color="white"
                            icon="ri-customer-service-2-line"
                            onClick={() => setStatusFilter("")}
                            active={statusFilter === ""}
                        />
                        <StatusCard
                            title="Open"
                            count={statusCounts.OPEN}
                            color="white"
                            icon="ri-time-line"
                            onClick={() => setStatusFilter("OPEN")}
                            active={statusFilter === "OPEN"}
                        />
                        <StatusCard
                            title="In Progress"
                            count={statusCounts.IN_PROGRESS}
                            color="white"
                            icon="ri-loader-4-line"
                            onClick={() => setStatusFilter("IN_PROGRESS")}
                            active={statusFilter === "IN_PROGRESS"}
                        />
                        <StatusCard
                            title="Resolved"
                            count={statusCounts.RESOLVED}
                            color="white"
                            icon="ri-check-double-line"
                            onClick={() => setStatusFilter("RESOLVED")}
                            active={statusFilter === "RESOLVED"}
                        />
                        <StatusCard
                            title="Closed"
                            count={statusCounts.CLOSED}
                            color="white"
                            icon="ri-lock-line"
                            onClick={() => setStatusFilter("CLOSED")}
                            active={statusFilter === "CLOSED"}
                        />
                    </Row>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <Row className="g-3 align-items-center">
                                        <Col xl={3} lg={4} md={6}>
                                            <div className="search-box">
                                                <Input
                                                    type="text"
                                                    placeholder="Search tickets, users..."
                                                    value={query}
                                                    onChange={(e) =>
                                                        setQuery(e.target.value)
                                                    }
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="select"
                                                value={statusFilter}
                                                onChange={(e) =>
                                                    setStatusFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Status
                                                </option>
                                                <option value="OPEN">
                                                    Open
                                                </option>
                                                <option value="IN_PROGRESS">
                                                    In Progress
                                                </option>
                                                <option value="RESOLVED">
                                                    Resolved
                                                </option>
                                                <option value="CLOSED">
                                                    Closed
                                                </option>
                                            </Input>
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="select"
                                                value={categoryFilter}
                                                onChange={(e) =>
                                                    setCategoryFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Categories
                                                </option>
                                                <option value="ORDERS">
                                                    Orders
                                                </option>
                                                <option value="PAYMENT">
                                                    Payment
                                                </option>
                                                <option value="TECHNICAL">
                                                    Technical
                                                </option>
                                                <option value="PRODUCT">
                                                    Product
                                                </option>
                                                <option value="RETURNS">
                                                    Returns
                                                </option>
                                                <option value="OTHER">
                                                    Other
                                                </option>
                                            </Input>
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="date"
                                                placeholder="From Date"
                                                value={dateFrom}
                                                onChange={(e) =>
                                                    setDateFrom(e.target.value)
                                                }
                                            />
                                        </Col>
                                        <Col xl={2} lg={4} md={6}>
                                            <Input
                                                type="date"
                                                placeholder="To Date"
                                                value={dateTo}
                                                onChange={(e) =>
                                                    setDateTo(e.target.value)
                                                }
                                            />
                                        </Col>
                                        <Col
                                            xl="auto"
                                            lg={4}
                                            md={6}
                                            className="d-flex align-items-center justify-content-xl-end flex-wrap gap-2"
                                        >
                                            <ExportButtons
                                                data={tickets}
                                                columns={exportColumns}
                                                fileName="support-tickets"
                                                fetchAll={fetchAllForExport}
                                            />
                                            {hasFilters && (
                                                <Button
                                                    color="light"
                                                    onClick={clearFilters}
                                                    title="Clear Filters"
                                                >
                                                    <i className="ri-filter-off-line"></i>
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                </CardHeader>

                                <CardBody>
                                    <DataTable
                                        columns={columns}
                                        data={tickets}
                                        progressPending={loading}
                                        customStyles={tableCustomStyles}
                                        pagination
                                        paginationServer
                                        paginationTotalRows={totalRows}
                                        paginationDefaultPage={pageNo}
                                        paginationPerPage={perPage}
                                        paginationRowsPerPageOptions={[
                                            10, 20, 50, 100,
                                        ]}
                                        onChangeRowsPerPage={
                                            handlePerRowsChange
                                        }
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

            {/* View Ticket Modal */}
            <Modal
                isOpen={viewModal}
                toggle={() => setViewModal(false)}
                size="xl"
                scrollable
            >
                <ModalHeader toggle={() => setViewModal(false)}>
                    {selectedTicket && (
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-bold">
                                    Ticket #{selectedTicket.ticketNumber}
                                </span>
                                {getCategoryBadge(selectedTicket.category)}
                                {getStatusBadge(selectedTicket.status)}
                            </div>
                            <small className="text-muted">
                                Created: {formatDate(selectedTicket.createdAt)}
                            </small>
                        </div>
                    )}
                </ModalHeader>
                <ModalBody>
                    {selectedTicket && (
                        <Row>
                            {/* Left Column - Ticket Details */}
                            <Col md={5}>
                                {/* User Info */}
                                <Card className="mb-3">
                                    <CardBody>
                                        <h6 className="mb-3 text-primary">
                                            <i className="ri-user-line me-2"></i>
                                            Customer Information
                                        </h6>
                                        <div className="mb-2">
                                            <strong>Name:</strong>{" "}
                                            {
                                                selectedTicket.websiteUser
                                                    ?.firstName
                                            }{" "}
                                            {
                                                selectedTicket.websiteUser
                                                    ?.lastName
                                            }
                                        </div>
                                        <div className="mb-2">
                                            <strong>Email:</strong>{" "}
                                            <a
                                                href={`mailto:${selectedTicket.websiteUser?.email}`}
                                            >
                                                {
                                                    selectedTicket.websiteUser
                                                        ?.email
                                                }
                                            </a>
                                        </div>
                                        {selectedTicket.websiteUser?.phone && (
                                            <div>
                                                <strong>Phone:</strong>{" "}
                                                <a
                                                    href={`tel:${selectedTicket.websiteUser?.phone}`}
                                                >
                                                    {
                                                        selectedTicket
                                                            .websiteUser?.phone
                                                    }
                                                </a>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Ticket Details */}
                                <Card className="mb-3">
                                    <CardBody>
                                        <h6 className="mb-3 text-primary">
                                            <i className="ri-ticket-2-line me-2"></i>
                                            Ticket Details
                                        </h6>
                                        <div className="mb-2">
                                            <strong>Subject:</strong>
                                            <p className="mb-0 mt-1">
                                                {selectedTicket.subject}
                                            </p>
                                        </div>
                                        <div className="mb-2">
                                            <strong>Description:</strong>
                                            <p
                                                className="mb-0 mt-1 bg-light p-2 rounded"
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {selectedTicket.description}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Attachments */}
                                {selectedTicket.attachments &&
                                    selectedTicket.attachments.length > 0 && (
                                        <Card className="mb-3">
                                            <CardBody>
                                                <h6 className="mb-3 text-primary">
                                                    <i className="ri-attachment-2 me-2"></i>
                                                    Attachments (
                                                    {
                                                        selectedTicket
                                                            .attachments.length
                                                    }
                                                    )
                                                </h6>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {selectedTicket.attachments.map(
                                                        (attachment) => (
                                                            <a
                                                                key={
                                                                    attachment.id
                                                                }
                                                                href={
                                                                    attachment.fileUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="ri-image-line me-1"></i>
                                                                {
                                                                    attachment.fileName
                                                                }
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}

                                {/* Status Update */}
                                <Card>
                                    <CardBody>
                                        <h6 className="mb-3 text-primary">
                                            <i className="ri-settings-3-line me-2"></i>
                                            Update Status
                                        </h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button
                                                color="warning"
                                                size="sm"
                                                outline={
                                                    selectedTicket.status !==
                                                    "OPEN"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedTicket.id,
                                                        "OPEN"
                                                    )
                                                }
                                                disabled={
                                                    selectedTicket.status ===
                                                    "OPEN"
                                                }
                                            >
                                                Open
                                            </Button>
                                            <Button
                                                color="info"
                                                size="sm"
                                                outline={
                                                    selectedTicket.status !==
                                                    "IN_PROGRESS"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedTicket.id,
                                                        "IN_PROGRESS"
                                                    )
                                                }
                                                disabled={
                                                    selectedTicket.status ===
                                                    "IN_PROGRESS"
                                                }
                                            >
                                                In Progress
                                            </Button>
                                            <Button
                                                color="success"
                                                size="sm"
                                                outline={
                                                    selectedTicket.status !==
                                                    "RESOLVED"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedTicket.id,
                                                        "RESOLVED"
                                                    )
                                                }
                                                disabled={
                                                    selectedTicket.status ===
                                                    "RESOLVED"
                                                }
                                            >
                                                Resolved
                                            </Button>
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                outline={
                                                    selectedTicket.status !==
                                                    "CLOSED"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedTicket.id,
                                                        "CLOSED"
                                                    )
                                                }
                                                disabled={
                                                    selectedTicket.status ===
                                                    "CLOSED"
                                                }
                                            >
                                                Closed
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* Right Column - Conversation */}
                            <Col md={7}>
                                <Card className="h-100">
                                    <CardHeader className="bg-primary text-white">
                                        <h6 className="mb-0 text-white">
                                            <i className="ri-chat-3-line me-2"></i>
                                            Conversation
                                        </h6>
                                    </CardHeader>
                                    <CardBody
                                        className="p-3"
                                        style={{
                                            maxHeight: "400px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        {selectedTicket.messages &&
                                        selectedTicket.messages.length > 0 ? (
                                            selectedTicket.messages.map(
                                                (msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={`d-flex mb-3 ${
                                                            msg.senderType ===
                                                            "ADMIN"
                                                                ? "justify-content-end"
                                                                : "justify-content-start"
                                                        }`}
                                                    >
                                                        {/* User Avatar - Left side */}
                                                        {msg.senderType !==
                                                            "ADMIN" && (
                                                            <div className="flex-shrink-0 me-2">
                                                                <div
                                                                    className="avatar-xs rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        width: "32px",
                                                                        height: "32px",
                                                                    }}
                                                                >
                                                                    <i className="ri-user-line text-white fs-6"></i>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Message Bubble */}
                                                        <div
                                                            className={`p-3 rounded-3 position-relative ${
                                                                msg.senderType ===
                                                                "ADMIN"
                                                                    ? "bg-primary text-white"
                                                                    : "bg-light"
                                                            }`}
                                                            style={{
                                                                maxWidth: "75%",
                                                                borderTopLeftRadius:
                                                                    msg.senderType !==
                                                                    "ADMIN"
                                                                        ? "0"
                                                                        : undefined,
                                                                borderTopRightRadius:
                                                                    msg.senderType ===
                                                                    "ADMIN"
                                                                        ? "0"
                                                                        : undefined,
                                                            }}
                                                        >
                                                            <div
                                                                className={`d-flex align-items-center mb-1 ${
                                                                    msg.senderType ===
                                                                    "ADMIN"
                                                                        ? "justify-content-end"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <strong
                                                                    className={`small ${
                                                                        msg.senderType ===
                                                                        "ADMIN"
                                                                            ? "text-white"
                                                                            : "text-primary"
                                                                    }`}
                                                                >
                                                                    {
                                                                        msg.senderName
                                                                    }
                                                                </strong>
                                                                {msg.senderType ===
                                                                    "ADMIN" && (
                                                                    <Badge
                                                                        color="light"
                                                                        className="ms-2 text-primary"
                                                                        pill
                                                                    >
                                                                        Support
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={`mb-1 ${
                                                                    msg.senderType ===
                                                                    "ADMIN"
                                                                        ? "text-white"
                                                                        : ""
                                                                }`}
                                                                style={{
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                    wordBreak:
                                                                        "break-word",
                                                                }}
                                                            >
                                                                {msg.message}
                                                            </p>
                                                            <small
                                                                className={`d-block ${
                                                                    msg.senderType ===
                                                                    "ADMIN"
                                                                        ? "text-white-50 text-end"
                                                                        : "text-muted"
                                                                }`}
                                                                style={{
                                                                    fontSize:
                                                                        "0.7rem",
                                                                }}
                                                            >
                                                                {formatDate(
                                                                    msg.createdAt
                                                                )}
                                                            </small>
                                                        </div>

                                                        {/* Admin Avatar - Right side */}
                                                        {msg.senderType ===
                                                            "ADMIN" && (
                                                            <div className="flex-shrink-0 ms-2">
                                                                <div
                                                                    className="avatar-xs rounded-circle bg-success d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        width: "32px",
                                                                        height: "32px",
                                                                    }}
                                                                >
                                                                    <i className="ri-customer-service-2-line text-white fs-6"></i>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <div className="text-center text-muted py-5">
                                                <i className="ri-chat-3-line fs-1"></i>
                                                <p>No messages yet</p>
                                            </div>
                                        )}
                                    </CardBody>

                                    {/* Reply Box */}
                                    {selectedTicket.status !== "CLOSED" && (
                                        <div className="border-top p-3">
                                            <Label className="fw-medium mb-2">
                                                Send Reply
                                            </Label>
                                            <Input
                                                type="textarea"
                                                rows="3"
                                                placeholder="Type your reply here..."
                                                value={replyMessage}
                                                onChange={(e) =>
                                                    setReplyMessage(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <div className="d-flex justify-content-end mt-2">
                                                <Button
                                                    color="primary"
                                                    onClick={handleSendReply}
                                                    disabled={
                                                        sendingReply ||
                                                        !replyMessage.trim()
                                                    }
                                                >
                                                    {sendingReply ? (
                                                        <>
                                                            <i className="ri-loader-4-line animate-spin me-1"></i>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ri-send-plane-line me-1"></i>
                                                            Send Reply
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="secondary"
                        onClick={() => setViewModal(false)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Modal */}
            <DeleteModal
                show={deleteModal}
                handleDelete={handleDelete}
                toggle={handleDeleteClose}
                setmodal_delete={setDeleteModal}
            />
        </React.Fragment>
    );
};

export default SupportTickets;
