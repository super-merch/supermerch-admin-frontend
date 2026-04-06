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
import { ColorPicker } from "@vtaits/react-color-picker";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const Color = () => {
  const { adminData } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");
  const [multipleColor, setMultipleColor] = useState(false);

  const initialState = {
    name: "",
    primaryCode: "",
    primaryHexCode: "#000000",
    primaryPantoneCode: "",
    secondaryCode: "",
    secondaryHexCode: "#FFFFFF",
    secondaryPantoneCode: "",
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
      minWidth: "80px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      minWidth: "150px",
    },
    {
      name: "Primary Code",
      selector: (row) => <p className="text-wrap">{row.primaryCode}</p>,
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Primary Color",
      selector: (row) => (
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: row.primaryHexCode || "#000000",
              border: "1px solid #ccc",
              marginRight: "8px"
            }}
          ></div>
          <span>{row.primaryHexCode}</span>
        </div>
      ),
      sortable: false,
      minWidth: "150px",
    },
    {
      name: "Secondary Code",
      selector: (row) => <p className="text-wrap">{row.secondaryCode || "-"}</p>,
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Secondary Color",
      selector: (row) => (
        row.secondaryHexCode ? (
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: row.secondaryHexCode,
                border: "1px solid #ccc",
                marginRight: "8px"
              }}
            ></div>
            <span>{row.secondaryHexCode}</span>
          </div>
        ) : <span>-</span>
      ),
      sortable: false,
      minWidth: "150px",
    },
  ];

  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Primary Code", key: "primaryCode" },
    { header: "Primary Hex", key: "primaryHexCode" },
    { header: "Primary Pantone", key: "primaryPantoneCode" },
    { header: "Secondary Code", key: "secondaryCode" },
    { header: "Secondary Hex", key: "secondaryHexCode" },
    { header: "Secondary Pantone", key: "secondaryPantoneCode" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const response = await axios.get('/api/list-colors-by-params', {
        params: { page: 1, limit: 10000, isActive: filter },
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Export fetch error:", error);
      return [];
    }
  };

  const fetchColorMaster = useCallback(async () => {
    setLoading(true);
     let params = {
      page: pageNo + 1,
      limit: perPage,
      isActive: filter,
    };

    if (query) {
      params.search = query;
    }
    try {
      const response = await axios.get('/api/list-colors-by-params', {
        params,
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setData(response.data.data);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter, adminData.token]);

  useEffect(() => {
    fetchColorMaster();
  }, [fetchColorMaster]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (!values.primaryCode) errors.primaryCode = "Primary code is required";
    if (!values.primaryHexCode) errors.primaryHexCode = "Primary hex code is required";
    if (multipleColor && !values.secondaryCode) errors.secondaryCode = "Secondary code is required when multiple color is enabled";
    if (multipleColor && !values.secondaryHexCode) errors.secondaryHexCode = "Secondary hex code is required when multiple color is enabled";
    return errors;
  };

  const handleClick = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create color data object
      const colorData = {
        name: values.name,
        primaryCode: values.primaryCode,
        primaryHexCode: values.primaryHexCode,
        primaryPantoneCode: values.primaryPantoneCode,
        isActive: values.isActive,
      };

      // Add secondary color fields only if multipleColor is enabled
      if (multipleColor) {
        colorData.secondaryCode = values.secondaryCode;
        colorData.secondaryHexCode = values.secondaryHexCode;
        colorData.secondaryPantoneCode = values.secondaryPantoneCode;
      }
      
      try {
        const response = await axios.post(
          `/api/create-color`,
          colorData
        );

        if (response.data.success) {
          toast.success(response.data.message || "Color Added Successfully");
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setMultipleColor(false);
          fetchColorMaster();
        } else {
          toast.error(response.data.message || "Failed to add color");
        }
      } catch (error) {
        console.error("Error creating color:", error);
        toast.error("Failed to add color");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdate = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create color data object
      const colorData = {
        name: values.name,
        primaryCode: values.primaryCode,
        primaryHexCode: values.primaryHexCode,
        primaryPantoneCode: values.primaryPantoneCode,
        isActive: values.isActive,
      };

      // Add secondary color fields only if multipleColor is enabled
      if (multipleColor) {
        colorData.secondaryCode = values.secondaryCode;
        colorData.secondaryHexCode = values.secondaryHexCode;
        colorData.secondaryPantoneCode = values.secondaryPantoneCode;
      }

      try {
        const response = await axios.put(
          `/api/update-color/${_id}`,
          colorData,
        );

        if (response.data.success) {
          toast.success("Color Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setMultipleColor(false);
          fetchColorMaster();
        } else {
          toast.error(response.data.message || "Cannot update Color");
        }
      } catch (error) {
        console.error("Error updating color:", error);
        toast.error("Failed to update color");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setFormErrors({});
    setMultipleColor(false);
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/delete-color/${remove_id}`
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Color Deleted Successfully");
            fetchColorMaster();
        } else {
            toast.error(response.data.message || "Cannot delete Color");
        }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle reference error
        setReferenceData(error.response.data);
        setReferenceModal(true);
      } else {
        toast.error("Failed to delete color. Please try again.");
      }
    } finally {
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
      const response = await axios.get(`/api/get-color/${_id}`); 

      if (response.data.success) {
        const color = response.data.data;
        setValues({
          name: color.name || "",
          primaryCode: color.primaryCode || "",
          primaryHexCode: color.primaryHexCode || "#000000",
          primaryPantoneCode: color.primaryPantoneCode || "",
          secondaryCode: color.secondaryCode || "",
          secondaryHexCode: color.secondaryHexCode || "#FFFFFF",
          secondaryPantoneCode: color.secondaryPantoneCode || "",
          isActive: color.isActive,
        });
        
        // Enable multiple color if secondary fields are present
        if (color.secondaryCode || color.secondaryHexCode) {
          setMultipleColor(true);
        }
        
        setShowForm(true);
      } else {
        toast.error("Failed to fetch color details");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch color details");
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
    
    // Auto-generate primary code based on name
    if (name === "name") {
      const generatedCode = value.trim().toUpperCase().replace(/\s+/g, '_');
      setValues({ ...values, [name]: value, primaryCode: generatedCode });
    } else {
      setValues({ ...values, [name]: value });
    }
  };

  const handleColorChange = (colorType, color) => {
    const hexColor = typeof color === 'string' ? color : color.hex;
    setValues({ ...values, [colorType]: hexColor });
  };

  const handleMultipleColorToggle = (e) => {
    const isChecked = e.target.checked;
    setMultipleColor(isChecked);
    
    // Clear secondary fields when toggling off
    if (!isChecked) {
      setValues({
        ...values,
        secondaryCode: "",
        secondaryHexCode: "#FFFFFF",
        secondaryPantoneCode: ""
      });
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
                  {/* Basic Information */}
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
                        Color Name <span className="text-danger"> *</span>
                      </label>
                      {isSubmit && (
                        <p className="text-danger">{formErrors.name}</p>
                      )}
                    </div>
                  </Col>
                  
                  {/* Multiple Color Toggle */}
                  <Col lg={4}>
                    <div className="form-check mb-3 mt-4">
                      <Input
                        type="checkbox"
                        name="multipleColor"
                        checked={multipleColor}
                        onChange={handleMultipleColorToggle}
                      />
                      <Label className="form-check-label">
                        Multiple Color
                      </Label>
                    </div>
                  </Col>

                  {/* Primary Color Fields */}
                  <Col lg={12}>
                    <h5 className="mb-3">Primary Color</h5>
                  </Col>
                  
                  <Col lg={3}>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className="form-control"
                        required
                        name="primaryCode"
                        value={values.primaryCode}
                        onChange={handleChange}
                        readOnly
                      />
                      <label className="form-label">
                        Primary Code <span className="text-danger"> *</span>
                      </label>
                      {isSubmit && (
                        <p className="text-danger">{formErrors.primaryCode}</p>
                      )}
                    </div>
                  </Col>

                  <Col lg={3}>
                    <div className="mb-3">
                      <label className="form-label">
                        Primary Hex Color <span className="text-danger"> *</span>
                      </label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={values.primaryHexCode}
                          onChange={(e) => handleColorChange('primaryHexCode', e.target.value)}
                          style={{ width: '60px', height: '38px' }}
                        />
                        <input
                          type="text"
                          className="form-control"
                          name="primaryHexCode"
                          value={values.primaryHexCode}
                          onChange={handleChange}
                          placeholder="#000000"
                        />
                      </div>
                      {isSubmit && (
                        <p className="text-danger">{formErrors.primaryHexCode}</p>
                      )}
                    </div>
                  </Col>

                  <Col lg={3}>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className="form-control"
                        name="primaryPantoneCode"
                        value={values.primaryPantoneCode}
                        onChange={handleChange}
                        placeholder="Pantone Code"
                      />
                      <label className="form-label">
                        Primary Pantone Code
                      </label>
                    </div>
                  </Col>

                  {/* Secondary Color Fields - Only show when multipleColor is enabled */}
                  {multipleColor && (
                    <>
                      <Col lg={12}>
                        <h5 className="mb-3 mt-4">Secondary Color</h5>
                      </Col>
                      
                      <Col lg={3}>
                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            name="secondaryCode"
                            value={values.secondaryCode}
                            onChange={handleChange}
                            placeholder="Secondary Code"
                          />
                          <label className="form-label">
                            Secondary Code {multipleColor && <span className="text-danger"> *</span>}
                          </label>
                          {isSubmit && (
                            <p className="text-danger">{formErrors.secondaryCode}</p>
                          )}
                        </div>
                      </Col>

                      <Col lg={3}>
                        <div className="mb-3">
                          <label className="form-label">
                            Secondary Hex Color {multipleColor && <span className="text-danger"> *</span>}
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="color"
                              className="form-control form-control-color"
                              value={values.secondaryHexCode}
                              onChange={(e) => handleColorChange('secondaryHexCode', e.target.value)}
                              style={{ width: '60px', height: '38px' }}
                            />
                            <input
                              type="text"
                              className="form-control"
                              name="secondaryHexCode"
                              value={values.secondaryHexCode}
                              onChange={handleChange}
                              placeholder="#FFFFFF"
                            />
                          </div>
                          {isSubmit && (
                            <p className="text-danger">{formErrors.secondaryHexCode}</p>
                          )}
                        </div>
                      </Col>

                      <Col lg={3}>
                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            name="secondaryPantoneCode"
                            value={values.secondaryPantoneCode}
                            onChange={handleChange}
                            placeholder="Pantone Code"
                          />
                          <label className="form-label">
                            Secondary Pantone Code
                          </label>
                        </div>
                      </Col>
                    </>
                  )}
                  
                  {/* Status */}
                  <div className="mt-4">
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
    setMultipleColor(false);
  }

  document.title = `Color | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Color" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex align-items-center justify-content-between">
                    <FormsHeader
                      formName="Color"
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
                      fileName="colors"
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

export default Color;
