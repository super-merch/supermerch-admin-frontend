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
  ModalFooter,
  Button,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import { getAllRoles } from "../../functions/Master/roleMasterFunc";

const Employee = () => {
  const { adminData, role } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  };

  // Remove file-related states - no longer needed
  
  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);

  // Password reset states
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState("");

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);

  const [roleList, setRoleList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const {currentPagePermissions} = useContext(MenuContext);

  const fetchRoles = async () => {
    try { 
      const response = await getAllRoles({
        isActive: true,
      });
      if (response.data.success) {
        setRoleList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "20px",
    },
    {
      name: "FirstName",
      selector: (row) => <p className="text-wrap">{row.firstName}</p>,
      maxWidth: "200px",
    },
    {
      name: "Last Name",
      selector: (row) => <p className="text-wrap">{row.lastName}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Email",
      selector: (row) => <p className="text-wrap">{row.email}</p>,
      sortable: true,
      maxWidth: "250px",
    },
    {
      name: "Role",
      selector: (row) => <p className="text-wrap">{row.role?.roleName || "N/A"}</p>,
      sortable: true,
      maxWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && <button
              className="btn btn-sm btn-success edit-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#showModal"
              onClick={() => handleTog_edit(row.id)}
            >
              Edit
            </button>}
            {currentPagePermissions.delete && <button
              className="btn btn-sm btn-danger remove-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#deleteRecordModal"
              onClick={() => tog_delete(row.id)}
            >
              Remove
            </button>}
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

  const fetchEmployeeMaster = useCallback(async () => {
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
      const response = await axios.get('/api/users', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTotalRows(response.data.pagination.totalCount);
        setData(response.data.data);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error('Error fetching menu groups:', error);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, column, sortDirection, query, filter]);

  useEffect(() => {
    fetchEmployeeMaster();
  }, [fetchEmployeeMaster]);

  const validate = (values) => {
    const errors = {};
    if (!values.firstName) errors.firstName = "First Name is required";
    if (!values.lastName) errors.lastName = "Last Name is required";
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email))
      errors.email = "Invalid email address";
    if (!values.email) errors.email = "Email is required";
    // Only require password in add mode
    if (!values.password && !updateForm) errors.password = "Password is required";
    if(!selectedRole) errors.role = "Role is required";
    return errors;
  };

  const handleClick = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const employeeData = {
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: selectedRole?.value || "",
        email: values.email,
        password: values.password,
        isActive: values.isActive,
      };
      
      const response = await axios.post(
        `/api/user`,
        employeeData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        toast.success("Employee Added Successfully");
        setShowForm(false);
        setValues(initialState);  
        setIsSubmit(false);
        setFormErrors({});
        setSelectedRole(null);
        fetchEmployeeMaster();
      } else {
        toast.error(response.data.message || "Cannot add Employee");
      }
      setLoading(false);
    }
  };

  const handleUpdate = async(e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const employeeData = {
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: selectedRole?.value || "",
        email: values.email,
        password: values.password,
        isActive: values.isActive,
      };

      const response = await axios.put(
        `/api/user/${_id}`,
        employeeData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        toast.success("Employee Updated Successfully");
        setUpdateForm(false);
        setShowForm(false);
        setValues(initialState);  
        setIsSubmit(false);
        setFormErrors({});
        setSelectedRole(null);
        fetchEmployeeMaster();
      }
      else {
        toast.error(response.data.message || "Cannot update Employee");
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
    setSelectedRole(null);
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    // deleteEmployee(remove_id)
    //   .then((res) => {
    //     setmodal_delete(!modal_delete);
    //     fetchEmployeeMaster();
    //     toast.success("Employee Deleted Successfully");
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     toast.error("Cannot delete Employee");
    //   })
    //   .finally(() => setIsDeleteLoading(false));

    const response = await axios.delete(
      `/api/user/${remove_id}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    if (response.data.success) {
      setmodal_delete(!modal_delete);
      fetchEmployeeMaster();
      toast.success("Employee Deleted Successfully");
    } else {
      toast.error(response.data.message || "Cannot delete Employee");
    }
    setIsDeleteLoading(false);
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = async (_id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(_id);
    setFormErrors({});
    setIsLoading(true);
    setShowResetPassword(false); // Reset the password reset form when editing
    
    try {
      const response = await axios.get(`/api/user/${_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        const user = response.data.data;
        setValues({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          password: "", // Do not pre-fill password
          roleId: user.roleId || "",
          isActive: user.isActive,
        });
        

        setSelectedRole(
          user.role
            ? { value: user.role.id, label: user.role.roleName }
            : null
        );
        setShowForm(true);
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };
  

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(value);
    let newValue = value;
    setValues({ ...values, [name]: newValue });
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

  const handlePasswordResetChange = (e) => {
    setResetPasswordData({
      ...resetPasswordData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleResetPassword = () => {
    setShowResetPassword(!showResetPassword);
    setPasswordResetError("");
    setResetPasswordData({
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setPasswordResetError("Passwords do not match");
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      setPasswordResetError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `/api/auth/reset-password/employee/${_id}`,
        { password: resetPasswordData.newPassword },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      if (response.isOk) {
        toast.success("Password reset successfully");
        setShowResetPassword(false);
        setResetPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordResetError("");
      } else {
        toast.error("Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
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
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="firstName"
                          value={values.firstName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          First Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.firstName}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="lastName"
                          value={values.lastName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Last Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.lastName}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Email <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.email}</p>
                        )}
                      </div>
                    </Col>
                    {!updateForm && (
                      <Col lg={3}>
                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            required
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                          />
                          <label className="form-label">
                            Password <span className="text-danger"> *</span>
                          </label>
                          {isSubmit && (
                            <p className="text-danger">{formErrors.password}</p>
                          )}
                        </div>
                      </Col>
                    )}
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={roleList.map((role) => ({
                            value: role.id,
                            label: role.roleName,
                          }))}
                          value={selectedRole}
                          onChange={(selectedOption) => {
                            setSelectedRole(selectedOption);
                          }}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          Role <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.role}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  {/* Password Reset Section - Only show in edit mode */}
                  {updateForm && role === "ADMIN" && (
                    <Row className="mt-4 mb-4">
                      <Col lg={12}>
                        <div className="d-flex align-items-center mb-2">
                          <h5 className="mb-0">Reset Password</h5>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary ms-2"
                            onClick={toggleResetPassword}
                          >
                            {showResetPassword ? "Cancel" : "Change Password"}
                          </button>
                        </div>
                        
                        {showResetPassword && (
                          <div className="password-reset-container border rounded p-3">
                            <Row>
                              <Col lg={5}>
                                <div className="position-relative mb-3">
                                  <Label className="form-label">
                                    New Password <span className="text-danger">*</span>
                                  </Label>
                                  <div className="position-relative">
                                    <Input
                                      type={showNewPassword ? "text" : "password"}
                                      className="form-control"
                                      required
                                      name="newPassword"
                                      value={resetPasswordData.newPassword}
                                      onChange={handlePasswordResetChange}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      tabIndex={-1}
                                    >
                                      <i className={`ri-eye${showNewPassword ? "" : "-off"}-line align-middle`}></i>
                                    </button>
                                  </div>
                                </div>
                              </Col>
                              <Col lg={5}>
                                <div className="position-relative mb-3">
                                  <Label className="form-label">
                                    Confirm Password <span className="text-danger">*</span>
                                  </Label>
                                  <div className="position-relative">
                                    <Input
                                      type={showConfirmPassword ? "text" : "password"}
                                      className="form-control"
                                      required
                                      name="confirmPassword"
                                      value={resetPasswordData.confirmPassword}
                                      onChange={handlePasswordResetChange}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      tabIndex={-1}
                                    >
                                      <i className={`ri-eye${showConfirmPassword ? "" : "-off"}-line align-middle`}></i>
                                    </button>
                                  </div>
                                </div>
                              </Col>
                              <Col lg={2}>
                                <div className="d-flex align-items-end h-100 mb-3">
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleResetPassword}
                                  >
                                    Reset Password
                                  </button>
                                </div>
                              </Col>
                            </Row>
                            {passwordResetError && (
                              <div className="text-danger">{passwordResetError}</div>
                            )}
                          </div>
                        )}
                      </Col>
                    </Row>
                  )}
                  
                  <div className="mt-5">
                    <Row>
                      <Col lg={2}>
                        <div className="form-check mb-2">
                          <Input
                            type="checkbox"
                            name="isActive"
                            value={values.isActive}
                            onChange={handlecheck}
                            checked={values.isActive}
                          />
                          <Label className="form-check-label">
                            Is Active
                          </Label>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <Col lg={12}>
                    <FormsFooter
                      handleSubmit={updateForm ? handleUpdate : handleClick}
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
  
  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setSelectedRole(null);
    setFormErrors({});
    setShowResetPassword(false);
  }

  document.title = `Employee | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        {isDeleteLoading && <LoadingOverlay fullscreen />}
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Setup" title="Employee" pageTitle="Setup" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Employee"
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
                    // showAddButton={currentPagePermissions.write}
                  />
                </CardHeader>

                {(showForm || updateForm) ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
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
                          50,
                          100,
                          200,
                          300,
                          totalRows,
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

      <DeleteModal
        show={modal_delete && !isDeleteLoading}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
      />
    </React.Fragment>
  );
};

export default Employee;
