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
  Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  getCategoryMargins,
  addCategoryMargin,
} from "../../functions/Pricing/marginFunc";
import axios from "axios";

const CategoryMargin = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Supplier selection
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const suppliersFetched = useRef(false);

  // Add / Edit form
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const categoriesFetched = useRef(false);
  const [margin, setMargin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: false,
    },
    {
      name: "Category",
      selector: (row) => (
        <p className="text-wrap">{row.categoryName || row.categoryId}</p>
      ),
    },
    {
      name: "Margin (%)",
      selector: (row) => <p className="text-wrap">{row.margin}%</p>,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleEdit(row)}
              >
                Edit
              </button>
            )}
            {!currentPagePermissions.edit && (
              <span className="text-muted">No actions available</span>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "150px",
    },
  ];

  const fetchSuppliers = useCallback(async (search = "") => {
    try {
      const response = await axios.get("/api/listbyparams/suppliers", {
        params: { page: 1, limit: 50, isActive: true, search },
      });
      if (response.data.success) {
        setSuppliers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  const fetchCategories = useCallback(async (search = "") => {
    try {
      const response = await axios.get("/api/listbyparams/main-categories", {
        params: { page: 1, limit: 50, isActive: true, search },
      });
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const handleSupplierMenuOpen = () => {
    if (!suppliersFetched.current) {
      suppliersFetched.current = true;
      fetchSuppliers();
    }
  };

  const handleCategoryMenuOpen = () => {
    if (!categoriesFetched.current) {
      categoriesFetched.current = true;
      fetchCategories();
    }
  };

  // Debounced search for supplier dropdown
  useEffect(() => {
    if (!suppliersFetched.current) return;
    const timer = setTimeout(() => fetchSuppliers(supplierSearch), 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, fetchSuppliers]);

  // Debounced search for category dropdown
  useEffect(() => {
    if (!categoriesFetched.current) return;
    const timer = setTimeout(() => fetchCategories(categorySearch), 300);
    return () => clearTimeout(timer);
  }, [categorySearch, fetchCategories]);

  const fetchCategoryMargins = useCallback(async () => {
    if (!selectedSupplierId) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getCategoryMargins(selectedSupplierId);
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching category margins:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch category margins"
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSupplierId]);

  useEffect(() => {
    fetchCategoryMargins();
  }, [fetchCategoryMargins]);

  const handleSupplierChange = (value) => {
    setSelectedSupplierId(value);
    setShowForm(false);
  };

  const handleEdit = (row) => {
    setCategoryId(row.categoryId);
    setMargin(row.margin);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setCategoryId("");
    setMargin("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setCategoryId("");
    setMargin("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error("Please select a supplier first");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (margin === "" || isNaN(margin) || Number(margin) < 0) {
      toast.error("Please enter a valid margin percentage");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSupplier = suppliers.find(s => String(s._id || s.id) === String(selectedSupplierId));
      const selectedCategory = categories.find(c => String(c._id || c.id) === String(categoryId));
      const response = await addCategoryMargin({
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier?.name || "Unknown",
        categoryId,
        categoryName: selectedCategory?.name || "Unknown",
        margin: Number(margin),
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Category margin saved successfully"
        );
        setShowForm(false);
        setCategoryId("");
        setMargin("");
        fetchCategoryMargins();
      } else {
        toast.error(response.data.message || "Failed to save category margin");
      }
    } catch (error) {
      console.error("Error saving category margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to save category margin"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportColumns = [{header:"Category",key:"categoryName"},{header:"Category ID",key:"categoryId"},{header:"Margin %",key:"margin"}];
  const fetchAllForExport = async () => { return data || []; };

  document.title = `Category Margin | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Category Margin"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Category Margins</h5>
                    <ExportButtons data={data} columns={exportColumns} fileName="category_margins" fetchAll={fetchAllForExport} />
                    <div className="d-flex gap-2 align-items-center">
                      <div style={{ minWidth: "250px" }}>
                        <Select
                          isClearable
                          placeholder="Select Supplier"
                          options={suppliers.map((s) => ({
                            value: s._id || s.id,
                            label: s.name,
                          }))}
                          value={selectedSupplierId ? suppliers.map((s) => ({ value: s._id || s.id, label: s.name })).find((o) => o.value === selectedSupplierId) || null : null}
                          onChange={(opt) => handleSupplierChange(opt ? opt.value : "")}
                          onMenuOpen={handleSupplierMenuOpen}
                          onInputChange={(val) => setSupplierSearch(val)}
                          filterOption={null}
                        />
                      </div>
                      {currentPagePermissions.write &&
                        selectedSupplierId && (
                          <Button color="success" onClick={handleAddNew}>
                            <i className="ri-add-line align-bottom me-1"></i>
                            Add Category Margin
                          </Button>
                        )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {showForm && (
                    <Col xxl={12} className="mb-4">
                      <Card className="border">
                        <CardBody>
                          <div className="live-preview">
                            <Form onSubmit={handleSubmit}>
                              <Row>
                                <Col lg={4}>
                                  <div className="mb-3">
                                    <Label className="form-label">
                                      Category{" "}
                                      <span className="text-danger">*</span>
                                    </Label>
                                    <Select
                                      isClearable
                                      placeholder="Select Category"
                                      options={categories.map((c) => ({
                                        value: c._id || c.id,
                                        label: c.name,
                                      }))}
                                      value={categoryId ? categories.map((c) => ({ value: c._id || c.id, label: c.name })).find((o) => o.value === categoryId) || null : null}
                                      onChange={(opt) => setCategoryId(opt ? opt.value : "")}
                                      onMenuOpen={handleCategoryMenuOpen}
                                      onInputChange={(val) => setCategorySearch(val)}
                                      filterOption={null}
                                    />
                                  </div>
                                </Col>
                                <Col lg={4}>
                                  <div className="mb-3">
                                    <Label className="form-label">
                                      Margin (%){" "}
                                      <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                      type="number"
                                      value={margin}
                                      onChange={(e) =>
                                        setMargin(e.target.value)
                                      }
                                      step="0.01"
                                      min="0"
                                      placeholder="Enter margin percentage"
                                    />
                                  </div>
                                </Col>
                                <Col
                                  lg={4}
                                  className="d-flex align-items-end mb-3"
                                >
                                  <div className="d-flex gap-2">
                                    <Button
                                      type="submit"
                                      color="success"
                                      disabled={isSubmitting}
                                    >
                                      {isSubmitting ? (
                                        <>
                                          <span
                                            className="spinner-border spinner-border-sm me-1"
                                            role="status"
                                            aria-hidden="true"
                                          ></span>
                                          Saving...
                                        </>
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                    <Button
                                      color="outline-danger"
                                      onClick={handleCancel}
                                      disabled={isSubmitting}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </Col>
                              </Row>
                            </Form>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  )}

                  {!selectedSupplierId ? (
                    <div className="text-center text-muted py-4">
                      <p>Please select a supplier to view category margins.</p>
                    </div>
                  ) : (
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                      customStyles={tableCustomStyles}
                      columns={columns}
                        data={data}
                        progressPending={loading}
                        noDataComponent={
                          <div className="text-muted py-4">
                            No category margins found for this supplier.
                          </div>
                        }
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CategoryMargin;
