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
  Modal,
  ModalHeader,
  ModalBody,
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

const CustomNames = () => {
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
    productId: "",
    originalName: "",
    customName: "",
    customDescription: "",
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

  // Edit modal states
  const [editModal, setEditModal] = useState(false);
  const [editValues, setEditValues] = useState(initialState);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Original Name",
      selector: (row) => <p className="text-wrap">{row.originalName || row.productName || "-"}</p>,
      sortable: true,
    },
    {
      name: "Custom Name",
      selector: (row) => <p className="text-wrap">{row.customName || "-"}</p>,
      sortable: true,
    },
    {
      name: "Custom Description",
      selector: (row) => (
        <p className="text-wrap text-truncate" style={{ }}>
          {row.customDescription || "-"}
        </p>
      ),
      sortable: false,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && (
              <button
                className="btn btn-sm btn-success edit-item-btn"
                onClick={() => handleOpenEditModal(row)}
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

  const fetchCustomNames = useCallback(async () => {
    setLoading(true);
    let params = {
      page: pageNo || 1,
      limit: perPage,
    };

    if (query) {
      params.search = query;
    }

    try {
      const response = await axios.get("/api/custom-names", {
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
      console.error("Error fetching custom names:", error);
      toast.error("Failed to fetch custom product names");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query]);

  useEffect(() => {
    fetchCustomNames();
  }, [fetchCustomNames]);

  const validate = (vals) => {
    const errors = {};
    if (!vals.productId) errors.productId = "Product ID is required";
    if (!vals.customName) errors.customName = "Custom name is required";
    return errors;
  };

  const handleOpenEditModal = (row) => {
    set_Id(row.id);
    setEditValues({
      productId: row.productId || row.id,
      originalName: row.originalName || row.productName || "",
      customName: row.customName || "",
      customDescription: row.customDescription || "",
    });
    setEditModal(true);
    setFormErrors({});
    setIsSubmit(false);
  };

  const handleEditModalSave = async () => {
    const errors = validate(editValues);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "/api/custom-names",
          {
            productId: editValues.productId,
            customName: editValues.customName,
            customDescription: editValues.customDescription,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Custom Name Updated Successfully");
          setEditModal(false);
          setEditValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          fetchCustomNames();
        } else {
          toast.error(response.data.message || "Cannot update custom name");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error updating custom name");
      }
      setIsLoading(false);
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "/api/custom-names",
          {
            productId: values.productId,
            customName: values.customName,
            customDescription: values.customDescription,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Custom Name Added Successfully");
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          fetchCustomNames();
        } else {
          toast.error(response.data.message || "Cannot add custom name");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding custom name");
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
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    try {
      const response = await axios.delete(`/api/custom-names/${remove_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setmodal_delete(false);
        toast.success("Custom Name Deleted Successfully");
        fetchCustomNames();
      } else {
        toast.error(response.data.message || "Cannot delete Custom Name");
      }
    } catch (error) {
      toast.error("Failed to delete custom name. Please try again.");
    }
    setIsDeleteLoading(false);
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues({ ...editValues, [name]: value });
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
                          name="productId"
                          value={values.productId}
                          onChange={handleChange}
                          placeholder="Enter product ID"
                        />
                        <label className="form-label">
                          Product ID <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.productId}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={4}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="customName"
                          value={values.customName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Custom Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.customName}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={8}>
                      <div className="form-floating mb-3">
                        <textarea
                          className="form-control"
                          name="customDescription"
                          value={values.customDescription}
                          onChange={handleChange}
                          style={{ minHeight: "100px" }}
                        />
                        <label className="form-label">Custom Description</label>
                      </div>
                    </Col>
                  </Row>

                  <Col lg={12}>
                    <FormsFooter
                      handleSubmit={handleClick}
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

  const exportColumns = [{header:"Original Name",key:"originalName"},{header:"Custom Name",key:"customName"},{header:"Description",key:"customDescription"}];
  const fetchAllForExport = async () => { try { const r = await axios.get("/api/custom-names",{params:{page:1,limit:10000},headers:{Authorization:"Bearer "+localStorage.getItem("token")}}); return r.data?.data||[]; } catch(e){return data;} };

  document.title = `Custom Product Names | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Product" title="Custom Product Names" pageTitle="Product" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Custom Product Names"
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
                  <ExportButtons data={data} columns={exportColumns} fileName="custom_names" fetchAll={fetchAllForExport} />
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

      {/* Edit Modal */}
      <Modal isOpen={editModal} toggle={() => setEditModal(false)} centered>
        <ModalHeader toggle={() => setEditModal(false)}>
          Edit Custom Name
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <Label className="form-label fw-bold">Original Name</Label>
            <p className="text-muted">{editValues.originalName}</p>
          </div>
          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              name="customName"
              value={editValues.customName}
              onChange={handleEditChange}
            />
            <label className="form-label">
              Custom Name <span className="text-danger"> *</span>
            </label>
            {isSubmit && formErrors.customName && (
              <p className="text-danger">{formErrors.customName}</p>
            )}
          </div>
          <div className="form-floating mb-3">
            <textarea
              className="form-control"
              name="customDescription"
              value={editValues.customDescription}
              onChange={handleEditChange}
              style={{ minHeight: "100px" }}
            />
            <label className="form-label">Custom Description</label>
          </div>
          <div className="hstack gap-2 justify-content-end">
            <Button color="success" onClick={handleEditModalSave}>
              Save
            </Button>
            <Button color="outline-danger" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
          </div>
        </ModalBody>
      </Modal>

      <DeleteModal
        show={modal_delete && !isDeleteLoading}
        handleDelete={handleDelete}
        handleDeleteClose={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default CustomNames;
