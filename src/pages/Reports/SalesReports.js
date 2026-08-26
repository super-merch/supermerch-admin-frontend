import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Input,
  Label,
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

const SalesReports = () => {
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState({
    timeSeries: [],
    topProducts: [],
    revenueBySupplier: [],
    summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // Guards against exporting data for a filter the user has moved on from.
  //
  // Three ways that could happen: clicking Export while a request is in flight;
  // a slow earlier response landing after a faster later one; and — the subtle
  // one — a request FAILING, which leaves the previous filter's rows on screen
  // while the controls show the new filter, with exports re-enabled.
  //
  // So a ticket orders the responses, and appliedFilter records which filter
  // the data on screen actually belongs to. Export is offered only when that
  // matches the current controls.
  const requestTicket = useRef(0);
  const filterKey = `${groupBy}|${dateFrom}|${dateTo}`;
  const [appliedFilter, setAppliedFilter] = useState(null);

  const fetchData = useCallback(async () => {
    const ticket = ++requestTicket.current;
    const key = `${groupBy}|${dateFrom}|${dateTo}`;
    setLoading(true);
    try {
      const params = new URLSearchParams({ groupBy });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await axios.get(`/api/admin/reports/sales?${params}`, authHeaders);
      if (ticket !== requestTicket.current) return; // superseded
      if (res.data.success) {
        setReportData(res.data.data);
        setAppliedFilter(key);
      } else {
        // Resolved but unsuccessful — the rows on screen are still the old
        // filter's, so make sure export stays closed.
        setAppliedFilter(null);
      }
    } catch (err) {
      console.error(err);
      if (ticket === requestTicket.current) setAppliedFilter(null);
    }
    finally {
      if (ticket === requestTicket.current) setLoading(false);
    }
  }, [groupBy, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n) => `$${(n || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const timeSeriesColumns = [
    { name: "Period", selector: (r) => r._id, sortable: true, grow: 2 },
    { name: "Orders", selector: (r) => r.orders, sortable: true, width: "120px" },
    { name: "Revenue", selector: (r) => r.revenue, cell: (r) => fmt(r.revenue), sortable: true, width: "160px" },
  ];

  const topProductColumns = [
    { name: "Product", selector: (r) => r._id, grow: 3 },
    { name: "Qty Sold", selector: (r) => r.totalQty, sortable: true, width: "120px" },
    { name: "Revenue", selector: (r) => r.totalRevenue, cell: (r) => fmt(r.totalRevenue), sortable: true, width: "160px" },
  ];

  const supplierColumns = [
    { name: "Supplier", selector: (r) => r._id || "Unknown", grow: 2 },
    { name: "Line Items", selector: (r) => r.orders, sortable: true, width: "120px" },
    { name: "Revenue", selector: (r) => r.revenue, cell: (r) => fmt(r.revenue), sortable: true, width: "160px" },
  ];

  // Export rows are built from reportData, which is re-fetched whenever the
  // date range or Group By changes — so every export reflects the filters
  // currently applied on screen. Each row carries only the columns the matching
  // table renders, so the exported sheet matches the table
  // column for column. NOT row for row after the user sorts: the table sorts in
  // the browser while the export maps the original array, so a sorted table and
  // its export can list the same rows in a different order. Values and totals
  // are identical either way. Carrying the sort into the export is on the
  // backlog; the claim is narrowed here rather than left overstated.
  const timeSeriesExportColumns = [
    { header: "Period", key: "period" },
    { header: "Orders", key: "orders" },
    { header: "Revenue", key: "revenue" },
  ];

  const timeSeriesExportData = (reportData.timeSeries || []).map((r) => ({
    period: r._id,
    orders: r.orders,
    revenue: r.revenue,
  }));

  const topProductExportColumns = [
    { header: "Product", key: "product" },
    { header: "Qty Sold", key: "qtySold" },
    { header: "Revenue", key: "revenue" },
  ];

  const topProductExportData = (reportData.topProducts || []).map((r) => ({
    product: r._id ?? "",
    qtySold: r.totalQty,
    revenue: r.totalRevenue,
  }));

  const supplierExportColumns = [
    { header: "Supplier", key: "supplier" },
    { header: "Line Items", key: "lineItems" },
    { header: "Revenue", key: "revenue" },
  ];

  const supplierExportData = (reportData.revenueBySupplier || []).map((r) => ({
    supplier: r._id || "Unknown",
    lineItems: r.orders,
    revenue: r.revenue,
  }));

  document.title = "Sales Reports | SuperMerch Admin";

  const { summary } = reportData;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Sales Reports" pageTitle="Reports" />

          {/* Filters */}
          <Row className="mb-3">
            <Col md={3}>
              <Label className="form-label">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} bsSize="sm" />
            </Col>
            <Col md={3}>
              <Label className="form-label">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} bsSize="sm" />
            </Col>
            <Col md={3}>
              <Label className="form-label">Group By</Label>
              <Input type="select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} bsSize="sm">
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </Input>
            </Col>
          </Row>

          {/* Summary Cards */}
          <Row className="mb-3">
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h4 className="mb-0">{fmt(summary.totalRevenue)}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h4 className="mb-0">{summary.totalOrders}</h4>
                </CardBody>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="card-animate">
                <CardBody>
                  <p className="text-muted mb-1">Avg Order Value</p>
                  <h4 className="mb-0">{fmt(summary.avgOrderValue)}</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <LoadingOverlay isLoading={loading}>
            {/* Time Series */}
            <Row>
              <Col lg={12}>
                <Card>
                  <CardHeader>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-0">Revenue Over Time</h5>
                      <ExportButtons
                        data={timeSeriesExportData}
                        columns={timeSeriesExportColumns}
                        fileName="sales-report-revenue-over-time"
                        disabled={loading || appliedFilter !== filterKey}
                      />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataTable columns={timeSeriesColumns} data={reportData.timeSeries}
                      customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Top Products & Revenue by Supplier */}
            <Row>
              <Col lg={6}>
                <Card>
                  <CardHeader>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-0">Top Products</h5>
                      <ExportButtons
                        data={topProductExportData}
                        columns={topProductExportColumns}
                        fileName="sales-report-top-products"
                        disabled={loading || appliedFilter !== filterKey}
                      />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataTable columns={topProductColumns} data={reportData.topProducts}
                      customStyles={tableCustomStyles} highlightOnHover striped responsive pagination />
                  </CardBody>
                </Card>
              </Col>
              <Col lg={6}>
                <Card>
                  <CardHeader>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-0">Revenue by Supplier</h5>
                      <ExportButtons
                        data={supplierExportData}
                        columns={supplierExportColumns}
                        fileName="sales-report-revenue-by-supplier"
                        disabled={loading || appliedFilter !== filterKey}
                      />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <DataTable columns={supplierColumns} data={reportData.revenueBySupplier}
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

export default SalesReports;
