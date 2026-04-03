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
import { MenuContext } from "../../context/MenuContext";

const initialState = {
  vatRate: "",
  isActive: true,
};

const VatMaster = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [vats, setVats] = useState([]);

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
    axios
      .get(`/api/vat/${_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        if (res.data.success) {
          setValues({
            ...values,
            vatRate: res.data.data.vatRate,
            isActive: res.data.data.isActive,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error fetching VAT data!");
      })
      .finally(() => {
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
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      axios
        .post(
          `/api/vat`,
          {
            vatRate: parseFloat(values.vatRate),
            isActive: values.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .then((res) => {
          if (res.data.success) {
            toast.success("VAT Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchVats();
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Error adding VAT!");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setLoading(true);
    axios
      .delete(`/api/vat/${remove_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        if (res.data.success) {
          setmodal_delete(!modal_delete);
          fetchVats();
          toast.success("VAT Removed Successfully!");
        }
      })
      .catch((err) => {
        console.log(err);
        setmodal_delete(false);
        toast.error("Failed to delete VAT. Please try again.");
      })
      .finally(() => {
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
      axios
        .put(
          `/api/vat/${_id}`,
          {
            vatRate: parseFloat(values.vatRate),
            isActive: values.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .then((res) => {
          if (res.data.success) {
            setmodal_edit(!modal_edit);
            fetchVats();
            toast.success("VAT Updated Successfully!");
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error updating VAT!");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.vatRate === "" || values.vatRate === null) {
      errors.vatRate = "VAT Rate is required!";
    } else if (isNaN(values.vatRate)) {
      errors.vatRate = "VAT Rate must be a valid number!";
    } else if (parseFloat(values.vatRate) < 0) {
      errors.vatRate = "VAT Rate cannot be negative!";
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

  const fetchVats = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        `/api/vat/list`,
        {
          page: pageNo || 1,
          limit: perPage || 100,
          isActive: filter ? "true" : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setVats(response.data.data || []);
        setTotalRows(response.data.pagination?.totalCount || 0);
      } else {
        setVats([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching VATs:", error);
      setVats([]);
      setTotalRows(0);
      toast.error("Failed to fetch VATs!");
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, filter]);

  useEffect(() => {
    fetchVats();
  }, [fetchVats]);

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
      name: "VAT Rate (%)",
      selector: (row) => `${row.vatRate}%`,
      minWidth: "130px",
    },
    {
      name: "Status",
      selector: (row) => (row.isActive ? "Active" : "Inactive"),
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
                {!currentPagePermissions.edit 
                    && <span className="text-muted">No actions available</span>
                  }
            </div>
          </React.Fragment>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  document.title = `VAT Master | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer />
      {loading && <LoadingOverlay />}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb maintitle="Master" title="VAT" pageTitle="Master" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="VAT"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    currentPagePermissions={currentPagePermissions}
                    showAddButton={false}
                    showIsActiveFilter={false}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={vats}
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
                          50, 100, 200, 300, totalRows,
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
          Add VAT
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Enter VAT Rate"
                required
                name="vatRate"
                value={values.vatRate}
                onChange={handleChange}
              />
              <Label>
                VAT Rate (%) <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.vatRate}</p>
              )}
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
          Edit VAT
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Enter VAT Rate"
                required
                name="vatRate"
                value={values.vatRate}
                onChange={handleChange}
              />
              <Label>
                VAT Rate (%) <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.vatRate}</p>
              )}
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

export default VatMaster;
