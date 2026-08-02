import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
} from "reactstrap";
import axios from "axios";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import MarkRespondedModal from "../../Components/Common/MarkRespondedModal";
import tableCustomStyles from "../../Components/Common/tableStyles";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";

const logSafeApiError = (label, error) => {
  console.error(label, {
    status: error?.response?.status,
    message: error?.response?.data?.message || error?.message,
  });
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Enquiries = () => {
  const { adminData } = useContext(AuthContext);
  const {
    isAdmin,
    loading: menuLoading,
    findMenuIdByUrl,
    getPermissionsForMenu,
  } = useContext(MenuContext);

  const pagePermissions = useMemo(() => {
    if (isAdmin) return { read: true, edit: true };
    const menuId = findMenuIdByUrl(window.location.pathname);
    if (!menuId) return { read: false, edit: false };
    const permissions = getPermissionsForMenu(menuId);
    return { read: !!permissions.read, edit: !!permissions.edit };
  }, [isAdmin, findMenuIdByUrl, getPermissionsForMenu]);

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [responseFilter, setResponseFilter] = useState("unanswered");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [respondTarget, setRespondTarget] = useState(null);
  const [savingResponse, setSavingResponse] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    if (!pagePermissions.read) return;
    setLoading(true);
    try {
      const response = await axios.get("/api/contact/get");
      if (response.data.success) {
        setEnquiries(response.data.queries || []);
      } else {
        setEnquiries([]);
        toast.error(response.data.message || "Failed to fetch enquiries");
      }
    } catch (error) {
      logSafeApiError("Error fetching customer enquiries:", error);
      setEnquiries([]);
      toast.error("Failed to fetch customer enquiries");
    } finally {
      setLoading(false);
    }
  }, [pagePermissions.read]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const filteredEnquiries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      const matchesResponse =
        responseFilter === "all" ||
        (responseFilter === "responded" && enquiry.respondedAt) ||
        (responseFilter === "unanswered" && !enquiry.respondedAt);
      if (!matchesResponse) return false;
      if (!normalizedQuery) return true;
      return [
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.title,
        enquiry.type,
        enquiry.message,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedQuery),
      );
    });
  }, [enquiries, query, responseFilter]);

  const openDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewModal(true);
  };

  const openRespondConfirmation = (enquiry) => {
    if (!pagePermissions.edit || enquiry.respondedAt) return;
    setRespondTarget(enquiry);
  };

  const markResponded = async () => {
    if (!respondTarget || !pagePermissions.edit) return;
    setSavingResponse(true);
    try {
      const response = await axios.patch(
        `/api/contact/${respondTarget.id || respondTarget._id}/respond`,
      );
      if (response.data.success) {
        toast.success("Enquiry marked as responded");
        setRespondTarget(null);
        await fetchEnquiries();
      } else {
        toast.error(response.data.message || "Could not mark enquiry responded");
      }
    } catch (error) {
      logSafeApiError("Error marking enquiry responded:", error);
      toast.error(
        error?.response?.data?.message || "Could not mark enquiry responded",
      );
    } finally {
      setSavingResponse(false);
    }
  };

  const columns = [
    {
      name: "Received",
      selector: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <small>{formatDate(row.createdAt)}</small>,
      minWidth: "150px",
      sortable: true,
    },
    {
      name: "Customer",
      selector: (row) => row.name || "",
      cell: (row) => (
        <div>
          <div className="fw-medium">{row.name || "—"}</div>
          <small className="text-muted">{row.email || "—"}</small>
        </div>
      ),
      minWidth: "200px",
      sortable: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "",
      minWidth: "130px",
    },
    {
      name: "Topic",
      selector: (row) => row.title || "",
      cell: (row) => (
        <div>
          <div>{row.title || "—"}</div>
          <small className="text-muted">{row.type || "—"}</small>
        </div>
      ),
      minWidth: "220px",
      sortable: true,
    },
    {
      name: "Response",
      selector: (row) => (row.respondedAt ? "Responded" : "Unanswered"),
      cell: (row) =>
        row.respondedAt ? (
          <div>
            <Badge color="success">Responded</Badge>
            <small className="d-block text-muted mt-1">
              {formatDate(row.respondedAt)}
            </small>
          </div>
        ) : (
          <Badge color="warning">Unanswered</Badge>
        ),
      minWidth: "150px",
      sortable: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button color="info" size="sm" onClick={() => openDetails(row)}>
            View
          </Button>
          {pagePermissions.edit && !row.respondedAt && (
            <Button
              color="success"
              size="sm"
              onClick={() => openRespondConfirmation(row)}
            >
              Mark Responded
            </Button>
          )}
        </div>
      ),
      minWidth: "190px",
    },
  ];

  document.title = `Customer Enquiries | ${adminData?.companyName || "SuperMerch"}`;

  if (menuLoading) return <LoadingOverlay />;

  if (!pagePermissions.read) {
    return (
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Quotation"
            title="Customer Enquiries"
            pageTitle="Quotation"
          />
          <Card>
            <CardBody className="text-center py-5">
              <i className="ri-lock-2-line fs-1 text-danger" />
              <h5 className="mt-3">Access Denied</h5>
              <p className="text-muted mb-0">
                You do not have permission to view customer enquiries.
              </p>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      {loading && <LoadingOverlay />}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Quotation"
            title="Customer Enquiries"
            pageTitle="Quotation"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <Row className="g-3">
                    <Col lg={5} md={7}>
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search name, email, phone, topic or message..."
                      />
                    </Col>
                    <Col lg={3} md={5}>
                      <Input
                        type="select"
                        value={responseFilter}
                        onChange={(event) =>
                          setResponseFilter(event.target.value)
                        }
                      >
                        <option value="unanswered">Unanswered</option>
                        <option value="responded">Responded</option>
                        <option value="all">All enquiries</option>
                      </Input>
                    </Col>
                    <Col lg="auto" className="ms-lg-auto">
                      <Link
                        className="btn btn-outline-primary"
                        to="/quotation/user-requests"
                      >
                        Quote Requests
                      </Link>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <DataTable
                    columns={columns}
                    data={filteredEnquiries}
                    customStyles={tableCustomStyles}
                    progressPending={loading}
                    pagination
                    paginationPerPage={20}
                    paginationRowsPerPageOptions={[20, 50, 100]}
                    defaultSortFieldId={1}
                    defaultSortAsc={false}
                    highlightOnHover
                    responsive
                    striped
                    noDataComponent="No matching customer enquiries"
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        size="lg"
        scrollable
      >
        <ModalHeader toggle={() => setViewModal(false)}>
          Enquiry details
        </ModalHeader>
        <ModalBody>
          {selectedEnquiry && (
            <>
              <Row className="g-3">
                <Col md={6}>
                  <strong>Customer</strong>
                  <div>{selectedEnquiry.name || "—"}</div>
                </Col>
                <Col md={6}>
                  <strong>Received</strong>
                  <div>{formatDate(selectedEnquiry.createdAt)}</div>
                </Col>
                <Col md={6}>
                  <strong>Email</strong>
                  <div>{selectedEnquiry.email || "—"}</div>
                </Col>
                <Col md={6}>
                  <strong>Phone</strong>
                  <div>{selectedEnquiry.phone || "—"}</div>
                </Col>
                <Col md={6}>
                  <strong>Topic</strong>
                  <div>{selectedEnquiry.title || "—"}</div>
                </Col>
                <Col md={6}>
                  <strong>Customer type</strong>
                  <div>{selectedEnquiry.type || "—"}</div>
                </Col>
                <Col md={12}>
                  <strong>Message</strong>
                  <div
                    className="mt-1 p-3 bg-light rounded"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {selectedEnquiry.message || "—"}
                  </div>
                </Col>
              </Row>
              {pagePermissions.edit && !selectedEnquiry.respondedAt && (
                <Button
                  color="success"
                  className="mt-3"
                  onClick={() => {
                    setViewModal(false);
                    openRespondConfirmation(selectedEnquiry);
                  }}
                >
                  Mark Responded
                </Button>
              )}
            </>
          )}
        </ModalBody>
      </Modal>

      <MarkRespondedModal
        isOpen={!!respondTarget}
        leadLabel={
          respondTarget
            ? `enquiry from ${respondTarget.name || respondTarget.email}`
            : ""
        }
        onCancel={() => setRespondTarget(null)}
        onConfirm={markResponded}
        saving={savingResponse}
      />
    </React.Fragment>
  );
};

export default Enquiries;
