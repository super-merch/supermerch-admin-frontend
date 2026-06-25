import React, { useCallback, useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Table,
  TabContent,
  TabPane,
} from "reactstrap";
import Select from "react-select";
import axios from "axios";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  listClearanceDiscounts,
  removeClearanceDiscount,
  syncClearanceFromPromodata,
  toggleClearanceStatus,
  upsertClearanceDiscounts,
} from "../../functions/Pricing/discountFunc";

const discountTypeOptions = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FLAT", label: "Flat (A$)" },
];

const formatAmount = (item) =>
  item.discountType === "PERCENTAGE"
    ? `${Number(item.amount).toFixed(2)}%`
    : `A$${Number(item.amount).toFixed(2)}`;

const Clearance = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tab data
  const [adminActiveList, setAdminActiveList] = useState([]);
  const [adminInactiveList, setAdminInactiveList] = useState([]);
  const [promodataList, setPromodataList] = useState([]);

  // Add-clearance modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal — product selection state
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ mainCategoryId: "", subCategoryId: "", supplierId: "" });
  const [clearanceForm, setClearanceForm] = useState({ discountType: "PERCENTAGE", amount: "" });
  const [productsLoading, setProductsLoading] = useState(false);

  const allSelected = useMemo(
    () => products.length > 0 && products.every((p) => selectedProductIds.has(String(p.id))),
    [products, selectedProductIds]
  );

  // ── Data fetching ──────────────────────────────────────────────

  const fetchAllTabs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeRes, inactiveRes, promodataRes] = await Promise.all([
        listClearanceDiscounts("admin-active"),
        listClearanceDiscounts("admin-inactive"),
        listClearanceDiscounts("promodata"),
      ]);
      setAdminActiveList(activeRes.data?.data || []);
      setAdminInactiveList(inactiveRes.data?.data || []);
      setPromodataList(promodataRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch clearance data:", err);
      toast.error("Failed to load clearance data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMasterData = async () => {
    try {
      const [mainRes, supplierRes] = await Promise.all([
        axios.get("/api/main-categories", { params: { limit: 200, isActive: true } }),
        axios.get("/api/listbyparams/suppliers", { params: { limit: 500, isActive: true } }),
      ]);
      setMainCategories(mainRes.data?.data || []);
      setSuppliers(supplierRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch master data:", err);
    }
  };

  const fetchSubCategories = async (mainCategoryId) => {
    if (!mainCategoryId) { setSubCategories([]); return; }
    try {
      const res = await axios.get(`/api/sub-categories/main-category/${mainCategoryId}`);
      setSubCategories(res.data?.data || []);
    } catch {
      setSubCategories([]);
    }
  };

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = { page: 1, limit: 100, search };
      if (filters.mainCategoryId) params.mainCategoryId = filters.mainCategoryId;
      if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      const res = await axios.get("/api/list-products-by-params-dropdown", { params });
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchAllTabs();
    fetchMasterData();
  }, [fetchAllTabs]);

  useEffect(() => {
    if (!showAddModal) return;
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [showAddModal, fetchProducts]);

  // ── Tab helper ─────────────────────────────────────────────────

  const toggleTab = (tab) => { if (activeTab !== tab) setActiveTab(tab); };

  // ── Modal open/close ───────────────────────────────────────────

  const openAddModal = () => {
    setSelectedProductIds(new Set());
    setSearch("");
    setFilters({ mainCategoryId: "", subCategoryId: "", supplierId: "" });
    setClearanceForm({ discountType: "PERCENTAGE", amount: "" });
    setSubCategories([]);
    setShowAddModal(true);
  };

  const closeAddModal = () => setShowAddModal(false);

  // ── Product selection ──────────────────────────────────────────

  const toggleProduct = (productId) => {
    const id = String(productId);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) { setSelectedProductIds(new Set()); return; }
    setSelectedProductIds(new Set(products.map((p) => String(p.id))));
  };

  // ── CRUD handlers ──────────────────────────────────────────────

  const handleCreateClearance = async () => {
    const selectedIds = Array.from(selectedProductIds).map(Number);
    if (!selectedIds.length) { toast.error("Please select at least one product"); return; }
    const amount = Number(clearanceForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Please enter a valid discount amount"); return; }
    if (clearanceForm.discountType === "PERCENTAGE" && amount > 100) { toast.error("Percentage cannot exceed 100"); return; }

    setIsSaving(true);
    try {
      const res = await upsertClearanceDiscounts({
        productIds: selectedIds,
        discountType: clearanceForm.discountType,
        amount,
      });
      if (res.data?.success) {
        toast.success("Clearance created successfully");
        closeAddModal();
        fetchAllTabs();
      } else {
        toast.error(res.data?.message || "Failed to create clearance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create clearance");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (productId, makeActive) => {
    try {
      const res = await toggleClearanceStatus(productId, makeActive);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchAllTabs();
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await removeClearanceDiscount(productId);
      if (res.data?.success) {
        toast.success("Clearance removed");
        fetchAllTabs();
      } else {
        toast.error(res.data?.message || "Failed to remove clearance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove clearance");
    }
  };

  const handleSyncFromPromodata = async () => {
    setIsSyncing(true);
    try {
      const res = await syncClearanceFromPromodata();
      if (res.data?.success) {
        const { added, updated, removed, clearedProductsFound } = res.data.data || {};
        toast.success(
          `Sync complete — ${clearedProductsFound} cleared products found. Added: ${added}, Updated: ${updated}, Removed: ${removed}.`
        );
        fetchAllTabs();
      } else {
        toast.error(res.data?.message || "Sync failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sync failed — check console for details");
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="page-content">
      {(isLoading || isSaving || isSyncing) && <LoadingOverlay />}
      <Container fluid>
        <BreadCrumb maintitle="Pricing" title="Clearance" pageTitle="Pricing" />

        {/* Page header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold">Clearance Management</h5>
          <Button color="success" onClick={openAddModal}>
            <i className="ri-add-line align-bottom me-1"></i>
            Add Clearance
          </Button>
        </div>

        {/* Tabs */}
        <Nav tabs className="nav-tabs-custom nav-success mb-0">
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "1" })}
              onClick={() => toggleTab("1")}
            >
              <i className="ri-checkbox-circle-line align-middle me-1"></i>
              Active
              <span className="badge bg-success ms-2">{adminActiveList.length}</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "2" })}
              onClick={() => toggleTab("2")}
            >
              <i className="ri-pause-circle-line align-middle me-1"></i>
              Inactive
              <span className="badge bg-secondary ms-2">{adminInactiveList.length}</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: "pointer" }}
              className={classnames({ active: activeTab === "3" })}
              onClick={() => toggleTab("3")}
            >
              <i className="ri-cloud-line align-middle me-1"></i>
              PromoData
              <span className="badge bg-info ms-2">{promodataList.length}</span>
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab}>
          {/* Tab 1 — Active (Admin) */}
          <TabPane tabId="1">
            <Card className="border-top-0 rounded-top-0">
              <CardBody>
                <div className="table-responsive border rounded">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product ID</th>
                        <th>Discount Type</th>
                        <th>Amount</th>
                        <th width="180">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminActiveList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No active clearance configured
                          </td>
                        </tr>
                      ) : adminActiveList.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productId}</td>
                          <td>{item.discountType}</td>
                          <td>{formatAmount(item)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                color="warning"
                                onClick={() => handleToggleStatus(item.productId, false)}
                              >
                                Deactivate
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                onClick={() => handleRemove(item.productId)}
                              >
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </TabPane>

          {/* Tab 2 — Inactive (Admin) */}
          <TabPane tabId="2">
            <Card className="border-top-0 rounded-top-0">
              <CardBody>
                <div className="table-responsive border rounded">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product ID</th>
                        <th>Discount Type</th>
                        <th>Amount</th>
                        <th width="180">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminInactiveList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No inactive clearance entries
                          </td>
                        </tr>
                      ) : adminInactiveList.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productId}</td>
                          <td>{item.discountType}</td>
                          <td>{formatAmount(item)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                color="success"
                                onClick={() => handleToggleStatus(item.productId, true)}
                              >
                                Reactivate
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                onClick={() => handleRemove(item.productId)}
                              >
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </TabPane>

          {/* Tab 3 — PromoData */}
          <TabPane tabId="3">
            <Card className="border-top-0 rounded-top-0">
              <CardHeader className="d-flex align-items-center justify-content-between">
                <span className="fw-semibold">PromoData Clearance</span>
                <Button color="info" size="sm" onClick={handleSyncFromPromodata} disabled={isSyncing}>
                  <i className="ri-refresh-line align-bottom me-1"></i>
                  {isSyncing ? "Syncing..." : "Sync from PromoData"}
                </Button>
              </CardHeader>
              <CardBody>
                <p className="text-muted small mb-3">
                  These products are automatically marked as clearance by the PromoData API.
                  Discount amounts come directly from PromoData — not set by admin.
                </p>
                <div className="table-responsive border rounded">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product ID</th>
                        <th>Discount Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promodataList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No PromoData clearance products — click "Sync from PromoData" to fetch
                          </td>
                        </tr>
                      ) : promodataList.map((item) => (
                        <tr key={item.productId}>
                          <td>{item.productId}</td>
                          <td>{item.discountType}</td>
                          <td>{formatAmount(item)}</td>
                          <td>
                            <span
                              className={`badge ${item.isActive !== false ? "bg-success" : "bg-secondary"}`}
                            >
                              {item.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </TabPane>
        </TabContent>
      </Container>

      {/* ── Add Clearance Modal ──────────────────────────────────── */}
      <Modal isOpen={showAddModal} toggle={closeAddModal} size="xl" centered scrollable>
        <ModalHeader toggle={closeAddModal} className="bg-light">
          <i className="ri-price-tag-3-line me-2"></i>
          Add Clearance
        </ModalHeader>

        <ModalBody>
          {/* Filters row */}
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
                        .map((s) => ({ value: s.code || s.id || s._id, label: s.name }))
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

          {/* Product selection table */}
          <div
            className="table-responsive border rounded mb-3"
            style={{ maxHeight: "280px", overflowY: "auto" }}
          >
            <Table hover size="sm" className="mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th width="40">
                    <Input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      No products found
                    </td>
                  </tr>
                ) : products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
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
              </tbody>
            </Table>
          </div>

          {/* Discount form */}
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Label className="form-label">Discount Type</Label>
              <Select
                options={discountTypeOptions}
                value={discountTypeOptions.find((x) => x.value === clearanceForm.discountType)}
                onChange={(opt) =>
                  setClearanceForm((prev) => ({
                    ...prev,
                    discountType: opt?.value || "PERCENTAGE",
                  }))
                }
              />
            </Col>
            <Col md={4}>
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
            <Col md={4}>
              <div className="text-muted small">
                <strong>{selectedProductIds.size}</strong> product
                {selectedProductIds.size !== 1 ? "s" : ""} selected
              </div>
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter>
          <Button color="outline-secondary" onClick={toggleSelectAll}>
            {allSelected ? "Unselect All" : "Select All Visible"}
          </Button>
          <Button color="light" onClick={closeAddModal}>
            Cancel
          </Button>
          <Button
            color="success"
            onClick={handleCreateClearance}
            disabled={isSaving || selectedProductIds.size === 0}
          >
            <i className="ri-add-line align-bottom me-1"></i>
            {isSaving ? "Saving..." : `Create Clearance (${selectedProductIds.size})`}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Clearance;
