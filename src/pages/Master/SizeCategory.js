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
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import tableCustomStyles from "../../Components/Common/tableStyles";
import PageHeader from "../../Components/Common/PageHeader";


const initialState = {
  name: "",
  slug: "", 
  isActive: true,
};

const SizeCategory = () => {
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
  const handleTog_edit = async (_id) => {
    setmodal_edit(!modal_edit);
    setIsSubmit(false);
    set_Id(_id);
    setLoading(true);
    const response = await axios.get(
      `/api/size-categories/${_id}`,
      {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      const data = response.data.data;
      setValues({
        ...values,
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
      });
    }else{
        toast.error("Error fetching size category data!");
    }

    setLoading(false);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "name"){
        value = value.replace(/[^a-zA-Z\s]/g, "");
        // Auto-generate slug when name changes
        const slug = generateSlug(value);
        setValues({ ...values, [e.target.name]: value, slug: slug });
    } else {
        setValues({ ...values, [e.target.name]: value });
    }
  };

  const handleCheck = (e) => {
    setValues({ ...values, isActive: e.target.checked });
  };

  const handleSubmitCancel = () => {
    setmodal_list(false);
    setValues(initialState);
    setIsSubmit(false);
  };

  const handleClick = async(e) => {
    e.preventDefault();
    setFormErrors({});
    let errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (
      Object.keys(errors).length === 0
    ) {
      setLoading(true);
        try {
            const response = await axios.post(
              `/api/size-categories`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
    
            if (response.data.success) {
              toast.success(response.data.message);
              setmodal_list(!modal_list);
              setValues(initialState);
              fetchCountries();
            } else {
              toast.error("Error adding size category!");
            }
        } catch (error) {
            console.log(error);
            toast.error("Error adding size category!");
        }
        setLoading(false);

    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.delete(
            `/api/size-categories/${remove_id}`,
            {
                headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
            );
            if (response.data.success) {
                setmodal_delete(!modal_delete);
                fetchCountries();
                toast.success(response.data.message);
            } else {
                if(response.status === 409){
                    setReferenceData(response.data);
                    setReferenceModal(true);
                }else{
                    toast.error("Error deleting size category!");
                }
            }
    } catch (err) {
        console.log(err);
              setmodal_delete(false);
              
              if (err.response && err.response.status === 409) {
                // Handle reference error
                setReferenceData(err.response.data);
                setReferenceModal(true);
              } else {
                toast.error("Failed to delete size category. Please try again.");
              }
    }
    setLoading(false);
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

  const handleUpdate = async(e) => {
    e.preventDefault();
    let erros = validate(values);
    setFormErrors(erros);
    setIsSubmit(true);
    if (Object.keys(erros).length === 0) {
      setLoading(true);
    const response = await axios.put(
        `/api/size-categories/${_id}`,
        values,
        {
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
        );

        if (response.data.success) {
            toast.success(response.data.message);
            setmodal_edit(!modal_edit);
            fetchCountries();
        } else {
            toast.error("Error updating gender!");
        }
    setLoading(false);
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.name === "") {
      errors.name = "Size Category Name is required!";
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
      const params = {
        page: pageNo || 1,
        limit: perPage || 100,
        search: query || "",
        isActive: filter
      };

      const response = await axios.get(
        `/api/listbyparams/size-categories`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params,
        }
      );

      if (response.data.success) {
        setCountries(response.data.data || []);
        setTotalRows(response.data.totalPages || 0);
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
      minWidth: "80px",
    },
    {
      name: "Category",
      selector: (row) => row.name,
      minWidth: "130px",
    },
  ];

  const exportColumns = [
    { header: "Category", key: "name" },
    { header: "Slug", key: "slug" },
    { header: "Active", key: "isActive" },
  ];

  const fetchAllForExport = async () => {
    try {
      const response = await axios.get(`/api/listbyparams/size-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        params: { page: 1, limit: 10000, isActive: filter },
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Export fetch error:", error);
      return [];
    }
  };

  document.title = `Size Category | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="Size Category"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <PageHeader
                    formName="Size Category"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    showAddButton={false}
                    data={countries}
                    exportColumns={exportColumns}
                    fileName="size_categories"
                    fetchAllForExport={fetchAllForExport}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={countries}
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
          Add Size Category
        </ModalHeader>
        <form>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Size Category"
                required
                name="name"
                value={values.name}
                onChange={handleChange}
              />
              <Label>
                Size Category <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.name}</p>
              )}
            </div>

            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Slug"
                name="slug"
                value={values.slug}
                readOnly
                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
              <Label>
                Slug (Auto-generated)
              </Label>
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
          Edit Size Category
        </ModalHeader>
        <form>
          <ModalBody>
          <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Size Category"
                required
                name="name"
                value={values.name}
                onChange={handleChange}
              />
              <Label>
                Size Category <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && (
                <p className="text-danger">{formErrors.name}</p>
              )}
            </div>

            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Slug"
                name="slug"
                value={values.slug}
                readOnly
                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
              <Label>
                Slug (Auto-generated)
              </Label>
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

    </React.Fragment>
  );
};

export default SizeCategory;
