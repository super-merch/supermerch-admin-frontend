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
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";

const SeoManagement = () => {
  const { adminData } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    entityType: "product",
    entityId: "",
    metaTitle: "",
    metaDescription: "",
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
  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
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
  }, [pageNo, perPage, query, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (_id) {
        await axios.put(`/api/seo-meta/${_id}`, values, authHeaders);
        toast.success("SEO meta updated");
      } else {
        await axios.post(`/api/seo-meta`, values, authHeaders);
        toast.success("SEO meta created");
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving SEO meta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row) => {
    set_Id(row._id);
    setValues({
      entityType: row.entityType || "product",
      entityId: row.entityId || "",
      metaTitle: row.metaTitle || "",
      metaDescription: row.metaDescription || "",
      ogTitle: row.ogTitle || "",
      ogDescription: row.ogDescription || "",
      ogImage: row.ogImage || "",
      canonicalUrl: row.canonicalUrl || "",
      isActive: row.isActive ?? true,
    });
    setShowForm(true);
    setUpdateForm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/seo-meta/${remove_id}`, authHeaders);
      toast.success("Deleted");
      setDeleteModal(false);
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setValues(initialState);
    set_Id("");
    setShowForm(false);
    setUpdateForm(false);
  };

  const entityTypes = ["product", "category", "cmsPage", "blog"];

  const columns = [
    { name: "Entity Type", selector: (r) => r.entityType, cell: (r) => <Badge color="info">{r.entityType}</Badge>, width: "120px", sortable: true },
    { name: "Entity ID", selector: (r) => r.entityId, width: "180px" },
    { name: "Meta Title", selector: (r) => r.metaTitle, grow: 2 },
    { name: "Meta Description", selector: (r) => r.metaDescription, grow: 2, cell: (r) => <span className="text-truncate" style={{ maxWidth: 200 }}>{r.metaDescription}</span> },
    { name: "Active", selector: (r) => r.isActive, cell: (r) => <Badge color={r.isActive ? "success" : "danger"}>{r.isActive ? "Yes" : "No"}</Badge>, width: "80px" },
    {
      name: "Actions",
      cell: (r) => (
        <div className="d-flex gap-1">
          <button className="btn btn-soft-primary btn-sm" onClick={() => handleEdit(r)}><i className="ri-pencil-line"></i></button>
          <button className="btn btn-soft-danger btn-sm" onClick={() => { setRemove_id(r._id); setDeleteModal(true); }}><i className="ri-delete-bin-line"></i></button>
        </div>
      ),
      width: "120px",
    },
  ];

  document.title = "SEO Management | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="SEO Management" pageTitle="CMS" />
          <Row>
            <Col lg={showForm ? 8 : 12}>
              <Card>
                <CardHeader className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">SEO Meta Entries</h5>
                  <div className="d-flex gap-2">
                    <Input type="select" bsSize="sm" style={{ width: 140 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="">All Types</option>
                      {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Input>
                    <Input bsSize="sm" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
                      <i className="ri-add-line me-1"></i>Add
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <LoadingOverlay isLoading={loading}>
                    <DataTable columns={columns} data={data} pagination paginationServer paginationTotalRows={totalRows} paginationPerPage={perPage}
                      onChangePage={(p) => setPageNo(p - 1)} onChangeRowsPerPage={(n) => { setPerPage(n); setPageNo(0); }}
                      customStyles={tableCustomStyles} highlightOnHover striped responsive />
                  </LoadingOverlay>
                </CardBody>
              </Card>
            </Col>
            {showForm && (
              <Col lg={4}>
                <Card>
                  <FormsHeader title={updateForm ? "Edit SEO Meta" : "Add SEO Meta"} handleClose={resetForm} />
                  <CardBody>
                    <Form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <Label>Entity Type *</Label>
                        <Input type="select" name="entityType" value={values.entityType} onChange={handleChange}>
                          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Input>
                      </div>
                      <div className="mb-3">
                        <Label>Entity ID *</Label>
                        <Input name="entityId" value={values.entityId} onChange={handleChange} required placeholder="Product ID, Category slug, etc." />
                      </div>
                      <div className="mb-3">
                        <Label>Meta Title</Label>
                        <Input name="metaTitle" value={values.metaTitle} onChange={handleChange} placeholder="Page title for search engines" />
                      </div>
                      <div className="mb-3">
                        <Label>Meta Description</Label>
                        <Input type="textarea" name="metaDescription" value={values.metaDescription} onChange={handleChange} rows={3} placeholder="Description for search results" />
                      </div>
                      <div className="mb-3">
                        <Label>OG Title</Label>
                        <Input name="ogTitle" value={values.ogTitle} onChange={handleChange} placeholder="Title for social sharing" />
                      </div>
                      <div className="mb-3">
                        <Label>OG Description</Label>
                        <Input type="textarea" name="ogDescription" value={values.ogDescription} onChange={handleChange} rows={2} />
                      </div>
                      <div className="mb-3">
                        <Label>OG Image URL</Label>
                        <Input name="ogImage" value={values.ogImage} onChange={handleChange} placeholder="https://..." />
                      </div>
                      <div className="mb-3">
                        <Label>Canonical URL</Label>
                        <Input name="canonicalUrl" value={values.canonicalUrl} onChange={handleChange} placeholder="https://supermerch.com.au/..." />
                      </div>
                      <div className="mb-3 form-check form-switch">
                        <Input type="checkbox" className="form-check-input" name="isActive" checked={values.isActive} onChange={handleChange} />
                        <Label className="form-check-label">Active</Label>
                      </div>
                      <FormsFooter isLoading={isLoading} updateForm={updateForm} handleClose={resetForm} />
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            )}
          </Row>
        </Container>
      </div>
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />
    </React.Fragment>
  );
};

export default SeoManagement;
