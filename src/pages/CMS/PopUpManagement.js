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
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";

const PopUpManagement = () => {
  const { adminData } = useContext(AuthContext);
  const imageRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [_id, set_Id] = useState("");

  const initialState = {
    title: "",
    type: "FIRST_VISIT",
    heading: "",
    description: "",
    ctaText: "Shop Now",
    ctaLink: "/",
    couponCode: "",
    displayFrequency: "ONCE",
    isActive: true,
    startDate: "",
    endDate: "",
    delaySeconds: 3,
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
      const res = await axios.get(`/api/popups?${params}`, authHeaders);
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
    if (!values.title) { toast.error("Title is required"); return; }
    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) formData.append(key, val);
      });
      if (selectedFile) formData.append("imageUrl", selectedFile);

      if (_id) {
        await axios.put(`/api/popup/${_id}`, formData, { headers: { ...authHeaders.headers, "Content-Type": "multipart/form-data" } });
        toast.success("Pop-up updated");
      } else {
        await axios.post(`/api/popup`, formData, { headers: { ...authHeaders.headers, "Content-Type": "multipart/form-data" } });
        toast.success("Pop-up created");
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving pop-up");
    } finally { setIsLoading(false); }
  };

  const handleEdit = (row) => {
    set_Id(row._id);
    setValues({
      title: row.title || "",
      type: row.type || "FIRST_VISIT",
      heading: row.heading || "",
      description: row.description || "",
      ctaText: row.ctaText || "Shop Now",
      ctaLink: row.ctaLink || "/",
      couponCode: row.couponCode || "",
      displayFrequency: row.displayFrequency || "ONCE",
      isActive: row.isActive ?? true,
      startDate: row.startDate ? row.startDate.substring(0, 10) : "",
      endDate: row.endDate ? row.endDate.substring(0, 10) : "",
      delaySeconds: row.delaySeconds || 3,
    });
    if (row.imageUrl) setImagePreview(row.imageUrl);
    setShowForm(true);
    setUpdateForm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/popup/${remove_id}`, authHeaders);
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

  const typeBadge = { FIRST_VISIT: "primary", EXIT_INTENT: "warning", TIMED: "info" };

  const columns = [
    { name: "Title", selector: (r) => r.title, grow: 2, sortable: true },
    { name: "Type", cell: (r) => <Badge color={typeBadge[r.type] || "secondary"}>{r.type}</Badge>, width: "130px" },
    { name: "Frequency", selector: (r) => r.displayFrequency, width: "130px" },
    { name: "Coupon", selector: (r) => r.couponCode || "—", width: "120px" },
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

  document.title = "Pop-Up Management | SuperMerch Admin";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Pop-Up Management" pageTitle="CMS" />
          <Row>
            <Col lg={showForm ? 7 : 12}>
              <Card>
                <CardHeader className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0">Pop-Ups</h5>
                  <div className="d-flex gap-2">
                    <Input bsSize="sm" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
                      <i className="ri-add-line me-1"></i>Add Pop-Up
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
              <Col lg={5}>
                <Card>
                  <FormsHeader title={updateForm ? "Edit Pop-Up" : "Add Pop-Up"} handleClose={resetForm} />
                  <CardBody>
                    <Form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <Label>Title *</Label>
                        <Input name="title" value={values.title} onChange={handleChange} required />
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Type</Label>
                            <Input type="select" name="type" value={values.type} onChange={handleChange}>
                              <option value="FIRST_VISIT">First Visit</option>
                              <option value="EXIT_INTENT">Exit Intent</option>
                              <option value="TIMED">Timed</option>
                            </Input>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Frequency</Label>
                            <Input type="select" name="displayFrequency" value={values.displayFrequency} onChange={handleChange}>
                              <option value="ONCE">Once</option>
                              <option value="EVERY_VISIT">Every Visit</option>
                              <option value="ONCE_PER_DAY">Once Per Day</option>
                            </Input>
                          </div>
                        </Col>
                      </Row>
                      <div className="mb-3">
                        <Label>Heading</Label>
                        <Input name="heading" value={values.heading} onChange={handleChange} />
                      </div>
                      <div className="mb-3">
                        <Label>Description</Label>
                        <Input type="textarea" name="description" value={values.description} onChange={handleChange} rows={3} />
                      </div>
                      <div className="mb-3">
                        <Label>Image</Label>
                        <Input type="file" accept="image/*" onChange={handleImageChange} innerRef={imageRef} />
                        {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 rounded" style={{ maxHeight: 120 }} />}
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>CTA Text</Label>
                            <Input name="ctaText" value={values.ctaText} onChange={handleChange} />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>CTA Link</Label>
                            <Input name="ctaLink" value={values.ctaLink} onChange={handleChange} />
                          </div>
                        </Col>
                      </Row>
                      <div className="mb-3">
                        <Label>Coupon Code</Label>
                        <Input name="couponCode" value={values.couponCode} onChange={handleChange} placeholder="Optional" />
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Start Date</Label>
                            <Input type="date" name="startDate" value={values.startDate} onChange={handleChange} />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>End Date</Label>
                            <Input type="date" name="endDate" value={values.endDate} onChange={handleChange} />
                          </div>
                        </Col>
                      </Row>
                      <div className="mb-3">
                        <Label>Delay (seconds)</Label>
                        <Input type="number" name="delaySeconds" value={values.delaySeconds} onChange={handleChange} min={0} />
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

export default PopUpManagement;
