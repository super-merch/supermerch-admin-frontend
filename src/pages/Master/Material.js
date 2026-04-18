import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Row,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { MenuContext } from "../../context/MenuContext";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import DeleteModal from "../../Components/Common/DeleteModal";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import tableCustomStyles from "../../Components/Common/tableStyles";


const initialState = {
  name: "",
  isActive: true,
};

const Material = () => {
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

  const [materials, setMaterials] = useState([]);

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
      `/api/materials/${_id}`,
      {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.data.success) {
      setValues({
        ...values,
        name: response.data.data.name,
        isActive: response.data.data.isActive,
      });
    }else{
        toast.error("Error fetching material data!");
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    let value = e.target.value;
    setValues({ ...values, [e.target.name]: value });
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
              `/api/materials`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
    
            if (response.data.success) {
              setmodal_list(!modal_list);
              fetchMaterials();
              toast.success(response.data.message);
              setValues(initialState);
            } else {
              toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error("Error adding material!");
        }
        setLoading(false);

    }
  };

  const handleDelete = async(e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.delete(
            `/api/materials/${remove_id}`,
            {
                headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
            );
            if (response.data.success) {
                setmodal_delete(!modal_delete);
                fetchMaterials();
                toast.success(response.data.message);
            } else if(response.status === 409){
              // Handle reference error
                setReferenceData(response.data);
                setReferenceModal(true);
              }else{
                toast.error("Error deleting material!");
              }
    } catch (err) {
        console.log(err);
              setmodal_delete(false);
              
              if (err.response && err.response.status === 409) {
                // Handle reference error
                setReferenceData(err.response.data);
                setReferenceModal(true);
              } else {
                toast.error("Failed to delete material. Please try again.");
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
        `/api/materials/${_id}`,
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
            fetchMaterials();
            setValues(initialState);
        } else {
            toast.error(response.data.message);
        }
    setLoading(false);
    }
  };

  const validate = (values) => {
    const errors = {};

    if (values.name === "") {
      errors.name = "Material Name is required!";
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

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = {
        page: pageNo || 1,
        limit: perPage || 100,
        search: query || "",
        isActive: filter
      };

      const response = await axios.post(
        `/api/listbyparams/materials`,
        {
            ...params,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setMaterials(response.data.data);
        setTotalRows(response.data.pagination.totalCount);
      } else {
        setMaterials([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
      setTotalRows(0);
      toast.error("Failed to fetch materials!");
    } finally {
      setLoading(false);
    }
  }, [pageNo, perPage, query, filter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

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
      name: "Material",
      selector: (row) => row.name,
      minWidth: "130px",
    },
  ];

  document.title = `Material | ${adminData?.companyName}`;

  return (
    <React.Fragment>
      {loading && <LoadingOverlay/>}
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="Material"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Material"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    currentPagePermissions={currentPagePermissions}
                    showAddButton={false}
                  />
                </CardHeader>

                <CardBody>
                  <div id="customerList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={materials}
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
    </React.Fragment>
  );
};

export default Material;
