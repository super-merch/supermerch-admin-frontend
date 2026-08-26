import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Input,
  Label,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import FormsHeader from "../../Components/Common/FormsHeader";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import { getUserQuotes } from "../../functions/Quotation/quotationFunc";

const UserQuotes = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState(true);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [data, setData] = useState([]);

  // View modal states
  const [viewModal, setViewModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Customer Name",
      selector: (row) => row.name,
      cell: (row) => <p className="text-wrap mb-0">{row.name || "N/A"}</p>,
      sortable: true,
    },
    {
      name: "Contact",
      cell: (row) => (
        <div>
          <small className="d-block text-muted">{row.email}</small>
          <small className="d-block">{row.phone}</small>
        </div>
      ),
      sortable: false,
      minWidth: "200px",
    },
    {
      name: "Product",
      selector: (row) => row.product,
      cell: (row) => <p className="text-wrap mb-0">{row.product || "N/A"}</p>,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row) => row.quantity,
      sortable: true,
      width: "100px",
    },
    {
      name: "Delivery",
      selector: (row) => row.delivery,
      cell: (row) => <span>{row.delivery || "N/A"}</span>,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      width: "120px",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-info"
            onClick={() => handleView(row)}
          >
            View
          </button>
        </div>
      ),
      sortable: false,
      width: "100px",
    },
  ];

  const fetchUserQuotes = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo || 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await getUserQuotes(params);
      if (response.data.success) {
        setTotalRows(response.data.pagination?.totalCount || 0);
        setData(response.data.data || []);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching user quotes:", error);
      toast.error("Failed to fetch user quotes");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchUserQuotes();
  }, [fetchUserQuotes]);

  const handleView = (quote) => {
    setSelectedQuote(quote);
    setViewModal(true);
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  /**
   * A quote on a product the supplier gives no price for. The backend stores
   * price and totalPrice as null and sets this flag (backend #88); before
   * that it stored 0, so the null check still matters for older records.
   */
  const isOnApplication = (quote) =>
    quote?.isPriceOnApplication === true ||
    quote?.price === null ||
    quote?.price === undefined;

  /**
   * A quote can have a real unit price and still no total — the customer
   * submitted without one and #88 stores null rather than inventing a figure.
   * `?? 0` turned that straight back into a confident $0, which is the same
   * lie one field over. The unit price and quantity are both on the record,
   * so staff can work it out.
   */
  const hasTotal = (quote) =>
    quote?.totalPrice !== null && quote?.totalPrice !== undefined;

  const exportColumns = [{header:"Customer",key:"name"},{header:"Email",key:"email"},{header:"Phone",key:"phone"},{header:"Product",key:"product"},{header:"Quantity",key:"quantity"},{header:"Delivery",key:"delivery"},{header:"Price on application",key:"priceOnApplicationLabel"},{header:"Price",key:"price"},{header:"Total",key:"totalPrice"},{header:"Comment",key:"comment"}];
  /**
   * Excel sums a Price column. An on-application quote has no price, so it
   * must export as blank with the reason in its own column, never as 0 —
   * otherwise the export reads as a real order worth nothing.
   */
  const withOnApplicationColumn = (rows) =>
    (rows || []).map((row) =>
      isOnApplication(row)
        ? { ...row, priceOnApplicationLabel: "Yes", price: "", totalPrice: "" }
        : { ...row, priceOnApplicationLabel: "" },
    );

  const fetchAllForExport = async () => { try { const r = await getUserQuotes({page:1,limit:10000}); return withOnApplicationColumn(r.data?.data||[]); } catch(e){return withOnApplicationColumn(data);} };

  document.title = `User Quote Requests | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Quotation" title="User Quote Requests" pageTitle="Quotation" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="User Quote Requests"
                    filter={filter}
                    handleFilter={handleFilter}
                    setQuery={setQuery}
                    showForm={false}
                    updateForm={false}
                    setShowForm={() => {}}
                    setUpdateForm={() => {}}
                    initialState={{}}
                    setValues={() => {}}
                    showAddButton={false}
                  />
                  <ExportButtons data={withOnApplicationColumn(data)} columns={exportColumns} fileName="user_quotes" fetchAll={fetchAllForExport} />
                </CardHeader>

                <CardBody>
                  <div className="table-responsive table-card mt-1 mb-1 text-right">
                    <DataTable
                      customStyles={tableCustomStyles}
                      columns={columns}
                      data={data}
                      progressPending={loading}
                      sortServer
                      onSort={(column, sortDirection) =>
                        handleSort(column, sortDirection)
                      }
                      pagination
                      paginationServer
                      paginationTotalRows={totalRows}
                      paginationPerPage={100}
                      paginationRowsPerPageOptions={[
                        50, 100, 200, 300, totalRows,
                      ]}
                      onChangeRowsPerPage={handlePerRowsChange}
                      onChangePage={handlePageChange}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* View Quote Details Modal */}
      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
        <ModalHeader toggle={() => setViewModal(false)}>
          Quote Request Details
        </ModalHeader>
        <ModalBody>
          {selectedQuote && (
            <div>
              {/* Customer Information */}
              <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Customer Information</h6>
              <Row className="mb-3">
                <Col md={4}>
                  <Label className="text-muted small mb-1">Name</Label>
                  <p className="fw-medium mb-0">{selectedQuote.name || "N/A"}</p>
                </Col>
                <Col md={4}>
                  <Label className="text-muted small mb-1">Email</Label>
                  <p className="fw-medium mb-0">{selectedQuote.email || "N/A"}</p>
                </Col>
                <Col md={4}>
                  <Label className="text-muted small mb-1">Phone</Label>
                  <p className="fw-medium mb-0">{selectedQuote.phone || "N/A"}</p>
                </Col>
              </Row>

              {/* Delivery & Comment */}
              <Row className="mb-3">
                <Col md={4}>
                  <Label className="text-muted small mb-1">Delivery</Label>
                  <p className="fw-medium mb-0">{selectedQuote.delivery || "N/A"}</p>
                </Col>
                <Col md={8}>
                  <Label className="text-muted small mb-1">Comment</Label>
                  <p className="fw-medium mb-0">{selectedQuote.comment || "N/A"}</p>
                </Col>
              </Row>

              {/* Product Details */}
              <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 mt-4">Product Details</h6>
              <Row className="mb-3">
                <Col md={6}>
                  <Label className="text-muted small mb-1">Product</Label>
                  <p className="fw-medium mb-0">{selectedQuote.product || "N/A"}</p>
                </Col>
                <Col md={6}>
                  <Label className="text-muted small mb-1">Product ID</Label>
                  <p className="fw-medium mb-0">{selectedQuote.productId || "N/A"}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Label className="text-muted small mb-1">Description</Label>
                  <p className="fw-medium mb-0" style={{ whiteSpace: "pre-wrap" }}>{selectedQuote.description || "N/A"}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <Label className="text-muted small mb-1">Quantity</Label>
                  <p className="fw-medium mb-0">{selectedQuote.quantity ?? "N/A"}</p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Unit Price</Label>
                  <p className="fw-medium mb-0">
                    {isOnApplication(selectedQuote)
                      ? "On application"
                      : `$${selectedQuote.price ?? "N/A"}`}
                  </p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Color</Label>
                  <p className="fw-medium mb-0">{selectedQuote.color && selectedQuote.color !== "None" ? selectedQuote.color : "N/A"}</p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Size</Label>
                  <p className="fw-medium mb-0">{selectedQuote.size && selectedQuote.size !== "None" ? selectedQuote.size : "N/A"}</p>
                </Col>
              </Row>

              {/* Pricing & Print Details */}
              <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 mt-4">Pricing & Print Details</h6>
              <Row className="mb-3">
                <Col md={3}>
                  <Label className="text-muted small mb-1">Print Method</Label>
                  <p className="fw-medium mb-0">{selectedQuote.printMethod && selectedQuote.printMethod !== "None" ? selectedQuote.printMethod : "N/A"}</p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Logo Color</Label>
                  <p className="fw-medium mb-0">{selectedQuote.logoColor && selectedQuote.logoColor !== "None" ? selectedQuote.logoColor : "N/A"}</p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Setup Fee</Label>
                  <p className="fw-medium mb-0">${selectedQuote.setupFee ?? 0}</p>
                </Col>
                <Col md={3}>
                  <Label className="text-muted small mb-1">Freight Fee</Label>
                  <p className="fw-medium mb-0">${selectedQuote.freightFee ?? 0}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <Label className="text-muted small mb-1">Total Price</Label>
                  <p className="fw-bold text-success fs-5 mb-0">
                    {isOnApplication(selectedQuote)
                      ? "On application"
                      : hasTotal(selectedQuote)
                        ? `$${selectedQuote.totalPrice}`
                        : "Not provided"}
                  </p>
                </Col>
                <Col md={4}>
                  <Label className="text-muted small mb-1">Date</Label>
                  <p className="fw-medium mb-0">{new Date(selectedQuote.createdAt).toLocaleDateString()}</p>
                </Col>
              </Row>

              {/* File Attachment */}
              {selectedQuote.file && selectedQuote.file !== "None" && (
                <>
                  <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 mt-4">Attached File</h6>
                  <div className="text-center">
                    <img
                      src={selectedQuote.file}
                      alt="Quote attachment"
                      className="img-fluid rounded border"
                      style={{ maxHeight: "300px", objectFit: "contain" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div className="mt-2">
                      <a href={selectedQuote.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        View Full Image
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default UserQuotes;
