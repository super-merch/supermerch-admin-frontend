import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardHeader,
    Badge,
    Button,
    Table,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Label,
    FormGroup,
    Spinner,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import config from "../../config";

const apiUrl = config.api.API_URL;

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adminData } = useContext(AuthContext);

    // States
    const [isLoading, setIsLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(true);
    const [order, setOrder] = useState(null);

    // Item-level status update modal
    const [itemStatusModal, setItemStatusModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newItemStatus, setNewItemStatus] = useState("");
    const [itemStatusNotes, setItemStatusNotes] = useState("");
    const [itemTrackingNumber, setItemTrackingNumber] = useState("");
    const [itemTrackingLink, setItemTrackingLink] = useState("");
    const [itemLogisticId, setItemLogisticId] = useState("");

    // Logistics for dispatch
    const [logistics, setLogistics] = useState([]);

    // Item history modal
    const [itemHistoryModal, setItemHistoryModal] = useState(false);
    const [selectedItemHistory, setSelectedItemHistory] = useState(null);

    // Edit tracking modal
    const [editTrackingModal, setEditTrackingModal] = useState(false);
    const [editTrackingItem, setEditTrackingItem] = useState(null);
    const [editTrackingNumber, setEditTrackingNumber] = useState("");
    const [editTrackingLink, setEditTrackingLink] = useState("");
    const [editLogisticId, setEditLogisticId] = useState("");

    // Invoice download
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    // Delivery date override
    const [deliveryDateOverride, setDeliveryDateOverride] = useState("");
    const [savingDeliveryDate, setSavingDeliveryDate] = useState(false);

    // Customization Proof states
    const [proofModal, setProofModal] = useState(false);
    const [selectedProofItem, setSelectedProofItem] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [proofNotes, setProofNotes] = useState("");
    const [uploadingProof, setUploadingProof] = useState(false);
    const [itemProofs, setItemProofs] = useState(null);
    const [proofViewModal, setProofViewModal] = useState(false);
    const [proofCommentText, setProofCommentText] = useState("");

    // Item statuses for item-level updates
    const itemStatuses = [
        { value: "PENDING", label: "Pending" },
        { value: "PENDING_VERIFICATION", label: "Pending Verification" },
        { value: "REJECTED", label: "Rejected" },
        { value: "VERIFIED", label: "Verified" },
        { value: "CONFIRMED", label: "Confirmed" },
        { value: "PROCESSING", label: "Processing" },
        { value: "DISPATCHED", label: "Dispatched" },
        { value: "DELIVERED", label: "Delivered" },
        { value: "CANCELLED", label: "Cancelled" },
        { value: "REFUNDED", label: "Refunded" },
        { value: "RETURNED", label: "Returned" },
    ];

    // Helper: Check if item is first in its customization group
    const isFirstInCustomizationGroup = (item, items) => {
        if (!item.customizationGroupId) return true;
        const groupItems = items.filter(
            (i) => i.customizationGroupId === item.customizationGroupId
        );
        return groupItems[0]?.id === item.id;
    };

    // Helper: Get all items in a customization group
    const getItemsInGroup = (groupId, items) => {
        if (!groupId) return [];
        return items.filter((i) => i.customizationGroupId === groupId);
    };

    // Fetch logistics for dispatch
    const fetchLogistics = useCallback(async () => {
        try {
            const response = await axios.get(`/api/logistics?isActive=true`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (response.data.success) {
                setLogistics(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching logistics:", error);
        }
    }, []);

    // Fetch order details
    const fetchOrder = useCallback(async () => {
        setOrderLoading(true);
        try {
            const response = await axios.get(`/api/admin/orders/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                toast.error("Order not found");
                navigate("/orders");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Failed to fetch order details");
            navigate("/orders");
        } finally {
            setOrderLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (id) {
            fetchOrder();
            fetchLogistics();
        }
    }, [id, fetchOrder, fetchLogistics]);

    // Update individual item status
    const handleUpdateItemStatus = async () => {
        if (!newItemStatus || !selectedItem) {
            toast.error("Please select a status");
            return;
        }

        // Tracking link is now optional for DISPATCHED status
        // Removed validation check

        setIsLoading(true);
        try {
            const response = await axios.put(
                `/api/admin/orders/${order.id}/items/${selectedItem.id}/status`,
                {
                    status: newItemStatus,
                    notes: itemStatusNotes,
                    tracking: {
                        trackingNumber: itemTrackingNumber || undefined,
                        trackingLink: itemTrackingLink || undefined,
                        logisticId: itemLogisticId || undefined,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Item status updated successfully");
                setOrder(response.data.data);
                setItemStatusModal(false);
                setSelectedItem(null);
                setNewItemStatus("");
                setItemStatusNotes("");
                setItemTrackingNumber("");
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Error updating item status:", error);
            toast.error(
                error.response?.data?.message || "Failed to update item status"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Open item status modal
    const openItemStatusModal = (item) => {
        setSelectedItem(item);
        setNewItemStatus("");
        setItemStatusNotes("");
        setItemTrackingNumber(item.trackingNumber || "");
        setItemTrackingLink(item.trackingLink || "");
        setItemLogisticId(item.logisticId || "");
        setItemStatusModal(true);
    };

    // Open item history modal
    const openItemHistoryModal = (item) => {
        setSelectedItemHistory(item);
        setItemHistoryModal(true);
    };

    // Open edit tracking modal
    const openEditTrackingModal = (item) => {
        setEditTrackingItem(item);
        setEditTrackingNumber(item.trackingNumber || "");
        setEditTrackingLink(item.trackingLink || "");
        setEditLogisticId(item.logisticId || "");
        setEditTrackingModal(true);
    };

    // Update tracking info
    const handleUpdateTracking = async () => {
        if (!editTrackingItem) return;

        // Tracking link is now optional
        // Removed validation check

        setIsLoading(true);
        try {
            const response = await axios.put(
                `/api/admin/orders/${order.id}/items/${editTrackingItem.id}/tracking`,
                {
                    trackingNumber: editTrackingNumber || undefined,
                    trackingLink: editTrackingLink || undefined,
                    logisticId: editLogisticId || undefined,
                    notes: "Tracking information updated",
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Tracking information updated");
                fetchOrder(); // Refresh order data
                setEditTrackingModal(false);
                setEditTrackingItem(null);
            } else {
                toast.error(
                    response.data.message || "Failed to update tracking"
                );
            }
        } catch (error) {
            console.error("Error updating tracking:", error);
            toast.error(
                error.response?.data?.message || "Failed to update tracking"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Download invoice
    const handleDownloadInvoice = async () => {
        if (!order) return;

        setDownloadingInvoice(true);
        try {
            const response = await axios.get(
                `/api/admin/invoices/order/${order.orderNumber}/pdf`,
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            // Create blob URL and trigger download
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice-${order.orderNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error(
                error.response?.data?.message || "Failed to download invoice"
            );
        } finally {
            setDownloadingInvoice(false);
        }
    };

    // Save delivery date override
    const handleSaveDeliveryDate = async () => {
        if (!deliveryDateOverride) {
            toast.error("Please select a delivery date");
            return;
        }

        setSavingDeliveryDate(true);
        try {
            const response = await axios.put(
                `/api/admin/orders/${order.id}/delivery-date`,
                { deliveryDate: deliveryDateOverride },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Delivery date updated successfully");
                fetchOrder();
            } else {
                toast.error(response.data.message || "Failed to update delivery date");
            }
        } catch (error) {
            console.error("Error updating delivery date:", error);
            toast.error(error.response?.data?.message || "Failed to update delivery date");
        } finally {
            setSavingDeliveryDate(false);
        }
    };

    // ===== CUSTOMIZATION PROOF FUNCTIONS =====

    // Open proof upload modal for an item
    const openProofModal = (item) => {
        setSelectedProofItem(item);
        setProofFile(null);
        setProofNotes("");
        setProofModal(true);
    };

    // Upload proof for an item
    const handleUploadProof = async () => {
        if (!proofFile || !selectedProofItem) {
            toast.error("Please select a file");
            return;
        }

        setUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append("proof", proofFile);
            formData.append("adminNotes", proofNotes);
            formData.append("orderId", order.id || order._id);

            const response = await axios.post(
                `/api/admin/orders/items/${selectedProofItem.id}/proofs`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                toast.success(
                    "Proof uploaded successfully. Customer will be notified."
                );
                fetchOrder(); // Refresh order data
                setProofModal(false);
                setSelectedProofItem(null);
                setProofFile(null);
                setProofNotes("");
            } else {
                toast.error(response.data.message || "Failed to upload proof");
            }
        } catch (error) {
            console.error("Error uploading proof:", error);
            toast.error(
                error.response?.data?.message || "Failed to upload proof"
            );
        } finally {
            setUploadingProof(false);
        }
    };

    // View proofs for an item
    const openProofViewModal = async (item) => {
        setSelectedProofItem(item);
        setItemProofs(null);
        setProofViewModal(true);

        try {
            const response = await axios.get(
                `/api/admin/orders/items/${item.id}/proofs`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                const proofs = Array.isArray(response.data.data)
                    ? response.data.data
                    : response.data.data?.proofs || [];
                setItemProofs({ proofs });
            }
        } catch (error) {
            console.error("Error fetching proofs:", error);
            toast.error("Failed to fetch proof details");
        }
    };

    // Add comment to a proof
    const handleAddProofComment = async (proofId) => {
        if (!proofCommentText.trim()) {
            toast.error("Please enter a comment");
            return;
        }

        try {
            const response = await axios.post(
                `/api/admin/proofs/${proofId}/comments`,
                { message: proofCommentText },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Comment added");
                setProofCommentText("");
                // Refresh proofs
                openProofViewModal(selectedProofItem);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Failed to add comment");
        }
    };

    // Get proof status badge color
    const getProofStatusColor = (status) => {
        const colors = {
            NOT_REQUIRED: "secondary",
            PENDING_CUSTOMER_LOGO: "warning",
            PENDING_PROOF: "warning",
            AWAITING_APPROVAL: "info",
            APPROVED: "success",
            REVISION_REQUESTED: "danger",
        };
        return colors[status] || "secondary";
    };

    // Format proof status for display
    const formatProofStatus = (status) => {
        const labels = {
            NOT_REQUIRED: "No Proof Needed",
            PENDING_CUSTOMER_LOGO: "Waiting for Customer Logo",
            PENDING_PROOF: "Pending Upload",
            AWAITING_APPROVAL: "Awaiting Approval",
            APPROVED: "Approved",
            REVISION_REQUESTED: "Revision Requested",
        };
        return labels[status] || status;
    };

    // Get order status badge color
    const getOrderStatusColor = (status) => {
        const colors = {
            PENDING: "warning",
            PENDING_VERIFICATION: "info",
            REJECTED: "danger",
            VERIFIED: "primary",
            CONFIRMED: "primary",
            PROCESSING: "secondary",
            DISPATCHED: "dark",
            DELIVERED: "success",
            CANCELLED: "danger",
            REFUNDED: "dark",
            RETURNED: "warning",
            // Partial statuses
            PARTIALLY_DISPATCHED: "info",
            PARTIALLY_DELIVERED: "primary",
            PARTIALLY_CANCELLED: "secondary",
            PARTIALLY_REFUNDED: "secondary",
        };
        return colors[status] || "secondary";
    };

    // Get item status badge color
    const getItemStatusColor = (status) => {
        const colors = {
            PENDING: "warning",
            PENDING_VERIFICATION: "info",
            REJECTED: "danger",
            VERIFIED: "primary",
            CONFIRMED: "primary",
            PROCESSING: "secondary",
            DISPATCHED: "dark",
            DELIVERED: "success",
            CANCELLED: "danger",
            REFUNDED: "dark",
            RETURNED: "warning",
        };
        return colors[status] || "secondary";
    };

    // Get payment status badge color
    const getPaymentStatusColor = (status) => {
        const colors = {
            PENDING: "warning",
            PAID: "success",
            FAILED: "danger",
            REFUNDED: "info",
            PARTIALLY_REFUNDED: "warning",
        };
        return colors[status] || "secondary";
    };

    // Format status for display
    const formatStatus = (status) => {
        const statusMap = {
            PENDING: "Pending",
            PENDING_VERIFICATION: "Pending Verification",
            REJECTED: "Rejected",
            VERIFIED: "Verified",
            CONFIRMED: "Confirmed",
            PROCESSING: "Processing",
            DISPATCHED: "Dispatched",
            DELIVERED: "Delivered",
            CANCELLED: "Cancelled",
            REFUNDED: "Refunded",
            RETURNED: "Returned",
            PARTIALLY_DISPATCHED: "Partially Dispatched",
            PARTIALLY_DELIVERED: "Partially Delivered",
            PARTIALLY_CANCELLED: "Partially Cancelled",
            PARTIALLY_REFUNDED: "Partially Refunded",
        };
        return statusMap[status] || status;
    };

    // Generate image URL
    const generateImageUrl = (item) => {
        let url = null;
        if (
            item.itemType === "PRODUCT" &&
            item.product?.images?.[0]?.imageUrl
        ) {
            url = item.product.images[0].imageUrl;
        } else if (item.itemType === "DEAL" && item.deal?.bannerImage) {
            url = item.deal.bannerImage;
        } else if (item.image) {
            url = item.image;
        }

        if (!url) return null;

        if (url.includes("http") || url.includes("https")) {
            return url;
        }
        return `${apiUrl}/${url}`;
    };

    // Get customization image URL
    const getCustomizationImageUrl = (url) => {
        if (!url) return null;
        if (url.includes("http") || url.includes("https")) {
            return url;
        }
        return `${apiUrl}/${url}`;
    };

    document.title = order
        ? `Order #${order.orderNumber} | ${adminData.companyName}`
        : `Order Details | ${adminData.companyName}`;

    // Show a rate only when the order actually stored one. Defaulting a missing
    // value to 10 would assert a rate this order never recorded, and could put
    // "GST (10%)" above a $0.00 tax line, which is worse than saying less.
    // Every current order stores gstPercent (checked, 18 of 18), so this is
    // about imported or legacy records rather than today's data.
    //
    // Check the TYPE before coercing. `Number(order?.gstPercent)` on its own is
    // not the conservative thing it looks like: Number(null) is 0, and so are
    // Number("") and Number(" "). Number.isFinite(0) is true, so a legacy order
    // with gstPercent: null rendered "GST (0%)" - and this row only renders
    // when taxAmount > 0, so that label sat directly beside a positive tax
    // charge. Zero percent cannot produce positive GST; the label was making a
    // confident false claim about tax, which is the one thing it must not do.
    //
    // A stored 0 degrades to plain "GST" for the same reason. If the amount is
    // positive the rate cannot be zero, so the record is inconsistent and the
    // honest response is to state less, not to repeat the contradiction.
    const rawGstRate = order?.gstPercent;
    const gstRate =
        typeof rawGstRate === "number"
            ? rawGstRate
            : typeof rawGstRate === "string" && rawGstRate.trim() !== ""
              ? Number(rawGstRate)
              : NaN;
    const gstLabel =
        Number.isFinite(gstRate) && gstRate > 0 ? `GST (${gstRate}%)` : "GST";

    if (orderLoading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center py-5">
                        <Spinner
                            color="primary"
                            style={{ width: "3rem", height: "3rem" }}
                        />
                        <p className="mt-3">Loading order details...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page-content">
                <Container fluid>
                    <div className="text-center py-5">
                        <i className="ri-error-warning-line fs-1 text-danger"></i>
                        <h5 className="mt-3">Order not found</h5>
                        <Button
                            color="primary"
                            onClick={() => navigate("/orders")}
                        >
                            Back to Orders
                        </Button>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title={`Order #${order.orderNumber}`}
                        pageTitle="Orders"
                        pageLink="/orders"
                    />

                    {/* Action Bar */}
                    <Card className="mb-4">
                        <CardBody className="py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <Button
                                    color="light"
                                    onClick={() => navigate("/orders")}
                                    className="d-flex align-items-center"
                                >
                                    <i className="ri-arrow-left-line me-1"></i>{" "}
                                    Back to Orders
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Customization Proof Info Alert */}
                    {order.requiresVerification && (
                        <Card className="mb-4 border border-info bg-info bg-opacity-10">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <i className="ri-file-pdf-line fs-2 text-info me-3"></i>
                                    <div>
                                        <h5 className="mb-1 text-info">
                                            Customization Proof Required
                                        </h5>
                                        <p className="mb-0 text-muted">
                                            This order contains customized
                                            items. Upload design proofs for each
                                            item, and customers will approve
                                            them before production can begin.
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    <Row>
                        {/* Order Info */}
                        <Col lg={8}>
                            {/* Order Header */}
                            <Card className="mb-4">
                                <CardHeader className="bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                            Order #{order.orderNumber}
                                        </h5>
                                        <div className="d-flex gap-2">
                                            <Badge
                                                color={getOrderStatusColor(
                                                    order.status
                                                )}
                                                className="text-white fs-6"
                                            >
                                                {formatStatus(order.status)}
                                            </Badge>
                                            <Badge
                                                color={getPaymentStatusColor(
                                                    order.paymentStatus
                                                )}
                                                className="text-white fs-6"
                                            >
                                                {order.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                        <Col md={6}>
                                            <Table
                                                size="sm"
                                                borderless
                                                className="mb-0"
                                            >
                                                <tbody>
                                                    <tr>
                                                        <td
                                                            className="text-muted"
                                                            width="140"
                                                        >
                                                            Order Date:
                                                        </td>
                                                        <td className="fw-medium">
                                                            {new Date(
                                                                order.createdAt
                                                            ).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted">
                                                            Order Type:
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                color="light"
                                                                className="text-dark"
                                                            >
                                                                {
                                                                    order.orderType
                                                                }
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted">
                                                            Delivery Type:
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                color="secondary"
                                                                className="text-white"
                                                            >
                                                                {order
                                                                    .shippingAddress
                                                                    ?.deliveryType ||
                                                                    "N/A"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    {order.paymentMethod && (
                                                        <tr>
                                                            <td className="text-muted">
                                                                Payment Method:
                                                            </td>
                                                            <td>
                                                                {
                                                                    order.paymentMethod
                                                                }
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {order.trackingNumber && (
                                                        <tr>
                                                            <td className="text-muted">
                                                                Tracking #:
                                                            </td>
                                                            <td className="fw-medium text-primary">
                                                                {
                                                                    order.trackingNumber
                                                                }
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table
                                                size="sm"
                                                borderless
                                                className="mb-0"
                                            >
                                                <tbody>
                                                    <tr>
                                                        <td
                                                            className="text-muted"
                                                            width="100"
                                                        >
                                                            Items:
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                color="info"
                                                                className="text-white"
                                                            >
                                                                {order.items
                                                                    ?.length ||
                                                                    0}{" "}
                                                                item(s)
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted">
                                                            Customization:
                                                        </td>
                                                        <td>
                                                            {order.requiresVerification ? (
                                                                <Badge
                                                                    color={
                                                                        order.status ===
                                                                        "PENDING_VERIFICATION"
                                                                            ? "warning"
                                                                            : "success"
                                                                    }
                                                                    className="text-white"
                                                                >
                                                                    {order.status ===
                                                                    "PENDING_VERIFICATION"
                                                                        ? "Needs Review"
                                                                        : "Verified"}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted">
                                                                    No
                                                                    customization
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {order.notes && (
                                                        <tr>
                                                            <td className="text-muted">
                                                                Notes:
                                                            </td>
                                                            <td className="small">
                                                                {order.notes}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* Order Items */}
                            <Card className="mb-4">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-shopping-bag-line me-2"></i>
                                        Order Items ({order.items?.length || 0})
                                    </h6>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <div className="table-responsive">
                                        <Table className="mb-0 align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th
                                                        style={{ width: "40%" }}
                                                    >
                                                        Item
                                                    </th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th className="text-center">
                                                        Qty
                                                    </th>
                                                    <th className="text-end">
                                                        Unit Price
                                                    </th>
                                                    <th className="text-end">
                                                        Total
                                                    </th>
                                                    <th className="text-center">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item) => (
                                                    <React.Fragment
                                                        key={item.id}
                                                    >
                                                        <tr>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {generateImageUrl(
                                                                        item
                                                                    ) ? (
                                                                        <img
                                                                            src={generateImageUrl(
                                                                                item
                                                                            )}
                                                                            alt=""
                                                                            className="rounded me-3"
                                                                            style={{
                                                                                width: "60px",
                                                                                height: "60px",
                                                                                objectFit:
                                                                                    "contain",
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="rounded me-3 bg-light d-flex align-items-center justify-content-center"
                                                                            style={{
                                                                                width: "60px",
                                                                                height: "60px",
                                                                            }}
                                                                        >
                                                                            <i className="ri-image-line text-muted"></i>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="mb-1 fw-medium">
                                                                            {item.productName ||
                                                                                item.dealTitle ||
                                                                                "Item"}
                                                                        </p>
                                                                        <small className="text-muted">
                                                                            {item.productCode ||
                                                                                item.dealCode ||
                                                                                item.sku}
                                                                        </small>
                                                                        {(item.colorName ||
                                                                            item.sizeName) && (
                                                                            <div className="mt-1">
                                                                                {item.colorName && (
                                                                                    <Badge
                                                                                        color="light"
                                                                                        className="text-dark me-1"
                                                                                    >
                                                                                        {
                                                                                            item.colorName
                                                                                        }
                                                                                    </Badge>
                                                                                )}
                                                                                {item.sizeName && (
                                                                                    <Badge
                                                                                        color="light"
                                                                                        className="text-dark"
                                                                                    >
                                                                                        {
                                                                                            item.sizeName
                                                                                        }
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {item.hasCustomization && (
                                                                            <>
                                                                                {/* Proof Status Badge - Primary status indicator */}
                                                                                <Badge
                                                                                    color={getProofStatusColor(
                                                                                        item.proofStatus
                                                                                    )}
                                                                                    className="text-white mt-1"
                                                                                    pill
                                                                                >
                                                                                    <i
                                                                                        className={`${
                                                                                            item.proofStatus ===
                                                                                            "APPROVED"
                                                                                                ? "ri-check-double-line"
                                                                                                : item.proofStatus ===
                                                                                                  "AWAITING_APPROVAL"
                                                                                                ? "ri-eye-line"
                                                                                                : item.proofStatus ===
                                                                                                  "PENDING_CUSTOMER_LOGO"
                                                                                                ? "ri-time-line"
                                                                                                : item.proofStatus ===
                                                                                                  "PENDING_PROOF"
                                                                                                ? "ri-upload-2-line"
                                                                                                : item.proofStatus ===
                                                                                                  "REVISION_REQUESTED"
                                                                                                ? "ri-edit-line"
                                                                                                : "ri-file-pdf-line"
                                                                                        } me-1`}
                                                                                    ></i>
                                                                                    {formatProofStatus(
                                                                                        item.proofStatus
                                                                                    )}
                                                                                </Badge>
                                                                                {/* Show group indicator */}
                                                                                {item.customizationGroupId &&
                                                                                    getItemsInGroup(
                                                                                        item.customizationGroupId,
                                                                                        order.items
                                                                                    )
                                                                                        .length >
                                                                                        1 && (
                                                                                        <Badge
                                                                                            color="info"
                                                                                            className="text-white mt-1 ms-1"
                                                                                            pill
                                                                                        >
                                                                                            <i className="ri-group-line me-1"></i>
                                                                                            {isFirstInCustomizationGroup(
                                                                                                item,
                                                                                                order.items
                                                                                            )
                                                                                                ? `Group of ${
                                                                                                      getItemsInGroup(
                                                                                                          item.customizationGroupId,
                                                                                                          order.items
                                                                                                      )
                                                                                                          .length
                                                                                                  }`
                                                                                                : "Shares customization"}
                                                                                        </Badge>
                                                                                    )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge
                                                                    color={
                                                                        item.itemType ===
                                                                        "PRODUCT"
                                                                            ? "primary"
                                                                            : "info"
                                                                    }
                                                                    className="text-white"
                                                                >
                                                                    {
                                                                        item.itemType
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                {/* Item-level status */}
                                                                <Badge
                                                                    color={getItemStatusColor(
                                                                        item.status
                                                                    )}
                                                                    className="text-white"
                                                                >
                                                                    {formatStatus(
                                                                        item.status
                                                                    ) || "N/A"}
                                                                </Badge>
                                                                {item.trackingNumber && (
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">
                                                                            {item.logistic && (
                                                                                <span className="me-1">
                                                                                    <i className="ri-truck-line me-1"></i>
                                                                                    {
                                                                                        item
                                                                                            .logistic
                                                                                            .name
                                                                                    }
                                                                                    :
                                                                                </span>
                                                                            )}
                                                                            {item.trackingLink ? (
                                                                                <a
                                                                                    href={
                                                                                        item.trackingLink
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-primary"
                                                                                >
                                                                                    {
                                                                                        item.trackingNumber
                                                                                    }
                                                                                    <i className="ri-external-link-line ms-1"></i>
                                                                                </a>
                                                                            ) : (
                                                                                item.trackingNumber
                                                                            )}
                                                                            <Button
                                                                                color="link"
                                                                                size="sm"
                                                                                className="p-0 ms-2"
                                                                                onClick={() =>
                                                                                    openEditTrackingModal(
                                                                                        item
                                                                                    )
                                                                                }
                                                                                title="Edit tracking"
                                                                            >
                                                                                <i className="ri-pencil-line text-muted"></i>
                                                                            </Button>
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="text-center fw-medium">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="text-end">
                                                                A$
                                                                {parseFloat(
                                                                    item.unitPrice
                                                                ).toFixed(2)}
                                                                {item.customizationCharge >
                                                                    0 && (
                                                                    <small className="d-block text-success">
                                                                        +A$
                                                                        {parseFloat(
                                                                            item.customizationCharge
                                                                        ).toFixed(
                                                                            2
                                                                        )}{" "}
                                                                        (custom)
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td className="text-end fw-medium">
                                                                A$
                                                                {parseFloat(
                                                                    item.lineTotal
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                {/* Proof buttons for customized items */}
                                                                {item.hasCustomization && (
                                                                    <>
                                                                        {/* Show message if waiting for customer logo */}
                                                                        {item.proofStatus === "PENDING_CUSTOMER_LOGO" && (
                                                                            <div className="text-warning small">
                                                                                <i className="ri-time-line me-1"></i>
                                                                                Waiting for logo
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {(item.proofStatus ===
                                                                            "PENDING_PROOF" ||
                                                                            item.proofStatus ===
                                                                                "REVISION_REQUESTED") && (
                                                                            <Button
                                                                                color="soft-warning"
                                                                                size="sm"
                                                                                className="me-1"
                                                                                onClick={() =>
                                                                                    openProofModal(
                                                                                        item
                                                                                    )
                                                                                }
                                                                                title="Upload proof"
                                                                            >
                                                                                <i className="ri-upload-2-line"></i>
                                                                            </Button>
                                                                        )}
                                                                        {item.proofStatus !==
                                                                            "NOT_REQUIRED" &&
                                                                            item.proofStatus !==
                                                                                "PENDING_PROOF" &&
                                                                            item.proofStatus !==
                                                                                "PENDING_CUSTOMER_LOGO" && (
                                                                                <Button
                                                                                    color="soft-info"
                                                                                    size="sm"
                                                                                    className="me-1"
                                                                                    onClick={() =>
                                                                                        openProofViewModal(
                                                                                            item
                                                                                        )
                                                                                    }
                                                                                    title="View proofs"
                                                                                >
                                                                                    <i className="ri-file-list-3-line"></i>
                                                                                </Button>
                                                                            )}
                                                                    </>
                                                                )}
                                                                {/* Item history button */}
                                                                {item.statusHistory &&
                                                                    item
                                                                        .statusHistory
                                                                        .length >
                                                                        0 && (
                                                                        <Button
                                                                            color="soft-secondary"
                                                                            size="sm"
                                                                            className="me-1"
                                                                            onClick={() =>
                                                                                openItemHistoryModal(
                                                                                    item
                                                                                )
                                                                            }
                                                                            title="View item history"
                                                                        >
                                                                            <i className="ri-history-line"></i>
                                                                        </Button>
                                                                    )}
                                                                {/* Item-level status update button */}
                                                                <Button
                                                                    color="soft-primary"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openItemStatusModal(
                                                                            item
                                                                        )
                                                                    }
                                                                    title="Update item status"
                                                                    disabled={
                                                                        item.status ===
                                                                            "DELIVERED" ||
                                                                        item.status ===
                                                                            "CANCELLED" ||
                                                                        item.status ===
                                                                            "REFUNDED"
                                                                    }
                                                                >
                                                                    <i className="ri-edit-line"></i>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        {/* Customization Details Row - Only show for first item in a customization group */}
                                                        {item.hasCustomization &&
                                                            isFirstInCustomizationGroup(
                                                                item,
                                                                order.items
                                                            ) && (
                                                                <tr className="bg-light">
                                                                    <td
                                                                        colSpan={
                                                                            7
                                                                        }
                                                                        className="py-3"
                                                                    >
                                                                        <div className="ps-4">
                                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                                <div>
                                                                                    <h6 className="mb-1 text-primary">
                                                                                        <i className="ri-paint-brush-line me-1"></i>
                                                                                        Customization
                                                                                        Details
                                                                                        {item.customizationGroupId &&
                                                                                            getItemsInGroup(
                                                                                                item.customizationGroupId,
                                                                                                order.items
                                                                                            )
                                                                                                .length >
                                                                                                1 && (
                                                                                                <Badge
                                                                                                    color="info"
                                                                                                    className="text-white ms-2"
                                                                                                    pill
                                                                                                >
                                                                                                    Applies
                                                                                                    to{" "}
                                                                                                    {
                                                                                                        getItemsInGroup(
                                                                                                            item.customizationGroupId,
                                                                                                            order.items
                                                                                                        )
                                                                                                            .length
                                                                                                    }{" "}
                                                                                                    items
                                                                                                </Badge>
                                                                                            )}
                                                                                    </h6>
                                                                                    {item.customizationGroupId &&
                                                                                        getItemsInGroup(
                                                                                            item.customizationGroupId,
                                                                                            order.items
                                                                                        )
                                                                                            .length >
                                                                                            1 && (
                                                                                            <small className="text-muted">
                                                                                                Items:{" "}
                                                                                                {getItemsInGroup(
                                                                                                    item.customizationGroupId,
                                                                                                    order.items
                                                                                                )
                                                                                                    .map(
                                                                                                        (
                                                                                                            i
                                                                                                        ) =>
                                                                                                            i.sizeName ||
                                                                                                            i.colorName ||
                                                                                                            i.productName
                                                                                                    )
                                                                                                    .join(
                                                                                                        ", "
                                                                                                    )}
                                                                                            </small>
                                                                                        )}
                                                                                </div>
                                                                                {/* Proof action buttons */}
                                                                                <div className="d-flex gap-2 align-items-center">
                                                                                    {/* Show message if waiting for customer logo */}
                                                                                    {item.proofStatus === "PENDING_CUSTOMER_LOGO" && (
                                                                                        <div className="text-warning small fw-medium">
                                                                                            <i className="ri-time-line me-1"></i>
                                                                                            Waiting for customer to upload logo
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {/* Upload button for pending proof or revision requested */}
                                                                                    {(item.proofStatus ===
                                                                                        "PENDING_PROOF" ||
                                                                                        item.proofStatus ===
                                                                                            "REVISION_REQUESTED") && (
                                                                                        <Button
                                                                                            color="warning"
                                                                                            size="sm"
                                                                                            onClick={() =>
                                                                                                openProofModal(
                                                                                                    item
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <i className="ri-upload-2-line me-1"></i>
                                                                                            {item.proofStatus ===
                                                                                            "REVISION_REQUESTED"
                                                                                                ? "Upload New Version"
                                                                                                : "Upload Proof"}
                                                                                        </Button>
                                                                                    )}
                                                                                    {/* View proofs button */}
                                                                                    {item.proofStatus !==
                                                                                        "NOT_REQUIRED" &&
                                                                                        item.proofStatus !==
                                                                                            "PENDING_PROOF" &&
                                                                                        item.proofStatus !==
                                                                                            "PENDING_CUSTOMER_LOGO" && (
                                                                                            <Button
                                                                                                color="info"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    openProofViewModal(
                                                                                                        item
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <i className="ri-file-list-3-line me-1"></i>
                                                                                                View
                                                                                                Proofs
                                                                                            </Button>
                                                                                        )}
                                                                                    {/* Proof status badge */}
                                                                                    <Badge
                                                                                        color={getProofStatusColor(
                                                                                            item.proofStatus
                                                                                        )}
                                                                                        className="text-white py-1 px-2"
                                                                                    >
                                                                                        {formatProofStatus(
                                                                                            item.proofStatus
                                                                                        )}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                            <Row className="mb-3">
                                                                                <Col
                                                                                    md={
                                                                                        3
                                                                                    }
                                                                                >
                                                                                    <small className="text-muted d-block mb-1">
                                                                                        Application
                                                                                        Method
                                                                                    </small>
                                                                                    <span className="fw-medium">
                                                                                        {item
                                                                                            .customizationData
                                                                                            ?.applicationMethodName ||
                                                                                            item.customizationMethod ||
                                                                                            "N/A"}
                                                                                    </span>
                                                                                </Col>
                                                                                <Col
                                                                                    md={
                                                                                        3
                                                                                    }
                                                                                >
                                                                                    <small className="text-muted d-block mb-1">
                                                                                        Application
                                                                                        Type
                                                                                    </small>
                                                                                    <span className="fw-medium">
                                                                                        {item
                                                                                            .customizationData
                                                                                            ?.applicationTypeName ||
                                                                                            item.customizationType ||
                                                                                            "N/A"}
                                                                                    </span>
                                                                                </Col>
                                                                                <Col
                                                                                    md={
                                                                                        3
                                                                                    }
                                                                                >
                                                                                    <small className="text-muted d-block mb-1">
                                                                                        Positions
                                                                                    </small>
                                                                                    <span className="fw-medium">
                                                                                        {item
                                                                                            .customizationData
                                                                                            ?.positions
                                                                                            ?.length ||
                                                                                            0}{" "}
                                                                                        position(s)
                                                                                    </span>
                                                                                </Col>
                                                                                <Col
                                                                                    md={
                                                                                        3
                                                                                    }
                                                                                >
                                                                                    <small className="text-muted d-block mb-1">
                                                                                        Proof
                                                                                        Version
                                                                                    </small>
                                                                                    <span className="fw-medium">
                                                                                        {item.currentProofVersion
                                                                                            ? `v${item.currentProofVersion}`
                                                                                            : "No proof yet"}
                                                                                    </span>
                                                                                </Col>
                                                                            </Row>

                                                                            {/* Positions */}
                                                                            {item
                                                                                .customizationData
                                                                                ?.positions &&
                                                                                item
                                                                                    .customizationData
                                                                                    .positions
                                                                                    .length >
                                                                                    0 && (
                                                                                    <div className="mb-3">
                                                                                        <small className="text-muted d-block mb-2">
                                                                                            Print/Embroidery
                                                                                            Positions
                                                                                        </small>
                                                                                        <div className="d-flex flex-wrap gap-2">
                                                                                            {item.customizationData.positions.map(
                                                                                                (
                                                                                                    pos,
                                                                                                    idx
                                                                                                ) => (
                                                                                                    <Badge
                                                                                                        key={
                                                                                                            idx
                                                                                                        }
                                                                                                        color="secondary"
                                                                                                        className="text-white py-1 px-2"
                                                                                                    >
                                                                                                        <i className="ri-map-pin-line me-1"></i>
                                                                                                        {
                                                                                                            pos.name
                                                                                                        }
                                                                                                    </Badge>
                                                                                                )
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                            {/* TEXT Customization Content */}
                                                                            {(item.customizationType ===
                                                                                "TEXT" ||
                                                                                item
                                                                                    .customizationData
                                                                                    ?.content
                                                                                    ?.type ===
                                                                                    "TEXT") && (
                                                                                <div className="mb-3">
                                                                                    <small className="text-muted d-block mb-2">
                                                                                        <i className="ri-text me-1"></i>
                                                                                        Text
                                                                                        Customization
                                                                                        Content
                                                                                    </small>
                                                                                    <div className="bg-white border rounded p-3">
                                                                                        {(
                                                                                            item.customizationText ||
                                                                                            item
                                                                                                .customizationData
                                                                                                ?.content
                                                                                                ?.data
                                                                                                ?.lines ||
                                                                                            item
                                                                                                .customizationData
                                                                                                ?.content
                                                                                                ?.data
                                                                                                ?.filledLines ||
                                                                                            []
                                                                                        ).map(
                                                                                            (
                                                                                                line,
                                                                                                idx
                                                                                            ) =>
                                                                                                line && (
                                                                                                    <div
                                                                                                        key={
                                                                                                            idx
                                                                                                        }
                                                                                                        className="mb-1"
                                                                                                    >
                                                                                                        <span className="text-muted small me-2">
                                                                                                            Line{" "}
                                                                                                            {idx +
                                                                                                                1}
                                                                                                            :
                                                                                                        </span>
                                                                                                        <span className="fw-medium">
                                                                                                            {typeof line ===
                                                                                                            "string"
                                                                                                                ? line
                                                                                                                : JSON.stringify(
                                                                                                                      line
                                                                                                                  )}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )
                                                                                        )}
                                                                                        {/* Handle if customizationText is a JSON string */}
                                                                                        {item.customizationText &&
                                                                                            typeof item.customizationText ===
                                                                                                "string" &&
                                                                                            item.customizationText.startsWith(
                                                                                                "{"
                                                                                            ) &&
                                                                                            (() => {
                                                                                                try {
                                                                                                    const parsed =
                                                                                                        JSON.parse(
                                                                                                            item.customizationText
                                                                                                        );
                                                                                                    return (
                                                                                                        parsed.lines ||
                                                                                                        parsed.filledLines ||
                                                                                                        []
                                                                                                    ).map(
                                                                                                        (
                                                                                                            line,
                                                                                                            idx
                                                                                                        ) =>
                                                                                                            line && (
                                                                                                                <div
                                                                                                                    key={`parsed-${idx}`}
                                                                                                                    className="mb-1"
                                                                                                                >
                                                                                                                    <span className="text-muted small me-2">
                                                                                                                        Line{" "}
                                                                                                                        {idx +
                                                                                                                            1}
                                                                                                                        :
                                                                                                                    </span>
                                                                                                                    <span className="fw-medium">
                                                                                                                        {
                                                                                                                            line
                                                                                                                        }
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            )
                                                                                                    );
                                                                                                } catch (e) {
                                                                                                    return (
                                                                                                        <span className="fw-medium">
                                                                                                            {
                                                                                                                item.customizationText
                                                                                                            }
                                                                                                        </span>
                                                                                                    );
                                                                                                }
                                                                                            })()}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Uploaded Image - Only show for IMAGE type */}
                                                                            {item.customizationImageUrl &&
                                                                                item.customizationType !==
                                                                                    "TEXT" &&
                                                                                item
                                                                                    .customizationData
                                                                                    ?.content
                                                                                    ?.type !==
                                                                                    "TEXT" && (
                                                                                    <div className="mb-3">
                                                                                        <small className="text-muted d-block mb-2">
                                                                                            Uploaded
                                                                                            Logo/Image
                                                                                            (Click
                                                                                            to
                                                                                            view
                                                                                            full
                                                                                            size)
                                                                                        </small>
                                                                                        <a
                                                                                            href={getCustomizationImageUrl(
                                                                                                item.customizationImageUrl
                                                                                            )}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="d-inline-block"
                                                                                        >
                                                                                            <img
                                                                                                src={getCustomizationImageUrl(
                                                                                                    item.customizationImageUrl
                                                                                                )}
                                                                                                alt="Customization"
                                                                                                className="border rounded shadow-sm"
                                                                                                style={{
                                                                                                    maxWidth:
                                                                                                        "200px",
                                                                                                    maxHeight:
                                                                                                        "200px",
                                                                                                    objectFit:
                                                                                                        "contain",
                                                                                                }}
                                                                                            />
                                                                                        </a>
                                                                                        {item
                                                                                            .customizationData
                                                                                            ?.content
                                                                                            ?.fileName && (
                                                                                            <div className="mt-1">
                                                                                                <small className="text-muted">
                                                                                                    <i className="ri-file-line me-1"></i>
                                                                                                    {
                                                                                                        item
                                                                                                            .customizationData
                                                                                                            .content
                                                                                                            .fileName
                                                                                                    }
                                                                                                </small>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                            {/* Pricing Breakdown */}
                                                                            {item
                                                                                .customizationData
                                                                                ?.pricing && (
                                                                                <div className="bg-white p-3 rounded border">
                                                                                    <small className="text-muted d-block mb-2 fw-medium">
                                                                                        Customization
                                                                                        Pricing
                                                                                    </small>
                                                                                    <Table
                                                                                        size="sm"
                                                                                        borderless
                                                                                        className="mb-0 small"
                                                                                    >
                                                                                        <tbody>
                                                                                            {item.customizationData.pricing.breakdown?.map(
                                                                                                (
                                                                                                    b,
                                                                                                    idx
                                                                                                ) => (
                                                                                                    <tr
                                                                                                        key={
                                                                                                            idx
                                                                                                        }
                                                                                                    >
                                                                                                        <td className="ps-0 text-muted">
                                                                                                            {
                                                                                                                b.position
                                                                                                            }
                                                                                                            :
                                                                                                        </td>
                                                                                                        <td className="text-end">
                                                                                                            A$
                                                                                                            {parseFloat(
                                                                                                                b.pricePerItem ||
                                                                                                                    0
                                                                                                            ).toFixed(
                                                                                                                2
                                                                                                            )}{" "}
                                                                                                            x{" "}
                                                                                                            {
                                                                                                                item
                                                                                                                    .customizationData
                                                                                                                    .pricing
                                                                                                                    .quantity
                                                                                                            }{" "}
                                                                                                            =
                                                                                                            A$
                                                                                                            {parseFloat(
                                                                                                                b.subtotal ||
                                                                                                                    0
                                                                                                            ).toFixed(
                                                                                                                2
                                                                                                            )}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                )
                                                                                            )}
                                                                                            {item
                                                                                                .customizationData
                                                                                                .pricing
                                                                                                .setupFee >
                                                                                                0 && (
                                                                                                <tr>
                                                                                                    <td className="ps-0 text-muted">
                                                                                                        Setup
                                                                                                        Fee:
                                                                                                    </td>
                                                                                                    <td className="text-end">
                                                                                                        A$
                                                                                                        {parseFloat(
                                                                                                            item
                                                                                                                .customizationData
                                                                                                                .pricing
                                                                                                                .setupFee
                                                                                                        ).toFixed(
                                                                                                            2
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )}
                                                                                            <tr className="border-top">
                                                                                                <td className="ps-0 text-muted">
                                                                                                    Subtotal:
                                                                                                </td>
                                                                                                <td className="text-end fw-medium">
                                                                                                    A$
                                                                                                    {parseFloat(
                                                                                                        item
                                                                                                            .customizationData
                                                                                                            .pricing
                                                                                                            .subtotal ||
                                                                                                            0
                                                                                                    ).toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </td>
                                                                                            </tr>
                                                                                            {item
                                                                                                .customizationData
                                                                                                .pricing
                                                                                                .vat >
                                                                                                0 && (
                                                                                                <tr>
                                                                                                    <td className="ps-0 text-muted">
                                                                                                        {gstLabel}:
                                                                                                    </td>
                                                                                                    <td className="text-end">
                                                                                                        A$
                                                                                                        {parseFloat(
                                                                                                            item
                                                                                                                .customizationData
                                                                                                                .pricing
                                                                                                                .vat
                                                                                                        ).toFixed(
                                                                                                            2
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )}
                                                                                            <tr className="border-top">
                                                                                                <td className="ps-0 fw-medium">
                                                                                                    Total:
                                                                                                </td>
                                                                                                <td className="text-end fw-medium text-primary">
                                                                                                    A$
                                                                                                    {parseFloat(
                                                                                                        item
                                                                                                            .customizationData
                                                                                                            .pricing
                                                                                                            .total ||
                                                                                                            0
                                                                                                    ).toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </Table>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Status History */}
                            {order.statusHistory &&
                                order.statusHistory.length > 0 && (
                                    <Card className="mb-4">
                                        <CardHeader className="bg-light">
                                            <h6 className="mb-0">
                                                <i className="ri-history-line me-2"></i>
                                                Status History
                                            </h6>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="timeline-2">
                                                {order.statusHistory.map(
                                                    (history, index) => {
                                                        // Determine which status to display - itemStatus for item-level changes, status for order-level
                                                        const displayStatus =
                                                            history.itemStatus ||
                                                            history.status;
                                                        const isItemLevel =
                                                            !!history.orderItemId ||
                                                            !!history.itemStatus;

                                                        return (
                                                            <div
                                                                key={history.id}
                                                                className={`d-flex mb-3 ${
                                                                    index !==
                                                                    order
                                                                        .statusHistory
                                                                        .length -
                                                                        1
                                                                        ? "pb-3 border-bottom"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`rounded-circle bg-${getItemStatusColor(
                                                                        displayStatus
                                                                    )} d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
                                                                    style={{
                                                                        width: "40px",
                                                                        height: "40px",
                                                                    }}
                                                                >
                                                                    <i
                                                                        className={`${
                                                                            isItemLevel
                                                                                ? "ri-checkbox-circle-line"
                                                                                : "ri-check-line"
                                                                        } text-white fs-5`}
                                                                    ></i>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div>
                                                                            <Badge
                                                                                color={getItemStatusColor(
                                                                                    displayStatus
                                                                                )}
                                                                                className="text-white mb-2"
                                                                            >
                                                                                {formatStatus(
                                                                                    displayStatus
                                                                                )}
                                                                            </Badge>
                                                                            {isItemLevel && (
                                                                                <Badge
                                                                                    color="light"
                                                                                    className="text-dark ms-1 mb-2"
                                                                                >
                                                                                    <i className="ri-product-hunt-line me-1"></i>
                                                                                    Item
                                                                                </Badge>
                                                                            )}
                                                                            {history.notes && (
                                                                                <p className="mb-0 text-muted small">
                                                                                    {
                                                                                        history.notes
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {new Date(
                                                                                history.createdAt
                                                                            ).toLocaleString()}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                        </Col>

                        {/* Sidebar */}
                        <Col lg={4}>
                            {/* Customer Details */}
                            <Card className="mb-4">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-user-line me-2"></i>
                                        Customer Details
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-sm me-3 rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center">
                                            <i className="ri-user-line text-primary"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0">
                                                {order.customerName}
                                            </h6>
                                            {order.websiteUser && (
                                                <small className="text-muted">
                                                    User ID: #
                                                    {order.websiteUser.id}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <Table
                                        size="sm"
                                        borderless
                                        className="mb-0"
                                    >
                                        <tbody>
                                            <tr>
                                                <td
                                                    className="text-muted ps-0"
                                                    width="80"
                                                >
                                                    <i className="ri-mail-line me-1"></i>{" "}
                                                    Email:
                                                </td>
                                                <td>
                                                    <a
                                                        href={`mailto:${order.customerEmail}`}
                                                    >
                                                        {order.customerEmail}
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted ps-0">
                                                    <i className="ri-phone-line me-1"></i>{" "}
                                                    Phone:
                                                </td>
                                                <td>
                                                    <a
                                                        href={`tel:${order.customerPhone}`}
                                                    >
                                                        {order.customerPhone}
                                                    </a>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </CardBody>
                            </Card>

                            {/* Shipping Address */}
                            <Card className="mb-4">
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-map-pin-line me-2"></i>
                                        Shipping Address
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <address className="mb-0">
                                        <strong>
                                            {order.shippingAddress?.firstName}{" "}
                                            {order.shippingAddress?.lastName}
                                        </strong>
                                        <br />
                                        {order.shippingAddress?.addressLine1 || order.shippingAddress?.addressLine}
                                        {order.shippingAddress
                                            ?.addressLine2 && (
                                            <>
                                                <br />
                                                {
                                                    order.shippingAddress
                                                        .addressLine2
                                                }
                                            </>
                                        )}
                                        {order.shippingAddress?.companyName && (
                                            <>
                                                <br />
                                                {order.shippingAddress.companyName}
                                            </>
                                        )}
                                        <br />
                                        {order.shippingAddress?.cityName || order.shippingAddress?.city},{" "}
                                        {order.shippingAddress?.stateName || order.shippingAddress?.state}
                                        <br />
                                        {order.shippingAddress?.countryName || order.shippingAddress?.country}
                                        <br />
                                        <strong>
                                            {order.shippingAddress?.pincode || order.shippingAddress?.postalCode}
                                        </strong>
                                    </address>
                                </CardBody>
                            </Card>

                            {/* Order Summary */}
                            <Card className="mb-4 border-primary">
                                <CardHeader className="bg-primary text-white">
                                    <h6 className="mb-0 text-white">
                                        <i className="ri-file-list-3-line me-2"></i>
                                        Order Summary
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <Table
                                        size="sm"
                                        borderless
                                        className="mb-0"
                                    >
                                        <tbody>
                                            <tr>
                                                <td className="text-muted">
                                                    Subtotal:
                                                </td>
                                                <td className="text-end">
                                                    A$
                                                    {parseFloat(
                                                        order.subtotal
                                                    ).toFixed(2)}
                                                </td>
                                            </tr>
                                            {order.customizationCharges > 0 && (
                                                <tr>
                                                    <td className="text-muted">
                                                        Customization:
                                                    </td>
                                                    <td className="text-end">
                                                        A$
                                                        {parseFloat(
                                                            order.customizationCharges
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            {order.discountAmount > 0 && (
                                                <tr>
                                                    <td className="text-muted">
                                                        Discount:
                                                    </td>
                                                    <td className="text-end text-success">
                                                        -A$
                                                        {parseFloat(
                                                            order.discountAmount
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            {order.shippingCharges > 0 && (
                                                <tr>
                                                    <td className="text-muted">
                                                        Shipping:
                                                    </td>
                                                    <td className="text-end">
                                                        A$
                                                        {parseFloat(
                                                            order.shippingCharges
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            {order.taxAmount > 0 && (
                                                <tr>
                                                    <td className="text-muted">
                                                        {gstLabel}:
                                                    </td>
                                                    <td className="text-end">
                                                        A$
                                                        {parseFloat(
                                                            order.taxAmount
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="border-top">
                                                <td className="fw-bold fs-5 pt-2">
                                                    Total:
                                                </td>
                                                <td className="text-end fw-bold fs-5 text-primary pt-2">
                                                    A$
                                                    {parseFloat(
                                                        order.totalAmount
                                                    ).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </CardBody>
                            </Card>

                            {/* Delivery Date Override */}
                            <Card>
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-truck-line me-2"></i>
                                        Delivery Date
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    {order.estimatedDeliveryDate && (
                                        <div className="mb-3">
                                            <small className="text-muted d-block">Estimated Delivery</small>
                                            <span className="fw-medium">
                                                {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                    )}
                                    {order.deliveryDateOverride && (
                                        <div className="mb-3">
                                            <small className="text-muted d-block">Admin Override</small>
                                            <span className="fw-medium text-primary">
                                                {new Date(order.deliveryDateOverride).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        <Label className="form-label mb-1">Set Delivery Date</Label>
                                        <Input
                                            type="date"
                                            value={deliveryDateOverride}
                                            onChange={(e) => setDeliveryDateOverride(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                    <Button
                                        color="primary"
                                        className="w-100"
                                        onClick={handleSaveDeliveryDate}
                                        disabled={savingDeliveryDate || !deliveryDateOverride}
                                    >
                                        {savingDeliveryDate ? (
                                            <><Spinner size="sm" className="me-1" /> Saving...</>
                                        ) : (
                                            <><i className="ri-calendar-check-line me-1"></i> Update Delivery Date</>
                                        )}
                                    </Button>
                                </CardBody>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-flashlight-line me-2"></i>
                                        Quick Actions
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <div className="d-grid gap-2">
                                        <Button
                                            color="outline-primary"
                                            onClick={handleDownloadInvoice}
                                            disabled={downloadingInvoice}
                                        >
                                            {downloadingInvoice ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-1"
                                                    />{" "}
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-file-download-line me-1"></i>{" "}
                                                    Download Invoice
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Item Status Update Modal */}
            <Modal
                isOpen={itemStatusModal}
                toggle={() => setItemStatusModal(false)}
                centered
            >
                <ModalHeader toggle={() => setItemStatusModal(false)}>
                    Update Item Status
                </ModalHeader>
                <ModalBody>
                    {selectedItem && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <div className="d-flex align-items-center">
                                    {generateImageUrl(selectedItem) && (
                                        <img
                                            src={generateImageUrl(selectedItem)}
                                            alt=""
                                            className="rounded me-3"
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                objectFit: "contain",
                                            }}
                                        />
                                    )}
                                    <div>
                                        <p className="mb-0 fw-medium">
                                            {selectedItem.productName ||
                                                selectedItem.dealTitle ||
                                                "Item"}
                                        </p>
                                        <small className="text-muted">
                                            {selectedItem.colorName &&
                                                `${selectedItem.colorName} • `}
                                            {selectedItem.sizeName &&
                                                `${selectedItem.sizeName} • `}
                                            Qty: {selectedItem.quantity}
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <FormGroup>
                                <Label>Current Status</Label>
                                <div>
                                    <Badge
                                        color={getItemStatusColor(
                                            selectedItem.status
                                        )}
                                        className="text-white fs-6"
                                    >
                                        {formatStatus(selectedItem.status) ||
                                            "N/A"}
                                    </Badge>
                                </div>
                            </FormGroup>
                        </>
                    )}
                    <FormGroup>
                        <Label for="newItemStatus">New Status *</Label>
                        <Input
                            type="select"
                            id="newItemStatus"
                            value={newItemStatus}
                            onChange={(e) => setNewItemStatus(e.target.value)}
                        >
                            <option value="">Select Status</option>
                            {itemStatuses
                                .filter((s) => s.value !== selectedItem?.status)
                                .map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                        </Input>
                    </FormGroup>
                    {newItemStatus === "DISPATCHED" && (
                        <>
                            <FormGroup>
                                <Label for="itemLogisticId">
                                    Courier/Logistic
                                </Label>
                                <Input
                                    type="select"
                                    id="itemLogisticId"
                                    value={itemLogisticId}
                                    onChange={(e) =>
                                        setItemLogisticId(e.target.value)
                                    }
                                >
                                    <option value="">Select Courier</option>
                                    {logistics.map((logistic) => (
                                        <option
                                            key={logistic.id}
                                            value={logistic.id}
                                        >
                                            {logistic.name} ({logistic.code})
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="itemTrackingNumber">
                                    Tracking Number
                                </Label>
                                <Input
                                    type="text"
                                    id="itemTrackingNumber"
                                    value={itemTrackingNumber}
                                    onChange={(e) =>
                                        setItemTrackingNumber(e.target.value)
                                    }
                                    placeholder="Enter tracking number"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label for="itemTrackingLink">
                                    Tracking Link
                                </Label>
                                <Input
                                    type="url"
                                    id="itemTrackingLink"
                                    value={itemTrackingLink}
                                    onChange={(e) =>
                                        setItemTrackingLink(e.target.value)
                                    }
                                    placeholder="Enter tracking link (Optional)"
                                />
                                <small className="text-muted">
                                    Enter the full tracking URL for the customer
                                    to track their shipment
                                </small>
                            </FormGroup>
                        </>
                    )}
                    <FormGroup>
                        <Label for="itemStatusNotes">Notes (Optional)</Label>
                        <Input
                            type="textarea"
                            id="itemStatusNotes"
                            rows={3}
                            value={itemStatusNotes}
                            onChange={(e) => setItemStatusNotes(e.target.value)}
                            placeholder="Add any notes about this status change..."
                        />
                    </FormGroup>
                    <div className="alert alert-info mb-0">
                        <i className="ri-information-line me-2"></i>
                        <small>
                            Updating individual item status will automatically
                            recalculate the overall order status. For example,
                            if one item is dispatched while others are
                            processing, the order will show as "Partially
                            Dispatched".
                        </small>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="light"
                        onClick={() => setItemStatusModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleUpdateItemStatus}
                        disabled={isLoading || !newItemStatus}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" className="me-1" />{" "}
                                Updating...
                            </>
                        ) : (
                            "Update Item Status"
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Item History Modal */}
            <Modal
                isOpen={itemHistoryModal}
                toggle={() => setItemHistoryModal(false)}
                size="lg"
            >
                <ModalHeader toggle={() => setItemHistoryModal(false)}>
                    <i className="ri-history-line me-2"></i>
                    Item Status History
                </ModalHeader>
                <ModalBody>
                    {selectedItemHistory && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="mb-1">
                                    {selectedItemHistory.productName ||
                                        selectedItemHistory.product?.name ||
                                        "Item"}
                                </h6>
                                <small className="text-muted">
                                    {selectedItemHistory.sizeName &&
                                        `Size: ${selectedItemHistory.sizeName}`}
                                    {selectedItemHistory.colorName &&
                                        ` • Color: ${selectedItemHistory.colorName}`}
                                </small>
                            </div>
                            {selectedItemHistory.statusHistory &&
                            selectedItemHistory.statusHistory.length > 0 ? (
                                <div className="timeline-wrapper">
                                    {selectedItemHistory.statusHistory.map(
                                        (history, index) => (
                                            <div
                                                key={history.id}
                                                className={`d-flex mb-3 ${
                                                    index === 0
                                                        ? "border-start border-primary border-3 ps-3"
                                                        : "border-start border-2 ps-3"
                                                }`}
                                            >
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                                        <Badge
                                                            color={getItemStatusColor(
                                                                history.status
                                                            )}
                                                            className="me-2"
                                                        >
                                                            {formatStatus(
                                                                history.status
                                                            )}
                                                        </Badge>
                                                        <small className="text-muted">
                                                            {new Date(
                                                                history.createdAt
                                                            ).toLocaleString(
                                                                "en-GB",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </small>
                                                    </div>
                                                    {history.notes && (
                                                        <p className="mb-1 text-muted small">
                                                            {history.notes}
                                                        </p>
                                                    )}
                                                    {history.trackingNumber && (
                                                        <div className="small">
                                                            <span className="text-muted">
                                                                {history
                                                                    .logistic
                                                                    ?.name && (
                                                                    <span className="me-1">
                                                                        <i className="ri-truck-line me-1"></i>
                                                                        {
                                                                            history
                                                                                .logistic
                                                                                .name
                                                                        }
                                                                        :
                                                                    </span>
                                                                )}
                                                                {history.trackingLink ? (
                                                                    <a
                                                                        href={
                                                                            history.trackingLink
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary"
                                                                    >
                                                                        {
                                                                            history.trackingNumber
                                                                        }
                                                                        <i className="ri-external-link-line ms-1"></i>
                                                                    </a>
                                                                ) : (
                                                                    history.trackingNumber
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-4">
                                    <i className="ri-history-line fs-1 mb-2 d-block"></i>
                                    No status history available
                                </div>
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="light"
                        onClick={() => setItemHistoryModal(false)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Tracking Modal */}
            <Modal
                isOpen={editTrackingModal}
                toggle={() => setEditTrackingModal(false)}
            >
                <ModalHeader toggle={() => setEditTrackingModal(false)}>
                    <i className="ri-truck-line me-2"></i>
                    Edit Tracking Information
                </ModalHeader>
                <ModalBody>
                    {editTrackingItem && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="mb-1">
                                    {editTrackingItem.productName ||
                                        editTrackingItem.product?.name ||
                                        "Item"}
                                </h6>
                                <small className="text-muted">
                                    {editTrackingItem.sizeName &&
                                        `Size: ${editTrackingItem.sizeName}`}
                                    {editTrackingItem.colorName &&
                                        ` • Color: ${editTrackingItem.colorName}`}
                                </small>
                            </div>
                            <FormGroup>
                                <Label for="editLogisticId">
                                    Courier/Logistic
                                </Label>
                                <Input
                                    type="select"
                                    id="editLogisticId"
                                    value={editLogisticId}
                                    onChange={(e) =>
                                        setEditLogisticId(e.target.value)
                                    }
                                >
                                    <option value="">Select Courier</option>
                                    {logistics.map((logistic) => (
                                        <option
                                            key={logistic.id}
                                            value={logistic.id}
                                        >
                                            {logistic.name} ({logistic.code})
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label for="editTrackingNumber">
                                    Tracking Number
                                </Label>
                                <Input
                                    type="text"
                                    id="editTrackingNumber"
                                    value={editTrackingNumber}
                                    onChange={(e) =>
                                        setEditTrackingNumber(e.target.value)
                                    }
                                    placeholder="Enter tracking number"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label for="editTrackingLink">
                                    Tracking Link
                                </Label>
                                <Input
                                    type="url"
                                    id="editTrackingLink"
                                    value={editTrackingLink}
                                    onChange={(e) =>
                                        setEditTrackingLink(e.target.value)
                                    }
                                    placeholder="Enter tracking link (Optional)"
                                />
                                <small className="text-muted">
                                    Full URL for the customer to track their
                                    shipment
                                </small>
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="light"
                        onClick={() => setEditTrackingModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleUpdateTracking}
                        disabled={isLoading || !editTrackingLink}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" className="me-1" />{" "}
                                Updating...
                            </>
                        ) : (
                            "Update Tracking"
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Proof Upload Modal */}
            <Modal isOpen={proofModal} toggle={() => setProofModal(false)}>
                <ModalHeader toggle={() => setProofModal(false)}>
                    <i className="ri-upload-2-line me-2"></i>
                    Upload Customization Proof
                </ModalHeader>
                <ModalBody>
                    {selectedProofItem && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="mb-1">
                                    {selectedProofItem.productName || "Item"}
                                </h6>
                                <small className="text-muted">
                                    {selectedProofItem.sizeName &&
                                        `Size: ${selectedProofItem.sizeName}`}
                                    {selectedProofItem.colorName &&
                                        ` • Color: ${selectedProofItem.colorName}`}
                                </small>
                                {selectedProofItem.proofStatus ===
                                    "REVISION_REQUESTED" && (
                                    <div className="mt-2 p-2 bg-danger bg-opacity-10 rounded border border-danger">
                                        <small className="text-danger">
                                            <i className="ri-information-line me-1"></i>
                                            Customer requested revisions. Please
                                            review their feedback and upload an
                                            updated proof.
                                        </small>
                                    </div>
                                )}
                            </div>
                            <FormGroup>
                                <Label for="proofFile">
                                    Proof File (PDF or Image) *
                                </Label>
                                <Input
                                    type="file"
                                    id="proofFile"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) =>
                                        setProofFile(e.target.files[0])
                                    }
                                />
                                <small className="text-muted">
                                    Upload a PDF or image showing how the
                                    customization will look
                                </small>
                            </FormGroup>
                            <FormGroup>
                                <Label for="proofNotes">
                                    Notes for Customer (Optional)
                                </Label>
                                <Input
                                    type="textarea"
                                    id="proofNotes"
                                    rows={3}
                                    value={proofNotes}
                                    onChange={(e) =>
                                        setProofNotes(e.target.value)
                                    }
                                    placeholder="Add any notes about this proof..."
                                />
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setProofModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleUploadProof}
                        disabled={uploadingProof || !proofFile}
                    >
                        {uploadingProof ? (
                            <>
                                <Spinner size="sm" className="me-1" />{" "}
                                Uploading...
                            </>
                        ) : (
                            "Upload Proof"
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Proof View Modal */}
            <Modal
                isOpen={proofViewModal}
                toggle={() => setProofViewModal(false)}
                size="lg"
            >
                <ModalHeader toggle={() => setProofViewModal(false)}>
                    <i className="ri-file-list-3-line me-2"></i>
                    Customization Proof History
                </ModalHeader>
                <ModalBody>
                    {selectedProofItem && (
                        <div className="mb-3 p-3 bg-light rounded">
                            <h6 className="mb-1">
                                {selectedProofItem.productName || "Item"}
                            </h6>
                            <small className="text-muted">
                                {selectedProofItem.sizeName &&
                                    `Size: ${selectedProofItem.sizeName}`}
                                {selectedProofItem.colorName &&
                                    ` • Color: ${selectedProofItem.colorName}`}
                            </small>
                            <div className="mt-2">
                                <Badge
                                    color={getProofStatusColor(
                                        selectedProofItem.proofStatus
                                    )}
                                    className="text-white"
                                >
                                    {formatProofStatus(
                                        selectedProofItem.proofStatus
                                    )}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {!itemProofs ? (
                        <div className="text-center py-4">
                            <Spinner color="primary" />
                            <p className="mt-2 text-muted">Loading proofs...</p>
                        </div>
                    ) : itemProofs.proofs?.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="ri-file-pdf-line fs-1 mb-2 d-block"></i>
                            No proofs uploaded yet
                        </div>
                    ) : (
                        <div className="proof-history">
                            {itemProofs.proofs?.map((proof, index) => (
                                <div
                                    key={proof.id || proof._id}
                                    className={`mb-4 p-3 border rounded ${
                                        proof.status === "SUPERSEDED"
                                            ? "bg-light opacity-75"
                                            : ""
                                    }`}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 className="mb-1">
                                                Version {proof.version}
                                                {proof.status ===
                                                    "SUPERSEDED" && (
                                                    <Badge
                                                        color="secondary"
                                                        className="ms-2 text-white"
                                                        pill
                                                    >
                                                        Superseded
                                                    </Badge>
                                                )}
                                            </h6>
                                            <small className="text-muted">
                                                Uploaded:{" "}
                                                {new Date(
                                                    proof.createdAt
                                                ).toLocaleString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </small>
                                        </div>
                                        <Badge
                                            color={
                                                proof.status === "APPROVED"
                                                    ? "success"
                                                    : proof.status ===
                                                      "REVISION_REQUESTED"
                                                    ? "danger"
                                                    : proof.status ===
                                                      "PENDING_REVIEW"
                                                    ? "info"
                                                    : "secondary"
                                            }
                                            className="text-white"
                                        >
                                            {proof.status === "PENDING_REVIEW"
                                                ? "Awaiting Response"
                                                : proof.status.replace(
                                                      "_",
                                                      " "
                                                  )}
                                        </Badge>
                                    </div>

                                    {/* Proof file preview/link */}
                                    <div className="mb-3">
                                        <a
                                            href={proof.proofFileUrl?.startsWith("http") ? proof.proofFileUrl : `${apiUrl}${proof.proofFileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            <i className="ri-file-download-line me-1"></i>
                                            View/Download Proof (
                                            {proof.proofFileName || "proof.pdf"}
                                            )
                                        </a>
                                    </div>

                                    {/* Admin notes */}
                                    {proof.adminNotes && (
                                        <div className="mb-2 p-2 bg-info bg-opacity-10 rounded">
                                            <small className="fw-medium text-info">
                                                Admin Notes:
                                            </small>
                                            <p className="mb-0 small">
                                                {proof.adminNotes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Customer feedback for revision */}
                                    {proof.customerFeedback && (
                                        <div className="mb-2 p-2 bg-danger bg-opacity-10 rounded">
                                            <small className="fw-medium text-danger">
                                                Customer Feedback:
                                            </small>
                                            <p className="mb-0 small">
                                                {proof.customerFeedback}
                                            </p>
                                        </div>
                                    )}

                                    {/* Comments thread */}
                                    {proof.comments &&
                                        proof.comments.length > 0 && (
                                            <div className="mt-3 border-top pt-3">
                                                <small className="fw-medium text-muted d-block mb-2">
                                                    <i className="ri-chat-1-line me-1"></i>
                                                    Comments (
                                                    {proof.comments.length})
                                                </small>
                                                <div
                                                    className="comment-thread"
                                                    style={{
                                                        maxHeight: "200px",
                                                        overflowY: "auto",
                                                    }}
                                                >
                                                    {proof.comments.map(
                                                        (comment) => (
                                                            <div
                                                                key={comment.id || comment._id}
                                                                className={`mb-2 p-2 rounded ${
                                                                    (comment.authorType ||
                                                                        comment.senderType) ===
                                                                    "ADMIN"
                                                                        ? "bg-primary bg-opacity-10 ms-4"
                                                                        : "bg-light me-4"
                                                                }`}
                                                            >
                                                                <div className="d-flex justify-content-between">
                                                                    <small className="fw-medium">
                                                                        {comment.authorName ||
                                                                            comment.senderName ||
                                                                            ((comment.authorType ||
                                                                                comment.senderType) ===
                                                                            "ADMIN"
                                                                                ? "Admin"
                                                                                : "Customer")}
                                                                    </small>
                                                                    <small className="text-muted">
                                                                        {new Date(
                                                                            comment.createdAt
                                                                        ).toLocaleString(
                                                                            "en-GB",
                                                                            {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            }
                                                                        )}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-0 small">
                                                                    {
                                                                        comment.message
                                                                    }
                                                                </p>
                                                                {comment.attachmentUrl && (
                                                                    <a
                                                                        href={comment.attachmentUrl?.startsWith("http") ? comment.attachmentUrl : `${apiUrl}${comment.attachmentUrl}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="small"
                                                                    >
                                                                        <i className="ri-attachment-line me-1"></i>
                                                                        {comment.attachmentName ||
                                                                            "Attachment"}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Add comment for active proof */}
                                    {proof.status === "PENDING_REVIEW" && (
                                        <div className="mt-3 border-top pt-3">
                                            <FormGroup className="mb-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Add a comment..."
                                                    value={proofCommentText}
                                                    onChange={(e) =>
                                                        setProofCommentText(
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" &&
                                                        handleAddProofComment(
                                                            proof.id ||
                                                                proof._id
                                                        )
                                                    }
                                                />
                                            </FormGroup>
                                            <Button
                                                color="primary"
                                                size="sm"
                                                onClick={() =>
                                                    handleAddProofComment(
                                                        proof.id ||
                                                            proof._id
                                                    )
                                                }
                                                disabled={
                                                    !proofCommentText.trim()
                                                }
                                            >
                                                <i className="ri-send-plane-line me-1"></i>
                                                Send
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload new proof button if revision requested */}
                    {selectedProofItem?.proofStatus ===
                        "REVISION_REQUESTED" && (
                        <div className="mt-3 text-center">
                            <Button
                                color="warning"
                                onClick={() => {
                                    setProofViewModal(false);
                                    openProofModal(selectedProofItem);
                                }}
                            >
                                <i className="ri-upload-2-line me-1"></i>
                                Upload New Version
                            </Button>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="light"
                        onClick={() => setProofViewModal(false)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default OrderDetail;
