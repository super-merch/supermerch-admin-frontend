import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Label,
  Row,
  Table,
} from "reactstrap";
import Select from "react-select";
import axios from "axios";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  listClearanceDiscounts,
  removeClearanceDiscount,
  upsertClearanceDiscounts,
} from "../../functions/Pricing/discountFunc";

const discountTypeOptions = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FLAT", label: "Flat (A$)" },
];

const Clearance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [clearanceList, setClearanceList] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    mainCategoryId: "",
    subCategoryId: "",
    supplierId: "",
  });
  const [clearanceForm, setClearanceForm] = useState({
    discountType: "PERCENTAGE",
    amount: "",
  });

  const allSelected = useMemo(
    () => products.length > 0 && products.every((p) => selectedProductIds.has(String(p.id))),
    [products, selectedProductIds]
  );

  const fetchMasterData = async () => {
    try {
      const [mainRes, supplierRes] = await Promise.all([
        axios.get("/api/main-categories", { params: { limit: 200, isActive: true } }),
        axios.get("/api/listbyparams/suppliers", {
          params: { limit: 500, isActive: true },
        }),
      ]);
      setMainCategories(mainRes.data?.data || []);
      setSuppliers(supplierRes.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch master data:", error);
      toast.error("Failed to load categories/suppliers");
    }
  };

  const fetchSubCategories = async (mainCategoryId) => {
    if (!mainCategoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await axios.get(`/api/sub-categories/main-category/${mainCategoryId}`);
      setSubCategories(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch sub categories:", error);
      setSubCategories([]);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = { page: 1, limit: 100, search };
      if (filters.mainCategoryId) params.mainCategoryId = filters.mainCategoryId;
      if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
      if (filters.supplierId) params.supplierId = filters.supplierId;

      const res = await axios.get("/api/list-products-by-params-dropdown", { params });
      setProducts(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClearanceList = async () => {
    try {
      const res = await listClearanceDiscounts();
      setClearanceList(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch clearance list:", error);
      setClearanceList([]);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchClearanceList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters.mainCategoryId, filters.subCategoryId, filters.supplierId]);

  const toggleProduct = (productId) => {
    const id = String(productId);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProductIds(new Set());
      return;
    }
    setSelectedProductIds(new Set(products.map((p) => String(p.id))));
  };

  const handleCreateClearance = async () => {
    const selectedIds = Array.from(selectedProductIds).map((id) => Number(id));
    if (!selectedIds.length) {
      toast.error("Please select at least one product");
      return;
    }

    const amount = Number(clearanceForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }
    if (clearanceForm.discountType === "PERCENTAGE" && amount > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }

    setIsSaving(true);
    try {
      const res = await upsertClearanceDiscounts({
        productIds: selectedIds,
        discountType: clearanceForm.discountType,
        amount,
      });
      if (res.data?.success) {
        toast.success("Clearance created successfully");
        setSelectedProductIds(new Set());
        fetchClearanceList();
      } else {
        toast.error(res.data?.message || "Failed to create clearance");
      }
    } catch (error) {
      console.error("Failed to create clearance:", error);
      toast.error("Failed to create clearance");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveClearance = async (productId) => {
    try {
      const res = await removeClearanceDiscount(productId);
      if (res.data?.success) {
        toast.success("Clearance removed");
        fetchClearanceList();
      } else {
        toast.error(res.data?.message || "Failed to remove clearance");
      }
    } catch (error) {
      console.error("Failed to remove clearance:", error);
      toast.error("Failed to remove clearance");
    }
  };

  return (
    <div className="page-content">
      {(isLoading || isSaving) && <LoadingOverlay />}
      <Container fluid>
        <BreadCrumb maintitle="Pricing" title="Clearance" pageTitle="Pricing" />

        <Card>
          <CardHeader>
            <h5 className="mb-0">Create Clearance</h5>
          </CardHeader>
          <CardBody>
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Label className="form-label">Main Category</Label>
                <Select
                  isClearable
                  options={mainCategories.map((cat) => ({ value: cat._id, label: cat.name }))}
                  value={
                    filters.mainCategoryId
                      ? mainCategories
                          .map((cat) => ({ value: cat._id, label: cat.name }))
                          .find((x) => x.value === filters.mainCategoryId) || null
                      : null
                  }
                  onChange={(opt) => {
                    const mainCategoryId = opt?.value || "";
                    setFilters((prev) => ({ ...prev, mainCategoryId, subCategoryId: "" }));
                    fetchSubCategories(mainCategoryId);
                  }}
                />
              </Col>
              <Col md={3}>
                <Label className="form-label">Sub Category</Label>
                <Select
                  isClearable
                  options={subCategories.map((cat) => ({ value: cat._id, label: cat.name }))}
                  value={
                    filters.subCategoryId
                      ? subCategories
                          .map((cat) => ({ value: cat._id, label: cat.name }))
                          .find((x) => x.value === filters.subCategoryId) || null
                      : null
                  }
                  onChange={(opt) =>
                    setFilters((prev) => ({ ...prev, subCategoryId: opt?.value || "" }))
                  }
                  isDisabled={!filters.mainCategoryId}
                />
              </Col>
              <Col md={3}>
                <Label className="form-label">Supplier</Label>
                <Select
                  isClearable
                  options={suppliers.map((s) => ({
                    value: s.code || s.id || s._id,
                    label: s.name,
                  }))}
                  value={
                    filters.supplierId
                      ? suppliers
                          .map((s) => ({
                            value: s.code || s.id || s._id,
                            label: s.name,
                          }))
                          .find((x) => String(x.value) === String(filters.supplierId)) || null
                      : null
                  }
                  onChange={(opt) =>
                    setFilters((prev) => ({ ...prev, supplierId: opt?.value || "" }))
                  }
                />
              </Col>
              <Col md={3}>
                <Label className="form-label">Search Product</Label>
                <Input
                  placeholder="Name or code"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={3}>
                <Label className="form-label">Discount Type</Label>
                <Select
                  options={discountTypeOptions}
                  value={discountTypeOptions.find(
                    (x) => x.value === clearanceForm.discountType
                  )}
                  onChange={(opt) =>
                    setClearanceForm((prev) => ({
                      ...prev,
                      discountType: opt?.value || "PERCENTAGE",
                    }))
                  }
                />
              </Col>
              <Col md={3}>
                <Label className="form-label">
                  Amount ({clearanceForm.discountType === "PERCENTAGE" ? "%" : "A$"})
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={clearanceForm.amount}
                  onChange={(e) =>
                    setClearanceForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </Col>
              <Col md={6} className="d-flex align-items-end justify-content-end gap-2">
                <Button color="outline-secondary" onClick={toggleSelectAll}>
                  {allSelected ? "Unselect All" : "Select All Visible"}
                </Button>
                <Button color="primary" onClick={handleCreateClearance}>
                  Create Clearance ({selectedProductIds.size})
                </Button>
              </Col>
            </Row>

            <div className="table-responsive border rounded">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="40"></th>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Input
                          type="checkbox"
                          checked={selectedProductIds.has(String(product.id))}
                          onChange={() => toggleProduct(product.id)}
                        />
                      </td>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.code || "-"}</td>
                      <td>{product.supplier || "-"}</td>
                    </tr>
                  ))}
                  {!products.length && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h5 className="mb-0">Active Clearance</h5>
          </CardHeader>
          <CardBody>
            <div className="table-responsive border rounded">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product ID</th>
                    <th>Discount Type</th>
                    <th>Amount</th>
                    <th width="120">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clearanceList.map((item) => (
                    <tr key={`${item.productId}-${item.updatedAt || ""}`}>
                      <td>{item.productId}</td>
                      <td>{item.discountType}</td>
                      <td>
                        {item.discountType === "PERCENTAGE"
                          ? `${Number(item.amount).toFixed(2)}%`
                          : `A$${Number(item.amount).toFixed(2)}`}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleRemoveClearance(item.productId)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!clearanceList.length && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No active clearance configured
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default Clearance;
