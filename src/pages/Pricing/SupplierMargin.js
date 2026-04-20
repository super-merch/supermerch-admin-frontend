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
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import DeleteModal from "../../Components/Common/DeleteModal";
import {
  getSupplierMargins,
  addSupplierMargin,
  deleteSupplierMargin,
} from "../../functions/Pricing/marginFunc";
import axios from "axios";

const SupplierMargin = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(1);
  const [query, setQuery] = useState("");

  // Add modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [margin, setMargin] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete states
  const [modal_delete, setmodal_delete] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => (pageNo - 1) * perPage + index + 1,
      sortable: false,
      maxWidth: "80px",
    },
    {
      name: "Supplier",
      selector: (row) => (
        <p className="text-wrap">{row.supplierName || row.supplierId}</p>
      ),
    },
    {
      name: "Margin (%)",
      selector: (row) => <p className="text-wrap">{row.margin}%</p>,
      maxWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.delete && (
              <button
                className="btn btn-sm btn-danger remove-item-btn"
                onClick={() => tog_delete(row.supplierId)}
              >
                Remove
              </button>
            )}
            {!currentPagePermissions.delete && (
              <span className="text-muted">No actions available</span>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "150px",
    },
  ];

  const fetchSupplierMargins = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pageNo,
        limit: perPage,
      };
      if (query) params.search = query;

      const response = await getSupplierMargins(params);
      if (response.data.success) {
        setData(response.data.data || []);
        setTotalRows(response.data.pagination?.totalCount || 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching supplier margins:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch supplier margins"
      );
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchSupplierMargins();
  }, [fetchSupplierMargins]);

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

  // Debounced search for supplier dropdown in modal
  useEffect(() => {
    if (!showAddModal) return;
    const timer = setTimeout(() => fetchSuppliers(supplierSearch), 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, showAddModal, fetchSuppliers]);

  const handleOpenAddModal = () => {
    fetchSuppliers();
    setSupplierId("");
    setMargin("");
    setShowAddModal(true);
  };

  const handleAddSupplierMargin = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (margin === "" || isNaN(margin) || Number(margin) < 0) {
      toast.error("Please enter a valid margin percentage");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addSupplierMargin({
        supplierId,
        margin: Number(margin),
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Supplier margin added successfully"
        );
        setShowAddModal(false);
        setSupplierId("");
        setMargin("");
        fetchSupplierMargins();
      } else {
        toast.error(response.data.message || "Failed to add supplier margin");
      }
    } catch (error) {
      console.error("Error adding supplier margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to add supplier margin"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const tog_delete = (id) => {
    setmodal_delete(!modal_delete);
    setDeleteId(id);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await deleteSupplierMargin({ supplierId: deleteId });
      if (response.data.success) {
        setmodal_delete(false);
        toast.success("Supplier margin deleted successfully");
        fetchSupplierMargins();
      } else {
        toast.error(
          response.data.message || "Failed to delete supplier margin"
        );
      }
    } catch (error) {
      console.error("Error deleting supplier margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete supplier margin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage) => {
    setPerPage(newPerPage);
  };

  document.title = `Supplier Margin | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Supplier Margin"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Supplier Margins</h5>
                    <div className="d-flex gap-2 align-items-center">
                      <div className="search-box">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      {currentPagePermissions.write && (
                        <Button
                          color="success"
                          onClick={handleOpenAddModal}
                        >
                          <i className="ri-add-line align-bottom me-1"></i>
                          Add Supplier Margin
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="table-responsive table-card mt-1 mb-1 text-right">
                    <DataTable
                      columns={columns}
                      data={data}
                      progressPending={loading}
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
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Add Supplier Margin Modal */}
      <Modal
        isOpen={showAddModal}
        toggle={() => setShowAddModal(false)}
        centered
      >
        <ModalHeader toggle={() => setShowAddModal(false)}>
          Add Supplier Margin
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleAddSupplierMargin}>
            <div className="mb-3">
              <Label className="form-label">
                Supplier <span className="text-danger">*</span>
              </Label>
              <Select
                isClearable
                placeholder="Select Supplier"
                options={suppliers.map((s) => ({
                  value: String(s.code || s._id || s.id || ""),
                  label: s.code ? `${s.name} (${s.code})` : s.name,
                }))}
                value={
                  supplierId
                    ? suppliers
                        .map((s) => ({
                          value: String(s.code || s._id || s.id || ""),
                          label: s.code ? `${s.name} (${s.code})` : s.name,
                        }))
                        .find((o) => o.value === String(supplierId)) || null
                    : null
                }
                onChange={(opt) => setSupplierId(opt ? opt.value : "")}
                onInputChange={(val) => setSupplierSearch(val)}
                filterOption={null}
              />
            </div>
            <div className="mb-3">
              <Label className="form-label">
                Margin (%) <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                step="0.01"
                min="0"
                placeholder="Enter margin percentage"
              />
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="success"
            onClick={handleAddSupplierMargin}
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
            onClick={() => setShowAddModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default SupplierMargin;
