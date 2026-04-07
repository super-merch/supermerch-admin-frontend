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
import ExportButtons from "../../Components/Common/ExportButtons";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";

const SeoManagement = () => {
  const { adminData } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const initialState = {
    entityType: "product",
    entityId: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    canonicalUrl: "",
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
  const [modal_delete, setmodal_delete] = useState(false);
  const [filterType, setFilterType] = useState("");

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
        ...(filterType && { entityType: filterType }),
        isActive: filter,
      });
      const res = await axios.get(`/api/seo-metas?${params}`, authHeaders);
      if (res.data.success) {
        setData(res.data.data || []);
        setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filterType, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const validate = (values) => {
    const errors = {};
    if (!values.entityType) errors.entityType = "Entity type is required";
    if (!values.entityId) errors.entityId = "Entity ID is required";
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
        await axios.put(`/api/seo-meta/${_id}`, values, authHeaders);
        toast.success("SEO meta updated");
      } else {
        await axios.post(`/api/seo-meta`, values, authHeaders);
        toast.success("SEO meta created");
      }
      handleList();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving SEO meta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTog_edit = (row) => {
    set_Id(row._id);
    setValues({
      entityType: row.entityType || "product",
      entityId: row.entityId || "",
      metaTitle: row.metaTitle || "",
      metaDescription: row.metaDescription || "",
      keywords: row.keywords || "",
      ogTitle: row.ogTitle || "",
      ogDescription: row.ogDescription || "",
      ogImage: row.ogImage || "",
      canonicalUrl: row.canonicalUrl || "",
      isActive: row.isActive ?? true,
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
      await axios.delete(`/api/seo-meta/${remove_id}`, authHeaders);
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

  const entityTypes = ["product", "category", "cmsPage", "blog"];

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Entity Type",
      selector: (r) => r.entityType,
      cell: (r) => <Badge color="info">{r.entityType}</Badge>,
      width: "120px",
      sortable: true,
    },
    {
      name: "Entity ID",
      selector: (r) => r.entityId,
      width: "180px",
    },
    {
      name: "Meta Title",
      selector: (r) => r.metaTitle,
      grow: 2,
    },
    {
      name: "Keywords",
      selector: (r) => r.keywords,
      cell: (r) => (
        <span className="text-truncate" style={{ maxWidth: 150 }}>
          {r.keywords || "-"}
        </span>
      ),
      width: "150px",
    },
    {
      name: "Status",
      selector: (r) => r.isActive,
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
                    <Col lg={4}>
                      <div className="mb-3">
                        <Label className="form-label">
                          Entity Type <span className="text-danger"> *</span>
                        </Label>
                        <Input
                          type="select"
                          name="entityType"
                          value={values.entityType}
                          onChange={handleChange}
                        >
                          {entityTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Input>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.entityType}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="entityId"
                          value={values.entityId}
                          onChange={handleChange}
                          placeholder="Product ID, Category slug, etc."
                        />
                        <label className="form-label">
                          Entity ID <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.entityId}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="metaTitle"
                          value={values.metaTitle}
                          onChange={handleChange}
                          placeholder="Page title for search engines"
                        />
                        <label className="form-label">Meta Title</label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="ogTitle"
                          value={values.ogTitle}
                          onChange={handleChange}
                          placeholder="Title for social sharing"
                        />
                        <label className="form-label">OG Title</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="metaDescription"
                          value={values.metaDescription}
                          onChange={handleChange}
                          style={{ minHeight: "80px" }}
                          placeholder="Description for search results"
                        />
                        <label className="form-label">Meta Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="keywords"
                          value={values.keywords}
                          onChange={handleChange}
                          placeholder="e.g. promotional products, branded merchandise"
                        />
                        <label className="form-label">
                          SEO Keywords{" "}
                          <small className="text-muted">(comma separated)</small>
                        </label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="ogDescription"
                          value={values.ogDescription}
                          onChange={handleChange}
                          style={{ minHeight: "60px" }}
                          placeholder="Description for social sharing"
                        />
                        <label className="form-label">OG Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="ogImage"
                          value={values.ogImage}
                          onChange={handleChange}
                          placeholder="https://..."
                        />
                        <label className="form-label">OG Image URL</label>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="canonicalUrl"
                          value={values.canonicalUrl}
                          onChange={handleChange}
                          placeholder="https://supermerch.com.au/..."
                        />
                        <label className="form-label">Canonical URL</label>
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
    { header: "Entity Type", key: "entityType" },
    { header: "Entity ID", key: "entityId" },
    { header: "Meta Title", key: "metaTitle" },
    { header: "Keywords", key: "keywords" },
    { header: "Active", key: "isActive" },
  ];
  const fetchAllForExport = async () => {
    try {
      const r = await axios.get("/api/seo-metas?page=1&limit=10000", authHeaders);
      return r.data?.data || [];
    } catch (e) {
      return data;
    }
  };

  document.title = `SEO Management | ${adminData?.companyName || "SuperMerch Admin"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="CMS" title="SEO Management" pageTitle="CMS" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="SEO Management"
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
                  />
                  <ExportButtons
                    data={data}
                    columns={exportColumns}
                    fileName="seo_meta"
                    fetchAll={fetchAllForExport}
                  />
                </CardHeader>

                {showForm || updateForm ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="mb-3 d-flex gap-2 align-items-center">
                      <Label className="mb-0 me-2 text-muted">Filter by Type:</Label>
                      <Input
                        type="select"
                        bsSize="sm"
                        style={{ width: 160 }}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {entityTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Input>
                    </div>
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

export default SeoManagement;
