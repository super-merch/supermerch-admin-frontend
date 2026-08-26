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

const MarginAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    marginBySupplier: [],
    marginByProduct: [],
    overall: { totalRevenue: 0, totalOrders: 0 },
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/admin/reports/margins", authHeaders);
        if (res.data.success) setReportData(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fmt = (n) => `$${(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const supplierColumns = [
    { name: "Supplier", selector: (r) => r._id || "Unknown", grow: 2, sortable: true },
    { name: "Revenue", selector: (r) => r.totalRevenue, cell: (r) => fmt(r.totalRevenue), sortable: true, width: "160px" },
    { name: "Total Qty", selector: (r) => r.totalQty, sortable: true, width: "120px" },
    { name: "Avg Unit Price", selector: (r) => r.avgUnitPrice, cell: (r) => fmt(r.avgUnitPrice), sortable: true, width: "150px" },
  ];

  const productColumns = [
    { name: "Product", selector: (r) => r._id, grow: 3 },
    { name: "Supplier", selector: (r) => r.supplierName || "Unknown", grow: 2 },
    { name: "Revenue", selector: (r) => r.totalRevenue, cell: (r) => fmt(r.totalRevenue), sortable: true, width: "150px" },
    { name: "Qty", selector: (r) => r.totalQty, sortable: true, width: "100px" },
    { name: "Avg Unit Price", selector: (r) => r.avgUnitPrice, cell: (r) => fmt(r.avgUnitPrice), sortable: true, width: "150px" },
  ];

  // Export rows carry only the columns the matching table renders, using the
  // same headers, so each exported sheet matches its table one-for-one.
  const supplierExportColumns = [
    { header: "Supplier", key: "supplier" },
    { header: "Revenue", key: "revenue" },
    { header: "Total Qty", key: "totalQty" },
    { header: "Avg Unit Price", key: "avgUnitPrice" },
  ];

  const supplierExportData = (reportData.marginBySupplier || []).map((r) => ({
    supplier: r._id || "Unknown",
    revenue: money(r.totalRevenue),
    totalQty: r.totalQty,
    avgUnitPrice: money(r.avgUnitPrice),
  }));

  const productExportColumns = [
    { header: "Product", key: "product" },
    { header: "Supplier", key: "supplier" },
    { header: "Revenue", key: "revenue" },
    { header: "Qty", key: "qty" },
    { header: "Avg Unit Price", key: "avgUnitPrice" },
  ];

  const productExportData = (reportData.marginByProduct || []).map((r) => ({
    product: r._id ?? "",
    supplier: r.supplierName || "Unknown",
    revenue: money(r.totalRevenue),
    qty: r.totalQty,
    avgUnitPrice: money(r.avgUnitPrice),
  }));

  document.title = "Margin Analysis | SuperMerch Admin";

  const { overall } = reportData;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Margin Analysis" pageTitle="Reports" />

          <Row className="mb-3">
            <Col md={6}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h4 className="mb-0">{fmt(overall.totalRevenue)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h4 className="mb-0">{overall.totalOrders}</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <LoadingOverlay isLoading={loading}>
            <Row>
              <Col lg={12}>
                <Card>
                  <CardHeader>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-0">Margin by Supplier</h5>
                      <ExportButtons
                        data={supplierExportData}
                        columns={supplierExportColumns}
                        fileName="margin-analysis-by-supplier"
                        disabled={loading}
                      />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataTable columns={supplierColumns} data={reportData.marginBySupplier}
                      customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col lg={12}>
                <Card>
                  <CardHeader>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-0">Top Products by Revenue</h5>
                      <ExportButtons
                        data={productExportData}
                        columns={productExportColumns}
                        fileName="margin-analysis-top-products"
                        disabled={loading}
                      />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataTable columns={productColumns} data={reportData.marginByProduct}
                      customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </LoadingOverlay>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MarginAnalysis;
