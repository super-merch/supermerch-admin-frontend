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
  Button,
  Table
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
import config from "../../config";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const apiUrl = config.api.API_URL;

const CustomizationPosition = () => {
  const { adminData } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    positionName: "",
    positionCode: "",
    description: "",
    imageUrl: "",
    maxWidth: "",
    maxHeight: "",
    sortOrder: 0,
    isActive: true,
    pricingTiers: [
      { minQuantity: 1, maxQuantity: 8, pricePerApplication: 0 }
    ],
  };

  // File upload related states
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showImageInput, setShowImageInput] = useState(true);
  const [imageRemoved, setImageRemoved] = useState(false);
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

  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

  const {currentPagePermissions} = useContext(MenuContext);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Position Name",
      selector: (row) => <p className="text-wrap">{row.positionName}</p>,
    },
    {
      name: "Position Code",
      selector: (row) => <p className="text-wrap">{row.positionCode}</p>,
      sortable: true,
    },
    {
      name: "Image",
      selector: (row) => (
        <div>
          {row.imageUrl ? (
            <img
              src={`${apiUrl}/${row.imageUrl}`}
              alt={row.positionName}
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
            />
          ) : (
            "-"
          )}
        </div>
      ),
      sortable: false,
    },
    {
      name: "Max Dimensions",
      selector: (row) => (
        <p className="text-wrap">
          {row.maxWidth && row.maxHeight
            ? `${row.maxWidth} x ${row.maxHeight}`
            : "-"}
        </p>
      ),
      sortable: false,
    },
    {
      name: "Sort Order",
      selector: (row) => <p className="text-wrap">{row.sortOrder}</p>,
      sortable: true,
    },
    {
      name: "Pricing Tiers",
      selector: (row) => (
        <div className="text-wrap">
          {row.pricingTiers && row.pricingTiers.length > 0
            ? `${row.pricingTiers.length} tier(s)`
            : "No tiers"}
        </div>
      ),
      sortable: false,
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

  const exportColumns = [
    { header: "Position Name", key: "positionName" },
    { header: "Position Code", key: "positionCode" },
    { header: "Description", key: "description" },
    { header: "Max Width", key: "maxWidth" },
    { header: "Max Height", key: "maxHeight" },
    { header: "Sort Order", key: "sortOrder" },
    { header: "Is Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    const response = await axios.get('/api/listbyparams/customization-positions', {
      params: { page: 1, limit: 10000, isActive: filter, search: query },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data.data || [];
  };

  const fetchCustomizationPositions = useCallback(async () => {
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
      const response = await axios.get('/api/listbyparams/customization-positions', {
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
      console.error('Error fetching customization positions:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchCustomizationPositions();
  }, [fetchCustomizationPositions]);

  const validate = (values) => {
    const errors = {};
    if (!values.positionName) errors.positionName = "Position name is required";
    if (!values.positionCode) errors.positionCode = "Position code is required";
    if (!values.sortOrder && values.sortOrder !== 0) {
      errors.sortOrder = "Sort order is required";
    } else if (isNaN(values.sortOrder) || values.sortOrder < 0) {
      errors.sortOrder = "Sort order must be a non-negative number";
    }
    if (values.maxWidth && (isNaN(values.maxWidth) || values.maxWidth < 0)) {
      errors.maxWidth = "Max width must be a positive number";
    }
    if (values.maxHeight && (isNaN(values.maxHeight) || values.maxHeight < 0)) {
      errors.maxHeight = "Max height must be a positive number";
    }
    
    // Validate pricing tiers
    if (!values.pricingTiers || values.pricingTiers.length === 0) {
      errors.pricingTiers = "At least one pricing tier is required";
    } else {
      const tierErrors = [];
      values.pricingTiers.forEach((tier, index) => {
        const tierError = {};
        if (!tier.minQuantity && tier.minQuantity !== 0) {
          tierError.minQuantity = "Min quantity is required";
        } else if (isNaN(tier.minQuantity) || tier.minQuantity < 0) {
          tierError.minQuantity = "Min quantity must be non-negative";
        }
        if (tier.maxQuantity && (isNaN(tier.maxQuantity) || tier.maxQuantity < 0)) {
          tierError.maxQuantity = "Max quantity must be positive";
        }
        if (tier.minQuantity && tier.maxQuantity && parseInt(tier.minQuantity) >= parseInt(tier.maxQuantity)) {
          tierError.maxQuantity = "Max quantity must be greater than min quantity";
        }
        if (!tier.pricePerApplication && tier.pricePerApplication !== 0) {
          tierError.pricePerApplication = "Price is required";
        } else if (isNaN(tier.pricePerApplication) || tier.pricePerApplication < 0) {
          tierError.pricePerApplication = "Price must be non-negative";
        }
        if (Object.keys(tierError).length > 0) {
          tierErrors[index] = tierError;
        }
      });
      if (tierErrors.length > 0) {
        errors.pricingTiersErrors = tierErrors;
      }
    }
    
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
      formData.append('positionName', values.positionName);
      formData.append('positionCode', values.positionCode);
      formData.append('description', values.description || '');
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      
      if (values.maxWidth) {
        formData.append('maxWidth', values.maxWidth);
      }
      if (values.maxHeight) {
        formData.append('maxHeight', values.maxHeight);
      }
      
      if (selectedImageFile) {
        formData.append('imageUrl', selectedImageFile);
      }
      
      // Add pricing tiers as JSON string
      formData.append('pricingTiers', JSON.stringify(values.pricingTiers));
      
      try {
        const response = await axios.post(
          `/api/customization-positions`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Customization Position Added Successfully");
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setImagePreview("");
          setShowImageInput(true);
          setImageRemoved(false);
          fetchCustomizationPositions();
        } else {
          toast.error(response.data.message || "Cannot add Customization Position");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding customization position");
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
      formData.append('positionName', values.positionName);
      formData.append('positionCode', values.positionCode);
      formData.append('description', values.description || '');
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      
      if (values.maxWidth) {
        formData.append('maxWidth', values.maxWidth);
      }
      if (values.maxHeight) {
        formData.append('maxHeight', values.maxHeight);
      }
      
      // Handle image removal
      if (imageRemoved) {
        formData.append('removeImage', 'true');
      }
      
      if (selectedImageFile) {
        formData.append('imageUrl', selectedImageFile);
      }
      
      // Add pricing tiers as JSON string
      formData.append('pricingTiers', JSON.stringify(values.pricingTiers));

      try {
        const response = await axios.put(
          `/api/customization-positions/${_id}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success("Customization Position Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setImagePreview("");
          setShowImageInput(true);
          setImageRemoved(false);
          fetchCustomizationPositions();
        }
        else {
          toast.error(response.data.message || "Cannot update Customization Position");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating customization position");
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
    setSelectedImageFile(null);
    setImagePreview("");
    setShowImageInput(true);
    setImageRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/customization-positions/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Customization Position Deleted Successfully");
            fetchCustomizationPositions();
        } else {
            if(response.status === 409){
                setReferenceData(response.data);
                setReferenceModal(true);
            }else{
                toast.error(response.data.message || "Cannot delete Customization Position");
            }
        }
        setIsDeleteLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setReferenceData(error.response.data);
        setReferenceModal(true);
      } else {
        toast.error("Failed to delete customization position. Please try again.");
      }
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
      const response = await axios.get(`/api/customization-positions/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const position = response.data.data;
        setValues({
          positionName: position.positionName || "",
          positionCode: position.positionCode || "",
          description: position.description || "",
          imageUrl: position.imageUrl || "",
          maxWidth: position.maxWidth || "",
          maxHeight: position.maxHeight || "",
          sortOrder: position.sortOrder || 0,
          isActive: position.isActive,
          pricingTiers: position.pricingTiers && position.pricingTiers.length > 0 
            ? position.pricingTiers.map(tier => ({
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                pricePerApplication: tier.pricePerApplication
              }))
            : [{ minQuantity: 1, maxQuantity: 8, pricePerApplication: 0 }],
        });
        setShowForm(true);
        setSelectedImageFile(null);
        setImagePreview("");
        setShowImageInput(true);
        setImageRemoved(false);
      } else {
        toast.error("Failed to fetch customization position details");
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
    
    // Auto-generate position code based on position name
    if (name === "positionName") {
      const generatedCode = value.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      setValues({ ...values, [name]: newValue, positionCode: generatedCode });
    } else {
      setValues({ ...values, [name]: newValue });
    }
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...values.pricingTiers];
    newTiers[index][field] = value;
    setValues({ ...values, pricingTiers: newTiers });
  };

  const addPricingTier = () => {
    const lastTier = values.pricingTiers[values.pricingTiers.length - 1];
    const newMinQuantity = lastTier.maxQuantity ? parseInt(lastTier.maxQuantity) + 1 : parseInt(lastTier.minQuantity) + 10;
    setValues({
      ...values,
      pricingTiers: [
        ...values.pricingTiers,
        { minQuantity: newMinQuantity, maxQuantity: "", pricePerApplication: 0 }
      ]
    });
  };

  const removePricingTier = (index) => {
    if (values.pricingTiers.length > 1) {
      const newTiers = values.pricingTiers.filter((_, i) => i !== index);
      setValues({ ...values, pricingTiers: newTiers });
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

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setImageRemoved(false);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setValues({ ...values, imageUrl: "" });
    setSelectedImageFile(null);
    setImagePreview("");
    setShowImageInput(true);
    setImageRemoved(true);
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
                          name="positionName"
                          value={values.positionName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Position Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.positionName}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="positionCode"
                          value={values.positionCode}
                          onChange={handleChange}
                          disabled
                          readOnly
                        />
                        <label className="form-label">
                          Position Code <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.positionCode}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          required
                          name="sortOrder"
                          value={values.sortOrder}
                          onChange={handleChange}
                          min="0"
                        />
                        <label className="form-label">
                          Sort Order <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.sortOrder}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="description"
                          value={values.description}
                          onChange={handleChange}
                          style={{ minHeight: "80px" }}
                        />
                        <label className="form-label">Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          name="maxWidth"
                          value={values.maxWidth}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                        />
                        <label className="form-label">Max Width (mm)</label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.maxWidth}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="number"
                          className="form-control"
                          name="maxHeight"
                          value={values.maxHeight}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                        />
                        <label className="form-label">Max Height (mm)</label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.maxHeight}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Position Image</Label>
                        <div className="d-flex flex-column">
                          {values.imageUrl && !selectedImageFile && !imageRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.imageUrl}`}
                                alt="Current Image"
                                style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ms-2"
                                onClick={handleRemoveImage}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {imageRemoved && !selectedImageFile && (
                            <div className="mb-2">
                              <span className="text-muted">Image will be removed when you save</span>
                            </div>
                          )}
                          {imagePreview && selectedImageFile && (
                            <div className="mb-2">
                              <img
                                src={imagePreview}
                                alt="Image Preview"
                                style={{ width: '120px', height: '120px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          {showImageInput && (
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              ref={imageRef}
                            />
                          )}
                        </div>
                        {isSubmit && formErrors.imageUrl && (
                          <p className="text-danger">{formErrors.imageUrl}</p>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col lg={12}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5>Pricing Tiers</h5>
                        <Button 
                          color="primary" 
                          size="sm" 
                          onClick={addPricingTier}
                        >
                          <i className="ri-add-line"></i> Add Tier
                        </Button>
                      </div>
                      {isSubmit && formErrors.pricingTiers && (
                        <p className="text-danger">{formErrors.pricingTiers}</p>
                      )}
                      <div className="table-responsive">
                        <Table bordered>
                          <thead>
                            <tr>
                              <th>Min Quantity <span className="text-danger">*</span></th>
                              <th>Max Quantity</th>
                              <th>Price Per Application (A$) <span className="text-danger">*</span></th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.pricingTiers.map((tier, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={tier.minQuantity}
                                    onChange={(e) => handleTierChange(index, 'minQuantity', e.target.value)}
                                    min="0"
                                  />
                                  {isSubmit && formErrors.pricingTiersErrors && formErrors.pricingTiersErrors[index]?.minQuantity && (
                                    <small className="text-danger">{formErrors.pricingTiersErrors[index].minQuantity}</small>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={tier.maxQuantity || ""}
                                    onChange={(e) => handleTierChange(index, 'maxQuantity', e.target.value)}
                                    min="0"
                                    placeholder="Leave empty for unlimited"
                                  />
                                  {isSubmit && formErrors.pricingTiersErrors && formErrors.pricingTiersErrors[index]?.maxQuantity && (
                                    <small className="text-danger">{formErrors.pricingTiersErrors[index].maxQuantity}</small>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={tier.pricePerApplication}
                                    onChange={(e) => handleTierChange(index, 'pricePerApplication', e.target.value)}
                                    min="0"
                                    step="0.01"
                                  />
                                  {isSubmit && formErrors.pricingTiersErrors && formErrors.pricingTiersErrors[index]?.pricePerApplication && (
                                    <small className="text-danger">{formErrors.pricingTiersErrors[index].pricePerApplication}</small>
                                  )}
                                </td>
                                <td>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => removePricingTier(index)}
                                    disabled={values.pricingTiers.length === 1}
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
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
    setSelectedImageFile(null);
    setImagePreview("");
    setShowImageInput(true);
    setImageRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  }

  document.title = `Customization Position Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Customization Position" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <FormsHeader
                      formName="Customization Position"
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
                    <ExportButtons
                      data={data}
                      columns={exportColumns}
                      fileName="CustomizationPositions"
                      fetchAll={fetchAllForExport}
                    />
                  </div>
                </CardHeader>

                {(showForm || updateForm) ? (
                  renderForm()
                ) : (
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

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Customization Position"
        referenceData={referenceData}
      />
    </React.Fragment>
  );
};

export default CustomizationPosition;
