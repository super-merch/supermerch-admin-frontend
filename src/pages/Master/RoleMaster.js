import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Label,
  Input,
  Row,
} from "reactstrap";
import axios from "axios";
import DataTable from "react-data-table-component";
import { createRole, getRole, removeRole, updateRole } from "../../functions/Master/roleMasterFunc.js";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal.js";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const initialState = {
  roleName: "",
  isActive: true,
};

const RoleMaster = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (Object.keys(formErrors).length === 0 && isSubmit) {
      console.log("no errors");
    }
  }, [formErrors, isSubmit]);

  const [modal_list, setmodal_list] = useState(false);
  const tog_list = () => {
    setmodal_list(!modal_list);
    setValues(initialState);
    setIsSubmit(false);
  };

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

    const [referenceModal, setReferenceModal] = useState(false);
    const [referenceData, setReferenceData] = useState(null);

  const [modal_edit, setmodal_edit] = useState(false);
  const handleTog_edit = (_id) => {
    setmodal_edit(!modal_edit);
    setIsSubmit(false);
    set_Id(_id);
    setLoading(true);
    getRole(_id)
      .then((res) => {
        setValues({
          ...values,
          roleName: res.data.data.roleName,
          isActive: res.data.data.isActive,
        });
      })
      .catch((err) => {
        console.log(err);
      }).finally(() => {
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCheck = (e) => {
    setValues({ ...values, isActive: e.target.checked });
  };

  const handleSubmitCancel = () => {
    setmodal_list(false);
    setValues(initialState);
    setIsSubmit(false);
  };

  const handleClick = (e) => {
    e.preventDefault();
    setFormErrors({});
    let errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (
      Object.keys(errors).length === 0
    ) {
      setLoading(true);
      createRole(values)
        .then((res) => {
          if (res.data.success) {
            toast.success("Role Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchRoles();
          }
        })
        .catch((error) => {
          console.log(error);
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setLoading(true);
    removeRole(remove_id)
      .then((res) => {
        setmodal_delete(!modal_delete);
        fetchRoles();
        toast.success("Role Removed Successfully!");
      })
      .catch((err) => {
        console.log(err);
        setmodal_delete(false);
        
        if (err.response && err.response.status === 409) {
          // Handle reference error
          setReferenceData(err.response.data);
          setReferenceModal(true);
        } else {
          toast.error("Failed to delete role. Please try again.");
        }
      }).finally(()=>{
        setLoading(false);
      });
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleUpdateCancel = (e) => {
    setmodal_edit(false);
    setIsSubmit(false);
    setFormErrors({});
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    let erros = validate(values);
    setFormErrors(erros);
    setIsSubmit(true);
    if (Object.keys(erros).length === 0) {
      setLoading(true);
      updateRole(_id, values)
        .then((res) => {
          setmodal_edit(!modal_edit);
          fetchRoles();
          toast.success("Role Updated Successfully!");
        })
        .catch((err) => {
          console.log(err);
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.roleName === "") {
      errors.roleName = "Role Name is required!";
    }

    return errors;
  };

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const fetchRoles = useCallback(async () => {
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
      const response = await axios.get('/api/roles', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setRoles(response.data.data);
      } else {
        setRoles([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };
  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };
  const col = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Role Name",
      selector: (row) => row.roleName,
      sortable: true,
      sortField: "roleName",
      minWidth: "130px",
    },
    {
      name: "Status",
      selector: (row) => (row.isActive ? "Active" : "Inactive"),
      minWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <React.Fragment>
            <div className="d-flex gap-2">
              <div className="edit">
                {currentPagePermissions.edit && (
                <button
                  className="btn btn-sm btn-success edit-item-btn "
                  data-bs-toggle="modal"
                  data-bs-target="#showModal"
                  onClick={() => handleTog_edit(row.id)}
                >
                  Edit
                </button>
                )}
              </div>

              <div className="remove">
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
              </div>
              {!currentPagePermissions.edit && !currentPagePermissions.delete && (
                <span className="text-muted">No actions available</span>
              )}
            </div>
          </React.Fragment>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  document.title = `Role Master | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer/>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Employee Management"
            title="Role Master"
            pageTitle="Employee Management"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Role Master"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    currentPagePermissions={currentPagePermissions}
                    // showAddButton={currentPagePermissions.write}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={roles}
                        progressPending={loading}
                        sortServer
                        onSort={(column, sortDirection, sortedRows) => {
                          handleSort(column, sortDirection);
                        }}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[
                          50,100,200,300,totalRows
                      ]} 
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modal_list}
        toggle={() => {
          tog_list();
        }}
        centered
      >
        <ModalHeader
          className="bg-light p-3"
          toggle={() => {
            setmodal_list(false);
            setIsSubmit(false);
          }}
        >
          Add Role
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Role Name"
                required
                name="roleName"
                value={values.roleName}
                onChange={handleChange}
              />
              <Label>
                Role Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.roleName}</p>
              )}
            </div>
            <div className=" mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isActive"
                value={values.isActive}
                checked={values.isActive}
                onChange={handleCheck}
              />
              <Label className="form-check-label ms-1">Is Active</Label>
            </div>
          </ModalBody>
          <ModalFooter>
            <FormsFooter
              handleSubmit={handleClick}
              handleSubmitCancel={handleSubmitCancel}
            />
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modal_edit}
        toggle={() => {
          handleTog_edit();
        }}
        centered
        >
        <ModalHeader
          className="bg-light p-3"
          toggle={() => {
            setmodal_edit(false);
            setIsSubmit(false);
          }}
        >
          Edit Role
        </ModalHeader>
        <form>
          <ModalBody>
          <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Role Name"
                required
                name="roleName"
                value={values.roleName}
                onChange={handleChange}
              />
              <Label>
                Role Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.roleName}</p>
              )}
            </div>
            <div className=" mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isActive"
                value={values.isActive}
                checked={values.isActive}
                onChange={handleCheck}
              />
              <Label className="form-check-label ms-1">Is Active</Label>
            </div>
          </ModalBody>

          <ModalFooter>
            <FormUpdateFooter
              handleUpdate={handleUpdate}
              handleUpdateCancel={handleUpdateCancel}
            />
          </ModalFooter>
        </form>
      </Modal>

      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Role"
        referenceData={referenceData}
      />

    </React.Fragment>
  );
};

export default RoleMaster;
