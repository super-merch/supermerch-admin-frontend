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

const apiUrl = config.api.API_URL;

const Collection = () => {
  const { adminData } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const initialState = {
    name: "",
    slug: "",
    image: "",
    shortDescription: "",
    isActive: true,
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
      maxWidth: "20px",
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      maxWidth: "200px",
    },
    {
      name: "Slug",
      selector: (row) => <p className="text-wrap">{row.slug}</p>,
      sortable: true,
      maxWidth: "200px",
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
      maxWidth: "100px",
    },
    {
      name: "Short Description",
      selector: (row) => <p className="text-wrap">{row.shortDescription || "-"}</p>,
      maxWidth: "300px",
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

  const fetchCollectionsMaster = useCallback(async () => {
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
      const response = await axios.get('/api/listbyparams/collections', {
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
      console.error('Error fetching collections:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchCollectionsMaster();
  }, [fetchCollectionsMaster]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setQuery(searchInput);
      setPageNo(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
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
      formData.append('shortDescription', values.shortDescription);
      formData.append('isActive', values.isActive);
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      
      try {
        const response = await axios.post(
          `/api/collections`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Collection Added Successfully");
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setImagePreview("");
          setShowImageInput(true);
          setImageRemoved(false);
          fetchCollectionsMaster();
        } else {
          toast.error(response.data.message || "Cannot add Collection");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding collection");
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
      formData.append('shortDescription', values.shortDescription);
      formData.append('isActive', values.isActive);
      
      // Handle image removal
      if (imageRemoved) {
        formData.append('removeImage', 'true');
      }
      
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }

      try {
        const response = await axios.put(
          `/api/collections/${_id}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            },
          }
        );

        if (response.data.success) {
          toast.success("Collection Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);  
          setIsSubmit(false);
          setFormErrors({});
          setSelectedImageFile(null);
          setImagePreview("");
          setShowImageInput(true);
          setImageRemoved(false);
          fetchCollectionsMaster();
        }
        else {
          toast.error(response.data.message || "Cannot update Collection");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating collection");
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
            `/api/collections/${remove_id}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        if (response.data.success) {
            setmodal_delete(!modal_delete);
            toast.success("Collection Deleted Successfully");
            fetchCollectionsMaster();
        } else {
            if(response.status === 409){
                setReferenceData(response.data);
                setReferenceModal(true);
            }else{
                toast.error(response.data.message || "Cannot delete Collection");
            }
        }
        setIsDeleteLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle reference error
            setReferenceData(error.response.data);
            setReferenceModal(true);
        } else {
        toast.error("Failed to delete collection. Please try again.");
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
      const response = await axios.get(`/api/collections/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const collection = response.data.data;
        const generatedSlug = collection.name ? collection.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : collection.slug || "";
        setValues({
          name: collection.name || "",
          slug: generatedSlug,
          image: collection.image || "",
          shortDescription: collection.shortDescription || "",
          isActive: collection.isActive,
        });
        setShowForm(true);
        setSelectedImageFile(null);
        setImagePreview("");
        setShowImageInput(true);
        setImageRemoved(false);
      } else {
        toast.error("Failed to fetch collection details");
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
      // Check file size (max 500KB)
      const maxSize = 500 * 1024; // 500KB in bytes
      if (file.size > maxSize) {
        alert("Image file size must be less than 500KB");
        e.target.value = ""; // Clear the input
        return;
      }
      setSelectedImageFile(file);
      setImageRemoved(false); // Reset image removed flag when new file is selected
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
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

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Row>
                    <Col lg={6}>
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
                    <Col lg={6}>
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
                    <Col lg={12}>
                      <div className="mb-3">
                        <Label className="form-label">Image <span className="text-muted"> (Max 500KB)</span></Label>
                        
                        <div className="d-flex flex-column">
                          {values.image && !selectedImageFile && !imageRemoved && (
                            <div className="mb-2">
                              <img
                                src={`${apiUrl}/${values.image}`}
                                alt="Current"
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
                                alt="Preview"
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

  document.title = `Collection Master | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Collection" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Collection"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={() => handleList()}
                    setQuery={setSearchInput}
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

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Collection"
        referenceData={referenceData}
      />
    </React.Fragment>
  );
};

export default Collection;
