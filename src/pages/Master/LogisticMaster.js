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
  Row
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import PageHeader from "../../Components/Common/PageHeader";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import config from "../../config";

const apiUrl = config.api.API_URL;

const LogisticMaster = () => {
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
    logoUrl: "",
    isActive: true,
  };

  // File upload related states
  const [selectedFile, setSelectedFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [showFileInput, setShowFileInput] = useState(true);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const imageRef = useRef(null);
  
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

  const {currentPagePermissions} = useContext(MenuContext);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "20px",
    },
    {
      name: "Logo",
      selector: (row) => (
        row.logoUrl ? (
          <img
            src={`${apiUrl}/${row.logoUrl}`}
            alt={row.name}
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
        ) : (
          <span className="text-muted">-</span>
        )
      ),
      maxWidth: "80px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Code",
      selector: (row) => <p className="text-wrap">{row.code}</p>,
      sortable: true,
      maxWidth: "150px",
    },
    {
      name: "Status",
      selector: (row) => (
        <span className={`badge ${row.isActive ? 'bg-success' : 'bg-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      sortable: true,
      maxWidth: "100px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && <button
              className="btn btn-sm btn-success edit-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#showModal"
              onClick={() => handleTog_edit(row.id)}
            >
              Edit
            </button>}
            {currentPagePermissions.delete && <button
              className="btn btn-sm btn-danger remove-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#deleteRecordModal"
              onClick={() => tog_delete(row.id)}
            >
              Remove
            </button>}
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

  const fetchLogisticMaster = useCallback(async () => {
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
      const response = await axios.get('/api/listbyparams/logistics', {
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
      console.error('Error fetching logistics:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchLogisticMaster();
  }, [fetchLogisticMaster]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (!values.code) errors.code = "Code is required";
    return errors;
  };

  const handleClick = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('code', values.code);
      formData.append('isActive', values.isActive);
      
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }
      
      try {
        const response = await axios.post(
          `/api/logistics`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Logistic Added Successfully");
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedFile(null);
          setLogoPreview("");
          setShowFileInput(true);
          setLogoRemoved(false);
          fetchLogisticMaster();
        } else {
          toast.error(response.data.message || "Cannot add Logistic");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding logistic");
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
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('code', values.code);
      formData.append('isActive', values.isActive);
      
      // Handle logo removal
      if (logoRemoved) {
        formData.append('removeLogo', 'true');
      }
      
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      try {
        const response = await axios.put(
          `/api/logistics/${_id}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success("Logistic Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedFile(null);
          setLogoPreview("");
          setShowFileInput(true);
          setLogoRemoved(false);
          fetchLogisticMaster();
        }
        else {
          toast.error(response.data.message || "Cannot update Logistic");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating logistic");
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
    setSelectedFile(null);
    setLogoPreview("");
    setShowFileInput(true);
    setLogoRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/logistics/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Logistic Deleted Successfully");
            fetchLogisticMaster();
        } else {
            toast.error(response.data.message || "Cannot delete Logistic");
        }
        setIsDeleteLoading(false);
    } catch (error) {
        toast.error("Failed to delete logistic. Please try again.");
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
      const response = await axios.get(`/api/logistics/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const logistic = response.data.data;
        setValues({
          name: logistic.name || "",
          code: logistic.code || "",
          logoUrl: logistic.logoUrl || "",
          isActive: logistic.isActive,
        });
        setShowForm(true);
        setSelectedFile(null);
        setLogoPreview("");
        setShowFileInput(true);
        setLogoRemoved(false);
      } else {
        toast.error("Failed to fetch logistic details");
      }
    } catch (err) {
      console.log(err);
      toast.error("Error fetching logistic details");
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
    let newValue = value;
    
    // Auto-generate code based on name (uppercase, no spaces)
    if (name === "name") {
      const generatedCode = value.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 200KB as per requirement)
      if (file.size > 200 * 1024) {
        toast.error("Logo file size must be less than 200KB");
        return;
      }
      setSelectedFile(file);
      setLogoRemoved(false);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setValues({ ...values, logoUrl: "" });
    setSelectedFile(null);
    setLogoPreview("");
    setShowFileInput(true);
    setLogoRemoved(true);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
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
                    <Col lg={4}>
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
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="code"
                          value={values.code}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Code <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.code}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="mb-3">
                        <Label className="form-label">Logo (Max 200KB, will be compressed to ~10KB)</Label>
                        <div className="d-flex flex-column">
                          {values.logoUrl && !selectedFile && !logoRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.logoUrl}`}
                                alt="Current Logo"
                                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ms-2"
                                onClick={handleRemoveLogo}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {logoRemoved && !selectedFile && (
                            <div className="mb-2">
                              <span className="text-muted">Logo will be removed when you save</span>
                            </div>
                          )}
                          {logoPreview && selectedFile && (
                            <div className="mb-2">
                              <img
                                src={logoPreview}
                                alt="Logo Preview"
                                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          {showFileInput && (
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleFileChange}
                              ref={imageRef}
                            />
                          )}
                        </div>
                        {isSubmit && formErrors.logoUrl && (
                          <p className="text-danger">{formErrors.logoUrl}</p>
                        )}
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
    setSelectedFile(null);
    setLogoPreview("");
    setShowFileInput(true);
    setLogoRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  }

  document.title = `Logistic Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Logistic" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Logistic"
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

                {(showForm || updateForm) ? (
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

export default LogisticMaster;
