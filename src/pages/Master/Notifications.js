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
    Input,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import tableCustomStyles from "../../Components/Common/tableStyles";

const Notifications = () => {
    const { adminData } = useContext(AuthContext);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [pageNo, setPageNo] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [selectedRows, setSelectedRows] = useState([]);
    const [toggleCleared, setToggleCleared] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

    // Unread count
    const [unreadCount, setUnreadCount] = useState(0);

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            aToken: localStorage.getItem("aToken") || "",
        },
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/notifications/get-notifications?page=${pageNo}&limit=${perPage}`,
                authHeaders
            );
            if (response.data.success) {
                setNotifications(response.data.data || []);
                setTotalRows(response.data.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await axios.get(
                `/api/notifications/get-unread-notification`,
                authHeaders
            );
            if (response.data.success) {
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    // Mark single as seen
    const handleMarkSeen = async (id) => {
        try {
            await axios.post(
                `/api/notifications/mark-notification-seen/${id}`,
                {},
                authHeaders
            );
            toast.success("Notification marked as read");
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            toast.error("Failed to mark notification");
        }
    };

    // Mark all as seen
    const handleMarkAllSeen = async () => {
        try {
            await axios.post(
                `/api/notifications/update-notification`,
                {},
                authHeaders
            );
            toast.success("All notifications marked as read");
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            toast.error("Failed to mark all notifications");
        }
    };

    // Bulk mark selected as seen
    const handleBulkMarkSeen = async () => {
        if (selectedRows.length === 0) return;
        try {
            await axios.post(
                `/api/notifications/bulk-mark-seen`,
                { ids: selectedRows.map((r) => r._id) },
                authHeaders
            );
            toast.success(`${selectedRows.length} notifications marked as read`);
            setToggleCleared(!toggleCleared);
            setSelectedRows([]);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            toast.error("Failed to mark notifications");
        }
    };

    // Delete single
    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(
                `/api/notifications/delete-notification/${deleteId}`,
                authHeaders
            );
            toast.success("Notification deleted");
            setDeleteModal(false);
            setDeleteId(null);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;
        try {
            await axios.post(
                `/api/notifications/bulk-delete`,
                { ids: selectedRows.map((r) => r._id) },
                authHeaders
            );
            toast.success(`${selectedRows.length} notifications deleted`);
            setBulkDeleteModal(false);
            setToggleCleared(!toggleCleared);
            setSelectedRows([]);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            toast.error("Failed to delete notifications");
        }
    };

    const handleSelectedRowsChange = ({ selectedRows }) => {
        setSelectedRows(selectedRows);
    };

    const getTypeBadge = (type) => {
        const map = {
            order: { color: "primary", label: "Order" },
            quote: { color: "info", label: "Quote" },
            system: { color: "secondary", label: "System" },
            support: { color: "warning", label: "Support" },
            review: { color: "success", label: "Review" },
        };
        const t = map[type] || { color: "dark", label: type || "General" };
        return <Badge color={t.color}>{t.label}</Badge>;
    };

    const columns = [
        {
            name: "Type",
            selector: (row) => row.type,
            cell: (row) => getTypeBadge(row.type),
            width: "100px",
            sortable: true,
        },
        {
            name: "Message",
            selector: (row) => row.message || row.text || "",
            cell: (row) => (
                <div
                    className={`py-1 ${!row.seen ? "fw-bold" : "text-muted"}`}
                    style={{ whiteSpace: "normal", minWidth: 200 }}
                >
                    {row.title && (
                        <div className="text-dark mb-1">{row.title}</div>
                    )}
                    <div>{row.message || row.text || "—"}</div>
                </div>
            ),
            grow: 3,
        },
        {
            name: "Status",
            selector: (row) => row.seen,
            cell: (row) =>
                row.seen ? (
                    <Badge color="light" className="text-muted">
                        Read
                    </Badge>
                ) : (
                    <Badge color="success">Unread</Badge>
                ),
            width: "90px",
            sortable: true,
        },
        {
            name: "Added By",
            selector: (row) => row.addedBy || "system",
            width: "120px",
        },
        {
            name: "Date",
            selector: (row) => row.addedAt || row.createdAt,
            cell: (row) => {
                const d = row.addedAt || row.createdAt;
                return d
                    ? new Date(d).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "—";
            },
            width: "180px",
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="d-flex gap-1">
                    {!row.seen && (
                        <Button
                            color="soft-success"
                            size="sm"
                            title="Mark as read"
                            onClick={() => handleMarkSeen(row._id)}
                        >
                            <i className="ri-check-line"></i>
                        </Button>
                    )}
                    <Button
                        color="soft-danger"
                        size="sm"
                        title="Delete"
                        onClick={() => handleDeleteClick(row._id)}
                    >
                        <i className="ri-delete-bin-line"></i>
                    </Button>
                </div>
            ),
            width: "120px",
        },
    ];

    document.title = "Notifications | SuperMerch Admin";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Notifications" pageTitle="Admin" />

                    {/* Summary Cards */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Card className="card-animate">
                                <CardBody className="text-center">
                                    <h5 className="text-muted mb-1">Total</h5>
                                    <h3 className="mb-0">{totalRows}</h3>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="card-animate">
                                <CardBody className="text-center">
                                    <h5 className="text-muted mb-1">Unread</h5>
                                    <h3 className="mb-0 text-success">
                                        {unreadCount}
                                    </h3>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="card-animate">
                                <CardBody className="d-flex align-items-center justify-content-end gap-2">
                                    {selectedRows.length > 0 && (
                                        <>
                                            <Button
                                                color="soft-success"
                                                size="sm"
                                                onClick={handleBulkMarkSeen}
                                            >
                                                <i className="ri-check-double-line me-1"></i>
                                                Mark Selected Read (
                                                {selectedRows.length})
                                            </Button>
                                            <Button
                                                color="soft-danger"
                                                size="sm"
                                                onClick={() =>
                                                    setBulkDeleteModal(true)
                                                }
                                            >
                                                <i className="ri-delete-bin-line me-1"></i>
                                                Delete Selected (
                                                {selectedRows.length})
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        color="primary"
                                        size="sm"
                                        onClick={handleMarkAllSeen}
                                        disabled={unreadCount === 0}
                                    >
                                        <i className="ri-check-double-line me-1"></i>
                                        Mark All Read
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Notifications Table */}
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0">
                                        All Notifications
                                    </h5>
                                </CardHeader>
                                <CardBody>
                                    <LoadingOverlay isLoading={loading}>
                                        <DataTable
                                            columns={columns}
                                            data={notifications}
                                            pagination
                                            paginationServer
                                            paginationTotalRows={totalRows}
                                            paginationPerPage={perPage}
                                            onChangePage={(p) => setPageNo(p)}
                                            onChangeRowsPerPage={(
                                                newPerPage
                                            ) => {
                                                setPerPage(newPerPage);
                                                setPageNo(1);
                                            }}
                                            selectableRows
                                            onSelectedRowsChange={
                                                handleSelectedRowsChange
                                            }
                                            clearSelectedRows={toggleCleared}
                                            customStyles={tableCustomStyles}
                                            highlightOnHover
                                            striped
                                            responsive
                                            noDataComponent={
                                                <div className="text-center py-5 text-muted">
                                                    <i
                                                        className="ri-notification-off-line"
                                                        style={{
                                                            fontSize: 48,
                                                        }}
                                                    ></i>
                                                    <p className="mt-2">
                                                        No notifications yet
                                                    </p>
                                                </div>
                                            }
                                        />
                                    </LoadingOverlay>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Delete Single Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteConfirm}
                onCloseClick={() => {
                    setDeleteModal(false);
                    setDeleteId(null);
                }}
            />

            {/* Bulk Delete Modal */}
            <DeleteModal
                show={bulkDeleteModal}
                onDeleteClick={handleBulkDelete}
                onCloseClick={() => setBulkDeleteModal(false)}
                title={`Delete ${selectedRows.length} notifications?`}
            />
        </React.Fragment>
    );
};

export default Notifications;
