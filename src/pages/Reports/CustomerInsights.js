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
              <CardHeader><h5 className="card-title mb-0">Top Customers by Spend</h5></CardHeader>
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
