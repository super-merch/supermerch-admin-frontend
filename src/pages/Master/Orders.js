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
  Nav,
  NavItem,
  NavLink,
  Input,
} from "reactstrap";
import classnames from "classnames";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const Orders = () => {
  const navigate = useNavigate();
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  // Delivery types
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState("all");

  // Status filter
  const [statusFilter, setStatusFilter] = useState("");

  // Pending logo filter
  const [showPendingLogoOnly, setShowPendingLogoOnly] = useState(false);
  const [pendingLogoCount, setPendingLogoCount] = useState(0);

  // Data table states
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [pageNo, setPageNo] = useState(0);
  const [data, setData] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingVerificationOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    dispatchedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    deliveryTypeStats: {},
  });

  // Order statuses for filter
  const orderStatuses = [
    { value: "", label: "All Statuses" },
    { value: "PENDING_VERIFICATION", label: "Pending Verification" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "DISPATCHED", label: "Dispatched" },
    { value: "PARTIALLY_DISPATCHED", label: "Partially Dispatched" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "PARTIALLY_DELIVERED", label: "Partially Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "PARTIALLY_CANCELLED", label: "Partially Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "PARTIALLY_REFUNDED", label: "Partially Refunded" },
  ];

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchTerm);
      setPageNo(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
      PENDING_VERIFICATION: "Pending Verification",
      REJECTED: "Rejected",
      CONFIRMED: "Confirmed",
      PROCESSING: "Processing",
      DISPATCHED: "Dispatched",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
      REFUNDED: "Refunded",
    };
    return statusMap[status] || status;
  };

  // Columns for DataTable
  const columns = [
    {
      name: "Order #",
      selector: (row) => row.orderNumber,
      sortable: true,
      minWidth: "140px",
      cell: (row) => (
        <span
          className="fw-medium text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          {row.orderNumber}
        </span>
      ),
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      minWidth: "100px",
    },
    {
      name: "Customer",
      selector: (row) => row.customerName,
      sortable: true,
      minWidth: "150px",
      cell: (row) => (
        <div>
          <p className="mb-0 fw-medium">{row.customerName}</p>
          <small className="text-muted">{row.customerEmail}</small>
        </div>
      ),
    },
    {
      name: "Items",
      selector: (row) => row.items?.length || 0,
      sortable: false,
      width: "80px",
      cell: (row) => (
        <Badge color="light" className="text-dark">
          {row.items?.length || 0}
        </Badge>
      ),
    },
    {
      name: "Total",
      selector: (row) => row.totalAmount,
      sortable: true,
      minWidth: "100px",
      cell: (row) => (
        <span className="fw-medium">
          A${parseFloat(row.totalAmount).toFixed(2)}
        </span>
      ),
    },
    {
      name: "Delivery",
      selector: (row) => row.shippingAddress?.deliveryType,
      sortable: false,
      minWidth: "120px",
      cell: (row) => (
        <Badge color="secondary" className="text-white">
          {row.shippingAddress?.deliveryType || "N/A"}
        </Badge>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      minWidth: "150px",
      cell: (row) => (
        <Badge color={getOrderStatusColor(row.status)} className="text-white">
          {formatStatus(row.status)}
        </Badge>
      ),
    },
    {
      name: "Payment",
      selector: (row) => row.paymentStatus,
      sortable: true,
      minWidth: "110px",
      cell: (row) => (
        <Badge
          color={getPaymentStatusColor(row.paymentStatus)}
          className="text-white"
        >
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      name: "Customization",
      selector: (row) => row.requiresVerification,
      sortable: false,
      width: "120px",
      cell: (row) =>
        row.requiresVerification ? (
          <Badge
            color={
              row.status === "PENDING_VERIFICATION" ? "warning" : "success"
            }
            className="text-white"
          >
            {row.status === "PENDING_VERIFICATION" ? "Needs Review" : "Verified"}
          </Badge>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      name: "Action",
      selector: (row) => row.id,
      sortable: false,
      minWidth: "100px",
      cell: (row) => (
        <Button
          size="sm"
          color="info"
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Fetch delivery types
  const fetchDeliveryTypes = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/orders/delivery-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setDeliveryTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery types:", error);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo + 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    if (statusFilter) {
      params.status = statusFilter;
    }

    if (activeDeliveryTab && activeDeliveryTab !== "all") {
      params.deliveryType = activeDeliveryTab;
    }

    if (showPendingLogoOnly) {
      params.pendingCustomerLogo = true;
    }

    try {
      const response = await axios.get(`/api/admin/orders`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setData(response.data.data);
        setTotalRows(response.data.pagination.total);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, statusFilter, activeDeliveryTab, showPendingLogoOnly]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/orders/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }

      // Fetch pending logo count
      const logoResponse = await axios.get(`/api/admin/orders/pending-customer-logo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (logoResponse.data.success) {
        setPendingLogoCount(logoResponse.data.data?.orders?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryTypes();
    fetchStats();
  }, [fetchDeliveryTypes, fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setPageNo(page - 1);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    setPageNo(0);
  };

  const exportColumns = [
    { header: "Order #", key: "orderNumber" },
    { header: "Date", key: "createdAt" },
    { header: "Customer", key: "customerName" },
    { header: "Email", key: "customerEmail" },
    { header: "Total", key: "totalAmount" },
    { header: "Status", key: "status" },
    { header: "Payment", key: "paymentStatus" },
  ];

  const fetchAllForExport = async () => {
    try {
      const params = { page: 1, limit: 10000 };
      if (statusFilter) params.status = statusFilter;
      if (activeDeliveryTab && activeDeliveryTab !== "all") params.deliveryType = activeDeliveryTab;
      const response = await axios.get(`/api/admin/orders`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) return response.data.data;
      return [];
    } catch { return []; }
  };

  document.title = `Orders | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <BreadCrumb maintitle="Master" title="Orders" pageTitle="Master" />
            <Button
              color="success"
              onClick={() => navigate("/orders/create")}
            >
              <i className="ri-add-line me-1"></i>Create Order
            </Button>
          </div>

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">
                        Total Orders
                      </p>
                      <h4 className="mt-1 mb-0">{stats.totalOrders}</h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle rounded-circle">
                        <i className="ri-shopping-bag-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">
                        Pending Verification
                      </p>
                      <h4 className="mt-1 mb-0 text-info">
                        {stats.pendingVerificationOrders}
                      </h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-info-subtle rounded-circle">
                        <i className="ri-eye-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">
                        Processing
                      </p>
                      <h4 className="mt-1 mb-0 text-warning">
                        {stats.confirmedOrders + stats.processingOrders}
                      </h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-warning-subtle rounded-circle">
                        <i className="ri-loader-4-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">
                        Dispatched
                      </p>
                      <h4 className="mt-1 mb-0 text-secondary">
                        {stats.dispatchedOrders}
                      </h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-secondary-subtle rounded-circle">
                        <i className="ri-truck-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">
                        Delivered
                      </p>
                      <h4 className="mt-1 mb-0 text-success">
                        {stats.deliveredOrders}
                      </h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle rounded-circle">
                        <i className="ri-checkbox-circle-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="card-animate">
                <CardBody className="py-3">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="fw-medium text-muted mb-0 small">Revenue</p>
                      <h4 className="mt-1 mb-0 text-success">
                        A${parseFloat(stats.totalRevenue || 0).toFixed(0)}
                      </h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle rounded-circle">
                        <i className="ri-money-pound-circle-line text-white fs-5"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  {/* Delivery Type Tabs */}
                  <Nav tabs className="nav-tabs-custom nav-primary mb-3">
                    <NavItem>
                      <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames({
                          active: activeDeliveryTab === "all",
                        })}
                        onClick={() => {
                          setActiveDeliveryTab("all");
                          setPageNo(0);
                        }}
                      >
                        All Orders
                        <Badge color="light" className="ms-2 text-dark">
                          {stats.totalOrders}
                        </Badge>
                      </NavLink>
                    </NavItem>
                    {deliveryTypes.map((dt) => (
                      <NavItem key={dt.id}>
                        <NavLink
                          style={{ cursor: "pointer" }}
                          className={classnames({
                            active: activeDeliveryTab === dt.name,
                          })}
                          onClick={() => {
                            setActiveDeliveryTab(dt.name);
                            setPageNo(0);
                          }}
                        >
                          {dt.name}
                          {stats.deliveryTypeStats?.[dt.name] && (
                            <Badge color="light" className="ms-2 text-dark">
                              {stats.deliveryTypeStats[dt.name].total}
                            </Badge>
                          )}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>

                  {/* Filters Row */}
                  <Row className="align-items-center">
                    <Col md={4}>
                      <div className="search-box">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search orders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                    </Col>
                    <Col md={3}>
                      <Input
                        type="select"
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPageNo(0);
                        }}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={5} className="text-end d-flex justify-content-end align-items-center gap-2">
                      <ExportButtons
                        data={data}
                        columns={exportColumns}
                        fileName="orders"
                        fetchAll={fetchAllForExport}
                      />
                      <Button
                        color={showPendingLogoOnly ? "warning" : "light"}
                        outline={!showPendingLogoOnly}
                        onClick={() => {
                          setShowPendingLogoOnly(!showPendingLogoOnly);
                          setPageNo(0);
                        }}
                        className="d-inline-flex align-items-center"
                      >
                        <i className="ri-upload-line me-1"></i>
                        Pending Customer Logo
                        {pendingLogoCount > 0 && (
                          <Badge
                            color="danger"
                            className="ms-2"
                            pill
                          >
                            {pendingLogoCount}
                          </Badge>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody>
                  <div className="table-responsive table-card">
                    <DataTable
                      columns={columns}
                      data={data}
                      progressPending={loading}
                      customStyles={tableCustomStyles}
                      pagination
                      paginationServer
                      paginationTotalRows={totalRows}
                      paginationPerPage={perPage}
                      paginationRowsPerPageOptions={[25, 50, 100, 200]}
                      onChangeRowsPerPage={handlePerRowsChange}
                      onChangePage={handlePageChange}
                      noDataComponent={
                        <div className="text-center py-4 text-muted">
                          <i className="ri-shopping-bag-line fs-1 d-block mb-2"></i>
                          No orders found
                        </div>
                      }
                      highlightOnHover
                      pointerOnHover
                      onRowClicked={(row) => navigate(`/orders/${row.id}`)}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Orders;
