import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Input,
  Label,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Container,
  Row,
  Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";

const Inquiry = () => {
  const { adminData } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    status: "new",
    adminNote: "",
    isActive: true,
  };

  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);

  const { currentPagePermissions } = useContext(MenuContext);

  const getStatusBadge = (status) => {
    const statusColors = {
      new: "primary",
      read: "info",
      responded: "success",
      closed: "secondary",
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
      maxWidth: "60px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      sortable: true,
      maxWidth: "150px",
    },
    {
      name: "Email",
      selector: (row) => <p className="text-wrap">{row.email}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Subject",
      selector: (row) => <p className="text-wrap">{row.subject}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Status",
      selector: (row) => getStatusBadge(row.status),
      sortable: true,
      maxWidth: "100px",
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      maxWidth: "120px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                data-bs-toggle="modal"
                data-bs-target="#showModal"
                onClick={() => handleTog_edit(row.id)}
              >
                View/Edit
              </button>
            )}
            {currentPagePermissions.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                data-bs-toggle="modal"
                data-bs-target="#deleteRecordModal"
                onClick={() => tog_delete(row.id)}
              >
                Remove
              </button>
            )}
            {!currentPagePermissions.edit && !currentPagePermissions.delete && (
              <span className="text-muted">No actions available</span>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo || 1,
      limit: perPage,
      isActive: filter,
    };

    if (query) {
      params.search = query;
    }

    if (statusFilter) {
      params.status = statusFilter;
    }

    if (startDate) {
      params.startDate = startDate;
    }

    if (endDate) {
      params.endDate = endDate;
    }

    try {
      const response = await axios.get("/api/listbyparams/inquiries", {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setData(response.data.data);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmit(true);
    setIsLoading(true);

    try {
      const response = await axios.put(
        `/api/inquiries/${_id}`,
        {
          status: values.status,
          adminNote: values.adminNote,
          isActive: values.isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Inquiry Updated Successfully");
        setUpdateForm(false);
        setShowForm(false);
        setValues(initialState);
        setIsSubmit(false);
        setFormErrors({});
        fetchInquiries();
      } else {
        toast.error(response.data.message || "Cannot update Inquiry");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating inquiry");
    }
    setIsLoading(false);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setFormErrors({});
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
      const response = await axios.delete(`/api/inquiries/${remove_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setmodal_delete(!modal_delete);
        toast.success("Inquiry Deleted Successfully");
        fetchInquiries();
      } else {
        toast.error(response.data.message || "Cannot delete Inquiry");
      }
      setIsDeleteLoading(false);
    } catch (error) {
      toast.error("Failed to delete inquiry. Please try again.");
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = async (_id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(_id);
    setFormErrors({});
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/inquiries/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const inquiry = response.data.data;
        setValues({
          name: inquiry.name || "",
          email: inquiry.email || "",
          company: inquiry.company || "",
          phone: inquiry.phone || "",
          subject: inquiry.subject || "",
          message: inquiry.message || "",
          status: inquiry.status || "new",
          adminNote: inquiry.adminNote || "",
          isActive: inquiry.isActive,
        });
        setShowForm(true);
      } else {
        toast.error("Failed to fetch inquiry details");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
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

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setQuery("");
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  {/* Read-only inquiry details */}
                  <Row>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={values.name}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Name</label>
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="email"
                          value={values.email}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Email</label>
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="phone"
                          value={values.phone || "N/A"}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Phone</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="company"
                          value={values.company || "N/A"}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Company</label>
                      </div>
                    </Col>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          value={values.subject}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Subject</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="message"
                          value={values.message}
                          style={{ minHeight: "120px" }}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Message</label>
                      </div>
                    </Col>
                  </Row>

                  <hr className="my-3" />

                  {/* Editable admin fields */}
                  <Row>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-control form-select"
                          name="status"
                          value={values.status}
                          onChange={handleChange}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                        <label className="form-label">Status</label>
                      </div>
                    </Col>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="adminNote"
                          value={values.adminNote}
                          onChange={handleChange}
                          style={{ minHeight: "80px" }}
                          placeholder="Add internal notes..."
                        />
                        <label className="form-label">Admin Notes</label>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-3">
                    <Row>
                      <Col lg={2}>
                        <div className="form-check mb-2">
                          <Input
                            type="checkbox"
                            name="isActive"
                            value={values.isActive}
                            onChange={handlecheck}
                            checked={values.isActive}
                          />
                          <Label className="form-check-label">Is Active</Label>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <Col lg={12}>
                    <FormsFooter
                      handleSubmit={handleUpdate}
                      handleSubmitCancel={handleCancel}
                    />
                  </Col>
                </Row>
              </Form>
            </div>
          </CardBody>
        </Card>
      </Col>
    </CardBody>
  );

  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
  };

  document.title = `Inquiries | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="CMS" title="Inquiries" pageTitle="CMS" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Inquiry"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={() => handleList()}
                    setQuery={setQuery}
                    initialState={initialState}
                    setValues={setValues}
                    updateForm={updateForm}
                    showForm={showForm}
                    setShowForm={setShowForm}
                    setUpdateForm={setUpdateForm}
                    showAddButton={false}
                  />
                  {/* Additional Filters */}
                  {!showForm && !updateForm && (
                    <Row className="mt-3 g-3">
                      <Col lg={3}>
                        <Label className="form-label">Status</Label>
                        <select
                          className="form-control form-select"
                          value={statusFilter}
                          onChange={handleStatusFilterChange}
                        >
                          <option value="">All Statuses</option>
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                        </select>
                      </Col>
                      <Col lg={3}>
                        <Label className="form-label">Start Date</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </Col>
                      <Col lg={3}>
                        <Label className="form-label">End Date</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </Col>
                      <Col lg={3} className="d-flex align-items-end">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={handleClearFilters}
                        >
                          Clear Filters
                        </button>
                      </Col>
                    </Row>
                  )}
                </CardHeader>

                {showForm || updateForm ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
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
                          50,
                          100,
                          200,
                          300,
                          totalRows,
                        ]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <DeleteModal
        show={modal_delete && !isDeleteLoading}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default Inquiry;
