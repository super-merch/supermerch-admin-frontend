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
  TabContent,
  TabPane,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";
import classnames from "classnames";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import FormsHeader from "../../Components/Common/FormsHeader";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import config from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const apiUrl = config.api.API_URL;

const WebsiteUsers = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState(true);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Data table states
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [data, setData] = useState([]);

  // View states
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersWithOrders: 0,
  });

  // Order detail modal
  const [orderDetailModal, setOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Orders DataTable states (server-side)
  const [ordersData, setOrdersData] = useState([]);
  const [ordersTotalRows, setOrdersTotalRows] = useState(0);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [ordersPageNo, setOrdersPageNo] = useState(0);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
  const [ordersQuery, setOrdersQuery] = useState("");

  // Wishlist DataTable states (server-side)
  const [wishlistData, setWishlistData] = useState([]);
  const [wishlistTotalRows, setWishlistTotalRows] = useState(0);
  const [wishlistPerPage, setWishlistPerPage] = useState(10);
  const [wishlistPageNo, setWishlistPageNo] = useState(0);
  const [wishlistSearchTerm, setWishlistSearchTerm] = useState("");
  const [wishlistQuery, setWishlistQuery] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Debounce orders search
  useEffect(() => {
    const handler = setTimeout(() => {
      setOrdersQuery(ordersSearchTerm);
      setOrdersPageNo(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [ordersSearchTerm]);

  // Debounce wishlist search
  useEffect(() => {
    const handler = setTimeout(() => {
      setWishlistQuery(wishlistSearchTerm);
      setWishlistPageNo(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [wishlistSearchTerm]);

  // Orders DataTable columns
  const ordersColumns = [
    {
      name: "Order #",
      selector: (row) => row.orderNumber,
      sortable: true,
      minWidth: "100px",
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      minWidth: "90px",
    },
    {
      name: "Items",
      selector: (row) => `${row.items?.length || 0} items`,
      sortable: false,
      minWidth: "90px",
    },
    {
      name: "Total",
      selector: (row) => `A$${parseFloat(row.totalAmount).toFixed(2)}`,
      sortable: true,
      minWidth: "50px",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge color={getOrderStatusColor(row.status)} className="text-white">
          {row.status}
        </Badge>
      ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Payment",
      selector: (row) => (
        <Badge color={getPaymentStatusColor(row.paymentStatus)} className="text-white">
          {row.paymentStatus}
        </Badge>
      ),
      sortable: true,
      minWidth: "110px",
    },
    {
      name: "Action",
      selector: (row) => (
        <Button size="sm" color="info" onClick={() => handleViewOrder(row)}>
          View
        </Button>
      ),
      sortable: false,
      width: "80px",
    },
  ];

  // Wishlist DataTable columns
  const wishlistColumns = [
    {
      name: "Type",
      selector: (row) => (
        <Badge color={row.product ? 'primary' : 'info'}>
          {row.product ? 'Product' : 'Deal'}
        </Badge>
      ),
      sortable: false,
      width: "100px",
    },
    {
      name: "Name",
      selector: (row) => row.product?.name || row.deal?.title || '-',
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "Code",
      selector: (row) => row.product?.productCode || row.deal?.dealCode || '-',
      sortable: true,
      width: "150px",
    },
    {
      name: "Added On",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      width: "120px",
    },
  ];

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => (
        <div className="d-flex align-items-center">
          {row.profileImage ? (
            <img
              src={`${apiUrl}/${row.profileImage}`}
              alt={row.name}
              className="rounded-circle me-2"
              style={{ width: "32px", height: "32px", objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center me-2"
              style={{ width: "32px", height: "32px" }}
            >
              <span className="text-primary fw-medium">
                {row.name?.charAt(0)}{row.lastName?.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="mb-0 fw-medium">{row.name} {row.lastName}</p>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "Email",
      selector: (row) => <span className="text-wrap">{row.email}</span>,
      sortable: true,
      minWidth: "220px",
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "-",
      sortable: true,
      width: "140px",
    },
    {
      name: "Orders",
      selector: (row) => (
        <Badge color="info" className="text-white">
          {row._count?.orders || 0}
        </Badge>
      ),
      sortable: false,
      width: "90px",
    },
    {
      name: "Wishlist",
      selector: (row) => (
        <Badge color="warning" className="text-white">
          {row._count?.wishlists || 0}
        </Badge>
      ),
      sortable: false,
      width: "90px",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge color={row.isActive ? "success" : "danger"} className="text-white">
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: true,
      width: "100px",
    },
    {
      name: "Registered",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      width: "120px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-info view-item-btn"
              onClick={() => handleViewUser(row._id)}
              disabled={isLoading}
            >
              View
            </button>
            {currentPagePermissions?.edit && (
              <button
                className={`btn btn-sm ${row.isActive ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleStatus(row._id, !row.isActive)}
                disabled={isLoading}
              >
                {row.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  // Toggle tab
  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Fetch website users
  const fetchWebsiteUsers = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo + 1,
      limit: perPage,
      isActive: filter,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await axios.get(`/api/admin/website-users`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setData(response.data.data);
        setTotalRows(response.data.pagination.totalCount);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching website users:", error);
      toast.error("Failed to fetch website users");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/admin/website-users/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchWebsiteUsers();
    fetchStats();
  }, [fetchWebsiteUsers, fetchStats]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // View user details
  const handleViewUser = async (userId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/admin/website-users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowDetails(true);
        setActiveTab("1");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user orders (server-side pagination)
  const fetchUserOrders = useCallback(async (userId) => {
    setOrdersLoading(true);
    try {
      const response = await axios.get(`/api/admin/website-users/${userId}/orders`, {
        params: {
          page: ordersPageNo + 1,
          limit: ordersPerPage,
          search: ordersQuery || undefined,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setOrdersData(response.data.data);
        setOrdersTotalRows(response.data.pagination.total);
      } else {
        setOrdersData([]);
        setOrdersTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setOrdersData([]);
      setOrdersTotalRows(0);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPageNo, ordersPerPage, ordersQuery]);

  // Fetch user wishlist (server-side pagination)
  const fetchUserWishlist = useCallback(async (userId) => {
    setWishlistLoading(true);
    try {
      const response = await axios.get(`/api/admin/website-users/${userId}/wishlist`, {
        params: {
          page: wishlistPageNo + 1,
          limit: wishlistPerPage,
          search: wishlistQuery || undefined,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setWishlistData(response.data.data);
        setWishlistTotalRows(response.data.pagination.total);
      } else {
        setWishlistData([]);
        setWishlistTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching user wishlist:", error);
      setWishlistData([]);
      setWishlistTotalRows(0);
    } finally {
      setWishlistLoading(false);
    }
  }, [wishlistPageNo, wishlistPerPage, wishlistQuery]);

  // Fetch orders when selectedUser, pagination or search changes
  useEffect(() => {
    if (selectedUser?._id && showDetails) {
      fetchUserOrders(selectedUser._id);
    }
  }, [selectedUser?._id, showDetails, fetchUserOrders]);

  // Fetch wishlist when selectedUser, pagination or search changes
  useEffect(() => {
    if (selectedUser?._id && showDetails) {
      fetchUserWishlist(selectedUser._id);
    }
  }, [selectedUser?._id, showDetails, fetchUserWishlist]);

  // Toggle user status
  const handleToggleStatus = async (userId, newStatus) => {
    setIsLoading(true);
    try {
      const response = await axios.patch(
        `/api/admin/website-users/${userId}/status`,
        { isActive: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchWebsiteUsers();
        fetchStats();
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setIsLoading(false);
    }
  };

  // Back to list
  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedUser(null);
    setUserOrders([]);
    setActiveTab("1");
    // Reset pagination and search states
    setOrdersPageNo(0);
    setOrdersSearchTerm("");
    setOrdersQuery("");
    setOrdersData([]);
    setOrdersTotalRows(0);
    setWishlistPageNo(0);
    setWishlistSearchTerm("");
    setWishlistQuery("");
    setWishlistData([]);
    setWishlistTotalRows(0);
  };

  // Handle pagination
  const handleSort = (column, sortDirection) => {
    // Sorting can be implemented if needed
  };

  const handlePageChange = (page) => {
    setPageNo(page - 1);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    setPageNo(0);
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  // Get order status badge color
  const getOrderStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      PENDING_VERIFICATION: "info",
      VERIFIED: "primary",
      CONFIRMED: "primary",
      PROCESSING: "info",
      DISPATCHED: "secondary",
      DELIVERED: "success",
      CANCELLED: "danger",
      REFUNDED: "dark",
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

  const generateImageUrl = (item) => {
    if(item.itemType === 'PRODUCT'){
        let url = item.product?.images?.[0]?.imageUrl;
        if(url.includes('http') || url.includes('https')){
            return url;
        }else{
            return `${apiUrl}/${url}`;
        }
    }else{
        let url = item.deal?.bannerImage;
        if(url.includes('http') || url.includes('https')){
            return url;
        }else{
            return `${apiUrl}/${url}`;
        }
    }
  }

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailModal(true);
  };

  // Render user details view
  const renderUserDetails = () => {
    if (!selectedUser) return null;

    return (
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button color="secondary" onClick={handleBackToList}>
            <i className="ri-arrow-left-line me-1"></i> Back to List
          </Button>
        </div>

        {/* User Header */}
        <Card className="mb-4">
          <CardBody>
            <Row>
              <Col md={2} className="text-center">
                {selectedUser.profileImage ? (
                  <img
                    src={`${apiUrl}/${selectedUser.profileImage}`}
                    alt={selectedUser.name}
                    className="rounded-circle"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <span className="text-primary fw-bold fs-1">
                      {selectedUser.name?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </Col>
              <Col md={10}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h4 className="mb-1">{selectedUser.name} {selectedUser.lastName}</h4>
                    <p className="text-muted mb-2">{selectedUser.email}</p>
                    <div className="d-flex gap-3">
                      <span><i className="ri-phone-line me-1"></i> {selectedUser.phone || "Not provided"}</span>
                      <span><i className="ri-user-line me-1"></i> {selectedUser.gender || "Not specified"}</span>
                      {selectedUser.dateOfBirth && (
                        <span><i className="ri-cake-line me-1"></i> {new Date(selectedUser.dateOfBirth).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Badge color={selectedUser.isActive ? "success" : "danger"} className="text-white fs-6">
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <hr />
                <Row className="text-center">
                  <Col>
                    <h5 className="mb-0">{selectedUser._count?.orders || 0}</h5>
                    <small className="text-muted">Orders</small>
                  </Col>
                  <Col>
                    <h5 className="mb-0">{selectedUser._count?.addresses || 0}</h5>
                    <small className="text-muted">Addresses</small>
                  </Col>
                  <Col>
                    <h5 className="mb-0">{selectedUser._count?.wishlists || 0}</h5>
                    <small className="text-muted">Wishlist Items</small>
                  </Col>
                  <Col>
                    <h5 className="mb-0">{new Date(selectedUser.createdAt).toLocaleDateString()}</h5>
                    <small className="text-muted">Registered</small>
                  </Col>
                </Row>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Nav tabs className="nav-tabs-custom nav-success mb-3">
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "1" })}
              onClick={() => toggleTab("1")}
            >
              <i className="ri-shopping-bag-line align-middle me-1"></i>
              Orders ({ordersTotalRows})
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "2" })}
              onClick={() => toggleTab("2")}
            >
              <i className="ri-map-pin-line align-middle me-1"></i>
              Addresses ({selectedUser.addresses?.length || 0})
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "3" })}
              onClick={() => toggleTab("3")}
            >
              <i className="ri-heart-line align-middle me-1"></i>
              Wishlist ({wishlistTotalRows})
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab}>
          {/* Orders Tab */}
          <TabPane tabId="1">
            {/* Orders Search */}
            <div className="d-flex justify-content-end align-items-center mb-3">
              <div className="search-box" style={{ width: "300px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search orders..."
                  value={ordersSearchTerm}
                  onChange={(e) => setOrdersSearchTerm(e.target.value)}
                />
                <i className="ri-search-line search-icon"></i>
              </div>
            </div>

            <div className="table-responsive table-card">
              <DataTable
                columns={ordersColumns}
                data={ordersData}
                progressPending={ordersLoading}
                pagination
                paginationServer
                paginationTotalRows={ordersTotalRows}
                paginationPerPage={ordersPerPage}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                onChangeRowsPerPage={(newPerPage) => {
                  setOrdersPerPage(newPerPage);
                  setOrdersPageNo(0);
                }}
                onChangePage={(page) => setOrdersPageNo(page - 1)}
                noDataComponent={
                  <div className="text-center py-4 text-muted">
                    <i className="ri-shopping-bag-line fs-1 d-block mb-2"></i>
                    No orders found
                  </div>
                }
              />
            </div>
          </TabPane>

          {/* Addresses Tab */}
          <TabPane tabId="2">
            {selectedUser.addresses?.length > 0 ? (
              <Row>
                {selectedUser.addresses.map((address) => (
                  <Col md={6} key={address.id} className="mb-3">
                    <Card className="h-100">
                      <CardBody>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Badge color={address.type === 'billing' ? 'primary' : 'success'}>
                            {address.type}
                          </Badge>
                          {address.isDefault && (
                            <Badge color="warning">Default</Badge>
                          )}
                        </div>
                        <p className="mb-1">{address.addressLine1}</p>
                        {address.addressLine2 && <p className="mb-1">{address.addressLine2}</p>}
                        <p className="mb-1">
                          {address.cityRelation?.cityName}, {address.countryRelation?.countryName}
                        </p>
                        <p className="mb-0">{address.pincode}</p>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="ri-map-pin-line fs-1 d-block mb-2"></i>
                No addresses saved
              </div>
            )}
          </TabPane>

          {/* Wishlist Tab */}
          <TabPane tabId="3">
            {/* Wishlist Search */}
            <div className="d-flex justify-content-end align-items-center mb-3">
              <div className="search-box" style={{ width: "300px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search wishlist..."
                  value={wishlistSearchTerm}
                  onChange={(e) => setWishlistSearchTerm(e.target.value)}
                />
                <i className="ri-search-line search-icon"></i>
              </div>
            </div>

            <div className="table-responsive table-card">
              <DataTable
                columns={wishlistColumns}
                data={wishlistData}
                progressPending={wishlistLoading}
                pagination
                paginationServer
                paginationTotalRows={wishlistTotalRows}
                paginationPerPage={wishlistPerPage}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                onChangeRowsPerPage={(newPerPage) => {
                  setWishlistPerPage(newPerPage);
                  setWishlistPageNo(0);
                }}
                onChangePage={(page) => setWishlistPageNo(page - 1)}
                noDataComponent={
                  <div className="text-center py-4 text-muted">
                    <i className="ri-heart-line fs-1 d-block mb-2"></i>
                    No wishlist items
                  </div>
                }
              />
            </div>
          </TabPane>
        </TabContent>
      </CardBody>
    );
  };

  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Last Name", key: "lastName" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Status", key: "isActive" },
    { header: "Registered", key: "createdAt" },
  ];

  const fetchAllForExport = async () => {
    try {
      const response = await axios.get(`/api/admin/website-users`, {
        params: { page: 1, limit: 10000, isActive: filter },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) return response.data.data;
      return [];
    } catch { return []; }
  };

  document.title = `Website Users | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Website Users" pageTitle="Master" />

          {/* Stats Cards */}
          {!showDetails && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="card-animate">
                  <CardBody>
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="fw-medium text-muted mb-0">Total Users</p>
                        <h2 className="mt-2 mb-0">{stats.totalUsers}</h2>
                      </div>
                      <div className="avatar-sm">
                        <span className="avatar-title bg-primary-subtle rounded-circle">
                          <i className="ri-group-line text-white fs-4"></i>
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-animate">
                  <CardBody>
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="fw-medium text-muted mb-0">Active Users</p>
                        <h2 className="mt-2 mb-0 text-success">{stats.activeUsers}</h2>
                      </div>
                      <div className="avatar-sm">
                        <span className="avatar-title bg-success-subtle rounded-circle">
                          <i className="ri-user-follow-line text-white fs-4"></i>
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-animate">
                  <CardBody>
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="fw-medium text-muted mb-0">Inactive Users</p>
                        <h2 className="mt-2 mb-0 text-danger">{stats.inactiveUsers}</h2>
                      </div>
                      <div className="avatar-sm">
                        <span className="avatar-title bg-danger-subtle rounded-circle">
                          <i className="ri-user-unfollow-line text-white fs-4"></i>
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-animate">
                  <CardBody>
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="fw-medium text-muted mb-0">With Orders</p>
                        <h2 className="mt-2 mb-0 text-info">{stats.usersWithOrders}</h2>
                      </div>
                      <div className="avatar-sm">
                        <span className="avatar-title bg-info-subtle rounded-circle">
                          <i className="ri-shopping-bag-line text-white fs-4"></i>
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  {!showDetails && (
                    <div className="d-flex justify-content-between align-items-center">
                    <FormsHeader
                      formName="Website Users"
                      filter={filter}
                      handleFilter={handleFilter}
                      setQuery={setSearchTerm}
                      showForm={false}
                      updateForm={false}
                      showAddButton={false}
                    />
                    <ExportButtons
                      data={data}
                      columns={exportColumns}
                      fileName="website-users"
                      fetchAll={fetchAllForExport}
                    />
                    </div>
                  )}
                </CardHeader>

                {showDetails ? (
                  renderUserDetails()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        customStyles={tableCustomStyles}
                        sortServer
                        onSort={(column, sortDirection) =>
                          handleSort(column, sortDirection)
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
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Order Detail Modal */}
        <Modal isOpen={orderDetailModal} toggle={() => setOrderDetailModal(false)} size="lg">
          <ModalHeader toggle={() => setOrderDetailModal(false)}>
            Order Details - {selectedOrder?.orderNumber}
          </ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <>
                {/* Order Summary */}
                <Row className="mb-3">
                  <Col md={6}>
                    <h6>Order Information</h6>
                    <Table size="sm" borderless>
                      <tbody>
                        <tr>
                          <td className="text-muted">Order Number:</td>
                          <td className="fw-medium">{selectedOrder.orderNumber}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Date:</td>
                          <td>{new Date(selectedOrder.createdAt).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Status:</td>
                          <td>
                            <Badge color={getOrderStatusColor(selectedOrder.status)} className="text-white">
                              {selectedOrder.status}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted">Payment:</td>
                          <td>
                            <Badge color={getPaymentStatusColor(selectedOrder.paymentStatus)} className="text-white">
                              {selectedOrder.paymentStatus}
                            </Badge>
                            {selectedOrder.paymentMethod && (
                              <span className="ms-2 text-muted">({selectedOrder.paymentMethod})</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h6>Customer Details</h6>
                    <Table size="sm" borderless>
                      <tbody>
                        <tr>
                          <td className="text-muted">Name:</td>
                          <td>{selectedOrder.customerName}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Email:</td>
                          <td>{selectedOrder.customerEmail}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Phone:</td>
                          <td>{selectedOrder.customerPhone}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                <hr />

                {/* Order Items */}
                <h6>Order Items</h6>
                <div className="table-responsive">
                  <Table size="sm">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {(item.product?.images?.[0]?.imageUrl || item.deal?.bannerImage) && (
                                <img
                                  src={generateImageUrl(item)}
                                  alt=""
                                  className="rounded me-2"
                                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                />
                              )}
                              <div>
                                <p className="mb-0 fw-medium">
                                  {item.product?.name || item.deal?.title || item.productName || item.dealTitle}
                                </p>
                                <small className="text-muted">
                                  {item.product?.productCode || item.deal?.dealCode || item.productCode || item.dealCode}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge color={item.itemType === 'PRODUCT' ? 'primary' : 'info'} className="text-white">
                              {item.itemType}
                            </Badge>
                          </td>
                          <td>{item.quantity}</td>
                          <td>A${parseFloat(item.unitPrice).toFixed(2)}</td>
                          <td>A${parseFloat(item.lineTotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <hr />

                {/* Order Totals */}
                <Row>
                  <Col md={{ size: 4, offset: 8 }}>
                    <Table size="sm" borderless>
                      <tbody>
                        <tr>
                          <td className="text-muted">Subtotal:</td>
                          <td className="text-end">A${parseFloat(selectedOrder.subtotal).toFixed(2)}</td>
                        </tr>
                        {selectedOrder.discountAmount > 0 && (
                          <tr>
                            <td className="text-muted">Discount:</td>
                            <td className="text-end text-success">-A${parseFloat(selectedOrder.discountAmount).toFixed(2)}</td>
                          </tr>
                        )}
                        {selectedOrder.customizationCharges > 0 && (
                          <tr>
                            <td className="text-muted">Customization:</td>
                            <td className="text-end">A${parseFloat(selectedOrder.customizationCharges).toFixed(2)}</td>
                          </tr>
                        )}
                        {selectedOrder.shippingCharges > 0 && (
                          <tr>
                            <td className="text-muted">Shipping:</td>
                            <td className="text-end">A${parseFloat(selectedOrder.shippingCharges).toFixed(2)}</td>
                          </tr>
                        )}
                        {selectedOrder.taxAmount > 0 && (
                          <tr>
                            <td className="text-muted">Tax:</td>
                            <td className="text-end">A${parseFloat(selectedOrder.taxAmount).toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="border-top">
                          <td className="fw-bold">Total:</td>
                          <td className="text-end fw-bold">A${parseFloat(selectedOrder.totalAmount).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </>
            )}
          </ModalBody>
        </Modal>
      </div>
    </React.Fragment>
  );
};

export default WebsiteUsers;
