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
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import JoditEditor from "jodit-react";
import { 
  createAboutUsBanner, 
  deleteAboutUsBanner, 
  getAboutUsBannerById, 
  updateAboutUsBanner 
} from "../../functions/CMS/aboutUsBannerFunc";
import { MenuContext } from "../../context/MenuContext";
import { api } from "../../config";

const AboutUsBanner = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    content: "",
    linkText: "",
    linkUrl: "",
    sortOrder: 0,
    isActive: true,
  };

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

  // Image states
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const editorConfig = {
    readonly: false,
    toolbar: true,
    spellcheck: true,
    language: "en",
    toolbarButtonSize: "medium",
    toolbarAdaptive: false,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    uploader: {
      insertImageAsBase64URI: false,
    },
    imageDefaultWidth: "100%",
    removeButtons: ["source", "file", "image", "video"],
    buttons: [
      "undo",
      "redo",
      "|",
      "bold",
      "italic",
      "underline",
      "|",
      "ul",
      "ol",
      "|",
      "link",
      "unlink",
      "|",
      "align",
      "brush",
      "fontsize",
      "font",
      "|",
      "fullsize",
    ],
  };

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "10px",
    },
    {
      name: "Image",
      selector: (row) => (
        <img
          src={`${api.API_URL}/uploads/aboutUsBanner/${row.imageUrl}`}
          alt="banner"
          style={{ width: "100px", height: "60px", objectFit: "cover", margin: "5px 0" }}
        />
      ),
      maxWidth: "120px",
    },
    {
      name: "Sort Order",
      selector: (row) => row.sortOrder,
      sortable: true,
      maxWidth: "100px",
    },
    {
      name: "Status",
      selector: (row) => (
        <span className={`badge bg-${row.isActive ? 'success' : 'danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      maxWidth: "100px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                data-bs-toggle="modal"
                data-bs-target="#showModal"
                onClick={() => handleTog_edit(row.id)}
              >
                Edit
              </button>
            )}
            {currentPagePermissions.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                data-bs-toggle="modal"
                data-bs-target="#deleteRecordModal"
                onClick={() => tog_delete(row.id)}
              >
                Remove
              </button>
            )}
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

  const fetchAboutUsBanners = useCallback(async () => {
    setLoading(true);
    let skip = pageNo;
    if (skip < 1) skip = 1;

    const params = new URLSearchParams({
      page: skip,
      limit: perPage,
      search: query,
      isActive: filter,
    });

    await axios
      .get(`/api/about-us-banners?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        if (response.data.success) {
          setData(response.data.data);
          setTotalRows(response.data.pagination.totalCount);
        } else {
          setData([]);
          setTotalRows(0);
        }
      })
      .catch((err) => {
        console.log(err);
        setData([]);
        setTotalRows(0);
      });
    setLoading(false);
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchAboutUsBanners();
  }, [pageNo, perPage, column, sortDirection, query, filter]);

  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      toast.error("Only image files (JPEG, PNG, GIF, WebP) are allowed");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("Image size must be less than 2MB");
      return false;
    }

    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImageFile(file)) {
      setImageUrl(file);
      setRemoveImage(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      e.target.value = null;
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    setRemoveImage(true);
    const fileInput = document.querySelector('input[name="imageUrl"]');
    if (fileInput) fileInput.value = null;
  };

  const validate = (values) => {
    const errors = {};
    if (!values.content) errors.content = "Content is required";
    if (!imageUrl && !imagePreview) errors.imageUrl = "Image is required";
    if (values.sortOrder === "" || values.sortOrder < 0) {
      errors.sortOrder = "Sort Order must be 0 or greater";
    }
    return errors;
  };

  const handleClick = (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("content", values.content);
      formData.append("linkText", values.linkText || "");
      formData.append("linkUrl", values.linkUrl || "");
      formData.append("sortOrder", values.sortOrder);
      formData.append("isActive", values.isActive);
      
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }

      createAboutUsBanner(formData)
        .then((res) => {
          if (res.data.success) {
            setShowForm(false);
            setValues(initialState);
            setImageUrl(null);
            setImagePreview(null);
            setRemoveImage(false);
            setIsSubmit(false);
            setFormErrors({});
            fetchAboutUsBanners();
            toast.success("About Us Banner Added Successfully");
          } else {
            toast.error(res.data.message || "Failed to create About Us Banner");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error(err.response?.data?.message || "Error creating About Us Banner");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("content", values.content);
      formData.append("linkText", values.linkText || "");
      formData.append("linkUrl", values.linkUrl || "");
      formData.append("sortOrder", values.sortOrder);
      formData.append("isActive", values.isActive);
      formData.append("removeImage", removeImage);
      
      if (imageUrl && typeof imageUrl !== 'string') {
        formData.append("imageUrl", imageUrl);
      }

      updateAboutUsBanner(_id, formData)
        .then((res) => {
          if (res.data.success) {
            toast.success("About Us Banner Updated Successfully");
            setUpdateForm(false);
            setShowForm(false);
            setValues(initialState);
            setImageUrl(null);
            setImagePreview(null);
            setRemoveImage(false);
            setIsSubmit(false);
            setFormErrors({});
            fetchAboutUsBanners();
          } else {
            toast.error(res.data.message || "Failed to update About Us Banner");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error(err.response?.data?.message || "Error updating About Us Banner");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setImageUrl(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormErrors({});
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    deleteAboutUsBanner(remove_id)
      .then((res) => {
        if (res.data.success) {
          setmodal_delete(!modal_delete);
          fetchAboutUsBanners();
          toast.success("About Us Banner Deleted Successfully");
        } else {
          toast.error(res.data.message || "Cannot delete About Us Banner");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Cannot delete About Us Banner");
      })
      .finally(() => setIsDeleteLoading(false));
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = (_id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(_id);
    setFormErrors({});
    setIsLoading(true);
    getAboutUsBannerById(_id)
      .then((res) => {
        if (res.data.success) {
          const bannerData = res.data.data;
          setValues({
            content: bannerData.content,
            linkText: bannerData.linkText || "",
            linkUrl: bannerData.linkUrl || "",
            sortOrder: bannerData.sortOrder,
            isActive: bannerData.isActive,
          });
          
          if (bannerData.imageUrl) {
            setImageUrl(bannerData.imageUrl);
            setImagePreview(`${api.API_URL}/uploads/aboutUsBanner/${bannerData.imageUrl}`);
          }
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error loading banner data");
      })
      .finally(() => setIsLoading(false));
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
    setValues({ ...values, [e.target.name]: e.target.value });
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

  const tog_list = () => {
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setImageUrl(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormErrors({});
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
      {isDeleteLoading && <LoadingOverlay fullscreen={false} />}
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Col lg={12}>
                    <div className="mb-3">
                      <label className="form-label">
                        Content <span className="text-danger"> *</span>
                      </label>
                      <div style={{ minHeight: "400px" }}>
                        <JoditEditor
                          value={values.content}
                          config={{
                            ...editorConfig,
                            height: 400,
                          }}
                          tabIndex={1}
                          name="content"
                          onBlur={(newContent) =>
                            setValues({ ...values, content: newContent })
                          }
                        />
                      </div>
                      {isSubmit && (
                        <p className="text-danger mt-2">{formErrors.content}</p>
                      )}
                    </div>
                  </Col>

                  <Col lg={12}>
                    <Row>
                      <Col lg={6}>
                        <div className="mb-3">
                          <label className="form-label">
                            Banner Image <span className="text-danger"> *</span>
                            <span className="text-muted"> (Max 2MB, Images only)</span>
                          </label>
                          <input
                            type="file"
                            name="imageUrl"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          {isSubmit && (
                            <p className="text-danger">{formErrors.imageUrl}</p>
                          )}
                        </div>
                      </Col>

                      {imagePreview && (
                        <Col lg={6}>
                          <div className="mb-3">
                            <label className="form-label">Image Preview</label>
                            <div className="position-relative d-inline-block w-100">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                  width: "100%",
                                  maxWidth: "100%",
                                  height: "auto",
                                  maxHeight: "400px",
                                  objectFit: "contain",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  padding: "5px",
                                  backgroundColor: "#f8f9fa",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute"
                                onClick={handleRemoveImage}
                                style={{ top: "10px", right: "10px", zIndex: 1 }}
                              >
                                <i className="ri-close-line"></i> Remove
                              </button>
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Col>

                  <Col lg={4}>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className="form-control"
                        name="linkText"
                        value={values.linkText}
                        onChange={handleChange}
                      />
                      <label className="form-label">Link Text</label>
                    </div>
                  </Col>

                  <Col lg={4}>
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className="form-control"
                        name="linkUrl"
                        value={values.linkUrl}
                        onChange={handleChange}
                        placeholder="https://example.com"
                      />
                      <label className="form-label">Link URL</label>
                    </div>
                  </Col>

                  <Col lg={4}>
                    <div className="form-floating mb-3">
                      <input
                        type="number"
                        className="form-control"
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
                            defaultChecked={values.isActive}
                          />
                          <Label className="form-check-label">Is Active</Label>
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

  document.title = `About Us Banner | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="CMS"
            title="About Us Banner"
            pageTitle="CMS"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="About Us Banner"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    initialState={initialState}
                    setValues={setValues}
                    updateForm={updateForm}
                    showForm={showForm}
                    setShowForm={setShowForm}
                    setUpdateForm={setUpdateForm}
                  />
                </CardHeader>

                {showForm || updateForm ? (
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
                        paginationRowsPerPageOptions={[50, 100, 200, 300, totalRows]}
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

export default AboutUsBanner;
