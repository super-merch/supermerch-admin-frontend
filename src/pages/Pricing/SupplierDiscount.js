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
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  getSupplierDiscounts,
  addSupplierDiscount,
} from "../../functions/Pricing/discountFunc";
import axios from "axios";

const SupplierDiscount = () => {
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
  const [discount, setDiscount] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      name: "Discount (%)",
      selector: (row) => <p className="text-wrap">{row.discount}%</p>,
      maxWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleEditDiscount(row)}
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

  const fetchSupplierDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pageNo,
        limit: perPage,
      };
      if (query) params.search = query;

      const response = await getSupplierDiscounts(params);
      if (response.data.success) {
        setData(response.data.data || []);
        setTotalRows(response.data.pagination?.totalCount || 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching supplier discounts:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch supplier discounts"
      );
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchSupplierDiscounts();
  }, [fetchSupplierDiscounts]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get("/api/listbyparams/suppliers", {
        params: { page: 1, limit: 1000, isActive: true },
      });
      if (response.data.success) {
        setSuppliers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleOpenAddModal = () => {
    fetchSuppliers();
    setSupplierId("");
    setDiscount("");
    setShowAddModal(true);
  };

  const handleEditDiscount = (row) => {
    fetchSuppliers();
    setSupplierId(row.supplierId);
    setDiscount(row.discount);
    setShowAddModal(true);
  };

  const handleAddSupplierDiscount = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (discount === "" || isNaN(discount) || Number(discount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addSupplierDiscount({
        supplierId,
        discount: Number(discount),
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Supplier discount saved successfully"
        );
        setShowAddModal(false);
        setSupplierId("");
        setDiscount("");
        fetchSupplierDiscounts();
      } else {
        toast.error(
          response.data.message || "Failed to save supplier discount"
        );
      }
    } catch (error) {
      console.error("Error saving supplier discount:", error);
      toast.error(
        error.response?.data?.message || "Failed to save supplier discount"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage) => {
    setPerPage(newPerPage);
  };

  document.title = `Supplier Discount | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Supplier Discount"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Supplier Discounts</h5>
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
                          Add Supplier Discount
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

      {/* Add / Edit Supplier Discount Modal */}
      <Modal
        isOpen={showAddModal}
        toggle={() => setShowAddModal(false)}
        centered
      >
        <ModalHeader toggle={() => setShowAddModal(false)}>
          {supplierId ? "Edit" : "Add"} Supplier Discount
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleAddSupplierDiscount}>
            <div className="mb-3">
              <Label className="form-label">
                Supplier <span className="text-danger">*</span>
              </Label>
              <select
                className="form-select"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option
                    key={s._id || s.id}
                    value={String(s.code || s._id || s.id || "")}
                  >
                    {s.code ? `${s.name} (${s.code})` : s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <Label className="form-label">
                Discount (%) <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                step="0.01"
                min="0"
                placeholder="Enter discount percentage"
              />
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="success"
            onClick={handleAddSupplierDiscount}
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
    </React.Fragment>
  );
};

export default SupplierDiscount;
