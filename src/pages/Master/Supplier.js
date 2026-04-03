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
  Row
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

  const {currentPagePermissions} = useContext(MenuContext);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "20px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      maxWidth: "200px",
    },
    {
      name: "Code",
      selector: (row) => <p className="text-wrap">{row.code}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Email",
      selector: (row) => <p className="text-wrap">{row.email}</p>,
      sortable: true,
      maxWidth: "250px",
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

  useEffect(() => {
    fetchSupplierMaster();
  }, [fetchSupplierMaster]);

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
                </CardHeader>

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
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Supplier;
