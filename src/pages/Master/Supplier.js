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
  Button,
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
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import ExportButtons from "../../Components/Common/ExportButtons";
import tableCustomStyles from "../../Components/Common/tableStyles";
import {
  getSupplierMargins,
  addSupplierMargin,
  deleteSupplierMargin,
} from "../../functions/Pricing/marginFunc";
import {
  getSupplierDiscounts,
  addSupplierDiscount,
} from "../../functions/Pricing/discountFunc";

const Supplier = () => {
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
    code: "",
    email: "",
    phone: "",
    address: "",
    apiEndpoint:"",
    apiKey:"",
    requestType: "",
    requestBody: "",
    responseType: "",
    isActive: true,
  };

  // Remove file-related states - no longer needed
  
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

  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

  // ── Inline margin/discount states ──
  const [marginMap, setMarginMap] = useState({});       // { supplierId: margin% }
  const [discountMap, setDiscountMap] = useState({});    // { supplierId: discount% }
  const [marginInputs, setMarginInputs] = useState({});
  const [discountInputs, setDiscountInputs] = useState({});

  const {currentPagePermissions} = useContext(MenuContext);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "70px",
    },
    {
      name: "Name",
      cell: (row) => <span className="text-wrap">{row.name}</span>,
      minWidth: "160px",
    },
    {
      name: "Code",
      cell: (row) => <span className="text-wrap">{row.code}</span>,
      sortable: true,
      minWidth: "140px",
    },
    {
      name: "Email",
      cell: (row) => <span className="text-wrap">{row.email}</span>,
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Margin %",
      width: "200px",
      cell: (row) => {
        const sid = row._id;
        const existing = marginMap[sid];
        return (
          <div className="d-flex align-items-center gap-1">
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 70 }}
              step="0.01"
              min="0"
              placeholder="%"
              value={marginInputs[sid] ?? ""}
              onChange={(e) =>
                setMarginInputs((prev) => ({ ...prev, [sid]: e.target.value }))
              }
            />
            <Button color="success" size="sm" className="btn-icon" onClick={() => handleMarginSave(sid)} title="Save">
              <i className="ri-save-line"></i>
            </Button>
            {existing !== undefined && (
              <Button color="soft-danger" size="sm" className="btn-icon" onClick={() => handleMarginDelete(sid)} title="Remove">
                <i className="ri-delete-bin-line"></i>
              </Button>
            )}
          </div>
        );
      },
    },
    {
      name: "Discount %",
      width: "200px",
      cell: (row) => {
        const sid = row._id;
        const existing = discountMap[sid];
        return (
          <div className="d-flex align-items-center gap-1">
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 70 }}
              step="0.01"
              min="0"
              placeholder="%"
              value={discountInputs[sid] ?? ""}
              onChange={(e) =>
                setDiscountInputs((prev) => ({ ...prev, [sid]: e.target.value }))
              }
            />
            <Button color="success" size="sm" className="btn-icon" onClick={() => handleDiscountSave(sid)} title="Save">
              <i className="ri-save-line"></i>
            </Button>
            {existing !== undefined && (
              <Badge color="soft-info" className="text-info ms-1">{existing}%</Badge>
            )}
          </div>
        );
      },
    },
  ];

  const fetchSupplierMaster = useCallback(async () => {
    setLoading(true);
     let params = {
      page: pageNo || 1,
      limit: perPage,
      isActive: filter,
    };

    if (query) {
      params.search = query;
    }
    try {
      const response = await axios.get('/api/listbyparams/suppliers', {
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
      console.error('Error fetching menu groups:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, column, sortDirection, query, filter]);

  // ── Fetch supplier margins & discounts ──
  const fetchMargins = useCallback(async () => {
    try {
      const res = await getSupplierMargins({ limit: 10000 });
      const list = res.data?.data || [];
      const mMap = {};
      const mInputs = {};
      list.forEach((item) => {
        mMap[item.supplierId] = item.margin;
        mInputs[item.supplierId] = item.margin;
      });
      setMarginMap(mMap);
      setMarginInputs(mInputs);
    } catch (err) {
      console.error("Error fetching supplier margins:", err);
    }
  }, []);

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await getSupplierDiscounts({ limit: 10000 });
      const list = res.data?.data || [];
      const dMap = {};
      const dInputs = {};
      list.forEach((item) => {
        dMap[item.supplierId] = item.discount;
        dInputs[item.supplierId] = item.discount;
      });
      setDiscountMap(dMap);
      setDiscountInputs(dInputs);
    } catch (err) {
      console.error("Error fetching supplier discounts:", err);
    }
  }, []);

  useEffect(() => {
    fetchSupplierMaster();
  }, [fetchSupplierMaster]);

  useEffect(() => {
    fetchMargins();
    fetchDiscounts();
  }, [fetchMargins, fetchDiscounts]);

  // ── Inline margin/discount handlers ──
  const handleMarginSave = async (supplierId) => {
    const val = parseFloat(marginInputs[supplierId]);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid margin %");
      return;
    }
    try {
      const res = await addSupplierMargin({ supplierId, margin: val });
      if (res.data?.success !== false) {
        toast.success("Supplier margin saved");
        setMarginMap((prev) => ({ ...prev, [supplierId]: val }));
      }
    } catch (err) {
      toast.error("Failed to save margin");
    }
  };

  const handleMarginDelete = async (supplierId) => {
    try {
      const res = await deleteSupplierMargin({ supplierId });
      if (res.data?.success !== false) {
        toast.success("Supplier margin removed");
        setMarginMap((prev) => { const n = { ...prev }; delete n[supplierId]; return n; });
        setMarginInputs((prev) => { const n = { ...prev }; delete n[supplierId]; return n; });
      }
    } catch (err) {
      toast.error("Failed to delete margin");
    }
  };

  const handleDiscountSave = async (supplierId) => {
    const val = parseFloat(discountInputs[supplierId]);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid discount %");
      return;
    }
    try {
      const res = await addSupplierDiscount({ supplierId, discount: val });
      if (res.data?.success !== false) {
        toast.success("Supplier discount saved");
        setDiscountMap((prev) => ({ ...prev, [supplierId]: val }));
      }
    } catch (err) {
      toast.error("Failed to save discount");
    }
  };

  // ── Export columns & fetchAll for ExportButtons ──
  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Code", key: "code" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Address", key: "address" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const res = await axios.get("/api/listbyparams/suppliers", {
        params: { page: 1, limit: 10000, isActive: filter },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.data?.data || data;
    } catch {
      return data;
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email))
      errors.email = "Invalid email address";
    if (!values.email) errors.email = "Email is required";
    if( values.phone && values.phone.length !==10 ) errors.phone = "Phone number must be 10 digits";
    if(values.apiEndpoint && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(values.apiEndpoint)) errors.apiEndpoint = "Invalid API endpoint";
    return errors;
  };

  const handleClick = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const supplierData = {
        name: values.name,
        code: values.code,
        email: values.email,
        phone: values.phone,
        address: values.address,
        apiEndpoint: values.apiEndpoint,
        apiKey: values.apiKey,
        isActive: values.isActive,
      };
      
      const response = await axios.post(
        `/api/suppliers`,
        supplierData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Supplier Added Successfully");
        setShowForm(false);
        setValues(initialState);  
        setIsSubmit(false);
        setFormErrors({});
        fetchSupplierMaster();
      } else {
        toast.error(response.data.message || "Cannot add Supplier");
      }
      setIsLoading(false);
    }
  };

  const handleUpdate = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const supplierData = {
        name: values.name,
        code: values.code,
        email: values.email,
        phone: values.phone,
        address: values.address,
        apiEndpoint: values.apiEndpoint,
        apiKey: values.apiKey,
        requestType: values.requestType,
        requestBody: values.requestBody,
        responseType: values.responseType,
        isActive: values.isActive,
      };
      

      const response = await axios.put(
        `/api/suppliers/${_id}`,
        supplierData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        toast.success("Supplier Updated Successfully");
        setUpdateForm(false);
        setShowForm(false);
        setValues(initialState);  
        setIsSubmit(false);
        setFormErrors({});
        fetchSupplierMaster();
      }
      else {
        toast.error(response.data.message || "Cannot update Employee");
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

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/suppliers/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Supplier Deleted Successfully");
            fetchSupplierMaster();
        } else {
            toast.error(response.data.message || "Cannot delete Supplier");
        }
        setIsDeleteLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle reference error
            setReferenceData(error.response.data);
            setReferenceModal(true);
        } else {
        toast.error("Failed to delete country. Please try again.");
        }
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
      const response = await axios.get(`/api/suppliers/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const supplier = response.data.data;
        const generatedCode = supplier.name ? supplier.name.trim().toUpperCase().replace(/\s+/g, '_') : supplier.code || "";
        setValues({
          name: supplier.name || "",
          code: generatedCode,
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
          apiEndpoint: supplier.apiEndpoint || "",
          apiKey: supplier.apiKey || "",
          requestType: supplier.requestType || "",
          requestBody: supplier.requestBody || "",
          responseType: supplier.responseType || "",
          isActive: supplier.isActive,
        });
        setShowForm(true);
      } else {
        toast.error("Failed to fetch supplier details");
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

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if(name==="phone"){
        newValue = newValue.replace(/\D/g, ''); // Remove non-numeric characters
    }
    
    // Auto-generate code based on name
    if (name === "name") {
      const generatedCode = value.trim().toUpperCase().replace(/\s+/g, '_');
      setValues({ ...values, [name]: newValue, code: generatedCode });
    } else {
      setValues({ ...values, [name]: newValue });
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

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Row>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.name}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="code"
                          value={values.code}
                          onChange={handleChange}
                          disabled
                          readOnly
                        />
                        <label className="form-label">
                          Code <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.code}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Email <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.email}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="phone"
                          value={values.phone}
                          onChange={handleChange}
                          maxLength={10}
                          minLength={10}
                        />
                        <label className="form-label">
                          Phone
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.phone}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          required
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Address
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.address}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="apiEndpoint"
                          className="form-control"
                          required
                          name="apiEndpoint"
                          value={values.apiEndpoint}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          API Endpoint
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.apiEndpoint}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="apiKey"
                          value={values.apiKey}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          API Key
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.apiKey}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-select"
                          name="requestType"
                          value={values.requestType}
                          onChange={handleChange}
                        >
                          <option value="">Select Request Type</option>
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                        </select>
                        <label className="form-label">
                          Request Type
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.requestType}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <select
                          className="form-select"
                          name="responseType"
                          value={values.responseType}
                          onChange={handleChange}
                        >
                          <option value="">Select Response Type</option>
                          <option value="JSON">JSON</option>
                          <option value="CSV">CSV</option>
                        </select>
                        <label className="form-label">
                          Response Type
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.responseType}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="requestBody"
                          value={values.requestBody}
                          onChange={handleChange}
                          style={{ minHeight: "100px" }}
                        />
                        <label className="form-label">
                          Request Body
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.requestBody}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="mt-5">
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
                          <Label className="form-check-label">
                            Is Active
                          </Label>
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
  
  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
  }

  document.title = `Supplier | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Supplier" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <FormsHeader
                      formName="Supplier"
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
                    <ExportButtons
                      data={data}
                      columns={exportColumns}
                      fileName="suppliers"
                      fetchAll={fetchAllForExport}
                    />
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="table-responsive table-card mt-1 mb-1 text-right">
                    <DataTable
                      columns={columns}
                      data={data}
                      customStyles={tableCustomStyles}
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
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Supplier;
