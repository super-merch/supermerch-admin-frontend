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
  Badge,
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

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "warning",
      reviewed: "info",
      approved: "success",
      rejected: "danger",
      completed: "primary",
    };
    return (
      <Badge color={statusColors[status] || "secondary"} className="text-capitalize">
        {status}
      </Badge>
    );
  };

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => <p className="text-wrap">{row.customerName}</p>,
      sortable: true,
    },
    {
      name: "Product",
      selector: (row) => <p className="text-wrap">{row.productName}</p>,
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row) => row.quantity,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => getStatusBadge(row.status),
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-info"
              onClick={() => handleView(row)}
            >
              View
            </button>
          </div>
        );
      },
      sortable: false,
      minWidth: "100px",
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

  const exportColumns = [{header:"Customer",key:"customerName"},{header:"Email",key:"email"},{header:"Phone",key:"phone"},{header:"Product",key:"productName"},{header:"Status",key:"status"}];
  const fetchAllForExport = async () => { try { const r = await getUserQuotes({page:1,limit:10000}); return r.data?.data||[]; } catch(e){return data;} };

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
                  <ExportButtons data={data} columns={exportColumns} fileName="user_quotes" fetchAll={fetchAllForExport} />
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
              <Row className="mb-3">
                <Col md={6}>
                  <Label className="fw-bold">Customer Name</Label>
                  <p>{selectedQuote.customerName || "N/A"}</p>
                </Col>
                <Col md={6}>
                  <Label className="fw-bold">Email</Label>
                  <p>{selectedQuote.email || "N/A"}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Label className="fw-bold">Phone</Label>
                  <p>{selectedQuote.phone || "N/A"}</p>
                </Col>
                <Col md={6}>
                  <Label className="fw-bold">Company</Label>
                  <p>{selectedQuote.company || "N/A"}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Label className="fw-bold">Product</Label>
                  <p>{selectedQuote.productName || "N/A"}</p>
                </Col>
                <Col md={6}>
                  <Label className="fw-bold">Quantity</Label>
                  <p>{selectedQuote.quantity || "N/A"}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Label className="fw-bold">Status</Label>
                  <div>{getStatusBadge(selectedQuote.status)}</div>
                </Col>
                <Col md={6}>
                  <Label className="fw-bold">Date</Label>
                  <p>{new Date(selectedQuote.createdAt).toLocaleDateString()}</p>
                </Col>
              </Row>
              {selectedQuote.message && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Label className="fw-bold">Message</Label>
                    <p>{selectedQuote.message}</p>
                  </Col>
                </Row>
              )}
              {selectedQuote.notes && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Label className="fw-bold">Notes</Label>
                    <p>{selectedQuote.notes}</p>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default UserQuotes;
