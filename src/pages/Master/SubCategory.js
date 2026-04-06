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

const SubCategory = () => {
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
    slug: "",
    mainCategoryId: "",
    shortDescription: "",
    image: "",
    icon: "",
    sortOrder: 0,
    isActive: true,
  };

  // File upload related states
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedIconFile, setSelectedIconFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [iconPreview, setIconPreview] = useState("");
  const [showImageInput, setShowImageInput] = useState(true);
  const [showIconInput, setShowIconInput] = useState(true);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [iconRemoved, setIconRemoved] = useState(false);
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

  // Main categories for dropdown
  const [mainCategories, setMainCategories] = useState([]);

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
      name: "Main Category",
      selector: (row) => <p className="text-wrap">{row.mainCategory?.name || '-'}</p>,
      minWidth: "150px",
    },
    {
      name: "Slug",
      selector: (row) => <p className="text-wrap">{row.slug}</p>,
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Image",
      selector: (row) => (
        <div>
          {row.image ? (
            <img
              src={`${apiUrl}/${row.image}`}
              alt={row.name}
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          ) : (
            "-"
          )}
        </div>
      ),
      sortable: false,
      minWidth: "120px",
    },
    {
      name: "Sort Order",
      selector: (row) => <p className="text-wrap">{row.sortOrder}</p>,
      sortable: true,
      minWidth: "120px",
    },
  ];

  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Main Category", key: "mainCategory.name" },
    { header: "Slug", key: "slug" },
    { header: "Sort Order", key: "sortOrder" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const response = await axios.get('/api/listbyparams/sub-categories', {
        params: { page: 1, limit: 10000, isActive: filter },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Export fetch error:", error);
      return [];
    }
  };

  const fetchSubCategoriesMaster = useCallback(async () => {
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
      const response = await axios.get('/api/listbyparams/sub-categories', {
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
      console.error('Error fetching sub categories:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchSubCategoriesMaster();
  }, [fetchSubCategoriesMaster]);

  // Fetch main categories for dropdown
  const fetchMainCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/main-categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setMainCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchMainCategories();
  }, [fetchMainCategories]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (!values.mainCategoryId) errors.mainCategoryId = "Main Category is required";
    if (!values.sortOrder && values.sortOrder !== 0) {
      errors.sortOrder = "Sort order is required";
    } else if (isNaN(values.sortOrder) || values.sortOrder < 0) {
      errors.sortOrder = "Sort order must be a non-negative number";
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
      formData.append('name', values.name);
      formData.append('slug', values.slug);
      formData.append('mainCategoryId', values.mainCategoryId);
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      if (selectedIconFile) {
        formData.append('icon', selectedIconFile);
      }
      
      try {
        const response = await axios.post(
          `/api/sub-categories`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Sub Category Added Successfully");
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setSelectedIconFile(null);
          setImagePreview("");
          setIconPreview("");
          setShowImageInput(true);
          setShowIconInput(true);
          setImageRemoved(false);
          setIconRemoved(false);
          fetchSubCategoriesMaster();
        } else {
          toast.error(response.data.message || "Cannot add Sub Category");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding sub category");
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
      formData.append('slug', values.slug);
      formData.append('mainCategoryId', values.mainCategoryId);
      formData.append('shortDescription', values.shortDescription);
      formData.append('sortOrder', values.sortOrder);
      formData.append('isActive', values.isActive);
      
      // Handle image removal
      if (imageRemoved) {
        formData.append('removeImage', 'true');
      }
      
      // Handle icon removal
      if (iconRemoved) {
        formData.append('removeIcon', 'true');
      }
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      if (selectedIconFile) {
        formData.append('icon', selectedIconFile);
      }

      try {
        const response = await axios.put(
          `/api/sub-categories/${_id}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success("Sub Category Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setSelectedIconFile(null);
          setImagePreview("");
          setIconPreview("");
          setShowImageInput(true);
          setShowIconInput(true);
          setImageRemoved(false);
          setIconRemoved(false);
          fetchSubCategoriesMaster();
        }
        else {
          toast.error(response.data.message || "Cannot update Sub Category");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating sub category");
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
    setSelectedIconFile(null);
    setImagePreview("");
    setIconPreview("");
    setShowImageInput(true);
    setShowIconInput(true);
    setImageRemoved(false);
    setIconRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
        const response = await axios.delete(
            `/api/sub-categories/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Sub Category Deleted Successfully");
            fetchSubCategoriesMaster();
        } else {
            toast.error(response.data.message || "Cannot delete Sub Category");
        }
        setIsDeleteLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle reference error
            setReferenceData(error.response.data);
            setReferenceModal(true);
        } else {
        toast.error("Failed to delete sub category. Please try again.");
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
      const response = await axios.get(`/api/sub-categories/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const subCategory = response.data.data;
        const generatedSlug = subCategory.name ? subCategory.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : subCategory.slug || "";
        setValues({
          name: subCategory.name || "",
          slug: generatedSlug,
          mainCategoryId: subCategory.mainCategoryId || "",
          shortDescription: subCategory.shortDescription || "",
          image: subCategory.image || "",
          icon: subCategory.icon || "",
          sortOrder: subCategory.sortOrder || 0,
          isActive: subCategory.isActive,
        });
        setShowForm(true);
        setSelectedImageFile(null);
        setSelectedIconFile(null);
        setImagePreview("");
        setIconPreview("");
        setShowImageInput(true);
        setShowIconInput(true);
        setImageRemoved(false);
        setIconRemoved(false);
      } else {
        toast.error("Failed to fetch sub category details");
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
    
    // Auto-generate slug based on name
    if (name === "name") {
      const generatedSlug = value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setValues({ ...values, [name]: newValue, slug: generatedSlug });
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

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setImageRemoved(false); // Reset image removed flag when new file is selected
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedIconFile(file);
      setIconRemoved(false); // Reset icon removed flag when new file is selected
      const reader = new FileReader();
      reader.onload = (e) => setIconPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setValues({ ...values, image: "" });
    setSelectedImageFile(null);
    setImagePreview("");
    setShowImageInput(true);
    setImageRemoved(true);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleRemoveIcon = () => {
    setValues({ ...values, icon: "" });
    setSelectedIconFile(null);
    setIconPreview("");
    setShowIconInput(true);
    setIconRemoved(true);
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
                        <select
                          className="form-select"
                          required
                          name="mainCategoryId"
                          value={values.mainCategoryId}
                          onChange={handleChange}
                        >
                          <option value="">Select Main Category</option>
                          {mainCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <label className="form-label">
                          Main Category <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.mainCategoryId}</p>
                        )}
                      </div>
                    </Col>
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
                          name="slug"
                          value={values.slug}
                          onChange={handleChange}
                          disabled
                          readOnly
                        />
                        <label className="form-label">
                          Slug <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.slug}</p>
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
                          name="shortDescription"
                          value={values.shortDescription}
                          onChange={handleChange}
                          style={{ height: "100px" }}
                        />
                        <label className="form-label">Short Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Image</Label>
                        <div className="d-flex flex-column">
                          {values.image && !selectedImageFile && !imageRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.image}`}
                                alt="Current Image"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
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
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
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
                        {isSubmit && formErrors.image && (
                          <p className="text-danger">{formErrors.image}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Icon</Label>
                        <div className="d-flex flex-column">
                          {values.icon && !selectedIconFile && !iconRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.icon}`}
                                alt="Current Icon"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ms-2"
                                onClick={handleRemoveIcon}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          {iconRemoved && !selectedIconFile && (
                            <div className="mb-2">
                              <span className="text-muted">Icon will be removed when you save</span>
                            </div>
                          )}
                          {iconPreview && selectedIconFile && (
                            <div className="mb-2">
                              <img
                                src={iconPreview}
                                alt="Icon Preview"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          {showIconInput && (
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handleIconFileChange}
                            />
                          )}
                        </div>
                        {isSubmit && formErrors.icon && (
                          <p className="text-danger">{formErrors.icon}</p>
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
    setSelectedImageFile(null);
    setSelectedIconFile(null);
    setImagePreview("");
    setIconPreview("");
    setShowImageInput(true);
    setShowIconInput(true);
    setImageRemoved(false);
    setIconRemoved(false);
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  }

  document.title = `Sub Category Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Sub Category" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex align-items-center justify-content-between">
                    <FormsHeader
                      formName="Sub Category"
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
                      fileName="sub_categories"
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

export default SubCategory;
