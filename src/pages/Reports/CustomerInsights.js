import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import axios from "axios";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import ExportButtons from "../../Components/Common/ExportButtons";

// Currency exported as a NUMBER so it stays summable in Excel, but
// rounded to cents — raw floats otherwise land in the sheet as
// 2173.7870000000003.
const money = (n) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return n;
  // Nudge by EPSILON before rounding: Math.round(1.005 * 100) is 100, not 101,
  // because 1.005 has no exact binary representation. Rounding the magnitude
  // and reapplying the sign keeps -1.005 at -1.01 rather than -1.
  //
  // Do NOT replace this with decimal-string shifting. That reads tidier but
  // returns NaN for any value JavaScript stringifies in exponent form — 1e-7
  // becomes the unparseable "1e-7e2", and 1e21 likewise.
  const rounded = Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100;
  return n < 0 ? -rounded : rounded;
};

const CustomerInsights = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    customers: [],
    totalUsers: 0,
    repeatUsers: 0,
    orderingUsers: 0,
    repeatRate: 0,
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/admin/reports/customers", authHeaders);
        if (res.data.success) setReportData(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fmt = (n) => `$${(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-AU") : "—";

  const columns = [
    { name: "Customer", selector: (r) => r.name, grow: 2 },
    { name: "Email", selector: (r) => r.email, grow: 2 },
    { name: "Orders", selector: (r) => r.orderCount, sortable: true, width: "100px" },
    { name: "Total Spent", selector: (r) => r.totalSpent, cell: (r) => fmt(r.totalSpent), sortable: true, width: "140px" },
    { name: "Avg Order", selector: (r) => r.avgOrderValue, cell: (r) => fmt(r.avgOrderValue), sortable: true, width: "130px" },
    { name: "First Order", selector: (r) => r.firstOrder, cell: (r) => fmtDate(r.firstOrder), width: "120px" },
    { name: "Last Order", selector: (r) => r.lastOrder, cell: (r) => fmtDate(r.lastOrder), width: "120px" },
  ];

  // Export rows carry only the columns the table renders, using the same
  // headers, so the exported sheet matches the table one-for-one.
  const exportColumns = [
    { header: "Customer", key: "customer" },
    { header: "Email", key: "email" },
    { header: "Orders", key: "orders" },
    { header: "Total Spent", key: "totalSpent" },
    { header: "Avg Order", key: "avgOrder" },
    { header: "First Order", key: "firstOrder" },
    { header: "Last Order", key: "lastOrder" },
  ];

  const exportData = (reportData.customers || []).map((r) => ({
    customer: r.name ?? "",
    email: r.email,
    orders: r.orderCount,
    totalSpent: money(r.totalSpent),
    avgOrder: money(r.avgOrderValue),
    firstOrder: fmtDate(r.firstOrder),
    lastOrder: fmtDate(r.lastOrder),
  }));

  document.title = "Customer Insights | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Customer Insights" pageTitle="Reports" />

          <Row className="mb-3">
            <Col md={3}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Users</p>
                  <h4 className="mb-0">{reportData.totalUsers}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Users with Orders</p>
                  <h4 className="mb-0">{reportData.orderingUsers}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Repeat Customers</p>
                  <h4 className="mb-0">{reportData.repeatUsers}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Repeat Rate</p>
                  <h4 className="mb-0">{reportData.repeatRate}%</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <LoadingOverlay isLoading={loading}>
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">Top Customers by Spend</h5>
                  <ExportButtons
                    data={exportData}
                    columns={exportColumns}
                    fileName="customer-insights"
                        disabled={loading}
                  />
                </div>
              </CardHeader>
              <CardBody>
                <DataTable columns={columns} data={reportData.customers}
                  customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
              </CardBody>
            </Card>
          </LoadingOverlay>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CustomerInsights;
