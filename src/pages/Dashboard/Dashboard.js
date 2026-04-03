import React, { useContext, useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, CardHeader, Table, Badge, Spinner } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const { adminData } = useContext(AuthContext);
    
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingSales, setLoadingSales] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCategory, setLoadingCategory] = useState(true);
    
    const [stats, setStats] = useState(null);
    const [salesChart, setSalesChart] = useState([]);
    const [orderStatusChart, setOrderStatusChart] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [revenueByCategory, setRevenueByCategory] = useState([]);

    const getGreeting = () => {
        if (currentHour < 12) {
            return "Good Morning";
        } else if (currentHour < 17) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    useEffect(() => {
        // Global axios interceptor handles atoken header — no custom config needed
        fetchStats();
        fetchSalesChart();
        fetchOrderStatus();
        fetchTopProducts();
        fetchRecentOrders();
        fetchRevenueByCategory();
    }, []);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const res = await axios.get("/api/dashboard/stats");
            if (res.data.success) setStats(res.data.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Failed to load statistics");
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchSalesChart = async () => {
        try {
            setLoadingSales(true);
            const res = await axios.get("/api/dashboard/sales-chart");
            if (res.data.success) setSalesChart(res.data.data);
        } catch (error) {
            console.error("Error fetching sales chart:", error);
        } finally {
            setLoadingSales(false);
        }
    };

    const fetchOrderStatus = async () => {
        try {
            setLoadingStatus(true);
            const res = await axios.get("/api/dashboard/order-status-chart");
            if (res.data.success) setOrderStatusChart(res.data.data);
        } catch (error) {
            console.error("Error fetching order status:", error);
        } finally {
            setLoadingStatus(false);
        }
    };

    const fetchTopProducts = async () => {
        try {
            setLoadingProducts(true);
            const res = await axios.get("/api/dashboard/top-products?limit=5");
            if (res.data.success) setTopProducts(res.data.data);
        } catch (error) {
            console.error("Error fetching top products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            setLoadingOrders(true);
            const res = await axios.get("/api/dashboard/recent-orders?limit=5");
            if (res.data.success) setRecentOrders(res.data.data);
        } catch (error) {
            console.error("Error fetching recent orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchRevenueByCategory = async () => {
        try {
            setLoadingCategory(true);
            const res = await axios.get("/api/dashboard/revenue-by-category");
            if (res.data.success) setRevenueByCategory(res.data.data);
        } catch (error) {
            console.error("Error fetching revenue by category:", error);
        } finally {
            setLoadingCategory(false);
        }
    };

    // Sales Chart Options
    const salesChartOptions = {
        chart: {
            height: 350,
            type: "area",
            toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        xaxis: {
            categories: salesChart.map(d => new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
        },
        yaxis: [{
            title: { text: "Sales (A$)" },
        }],
        colors: ["#405189"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.1,
            },
        },
        tooltip: {
            y: {
                formatter: (val) => "A$" + val.toFixed(2),
            },
        },
    };

    const salesChartSeries = [{
        name: "Sales",
        data: salesChart.map(d => d.sales),
    }];

    // Order Status Chart
    const orderStatusChartOptions = {
        chart: { type: "donut", height: 300 },
        labels: orderStatusChart.map(d => d.status),
        colors: ["#f06548", "#f7b84b", "#0ab39c", "#405189", "#299cdb"],
        legend: { position: "bottom" },
        plotOptions: {
            pie: {
                donut: {
                    size: "70%",
                },
            },
        },
    };

    const orderStatusChartSeries = orderStatusChart.map(d => d.count);

    // Revenue by Category Chart
    const categoryChartOptions = {
        chart: {
            type: "bar",
            height: 350,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: revenueByCategory.map(d => d.category),
        },
        colors: ["#405189"],
        tooltip: {
            y: {
                formatter: (val) => "A$" + val.toFixed(2),
            },
        },
    };

    const categoryChartSeries = [{
        name: "Revenue",
        data: revenueByCategory.map(d => d.revenue),
    }];

    const getStatusBadgeColor = (status) => {
        const statusColors = {
            PENDING: "warning",
            CONFIRMED: "info",
            PROCESSING: "primary",
            DISPATCHED: "secondary",
            DELIVERED: "success",
            CANCELLED: "danger",
        };
        return statusColors[status] || "secondary";
    };

    const getPaymentStatusBadgeColor = (status) => {
        const statusColors = {
            PENDING: "warning",
            PAID: "success",
            FAILED: "danger",
            REFUNDED: "secondary",
        };
        return statusColors[status] || "secondary";
    };

    document.title = `Dashboard`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Dashboard" pageTitle="Dashboard" />

                    {/* Welcome Section */}
                    <Row>
                        <Col xl={12}>
                            <Card className="bg-primary-subtle">
                                <CardBody>
                                    <Row className="align-items-center">
                                        <Col lg={8}>
                                            <h4 className="text-primary mb-2">{getGreeting()}!</h4>
                                            <h2 className="mb-3">{adminData?.companyName || adminData?.employeeName}</h2>
                                            <p className="text-muted mb-0">
                                                Here's what's happening with your store today.
                                            </p>
                                        </Col>
                                        <Col lg={4} className="text-end">
                                            <i className="ri-dashboard-line text-primary" style={{ fontSize: "5rem", opacity: 0.3 }}></i>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* KPI Cards */}
                    <Row>
                        {/* Total Revenue */}
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Total Revenue</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className={`fs-14 mb-0 ${stats?.revenue?.growth >= 0 ? 'text-success' : 'text-danger'}`}>
                                                <i className={`ri-arrow-${stats?.revenue?.growth >= 0 ? 'up' : 'down'}-line fs-13 align-middle`}></i>
                                                {" "}{Math.abs(stats?.revenue?.growth || 0).toFixed(1)}%
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                A${(stats?.revenue?.total || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </h4>
                                            <span className="badge bg-warning-subtle text-warning mb-0">
                                                <i className="ri-arrow-down-line align-middle"></i> This Month: A${(stats?.revenue?.thisMonth || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-pound text-white"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Total Orders */}
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Total Orders</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats?.orders?.total || 0}
                                            </h4>
                                            <span className="badge bg-info-subtle text-info mb-0">
                                                <i className="ri-add-line align-middle"></i> {stats?.orders?.recent || 0} this week
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-shopping-bag text-white"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Total Customers */}
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Total Customers</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats?.users?.total || 0}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success mb-0">
                                                <i className="ri-user-add-line align-middle"></i> {stats?.users?.recent || 0} new this week
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-user-circle text-white"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Total Products */}
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Total Products</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats?.products?.total || 0}
                                            </h4>
                                            <span className="badge bg-primary-subtle text-primary mb-0">
                                                <i className="ri-check-line align-middle"></i> {stats?.products?.active || 0} active
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-package text-white"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Order Status Cards */}
                    <Row>
                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Pending Orders</p>
                                            <h2 className="mt-4 ff-secondary fw-semibold">
                                                {stats?.orders?.pending || 0}
                                            </h2>
                                        </div>
                                        <div>
                                            <div className="avatar-sm flex-shrink-0">
                                                <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                    <i className="ri-time-line text-white"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Processing</p>
                                            <h2 className="mt-4 ff-secondary fw-semibold">
                                                {stats?.orders?.processing || 0}
                                            </h2>
                                        </div>
                                        <div>
                                            <div className="avatar-sm flex-shrink-0">
                                                <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                    <i className="ri-loader-4-line text-white"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Delivered</p>
                                            <h2 className="mt-4 ff-secondary fw-semibold">
                                                {stats?.orders?.delivered || 0}
                                            </h2>
                                        </div>
                                        <div>
                                            <div className="avatar-sm flex-shrink-0">
                                                <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                    <i className="ri-check-double-line text-white"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate">
                                <CardBody>
                                    {loadingStats ? (
                                        <div className="text-center py-4">
                                            <Spinner size="sm" color="primary" />
                                        </div>
                                    ) : (
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <p className="fw-medium text-muted mb-0">Low Stock Items</p>
                                                <h2 className="mt-4 ff-secondary fw-semibold">
                                                    {stats?.products?.lowStock || 0}
                                                </h2>
                                            </div>
                                            <div>
                                                <div className="avatar-sm flex-shrink-0">
                                                    <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                                                        <i className="ri-alert-line text-white"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Charts Row */}
                    <Row>
                        {/* Sales Chart */}
                        <Col xl={8}>
                            <Card>
                                <CardHeader className="border-0 align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Sales Overview (Last 30 Days)</h4>
                                </CardHeader>
                                <CardBody className="p-0 pb-2">
                                    {salesChart.length > 0 ? (
                                        <ReactApexChart
                                            options={salesChartOptions}
                                            series={salesChartSeries}
                                            type="area"
                                            height={350}
                                            className="apex-charts"
                                        />
                                    ) : (
                                        <div className="text-center py-5">
                                            <p className="text-muted">No sales data available</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Order Status Distribution */}
                        <Col xl={4}>
                            <Card>
                                <CardHeader className="border-0">
                                    <h4 className="card-title mb-0">Order Status Distribution</h4>
                                </CardHeader>
                                <CardBody>
                                    {loadingStatus ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2">Loading order status...</p>
                                        </div>
                                    ) : orderStatusChart.length > 0 ? (
                                        <ReactApexChart
                                            options={orderStatusChartOptions}
                                            series={orderStatusChartSeries}
                                            type="donut"
                                            height={300}
                                            className="apex-charts"
                                        />
                                    ) : (
                                        <div className="text-center py-5">
                                            <p className="text-muted">No order data available</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Revenue by Category & Top Products */}
                    <Row>
                        {/* Revenue by Category */}
                        <Col xl={6}>
                            <Card>
                                <CardHeader className="border-0">
                                    <h4 className="card-title mb-0">Revenue by Category</h4>
                                </CardHeader>
                                <CardBody>
                                    {loadingCategory ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2">Loading category data...</p>
                                        </div>
                                    ) : revenueByCategory.length > 0 ? (
                                        <ReactApexChart
                                            options={categoryChartOptions}
                                            series={categoryChartSeries}
                                            type="bar"
                                            height={350}
                                            className="apex-charts"
                                        />
                                    ) : (
                                        <div className="text-center py-5">
                                            <p className="text-muted">No category data available</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Top Selling Products */}
                        <Col xl={6}>
                            <Card>
                                <CardHeader className="border-0">
                                    <h4 className="card-title mb-0">Top Selling Products</h4>
                                </CardHeader>
                                <CardBody>
                                    {loadingProducts ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2">Loading top products...</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive table-card">
                                            <Table className="table-borderless table-centered align-middle table-nowrap mb-0">
                                                <thead className="text-muted table-light">
                                                    <tr>
                                                        <th scope="col">Product</th>
                                                        <th scope="col">Brand</th>
                                                        <th scope="col">Qty Sold</th>
                                                        <th scope="col">Orders</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topProducts.length > 0 ? (
                                                        topProducts.map((product, idx) => (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-grow-1">
                                                                            <h6 className="mb-1">{product.productName}</h6>
                                                                            <p className="text-muted mb-0 fs-12">{product.productCode}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>{product.brandName}</td>
                                                                <td>
                                                                    <span className="badge bg-primary-subtle text-primary">
                                                                        {product.quantity}
                                                                    </span>
                                                                </td>
                                                                <td>{product.orderCount}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center text-muted">
                                                                No product data available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Orders */}
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardHeader className="border-0">
                                    <h4 className="card-title mb-0">Recent Orders</h4>
                                </CardHeader>
                                <CardBody>
                                    {loadingOrders ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2">Loading recent orders...</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive table-card">
                                            <Table className="table-borderless table-centered align-middle table-nowrap mb-0">
                                                <thead className="text-muted table-light">
                                                    <tr>
                                                        <th scope="col">Order ID</th>
                                                        <th scope="col">Customer</th>
                                                        <th scope="col">Date</th>
                                                        <th scope="col">Amount</th>
                                                        <th scope="col">Payment Status</th>
                                                        <th scope="col">Order Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentOrders.length > 0 ? (
                                                        recentOrders.map((order, idx) => (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <span className="fw-medium">{order.orderNumber}</span>
                                                                </td>
                                                                <td>{order.customerName}</td>
                                                                <td>{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                                                <td>A${order.totalAmount.toFixed(2)}</td>
                                                                <td>
                                                                    <Badge color={getPaymentStatusBadgeColor(order.paymentStatus)} className="badge-soft-">
                                                                        {order.paymentStatus}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge color={getStatusBadgeColor(order.status)} className="badge-soft-">
                                                                        {order.status}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="6" className="text-center text-muted">
                                                                No recent orders
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
