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

import {
  createCountry,
  updateCountry,
  getCountry,
  removeCountry,
} from "../../functions/Location/Location";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";

const initialState = {
  countryName: "",
  countryCode:"",
  isActive: false,
};

const Country = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  
  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

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
    getCountry(_id)
      .then((res) => {
        if (res.data.success) {
          setValues({
            ...values,
            countryCode: res.data.data.countryCode,
            countryName: res.data.data.countryName,
            isActive: res.data.data.isActive,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error fetching country data!");
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
      createCountry(values)
        .then((res) => {
          if (res.data.success) {
            toast.success("Country Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchCountries();
          } 
        })
        .catch((error) => {
          console.log(error);
          toast.error("Error adding country!");
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setLoading(true);
    removeCountry(remove_id)
      .then((res) => {
        if (res.data.success) {
          setmodal_delete(!modal_delete);
          fetchCountries();
          toast.success("Country Removed Successfully!");
        }
      })
      .catch((err) => {
              console.log(err);
              setmodal_delete(false);
              
              if (err.response && err.response.status === 409) {
                // Handle reference error
                setReferenceData(err.response.data);
                setReferenceModal(true);
              } else {
                toast.error("Failed to delete country. Please try again.");
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
      updateCountry(_id, values)
        .then((res) => {
          if (res.data.success) {
            setmodal_edit(!modal_edit);
            fetchCountries();
            toast.success("Country Updated Successfully!");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error updating country!");
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.countryName === "") {
      errors.countryName = "Country Name is required!";
    }
    if(values.countryCode === "") {
      errors.countryCode = "Country Code is required!";
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
        `/api/country?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setCountries(response.data.data || []);
        setTotalRows(response.data.total || 0);
      } else {
        setCountries([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
      setTotalRows(0);
      toast.error("Failed to fetch countries!");
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
      maxWidth: "20px",
    },
    {
      name: "Country Name",
      selector: (row) => row.countryName,
      minWidth: "130px",
    },
    {
      name: "Country Code",
      selector: (row) => row.countryCode,
      sortable: false,
      sortField: "Status",
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

  document.title = `Country | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer/>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="Country"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Country"
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
          Add Country
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Name"
                required
                name="countryName"
                value={values.countryName}
                onChange={handleChange}
              />
              <Label>
                Country <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.countryName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="countryCode"
                value={values.countryCode}
                onChange={handleChange}
              />
              <Label>
                Country Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.countryCode}</p>
              )}
            </div>

            <div className=" mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isActive"
                value={values.isActive}
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
          Edit Country
        </ModalHeader>
        <form>
          <ModalBody>
          <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Name"
                required
                name="countryName"
                value={values.countryName}
                onChange={handleChange}
              />
              <Label>
                Country <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.countryName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="countryCode"
                value={values.countryCode}
                onChange={handleChange}
              />
              <Label>
                Country Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.countryCode}</p>
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
        title="Cannot Delete Country"
        referenceData={referenceData}
      />

    </React.Fragment>
  );
};

export default Country;
