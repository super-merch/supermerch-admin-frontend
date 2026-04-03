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
  Button,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import {
  getAdminQuotes,
  getAdminQuoteById,
  createAdminQuote,
  updateAdminQuote,
  deleteAdminQuote,
} from "../../functions/Quotation/quotationFunc";

const AdminQuotes = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const emptyLineItem = { productName: "", quantity: 1, price: 0 };

  const initialState = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    lineItems: [{ ...emptyLineItem }],
    discount: 0,
    notes: "",
    status: "draft",
    isActive: true,
  };

  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: "secondary",
      sent: "info",
      pending: "warning",
      accepted: "success",
      declined: "danger",
      rejected: "danger",
      expired: "warning",
    };
    return (
      <Badge color={statusColors[status] || "secondary"} className="text-capitalize">
        {status}
      </Badge>
    );
  };

  const calculateTotal = (items, discount) => {
    const subtotal = (items || []).reduce(
      (sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0),
      0
    );
    return (subtotal - (parseFloat(discount) || 0)).toFixed(2);
  };

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "60px",
    },
    {
      name: "Quote #",
      selector: (row) => <p className="text-wrap">{row.quoteNumber || row._id}</p>,
      sortable: true,
      maxWidth: "120px",
    },
    {
      name: "Customer",
      selector: (row) => <p className="text-wrap">{row.customer?.name || row.customerName || "-"}</p>,
      sortable: true,
      maxWidth: "180px",
    },
    {
      name: "Total",
      selector: (row) => `A$${parseFloat(row.total || 0).toFixed(2)}`,
      sortable: true,
      maxWidth: "120px",
    },
    {
      name: "Status",
      selector: (row) => getStatusBadge(row.status),
      sortable: true,
      maxWidth: "120px",
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
        const rowId = row._id || row.id;
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleTog_edit(rowId)}
              >
                Edit
              </button>
            )}
            {currentPagePermissions.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                onClick={() => tog_delete(rowId)}
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

  const fetchAdminQuotes = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo || 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await getAdminQuotes(params);
      if (response.data.success) {
        setTotalRows(response.data.pagination?.totalCount || 0);
        setData(response.data.data || []);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching admin quotes:", error);
      toast.error("Failed to fetch admin quotes");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchAdminQuotes();
  }, [fetchAdminQuotes]);

  const validate = (values) => {
    const errors = {};
    if (!values.customerName) errors.customerName = "Customer name is required";
    if (!values.customerEmail) errors.customerEmail = "Customer email is required";
    if (values.lineItems.length === 0) {
      errors.lineItems = "At least one line item is required";
    } else {
      const hasEmptyItem = values.lineItems.some(
        (item) => !item.productName || !item.quantity || !item.price
      );
      if (hasEmptyItem) {
        errors.lineItems = "All line items must have product, quantity and price";
      }
    }
    return errors;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        const response = await createAdminQuote(values);
        if (response.data.success) {
          toast.success(response.data.message || "Quote Created Successfully");
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          fetchAdminQuotes();
        } else {
          toast.error(response.data.message || "Cannot create quote");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error creating quote");
      }
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        const response = await updateAdminQuote(_id, values);
        if (response.data.success) {
          toast.success("Quote Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          fetchAdminQuotes();
        } else {
          toast.error(response.data.message || "Cannot update quote");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating quote");
      }
      setIsLoading(false);
    }
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
      const response = await deleteAdminQuote(remove_id);
      if (response.data.success) {
        setmodal_delete(false);
        toast.success("Quote Deleted Successfully");
        fetchAdminQuotes();
      } else {
        toast.error(response.data.message || "Cannot delete quote");
      }
    } catch (error) {
      toast.error("Failed to delete quote. Please try again.");
    }
    setIsDeleteLoading(false);
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = async (id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(id);
    setFormErrors({});
    setIsLoading(true);

    try {
      const response = await getAdminQuoteById(id);
      if (response.data.success) {
        const quote = response.data.data;
        setValues({
          customerName: quote.customerName || "",
          customerEmail: quote.customerEmail || "",
          customerPhone: quote.customerPhone || "",
          customerCompany: quote.customerCompany || "",
          lineItems: quote.lineItems && quote.lineItems.length > 0
            ? quote.lineItems
            : [{ ...emptyLineItem }],
          discount: quote.discount || 0,
          notes: quote.notes || "",
          status: quote.status || "draft",
          isActive: quote.isActive !== undefined ? quote.isActive : true,
        });
        setShowForm(true);
      } else {
        toast.error("Failed to fetch quote details");
      }
    } catch (err) {
      console.log(err);
      toast.error("Error loading quote details");
    } finally {
      setIsLoading(false);
    }
  };

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  // Line item handlers
  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...values.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setValues({ ...values, lineItems: updatedItems });
  };

  const addLineItem = () => {
    setValues({
      ...values,
      lineItems: [...values.lineItems, { ...emptyLineItem }],
    });
  };

  const removeLineItem = (index) => {
    if (values.lineItems.length > 1) {
      const updatedItems = values.lineItems.filter((_, i) => i !== index);
      setValues({ ...values, lineItems: updatedItems });
    } else {
      toast.warning("At least one line item is required");
    }
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

  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  {/* Customer Information */}
                  <h5 className="mb-3">Customer Information</h5>
                  <Row>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="customerName"
                          value={values.customerName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Customer Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.customerName}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="email"
                          className="form-control"
                          required
                          name="customerEmail"
                          value={values.customerEmail}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Email <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.customerEmail}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="customerPhone"
                          value={values.customerPhone}
                          onChange={handleChange}
                        />
                        <label className="form-label">Phone</label>
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="customerCompany"
                          value={values.customerCompany}
                          onChange={handleChange}
                        />
                        <label className="form-label">Company</label>
                      </div>
                    </Col>
                  </Row>

                  {/* Line Items */}
                  <hr className="my-3" />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Line Items</h5>
                    <Button color="primary" size="sm" onClick={addLineItem}>
                      <i className="ri-add-line align-bottom me-1"></i> Add Item
                    </Button>
                  </div>
                  {isSubmit && formErrors.lineItems && (
                    <p className="text-danger mb-2">{formErrors.lineItems}</p>
                  )}
                  {values.lineItems.map((item, index) => (
                    <Row key={index} className="mb-2 align-items-center">
                      <Col lg={5}>
                        <div className="form-floating mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Product name or search"
                            value={item.productName}
                            onChange={(e) =>
                              handleLineItemChange(index, "productName", e.target.value)
                            }
                          />
                          <label className="form-label">Product</label>
                        </div>
                      </Col>
                      <Col lg={2}>
                        <div className="form-floating mb-2">
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(index, "quantity", e.target.value)
                            }
                          />
                          <label className="form-label">Qty</label>
                        </div>
                      </Col>
                      <Col lg={3}>
                        <div className="form-floating mb-2">
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              handleLineItemChange(index, "price", e.target.value)
                            }
                          />
                          <label className="form-label">Price</label>
                        </div>
                      </Col>
                      <Col lg={2} className="text-center mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeLineItem(index)}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </Col>
                    </Row>
                  ))}

                  {/* Discount + Notes */}
                  <hr className="my-3" />
                  <Row>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          name="discount"
                          min="0"
                          step="0.01"
                          value={values.discount}
                          onChange={handleChange}
                        />
                        <label className="form-label">Discount (A$)</label>
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-control form-select"
                          name="status"
                          value={values.status}
                          onChange={handleChange}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                        </select>
                        <label className="form-label">Status</label>
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control fw-bold"
                          value={`A$${calculateTotal(values.lineItems, values.discount)}`}
                          disabled
                          readOnly
                        />
                        <label className="form-label">Total</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="notes"
                          value={values.notes}
                          onChange={handleChange}
                          style={{ minHeight: "80px" }}
                          placeholder="Add notes..."
                        />
                        <label className="form-label">Notes</label>
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
                      handleSubmit={updateForm ? handleUpdate : handleClick}
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

  document.title = `Admin Quotes | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Quotation" title="Admin Quotes" pageTitle="Quotation" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Admin Quotes"
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
                  />
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
                          50, 100, 200, 300, totalRows,
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
        handleDeleteClose={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default AdminQuotes;
