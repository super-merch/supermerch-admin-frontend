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
import AsyncSelect from "react-select/async";

import {
  createState,
  removeState,
  getState,
  updateState,
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

const initialState = {
  countryId: "",
  stateName: "",
  stateCode: "",
  isActive: false,
};

const State = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [states, setStates] = useState([]);

  // Debounced search for countries with async select
  const loadCountryOptions = useCallback(async (inputValue) => {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 10,
        search: inputValue || "",
        isActive: true
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
        return response.data.data.map((country) => ({
          value: country.id,
          label: country.countryName,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error loading countries:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (Object.keys(formErrors).length === 0 && isSubmit) {
      console.log("no errors");
    }
  }, [formErrors, isSubmit]);

  const [modal_list, setmodal_list] = useState(false);
  const tog_list = () => {
    setmodal_list(!modal_list);
    setValues(initialState);
    setSelectedCountry(null);
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
    getState(_id)
      .then((res) => {
        if (res.data.success) {
          const stateData = res.data.data;
          setValues({
            ...values,
            countryId: stateData.countryId,
            stateName: stateData.stateName,
            stateCode: stateData.stateCode,
            isActive: stateData.isActive,
          });
          
          // Set the selected country for AsyncSelect
          if (stateData.country) {
            setSelectedCountry({
              value: stateData.country.id,
              label: stateData.country.countryName,
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error fetching state data!");
      }).finally(() => {
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setValues({ 
      ...values, 
      countryId: selectedOption ? selectedOption.value : "" 
    });
  };

  const handleCheck = (e) => {
    setValues({ ...values, isActive: e.target.checked });
  };

  const handleSubmitCancel = () => {
    setmodal_list(false);
    setValues(initialState);
    setSelectedCountry(null);
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
      createState(values)
        .then((res) => {
          if (res.data.success) {
            toast.success("State Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            setSelectedCountry(null);
            fetchStates();
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Error adding state!");
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setLoading(true);
    removeState(remove_id)
      .then((res) => {
        if (res.data.success) {
          setmodal_delete(!modal_delete);
          fetchStates();
          toast.success("State Removed Successfully!");
        }
      })
      .catch((err) => {
        console.log(err);
        setmodal_delete(false);
        toast.error("Failed to delete state. Please try again.");
      }).finally(() => {
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
    setSelectedCountry(null);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    let erros = validate(values);
    setFormErrors(erros);
    setIsSubmit(true);
    if (Object.keys(erros).length === 0) {
        setLoading(true);
      updateState(_id, values)
        .then((res) => {
          if (res.data.success) {
            setmodal_edit(!modal_edit);
            fetchStates();
            toast.success("State Updated Successfully!");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error updating state!");
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.countryId === "") {
      errors.countryId = "Country is required!";
    }
    if(values.stateCode === "") {
      errors.stateCode = "State Code is required!";
    }
    if(values.stateName === "") {
      errors.stateName = "State Name is required!";
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

  const fetchStates = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNo || 1,
        limit: perPage || 100,
        search: query || "",
        isActive: filter
      });

      const response = await axios.get(
        `/api/states?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setStates(response.data.data || []);
        setTotalRows(response.data.total || 0);
      } else {
        setStates([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
      setTotalRows(0);
      toast.error("Failed to fetch states!");
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

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
      name: "Country Name",
      selector: (row) => row.country?.countryName || "N/A",
      minWidth: "130px",
    },
    {
      name: "State Name",
      selector: (row) => row.stateName,
      minWidth: "130px",
    },
    {
      name: "State Code",
      selector: (row) => row.stateCode,
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

  document.title = `State | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer/>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="State"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="State"
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
                        data={states}
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
          Add State
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <AsyncSelect
                cacheOptions
                loadOptions={loadCountryOptions}
                defaultOptions
                value={selectedCountry}
                onChange={handleCountryChange}
                placeholder="Select Country *"
                isClearable
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '58px',
                    fontSize: '0.875rem'
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: '#6c757d'
                  })
                }}
              />
              {isSubmit && (
                <p className="text-danger">{formErrors.countryId}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter State Name"
                required
                name="stateName"
                value={values.stateName}
                onChange={handleChange}
              />
              <Label>
                State <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.stateName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="stateCode"
                value={values.stateCode}
                onChange={handleChange}
              />
              <Label>
                State Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.stateCode}</p>
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
          Edit State
        </ModalHeader>
        <form>
          <ModalBody>
          <div className="form-floating mb-3">
              <AsyncSelect
                cacheOptions
                loadOptions={loadCountryOptions}
                defaultOptions
                value={selectedCountry}
                onChange={handleCountryChange}
                placeholder="Select Country *"
                isClearable
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: '58px',
                    fontSize: '0.875rem'
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: '#6c757d'
                  })
                }}
              />
              {isSubmit && (
                <p className="text-danger">{formErrors.countryId}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter State Name"
                required
                name="stateName"
                value={values.stateName}
                onChange={handleChange}
              />
              <Label>
                State <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.stateName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="stateCode"
                value={values.stateCode}
                onChange={handleChange}
              />
              <Label>
                State Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.stateCode}</p>
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
    </React.Fragment>
  );
};

export default State;
