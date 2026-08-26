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
  // Round the magnitude through toPrecision(15), then reapply the sign.
  //
  // Two earlier attempts were wrong and are worth naming so they are not
  // reinstated. Decimal-string shifting (`${n}e2`) returns NaN for anything
  // JavaScript prints in exponent form — 1e-7 becomes the unparseable
  // "1e-7e2". Nudging by Number.EPSILON fixes the famous 1.005 case but is a
  // heuristic, not a rule: EPSILON is the gap around 1, so at larger
  // magnitudes it does not move the value at all and money(10.075) came back
  // 10.07, money(8.165) came back 8.16.
  //
  // toPrecision(15) drops the binary representation error below the rounding
  // decision without inventing precision, and handles exponent forms.
  // Verified: 1.005→1.01, 10.075→10.08, 8.165→8.17, 2.675→2.68, -1.005→-1.01,
  // 1e-7→0, 1e21 finite.
  const sign = n < 0 ? -1 : 1;
  const rounded = Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100;
  return sign * rounded;
};

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

  // Export rows carry only the columns the table renders, using the same
  // headers, so the exported sheet matches the table one-for-one. Share is a
  // derived column, so it is computed here exactly as the cell renders it.
  const exportColumns = [
    { header: "Supplier", key: "supplier" },
    { header: "Line Items", key: "lineItems" },
    { header: "Total Qty", key: "totalQty" },
    { header: "Revenue", key: "revenue" },
    { header: "Avg Item Value", key: "avgItemValue" },
    { header: "Share", key: "share" },
  ];

  const exportData = suppliers.map((r) => ({
    supplier: r._id || "Unknown",
    lineItems: r.totalOrders,
    totalQty: r.totalQty,
    revenue: money(r.totalRevenue),
    avgItemValue: money(r.avgItemValue),
    share: totalRevenue > 0 ? `${((r.totalRevenue / totalRevenue) * 100).toFixed(1)}%` : "—",
  }));

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
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">Supplier Breakdown</h5>
                  <ExportButtons
                    data={exportData}
                    columns={exportColumns}
                    fileName="supplier-performance"
                        disabled={loading}
                  />
                </div>
              </CardHeader>
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
