import React, { useContext, useState, useEffect } from "react";
import {
  Button,
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
import { createMenuGroup, deleteMenuGroup, getMenuGroupById, updateMenuGroup } from "../../functions/Master/menuGroupFunc";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";

const initialState = {
    menugroupName: "",
    sequence: "",
    isActive: true,
    isLink: false,
    url: "",
};

const MenuGroup = () => {
  const { currentPagePermissions, isSuperAdmin } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [departments, setDepartments] = useState([]);

  const [query, setQuery] = useState("");

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  // Reference error modal state
  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

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
    setIsLoading(true);
    getMenuGroupById(_id)
      .then((res) => {
        setValues({
          ...values,
          menugroupName:res.data.data.menugroupName,
          sequence: res.data.data.sequence,
          isActive: res.data.data.isActive,
          isLink: res.data.data.isLink,
          url: res.data.data.url,
        });
      })
      .catch((err) => {
        console.log(err);
      }).finally(()=>{
        setIsLoading(false);
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
    const dataToSend = {
        ...values,
    }
    if (
      Object.keys(errors).length === 0
    ) {
        setIsLoading(true);
        createMenuGroup(dataToSend)
        .then((res) => {
          if (res.data.success) {
            toast.success("Menu Group Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchDepartments();
          } 
        })
        .catch((error) => {
          console.log("Error creating menu group:", error);
        }).finally(()=>{
          setIsLoading(false);
        });
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
  try {
  
      const response = await deleteMenuGroup(remove_id);
      if (response.data.success) {
        setmodal_delete(!modal_delete);
        toast.success("Menu Group Removed Successfully!");
        fetchDepartments();
      } else {
        if(response.status === 409){
          // Handle reference error
          setReferenceData(response.data);
          setReferenceModal(true);
          setmodal_delete(false);
        }else{
          toast.error(response.data.message || "Failed to delete menu group.");
        }
      }
      setIsDeleteLoading(false);
  } catch (error) {
    console.error("Error deleting menu group:", error);
    setmodal_delete(false);
    setIsDeleteLoading(false);
    
    if (error.response && error.response.status === 409) {
      // Handle reference error
      setReferenceData(error.response.data);
      setReferenceModal(true);
    } else {
      toast.error("Failed to delete menu group. Please try again.");
    }
  }
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
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
      setIsLoading(true);
      updateMenuGroup(_id, values)
        .then((res) => {
          setmodal_edit(!modal_edit);
          fetchDepartments();
          toast.success("Menu Group Updated Successfully!");
        })
        .catch((err) => {
          console.log(err);
        }).finally(()=>{
          setIsLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.menugroupName === "") {
      errors.menugroupName = "Menu Group Name is required!";
    }
    
    if(values.sequence === ""){
      errors.sequence = "Sequence is required!";
    }
    
    if(values.isLink && values.url === ""){
      errors.url = "Menu URL is required for direct link menu groups!";
    }

    return errors;
  };


  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const exportColumns = [
    { header: "Menu Group Name", key: "menugroupName" },
    { header: "Sequence", key: "sequence" },
    { header: "Is Link", key: "isLink" },
    { header: "URL", key: "url" },
    { header: "Is Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    const response = await axios.get('/api/menugroups', {
      params: { page: 1, limit: 10000, isActive: filter, search: query },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data.data || [];
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  useEffect(() => {
    fetchDepartments();
  }, [pageNo, perPage, column, sortDirection, query, filter]);

  const fetchDepartments = async () => {
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
      const response = await axios.get('/api/menugroups', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setDepartments(response.data.data);
      } else {
        setDepartments([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching menu groups:', error);
      setDepartments([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };
  const handleFilter = (e) => {
    setPageNo(1)
    setFilter(e.target.checked);
  };
  const col = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
    },
    {
      name: "Menu Group Name",
      selector: (row) => row.menugroupName,
      sortable: true,
      sortField: "menugroupName",
      minWidth: "130px",
    },
    {
      name: "Sequence",
      selector: (row) => row.sequence,
      sortable: true,
      sortField: "sequence",
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
              {isSuperAdmin && (
              <div className="edit">
                <button
                  className="btn btn-sm btn-success edit-item-btn "
                  data-bs-toggle="modal"
                  data-bs-target="#showModal"
                  onClick={() => handleTog_edit(row.id)}
                >
                  Edit
                </button>
              </div>
              )}
              {isSuperAdmin && (
              <div className="remove">
                <button
                  className="btn btn-sm btn-danger remove-item-btn"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteRecordModal"
                  onClick={() => tog_delete(row.id)}
                >
                  Remove
                </button>
              </div>
              )}
              {!isSuperAdmin && (
                <span className="text-muted">View only</span>
              )}
            </div>
          </React.Fragment>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  document.title = `Menu Group Master | Shree Balaji Trade-Wing`;

  return (
    <React.Fragment>
      <ToastContainer/>
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullScreen />}
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="Menu Group"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <FormsHeader
                      formName="Menu Group"
                      filter={filter}
                      handleFilter={handleFilter}
                      tog_list={tog_list}
                      setQuery={setQuery}
                      showAddButton={isSuperAdmin}
                    />
                    <ExportButtons
                      data={departments}
                      columns={exportColumns}
                      fileName="MenuGroups"
                      fetchAll={fetchAllForExport}
                    />
                  </div>
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={departments}
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
          Add Menu Group
        </ModalHeader>
        <form>
          {isLoading && <LoadingOverlay />}
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                required
                name="menugroupName"
                value={values.menugroupName}
                onChange={handleChange}
              />
              <Label>
                Menu Group Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.menugroupName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="number"
                required
                name="sequence"
                value={values.sequence}
                onChange={handleChange}
                min={1}
              />
              <Label>
                Sequence<span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.sequence}</p>
              )}
            </div>
            <div className="mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isLink"
                checked={values.isLink}
                onChange={handleCheck}
                id="isLinkCheckbox"
              />
              <Label className="form-check-label ms-1" htmlFor="isLinkCheckbox">
                Is Direct Link (no submenus)
              </Label>
            </div>
            {values.isLink && (
              <div className="form-floating mb-3">
                <Input
                  type="text"
                  required
                  name="url"
                  value={values.url}
                  onChange={handleChange}
                />
                <Label>
                  Menu URL <span className="text-danger">*</span>{" "}
                </Label>
                {isSubmit && (
                  <p className="text-danger">{formErrors.url}</p>
                )}
              </div>
            )}
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
          Edit Menu Group
        </ModalHeader>
        <form>
          {isLoading && <LoadingOverlay />}
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                required
                name="menugroupName"
                value={values.menugroupName}
                onChange={handleChange}
              />
              <Label>
                Menu Group Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.menugroupName}</p>
              )}
            </div>
            <div className="form-floating mb-3">
              <Input
                type="number"
                required
                name="sequence"
                value={values.sequence}
                onChange={handleChange}
                min={1}
              />
              <Label>
                Sequence<span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.sequence}</p>
              )}
            </div>
            <div className="mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isLink"
                checked={values.isLink}
                onChange={handleCheck}
                id="isLinkCheckboxEdit"
              />
              <Label className="form-check-label ms-1" htmlFor="isLinkCheckboxEdit">
                Is Direct Link (no submenus)
              </Label>
            </div>
            {values.isLink && (
              <div className="form-floating mb-3">
                <Input
                  type="text"
                  required
                  name="url"
                  value={values.url}
                  onChange={handleChange}
                />
                <Label>
                  Menu URL <span className="text-danger">*</span>{" "}
                </Label>
                {isSubmit && (
                  <p className="text-danger">{formErrors.url}</p>
                )}
              </div>
            )}
            <div className=" mb-3">
              <Input
                type="checkbox"
                className="form-check-input"
                name="isActive"
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
        show={modal_delete && !isDeleteLoading}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Menu Group"
        referenceData={referenceData}
      />
    </React.Fragment>
  );
};

export default MenuGroup;
