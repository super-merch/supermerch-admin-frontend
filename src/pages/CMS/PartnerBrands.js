import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
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
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";

const PartnerBrands = () => {
  const { adminData } = useContext(AuthContext);
  const imageRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [_id, set_Id] = useState("");

  const initialState = {
    name: "",
    websiteUrl: "",
    sortOrder: 0,
    isActive: true,
  };

  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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
      const res = await axios.get(`/api/partner-brands?${params}`, authHeaders);
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
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.name) { toast.error("Name is required"); return; }
    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) formData.append(key, val);
      });
      if (selectedFile) formData.append("logo", selectedFile);

      if (_id) {
        await axios.put(`/api/partner-brand/${_id}`, formData, { headers: { ...authHeaders.headers, "Content-Type": "multipart/form-data" } });
        toast.success("Partner brand updated");
      } else {
        await axios.post(`/api/partner-brand`, formData, { headers: { ...authHeaders.headers, "Content-Type": "multipart/form-data" } });
        toast.success("Partner brand created");
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving partner brand");
    } finally { setIsLoading(false); }
  };

  const handleEdit = (row) => {
    set_Id(row._id);
    setValues({
      name: row.name || "",
      websiteUrl: row.websiteUrl || "",
      sortOrder: row.sortOrder || 0,
      isActive: row.isActive ?? true,
    });
    if (row.logo) setImagePreview(row.logo);
    setShowForm(true);
    setUpdateForm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/partner-brand/${remove_id}`, authHeaders);
      toast.success("Deleted");
      setDeleteModal(false);
      fetchData();
    } catch (err) { toast.error("Delete failed"); }
  };

  const resetForm = () => {
    setValues(initialState);
    set_Id("");
    setSelectedFile(null);
    setImagePreview("");
    setShowForm(false);
    setUpdateForm(false);
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label>Name *</Label>
                      <Input
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label>Website URL</Label>
                      <Input
                        name="websiteUrl"
                        value={values.websiteUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label>Logo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        innerRef={imageRef}
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="mt-2 rounded"
                          style={{ maxHeight: 80 }}
                        />
                      )}
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        name="sortOrder"
                        value={values.sortOrder}
                        onChange={handleChange}
                      />
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col lg={12}>
                    <div className="mb-3 form-check form-switch">
                      <Input
                        type="checkbox"
                        className="form-check-input"
                        name="isActive"
                        checked={values.isActive}
                        onChange={handleChange}
                      />
                      <Label className="form-check-label">Active</Label>
                    </div>
                  </Col>
                </Row>
                <FormsFooter
                  handleSubmit={handleSubmit}
                  handleSubmitCancel={resetForm}
                />
              </Form>
            </div>
          </CardBody>
        </Card>
      </Col>
    </CardBody>
  );

  const columns = [
    {
      name: "Logo",
      cell: (r) => r.logo ? <img src={r.logo} alt={r.name} style={{ width: 60, height: 40, objectFit: "contain" }} /> : <span className="text-muted">No logo</span>,
      width: "100px",
    },
    { name: "Name", selector: (r) => r.name, grow: 2, sortable: true },
    { name: "Website", selector: (r) => r.websiteUrl || "—", grow: 2 },
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

  document.title = "Partner Brands | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Partner Brands" pageTitle="CMS" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardHeader className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">Partner Brands</h5>
                  <div className="d-flex gap-2">
                    <Input
                      bsSize="sm"
                      placeholder="Search..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      <i className="ri-add-line me-1"></i>Add
                    </button>
                  </div>
                </CardHeader>
                {showForm || updateForm ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <LoadingOverlay isLoading={loading}>
                      <DataTable
                        columns={columns}
                        data={data}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={perPage}
                        onChangePage={(p) => setPageNo(p - 1)}
                        onChangeRowsPerPage={(n) => {
                          setPerPage(n);
                          setPageNo(0);
                        }}
                        customStyles={tableCustomStyles}
                        highlightOnHover
                        striped
                        responsive
                      />
                    </LoadingOverlay>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>

        </Container>
      </div>
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />
    </React.Fragment>
  );
};

export default PartnerBrands;
