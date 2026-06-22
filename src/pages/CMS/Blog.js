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
  Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import JoditEditor from "jodit-react";

const Blog = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    images: [],
    isActive: true,
  };

  // Existing cloud URLs shown during edit (admin can remove individually)
  const [existingImages, setExistingImages] = useState([]);
  // Newly selected local files to upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Data-URL previews for newly selected files
  const [imagePreviews, setImagePreviews] = useState([]);

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

  const editorConfig = {
    readonly: false,
    height: 400,
    buttons: [
      "undo",
      "redo",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "paragraph",
      "fontsize",
      "font",
      "|",
      "link",
      "unlink",
      "|",
      "align",
      "brush",
      "|",
      "table",
      "hr",
      "|",
      "fullsize",
    ],
    toolbarAdaptive: true,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_clear_html",
    defaultActionOnPasteFromWord: "insert_clear_html",
    processPasteHTML: true,
    nl2brInPlainText: true,
  };

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Title",
      selector: (row) => <p className="text-wrap">{row.title}</p>,
      sortable: true,
    },
    {
      name: "Author",
      selector: (row) => <p className="text-wrap">{row.author || "Admin"}</p>,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge color={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleTog_edit(row.id)}
              >
                Edit
              </button>
            )}
            {currentPagePermissions.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
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

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    let params = { page: pageNo || 1 };
    if (query) params.search = query;

    try {
      const response = await axios.get("/api/blogs/get-blogs", {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setTotalRows(response.data.pagination?.totalCount || 0);
        setData(response.data.data || []);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const validate = (values) => {
    const errors = {};
    if (!values.title) errors.title = "Title is required";
    if (!values.content) errors.content = "Content is required";
    return errors;
  };

  const clearImageState = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("metaTitle", values.metaTitle || "");
      formData.append("metaDescription", values.metaDescription || "");
      formData.append("keywords", values.keywords || "");
      formData.append("isActive", values.isActive);

      for (const file of selectedFiles) {
        formData.append("images", file);
      }

      try {
        const response = await axios.post("/api/blogs/add-blog", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          toast.success(response.data.message || "Blog Added Successfully");
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          clearImageState();
          fetchBlogs();
        } else {
          toast.error(response.data.message || "Cannot add Blog");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding blog");
      }
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("metaTitle", values.metaTitle || "");
      formData.append("metaDescription", values.metaDescription || "");
      formData.append("keywords", values.keywords || "");
      formData.append("isActive", values.isActive);
      // Tell backend which existing cloud URLs to keep
      formData.append("existingImages", JSON.stringify(existingImages));

      for (const file of selectedFiles) {
        formData.append("images", file);
      }

      try {
        const response = await axios.put(
          `/api/blogs/update-blog/${_id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Blog Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          clearImageState();
          fetchBlogs();
        } else {
          toast.error(response.data.message || "Cannot update Blog");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating blog");
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
    clearImageState();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    try {
      const response = await axios.delete(`/api/blogs/delete-blog/${remove_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setmodal_delete(false);
        toast.success("Blog Deleted Successfully");
        fetchBlogs();
      } else {
        toast.error(response.data.message || "Cannot delete Blog");
      }
    } catch (error) {
      toast.error("Failed to delete blog. Please try again.");
    }
    setIsDeleteLoading(false);
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = async (id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(id);
    setFormErrors({});
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/blogs/get-blogs`, {
        params: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const blog = Array.isArray(response.data.data)
          ? response.data.data.find((b) => b.id === id)
          : response.data.data;

        if (blog) {
          setValues({
            title: blog.title || "",
            content: blog.content || "",
            metaTitle: blog.metaTitle || "",
            metaDescription: blog.metaDescription || "",
            keywords: blog.keywords || "",
            images: [],
            isActive: blog.isActive !== undefined ? blog.isActive : true,
          });
          // Prefer images array; fall back to single legacy image
          const imgs = blog.images?.length
            ? blog.images
            : blog.image
            ? [blog.image]
            : [];
          setExistingImages(imgs);
          setSelectedFiles([]);
          setImagePreviews([]);
          setShowForm(true);
        } else {
          toast.error("Blog not found");
        }
      } else {
        toast.error("Failed to fetch blog details");
      }
    } catch (err) {
      console.log(err);
      toast.error("Error loading blog details");
    } finally {
      setIsLoading(false);
    }
  };

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB and was skipped`);
        continue;
      }
      valid.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const handlePageChange = (page) => setPageNo(page);

  const handlePerRowsChange = async (newPerPage) => setPerPage(newPerPage);

  const handleFilter = (e) => setFilter(e.target.checked);

  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
    clearImageState();
  };

  const totalImageCount = existingImages.length + selectedFiles.length;

  const thumbStyle = (isThumb) => ({
    width: "90px",
    height: "90px",
    objectFit: "cover",
    borderRadius: "6px",
    border: isThumb ? "2px solid #0ab39c" : "1px solid #dee2e6",
  });

  const thumbLabelStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(10,179,156,0.85)",
    color: "#fff",
    fontSize: "10px",
    textAlign: "center",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "4px",
  };

  const removeBtnStyle = {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#f06548",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    lineHeight: "18px",
    fontSize: "12px",
    cursor: "pointer",
    padding: 0,
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
                          name="title"
                          value={values.title}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Title <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.title}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="metaTitle"
                          value={values.metaTitle}
                          onChange={handleChange}
                        />
                        <label className="form-label">Meta Title</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="mb-3">
                        <label className="form-label">
                          Content <span className="text-danger"> *</span>
                        </label>
                        <JoditEditor
                          value={values.content}
                          config={editorConfig}
                          tabIndex={1}
                          onBlur={(newContent) =>
                            setValues({ ...values, content: newContent })
                          }
                        />
                        {isSubmit && (
                          <p className="text-danger mt-2">{formErrors.content}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="metaDescription"
                          value={values.metaDescription}
                          onChange={handleChange}
                          style={{ minHeight: "80px" }}
                        />
                        <label className="form-label">Meta Description</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="keywords"
                          value={values.keywords}
                          onChange={handleChange}
                          placeholder="e.g. promotional products, branded merchandise, workwear"
                        />
                        <label className="form-label">
                          SEO Keywords{" "}
                          <small className="text-muted">(comma separated)</small>
                        </label>
                      </div>
                    </Col>
                  </Row>

                  {/* ── Multi-Image Upload ── */}
                  <Row>
                    <Col lg={12}>
                      <div className="mb-3">
                        <Label className="form-label">
                          Images{" "}
                          <small className="text-muted">
                            (first image is used as thumbnail · max 5MB each)
                          </small>
                        </Label>

                        {totalImageCount > 0 && (
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {existingImages.map((url, i) => (
                              <div key={`e-${i}`} style={{ position: "relative", display: "inline-block" }}>
                                <img src={url} alt={`img-${i}`} style={thumbStyle(i === 0)} />
                                {i === 0 && <span style={thumbLabelStyle}>Thumbnail</span>}
                                <button type="button" style={removeBtnStyle} onClick={() => removeExistingImage(i)}>×</button>
                              </div>
                            ))}
                            {imagePreviews.map((src, i) => {
                              const globalIdx = existingImages.length + i;
                              return (
                                <div key={`n-${i}`} style={{ position: "relative", display: "inline-block" }}>
                                  <img src={src} alt={`new-${i}`} style={thumbStyle(globalIdx === 0)} />
                                  {globalIdx === 0 && <span style={thumbLabelStyle}>Thumbnail</span>}
                                  <button type="button" style={removeBtnStyle} onClick={() => removeNewFile(i)}>×</button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                        />
                        <small className="text-muted d-block mt-1">
                          Select multiple images. First image in the list becomes the thumbnail.
                        </small>
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

  const exportColumns = [{header:"Title",key:"title"},{header:"Slug",key:"slug"},{header:"Active",key:"isActive"}];
  const fetchAllForExport = async () => { try { const r = await axios.get("/api/blogs/get-blogs",{params:{page:1,limit:10000},headers:{Authorization:"Bearer "+localStorage.getItem("token")}}); return r.data?.data||[]; } catch(e){return data;} };

  document.title = `Blog | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="CMS" title="Blog" pageTitle="CMS" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Blog"
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
                  <ExportButtons data={data} columns={exportColumns} fileName="blogs" fetchAll={fetchAllForExport} />
                </CardHeader>

                {showForm || updateForm ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        customStyles={tableCustomStyles}
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        sortServer
                        onSort={(column, sortDirection) => handleSort(column, sortDirection)}
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
        handleDeleteClose={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default Blog;
