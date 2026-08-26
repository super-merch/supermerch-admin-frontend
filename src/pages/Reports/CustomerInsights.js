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

const CustomerInsights = () => {
  const [loading, setLoading] = useState(false);
  // Export stays shut until a request has actually SUCCEEDED, not merely
  // finished. These pages set state only inside `if (res.data.success)`, so a
  // failed or unsuccessful request left the initial empty array in place while
  // `finally` cleared the loading flag - and the export buttons came alive over
  // it. The accountant would then download a report with headings and no rows,
  // which is indistinguishable from a legitimate "no records in this period".
  // Reporting nothing as if it were something is worse than an error.
  const [loaded, setLoaded] = useState(false);
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
        if (res.data.success) {
          setReportData(res.data.data);
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
  // headers, so the exported sheet matches the table
  // column for column. NOT row for row after the user sorts: the table sorts in
  // the browser while the export maps the original array, so a sorted table and
  // its export can list the same rows in a different order. Values and totals
  // are identical either way. Carrying the sort into the export is on the
  // backlog; the claim is narrowed here rather than left overstated.
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
    totalSpent: r.totalSpent,
    avgOrder: r.avgOrderValue,
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
                        disabled={loading || !loaded}
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
