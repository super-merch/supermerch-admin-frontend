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

const SupplierPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const authHeaders = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      try {
        const res = await axios.get("/api/admin/reports/suppliers", authHeaders);
        if (res.data.success) setSuppliers(res.data.data.suppliers || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fmt = (n) => `$${(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalRevenue = suppliers.reduce((s, r) => s + (r.totalRevenue || 0), 0);
  const totalOrders = suppliers.reduce((s, r) => s + (r.totalOrders || 0), 0);
  const totalQty = suppliers.reduce((s, r) => s + (r.totalQty || 0), 0);

  const columns = [
    { name: "Supplier", selector: (r) => r._id || "Unknown", grow: 2, sortable: true },
    { name: "Line Items", selector: (r) => r.totalOrders, sortable: true, width: "120px" },
    { name: "Total Qty", selector: (r) => r.totalQty, sortable: true, width: "120px" },
    { name: "Revenue", selector: (r) => r.totalRevenue, cell: (r) => fmt(r.totalRevenue), sortable: true, width: "160px" },
    { name: "Avg Item Value", selector: (r) => r.avgItemValue, cell: (r) => fmt(r.avgItemValue), sortable: true, width: "150px" },
    {
      name: "Share",
      cell: (r) => totalRevenue > 0 ? `${((r.totalRevenue / totalRevenue) * 100).toFixed(1)}%` : "—",
      width: "100px",
    },
  ];

  document.title = "Supplier Performance | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Supplier Performance" pageTitle="Reports" />

          <Row className="mb-3">
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h4 className="mb-0">{fmt(totalRevenue)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Line Items</p>
                  <h4 className="mb-0">{totalOrders.toLocaleString()}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Qty Sold</p>
                  <h4 className="mb-0">{totalQty.toLocaleString()}</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <LoadingOverlay isLoading={loading}>
            <Card>
              <CardHeader><h5 className="card-title mb-0">Supplier Breakdown</h5></CardHeader>
              <CardBody>
                <DataTable columns={columns} data={suppliers}
                  customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
              </CardBody>
            </Card>
          </LoadingOverlay>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SupplierPerformance;
