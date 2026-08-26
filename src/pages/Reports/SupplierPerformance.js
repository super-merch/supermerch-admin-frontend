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
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import ExportButtons from "../../Components/Common/ExportButtons";
// Exported figures are the raw values, not rounded ones.
//
// There used to be a money() helper here - one copy per Reports page - that
// rounded every exported figure to two decimals. Three attempts at it were
// wrong in three different ways (decimal-string shifting returned NaN for
// exponent forms; a Number.EPSILON nudge rounded 10.075 down to 10.07;
// toPrecision(15) still loses a real cent at large magnitudes), which was the
// clue that the helper was the problem rather than its implementation.
//
// Rounding each row before export makes the accountant's spreadsheet disagree
// with the report they exported it from. The summary cards sum the RAW values
// and format once at the end, so two rows of 2173.787 show a total of
// $4,347.57 on screen, while SUM() over two exported 2173.79 cells gives
// $4,347.58. A one-cent difference with no total row to explain it is exactly
// the kind of error nobody catches.
//
// So the values go out untouched and stay summable, and presentation is left
// to presentation: Excel cells carry a #,##0.00 display format, and the PDF
// formats for display because it is a document rather than a data source.

const SupplierPerformance = () => {
  const [loading, setLoading] = useState(false);
  // Export stays shut until a request has actually SUCCEEDED, not merely
  // finished. These pages set state only inside `if (res.data.success)`, so a
  // failed or unsuccessful request left the initial empty array in place while
  // `finally` cleared the loading flag - and the export buttons came alive over
  // it. The accountant would then download a report with headings and no rows,
  // which is indistinguishable from a legitimate "no records in this period".
  // Reporting nothing as if it were something is worse than an error.
  const [loaded, setLoaded] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const authHeaders = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      try {
        const res = await axios.get("/api/admin/reports/suppliers", authHeaders);
        if (res.data.success) {
          setSuppliers(res.data.data.suppliers || []);
          setLoaded(true);
        } else {
          setLoaded(false);
          toast.error(res.data.message || "Could not load this report.");
        }
      } catch (err) {
        console.error(err);
        setLoaded(false);
        toast.error("Could not load this report. Nothing is safe to export.");
      }
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
  // headers, so the exported sheet matches the table
  // column for column. NOT row for row after the user sorts: the table sorts in
  // the browser while the export maps the original array, so a sorted table and
  // its export can list the same rows in a different order. Values and totals
  // are identical either way. Carrying the sort into the export is on the
  // backlog; the claim is narrowed here rather than left overstated. Share is a
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
    revenue: r.totalRevenue,
    avgItemValue: r.avgItemValue,
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
                        disabled={loading || !loaded}
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
