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
  getCity,
  createCity,
  updateCity,
  removeCity,
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
import tableCustomStyles from "../../Components/Common/tableStyles";
import PageHeader from "../../Components/Common/PageHeader";


const initialState = {
  countryId: "",
  stateId: "",
  cityName: "",
  cityCode: "",
  isActive: false,
};

const City = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [cities, setCities] = useState([]);

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

  // Debounced search for states by country with async select
  const loadStateOptions = useCallback(async (inputValue) => {
    if (!values.countryId) return [];
    
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 10,
        search: inputValue || "",
        isActive: true
      });

      const response = await axios.get(
        `/api/states/by-country/${values.countryId}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data.map((state) => ({
          value: state.id,
          label: state.stateName,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error loading states:", error);
      return [];
    }
  }, [values.countryId]);

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
    setSelectedState(null);
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
    getCity(_id)
      .then((res) => {
        if (res.data.success) {
          const cityData = res.data.data;
          setValues({
            ...values,
            countryId: cityData.countryId,
            stateId: cityData.stateId,
            cityName: cityData.cityName,
            cityCode: cityData.cityCode,
            isActive: cityData.isActive,
          });
          
          // Set the selected country for AsyncSelect
          if (cityData.country) {
            setSelectedCountry({
              value: cityData.country.id,
              label: cityData.country.countryName,
            });
          }
          
          // Set the selected state for AsyncSelect
          if (cityData.state) {
            setSelectedState({
              value: cityData.state.id,
              label: cityData.state.stateName,
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error fetching city data!");
      }).finally(() => {
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setSelectedState(null); // Clear state when country changes
    setValues({ 
      ...values, 
      countryId: selectedOption ? selectedOption.value : "",
      stateId: "" // Clear stateId when country changes
    });
  };

  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setValues({ 
      ...values, 
      stateId: selectedOption ? selectedOption.value : "" 
    });
  };

  const handleCheck = (e) => {
    setValues({ ...values, isActive: e.target.checked });
  };

  const handleSubmitCancel = () => {
    setmodal_list(false);
    setValues(initialState);
    setSelectedCountry(null);
    setSelectedState(null);
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
      createCity(values)
        .then((res) => {
          if (res.data.success) {
            toast.success("City Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            setSelectedCountry(null);
            setSelectedState(null);
            fetchCities();
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Error adding city!");
        }).finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setLoading(true);
    removeCity(remove_id)
      .then((res) => {
        if (res.data.success) {
          setmodal_delete(!modal_delete);
          fetchCities();
          toast.success("City Removed Successfully!");
        }
      })
      .catch((err) => {
        console.log(err);
        setmodal_delete(false);
        toast.error("Failed to delete city. Please try again.");
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
    setSelectedState(null);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    let erros = validate(values);
    setFormErrors(erros);
    setIsSubmit(true);
    if (Object.keys(erros).length === 0) {
        setLoading(true);
      updateCity(_id, values)
        .then((res) => {
          if (res.data.success) {
            setmodal_edit(!modal_edit);
            fetchCities();
            toast.success("City Updated Successfully!");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error updating city!");
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
    if (values.stateId === "") {
      errors.stateId = "State is required!";
    }
    if(values.cityCode === "") {
      errors.cityCode = "City Code is required!";
    }
    if(values.cityName === "") {
      errors.cityName = "City Name is required!";
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

  const fetchCities = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: pageNo || 1,
        limit: perPage || 100,
        search: query || "",
        isActive: filter
      });

      const response = await axios.get(
        `/api/cities?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setCities(response.data.data || []);
        setTotalRows(response.data.total || 0);
      } else {
        setCities([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
      setTotalRows(0);
      toast.error("Failed to fetch cities!");
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

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
      minWidth: "80px",
    },
    {
      name: "Country Name",
      selector: (row) => row.country?.countryName || "N/A",
      minWidth: "130px",
    },
    {
      name: "State Name",
      selector: (row) => row.state?.stateName || "N/A",
      minWidth: "130px",
    },
    {
      name: "City Name",
      selector: (row) => row.cityName,
      minWidth: "130px",
    },
    {
      name: "City Code",
      selector: (row) => row.cityCode,
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

  const exportColumns = [
    { header: "Country Name", key: "country.countryName" },
    { header: "State Name", key: "state.stateName" },
    { header: "City Name", key: "cityName" },
    { header: "City Code", key: "cityCode" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 10000,
        isActive: filter,
      });
      const response = await axios.get(`/api/cities?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Export fetch error:", error);
      return [];
    }
  };

  document.title = `City | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer/>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="City"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <PageHeader
                    formName="City"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    showAddButton={currentPagePermissions.write}
                    data={cities}
                    exportColumns={exportColumns}
                    fileName="cities"
                    fetchAllForExport={fetchAllForExport}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={cities}
                        customStyles={tableCustomStyles}
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
          Add City
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
              <AsyncSelect
                cacheOptions
                loadOptions={loadStateOptions}
                defaultOptions
                value={selectedState}
                onChange={handleStateChange}
                placeholder="Select State *"
                isClearable
                isDisabled={!values.countryId}
                key={values.countryId} // Force re-render when country changes
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
                <p className="text-danger">{formErrors.stateId}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter City Name"
                required
                name="cityName"
                value={values.cityName}
                onChange={handleChange}
              />
              <Label>
                City <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.cityName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="cityCode"
                value={values.cityCode}
                onChange={handleChange}
              />
              <Label>
                City Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.cityCode}</p>
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
          Edit City
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
              <AsyncSelect
                cacheOptions
                loadOptions={loadStateOptions}
                defaultOptions
                value={selectedState}
                onChange={handleStateChange}
                placeholder="Select State *"
                isClearable
                isDisabled={!values.countryId}
                key={values.countryId} // Force re-render when country changes
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
                <p className="text-danger">{formErrors.stateId}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter City Name"
                required
                name="cityName"
                value={values.cityName}
                onChange={handleChange}
              />
              <Label>
                City <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.cityName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Country Code"
                required
                name="cityCode"
                value={values.cityCode}
                onChange={handleChange}
              />
              <Label>
                City Code <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.cityCode}</p>
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

export default City;
