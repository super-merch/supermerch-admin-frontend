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
import tableCustomStyles from "../../Components/Common/tableStyles";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import PageHeader from "../../Components/Common/PageHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";

const ProductTags = () => {
  const { adminData } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [_id, set_Id] = useState("");
  const [filter, setFilter] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const initialState = {
    name: "",
    slug: "",
    color: "#3b82f6",
    textColor: "#ffffff",
    icon: "",
    isActive: true,
    sortOrder: 0,
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
  const [modal_delete, setmodal_delete] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNo + 1,
        limit: perPage,
        ...(query && { search: query }),
        isActive: filter,
      });
      const res = await axios.get(`/api/product-tags?${params}`, authHeaders);
      if (res.data.success) {
        setData(res.data.data || []);
        setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValues = { ...values, [name]: type === "checkbox" ? checked : value };
    if (name === "name" && !updateForm) {
      newValues.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    setValues(newValues);
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      if (_id) {
        await axios.put(`/api/product-tag/${_id}`, values, authHeaders);
        toast.success("Tag updated");
      } else {
        await axios.post(`/api/product-tag`, values, authHeaders);
        toast.success("Tag created");
      }
      handleList();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving tag");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTog_edit = (row) => {
    set_Id(row._id);
    setValues({
      name: row.name || "",
      slug: row.slug || "",
      color: row.color || "#3b82f6",
      textColor: row.textColor || "#ffffff",
      icon: row.icon || "",
      isActive: row.isActive ?? true,
      sortOrder: row.sortOrder || 0,
    });
    setShowForm(true);
    setUpdateForm(true);
    setIsSubmit(false);
    setFormErrors({});
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    try {
      await axios.delete(`/api/product-tag/${remove_id}`, authHeaders);
      toast.success("Deleted");
      setmodal_delete(false);
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const tog_delete = (id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(id);
  };

  const handleList = () => {
    setValues(initialState);
    set_Id("");
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setFormErrors({});
  };

  const handleCancel = (e) => {
    e.preventDefault();
    handleList();
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const handlePageChange = (page) => {
    setPageNo(page - 1);
  };

  const handlePerRowsChange = async (newPerPage) => {
    setPerPage(newPerPage);
    setPageNo(0);
  };

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Preview",
      cell: (r) => (
        <span
          style={{
            backgroundColor: r.color,
            color: r.textColor,
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {r.icon && <i className={`${r.icon} me-1`}></i>}
          {r.name}
        </span>
      ),
      width: "200px",
    },
    { name: "Slug", selector: (r) => r.slug, width: "180px" },
    {
      name: "Order",
      selector: (r) => r.sortOrder,
      width: "80px",
      sortable: true,
    },
    {
      name: "Status",
      cell: (r) => (
        <Badge color={r.isActive ? "success" : "danger"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      width: "100px",
    },
    {
      name: "Action",
      selector: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-success edit-item-btn"
            onClick={() => handleTog_edit(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger remove-item-btn"
            onClick={() => tog_delete(row._id)}
          >
            Remove
          </button>
        </div>
      ),
      sortable: false,
      minWidth: "180px",
    },
  ];

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          placeholder="e.g. Best Seller"
                        />
                        <label className="form-label">
                          Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.name}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="slug"
                          value={values.slug}
                          onChange={handleChange}
                          placeholder="auto-generated"
                        />
                        <label className="form-label">Slug</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={3}>
                      <div className="mb-3">
                        <Label className="form-label">Badge Color</Label>
                        <Input
                          type="color"
                          name="color"
                          value={values.color}
                          onChange={handleChange}
                          style={{ height: "40px" }}
                        />
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="mb-3">
                        <Label className="form-label">Text Color</Label>
                        <Input
                          type="color"
                          name="textColor"
                          value={values.textColor}
                          onChange={handleChange}
                          style={{ height: "40px" }}
                        />
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="icon"
                          value={values.icon}
                          onChange={handleChange}
                          placeholder="e.g. ri-fire-line"
                        />
                        <label className="form-label">Icon (Remix class)</label>
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          name="sortOrder"
                          value={values.sortOrder}
                          onChange={handleChange}
                          min="0"
                        />
                        <label className="form-label">Sort Order</label>
                      </div>
                    </Col>
                  </Row>
                  {values.icon && (
                    <Row>
                      <Col lg={12}>
                        <div className="mb-3">
                          <Label className="form-label">Icon Preview</Label>
                          <div>
                            <i className={values.icon} style={{ fontSize: 24 }}></i>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  )}
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
                      handleSubmit={handleSubmit}
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

  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Slug", key: "slug" },
    { header: "Sort Order", key: "sortOrder" },
    { header: "Active", key: "isActive" },
  ];
  const fetchAllForExport = async () => {
    try {
      const r = await axios.get("/api/product-tags?page=1&limit=10000", authHeaders);
      return r.data?.data || [];
    } catch (e) {
      return data;
    }
  };

  document.title = `Product Tags | ${adminData?.companyName || "SuperMerch Admin"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Products" title="Product Tags" pageTitle="Products" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <PageHeader
                    formName="Product Tags"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={handleList}
                    setQuery={setQuery}
                    initialState={initialState}
                    setValues={setValues}
                    updateForm={updateForm}
                    showForm={showForm}
                    setShowForm={setShowForm}
                    setUpdateForm={setUpdateForm}
                    data={data}
                    exportColumns={exportColumns}
                    fileName="product_tags"
                    fetchAllForExport={fetchAllForExport}
                  />
                </CardHeader>

                {showForm || updateForm ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        customStyles={tableCustomStyles}
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        sortServer
                        onSort={handleSort}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[50, 100, 200, 300, totalRows]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                        highlightOnHover
                        striped
                        responsive
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

export default ProductTags;
