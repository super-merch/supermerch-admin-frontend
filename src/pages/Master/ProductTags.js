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

const ProductTags = () => {
  const { adminData } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [_id, set_Id] = useState("");

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
  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNo + 1, limit: perPage, ...(query && { search: query }) });
      const res = await axios.get(`/api/product-tags?${params}`, authHeaders);
      if (res.data.success) {
        setData(res.data.data || []);
        setTotalRows(res.data.pagination?.totalCount || res.data.data?.length || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [pageNo, perPage, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValues = { ...values, [name]: type === "checkbox" ? checked : value };
    if (name === "name" && !updateForm) {
      newValues.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    setValues(newValues);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.name) { toast.error("Name is required"); return; }
    setIsLoading(true);
    try {
      if (_id) {
        await axios.put(`/api/product-tag/${_id}`, values, authHeaders);
        toast.success("Tag updated");
      } else {
        await axios.post(`/api/product-tag`, values, authHeaders);
        toast.success("Tag created");
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving tag");
    } finally { setIsLoading(false); }
  };

  const handleEdit = (row) => {
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
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/product-tag/${remove_id}`, authHeaders);
      toast.success("Deleted");
      setDeleteModal(false);
      fetchData();
    } catch (err) { toast.error("Delete failed"); }
  };

  const resetForm = () => {
    setValues(initialState);
    set_Id("");
    setShowForm(false);
    setUpdateForm(false);
  };

  const columns = [
    { name: "Preview", cell: (r) => (
      <span style={{ backgroundColor: r.color, color: r.textColor, padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
        {r.icon && <i className={`${r.icon} me-1`}></i>}{r.name}
      </span>
    ), width: "200px" },
    { name: "Slug", selector: (r) => r.slug, width: "180px" },
    { name: "Order", selector: (r) => r.sortOrder, width: "80px", sortable: true },
    { name: "Active", cell: (r) => <Badge color={r.isActive ? "success" : "danger"}>{r.isActive ? "Yes" : "No"}</Badge>, width: "80px" },
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

  document.title = "Product Tags | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Product Tags" pageTitle="Products" />
          <Row>
            <Col lg={showForm ? 8 : 12}>
              <Card>
                <CardHeader className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">Tags / Badges</h5>
                  <div className="d-flex gap-2">
                    <Input bsSize="sm" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
                      <i className="ri-add-line me-1"></i>Add Tag
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
                  <FormsHeader title={updateForm ? "Edit Tag" : "Add Tag"} handleClose={resetForm} />
                  <CardBody>
                    <Form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <Label>Name *</Label>
                        <Input name="name" value={values.name} onChange={handleChange} required placeholder="e.g. Best Seller" />
                      </div>
                      <div className="mb-3">
                        <Label>Slug</Label>
                        <Input name="slug" value={values.slug} onChange={handleChange} placeholder="auto-generated" />
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Badge Color</Label>
                            <Input type="color" name="color" value={values.color} onChange={handleChange} />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Text Color</Label>
                            <Input type="color" name="textColor" value={values.textColor} onChange={handleChange} />
                          </div>
                        </Col>
                      </Row>
                      <div className="mb-3">
                        <Label>Icon (Remix icon class)</Label>
                        <Input name="icon" value={values.icon} onChange={handleChange} placeholder="e.g. ri-fire-line" />
                        {values.icon && <span className="mt-1 d-inline-block"><i className={values.icon} style={{ fontSize: 20 }}></i></span>}
                      </div>
                      <div className="mb-3">
                        <Label>Sort Order</Label>
                        <Input type="number" name="sortOrder" value={values.sortOrder} onChange={handleChange} />
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

export default ProductTags;
