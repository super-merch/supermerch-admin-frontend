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

const CustomProducts = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const emptyPriceBreak = { minQty: "", price: "" };

  const initialState = {
    name: "",
    code: "",
    description: "",
    heroImage: "",
    prices: [{ ...emptyPriceBreak }],
    colors: "",
    category: "",
    isActive: true,
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row) => <p className="text-wrap">{row.name}</p>,
      sortable: true,
    },
    {
      name: "Code",
      selector: (row) => <p className="text-wrap">{row.code}</p>,
      sortable: true,
    },
    {
      name: "Category",
      selector: (row) => <p className="text-wrap">{row.category || "-"}</p>,
      sortable: true,
    },
    {
      name: "Price",
      selector: (row) => {
        if (row.prices && row.prices.length > 0) {
          return `A$${row.prices[0].price}`;
        }
        return "-";
      },
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

  const fetchCustomProducts = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo || 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await axios.get("/api/custom-products", {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination?.totalCount || 0);
        setData(response.data.data || []);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching custom products:", error);
      toast.error("Failed to fetch custom products");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchCustomProducts();
  }, [fetchCustomProducts]);

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = "Name is required";
    if (!values.code) errors.code = "Code is required";
    if (values.prices.length === 0) {
      errors.prices = "At least one price break is required";
    } else {
      const hasEmpty = values.prices.some(
        (p) => !p.minQty || !p.price
      );
      if (hasEmpty) {
        errors.prices = "All price breaks must have min qty and price";
      }
    }
    return errors;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("code", values.code);
      formData.append("description", values.description || "");
      formData.append("prices", JSON.stringify(values.prices));
      formData.append("colors", values.colors || "");
      formData.append("category", values.category || "");
      formData.append("isActive", values.isActive);

      if (selectedFile) {
        formData.append("heroImage", selectedFile);
      }

      try {
        const response = await axios.post("/api/custom-products", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          toast.success(response.data.message || "Custom Product Added Successfully");
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          setSelectedFile(null);
          setImagePreview("");
          fetchCustomProducts();
        } else {
          toast.error(response.data.message || "Cannot add Custom Product");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding custom product");
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
      formData.append("name", values.name);
      formData.append("code", values.code);
      formData.append("description", values.description || "");
      formData.append("prices", JSON.stringify(values.prices));
      formData.append("colors", values.colors || "");
      formData.append("category", values.category || "");
      formData.append("isActive", values.isActive);

      if (selectedFile) {
        formData.append("heroImage", selectedFile);
      }

      try {
        const response = await axios.put(
          `/api/custom-products/${_id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Custom Product Updated Successfully");
          setUpdateForm(false);
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          setSelectedFile(null);
          setImagePreview("");
          fetchCustomProducts();
        } else {
          toast.error(response.data.message || "Cannot update Custom Product");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating custom product");
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
    setImagePreview("");
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
      const response = await axios.delete(`/api/custom-products/${remove_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setmodal_delete(false);
        toast.success("Custom Product Deleted Successfully");
        fetchCustomProducts();
      } else {
        toast.error(response.data.message || "Cannot delete Custom Product");
      }
    } catch (error) {
      toast.error("Failed to delete custom product. Please try again.");
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
      const response = await axios.get(`/api/custom-products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const product = response.data.data;
        setValues({
          name: product.name || "",
          code: product.code || "",
          description: product.description || "",
          heroImage: product.heroImage || "",
          prices: product.prices && product.prices.length > 0
            ? product.prices
            : [{ ...emptyPriceBreak }],
          colors: product.colors || "",
          category: product.category || "",
          isActive: product.isActive !== undefined ? product.isActive : true,
        });
        setShowForm(true);
        setSelectedFile(null);
        setImagePreview("");
      } else {
        toast.error("Failed to fetch product details");
      }
    } catch (err) {
      console.log(err);
      toast.error("Error loading product details");
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
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Price break handlers
  const handlePriceBreakChange = (index, field, value) => {
    const updatedPrices = [...values.prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setValues({ ...values, prices: updatedPrices });
  };

  const addPriceBreak = () => {
    setValues({
      ...values,
      prices: [...values.prices, { ...emptyPriceBreak }],
    });
  };

  const removePriceBreak = (index) => {
    if (values.prices.length > 1) {
      const updatedPrices = values.prices.filter((_, i) => i !== index);
      setValues({ ...values, prices: updatedPrices });
    } else {
      toast.warning("At least one price break is required");
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

  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setFormErrors({});
    setSelectedFile(null);
    setImagePreview("");
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
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="category"
                          value={values.category}
                          onChange={handleChange}
                        />
                        <label className="form-label">Category</label>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="description"
                          value={values.description}
                          onChange={handleChange}
                          style={{ minHeight: "100px" }}
                        />
                        <label className="form-label">Description</label>
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="colors"
                          value={values.colors}
                          onChange={handleChange}
                          placeholder="e.g. Red, Blue, Green"
                        />
                        <label className="form-label">Colors (comma separated)</label>
                      </div>
                    </Col>
                  </Row>

                  {/* Hero Image */}
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Hero Image</Label>
                        <div className="d-flex flex-column">
                          {values.heroImage && !selectedFile && (
                            <div className="mb-2">
                              <img
                                src={values.heroImage}
                                alt="Current Product"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          {imagePreview && selectedFile && (
                            <div className="mb-2">
                              <img
                                src={imagePreview}
                                alt="Image Preview"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={imageRef}
                          />
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Price Breaks */}
                  <hr className="my-3" />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Price Breaks</h5>
                    <Button color="primary" size="sm" onClick={addPriceBreak}>
                      <i className="ri-add-line align-bottom me-1"></i> Add Price Break
                    </Button>
                  </div>
                  {isSubmit && formErrors.prices && (
                    <p className="text-danger mb-2">{formErrors.prices}</p>
                  )}
                  {values.prices.map((priceBreak, index) => (
                    <Row key={index} className="mb-2 align-items-center">
                      <Col lg={4}>
                        <div className="form-floating mb-2">
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={priceBreak.minQty}
                            onChange={(e) =>
                              handlePriceBreakChange(index, "minQty", e.target.value)
                            }
                          />
                          <label className="form-label">Min Quantity</label>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <div className="form-floating mb-2">
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={priceBreak.price}
                            onChange={(e) =>
                              handlePriceBreakChange(index, "price", e.target.value)
                            }
                          />
                          <label className="form-label">Price ($)</label>
                        </div>
                      </Col>
                      <Col lg={2} className="text-center mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removePriceBreak(index)}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </Col>
                    </Row>
                  ))}

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

  const exportColumns = [{header:"Name",key:"name"},{header:"Code",key:"code"},{header:"Category",key:"category"},{header:"Price",key:"price"},{header:"Active",key:"isActive"}];
  const fetchAllForExport = async () => { try { const r = await axios.get("/api/custom-products",{params:{page:1,limit:10000},headers:{Authorization:"Bearer "+localStorage.getItem("token")}}); return r.data?.data||[]; } catch(e){return data;} };

  document.title = `Custom Products | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Product" title="Custom Products" pageTitle="Product" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Custom Products"
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
                  <ExportButtons data={data} columns={exportColumns} fileName="custom_products" fetchAll={fetchAllForExport} />
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
                        onSort={(column, sortDirection) =>
                          handleSort(column, sortDirection)
                        }
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[
                          50, 100, 200, 300, totalRows,
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
        handleDeleteClose={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default CustomProducts;
