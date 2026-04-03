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
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { createEmailFor, deleteEmailFor, getEmailForById, updateEmailFor } from "../../functions/CMS/emailForFunc";
import { MenuContext } from "../../context/MenuContext";

const initialState = {
    emailFor: "",
    isActive: true,
};

const EmailFor = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);

  const [isDeleteErrorModalOpen, setIsDeleteErrorModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [errorServices, setErrorServices] = useState([]);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [countries, setCountries] = useState([]);

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

  const toggleErrorModal = () => {
    setIsDeleteErrorModalOpen(!isDeleteErrorModalOpen);
    setDeleteErrorMessage("");
    setErrorServices([]);
};

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

  const [modal_edit, setmodal_edit] = useState(false);

  const handleTog_edit = (_id) => {
    setmodal_edit(!modal_edit);
    setIsSubmit(false);
    set_Id(_id);
    setLoading(true);
    getEmailForById(_id)
      .then((res) => {
        if (res.data.success) {
          setValues({
            emailFor: res.data.data.emailFor,
            isActive: res.data.data.isActive,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error fetching email for data!");
      }).finally(() => {
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
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
      createEmailFor(values)
        .then((res) => {
          if (res.data.success) {
            toast.success("Email For Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchCountries();
          } 
        })
        .catch((error) => {
          console.log(error);
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Failed to create email for!");
          }
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await deleteEmailFor(remove_id);
        if(res.data.success) {
            toast.success("Email For Deleted Successfully");
            fetchCountries();
            setmodal_delete(false);
        } else {
            setDeleteErrorMessage(res.data.message || "Failed to delete email for");
            setErrorServices(res.data.data || []);
            setIsDeleteErrorModalOpen(true);
            console.log(res)
            setmodal_delete(false);
        }
    } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 409) {
          setDeleteErrorMessage(error.response.data.message || "Cannot delete - item is in use");
          setErrorServices(error.response.data.data || []);
          setIsDeleteErrorModalOpen(true);
        } else {
          toast.error("An error occurred while deleting");
        }
        setmodal_delete(false);
    } finally {
        setLoading(false);
    }
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
      updateEmailFor(_id, values)
        .then((res) => {
          if (res.data.success) {
            setmodal_edit(!modal_edit);
            fetchCountries();
            toast.success("Email For Updated Successfully!");
          }
        })
        .catch((err) => {
          console.log(err);
          if (err.response && err.response.data && err.response.data.message) {
            toast.error(err.response.data.message);
          } else {
            toast.error("Failed to update email for!");
          }
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.emailFor === "") {
      errors.emailFor = "Email For is required!";
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

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNo || 1,
        limit: perPage || 100,
        search: query || "",
        isActive: filter
      });

      const response = await axios.get(
        `/api/list/email-for?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setCountries(response.data.data);
        setTotalRows(response.data.total);
      } else {
        setCountries([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching email fors:", error);
      setCountries([]);
      setTotalRows(0);
      toast.error("Failed to fetch email fors!");
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handlePageChange = (page) => {
    setPageNo(page);
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
      maxWidth: "20px",
    },
    {
      name: "Email For",
      selector: (row) => row.emailFor,
      minWidth: "70px",
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
                {!currentPagePermissions.edit && !currentPagePermissions.delete && (
                  <span className="text-muted">No actions available</span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  document.title = `Email For | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer/>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Setup"
            title="Email For"
            pageTitle="Setup"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Email For"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    currentPagePermissions={currentPagePermissions}
                    showAddButton={currentPagePermissions.write}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={countries}
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
          Add Email For
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Email For"
                required
                name="emailFor"
                value={values.emailFor}
                onChange={handleChange}
              />
              <Label>
                Email For <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.emailFor}</p>
              )}
            </div>
            <div className=" mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isActive"
                value={values.isActive}
                defaultChecked={values.isActive}
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
          Edit Email For
        </ModalHeader>
        <form>
        <ModalBody>
        <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Email For"
                required
                name="emailFor"
                value={values.emailFor}
                onChange={handleChange}
              />
              <Label>
                Email For <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.emailFor}</p>
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

      <ServiceGroupDeleteError 
          isOpen={isDeleteErrorModalOpen}
          toggle={toggleErrorModal}
          message={deleteErrorMessage}
          services={errorServices}
      />

      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default EmailFor;

const ServiceGroupDeleteError = ({ isOpen, toggle, message, services }) => {
    return (
      <Modal isOpen={isOpen} toggle={toggle} centered>
        <ModalHeader 
          className="bg-light p-3" 
          toggle={toggle}
        >
          Unable to Delete Email For
        </ModalHeader>
        <ModalBody>
          <p className="text-danger mb-3">{message}</p>
          {services && services.length > 0 && (
            <>
              <p className="mb-2">Please delete the following services first:</p>
              <ul className="list-group">
                {services.map((service, index) => (
                  <li key={index} className="list-group-item">
                    {service}
                  </li>
                ))}
              </ul>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn-light"
            onClick={toggle}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    );
  };