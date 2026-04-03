import React,{ useContext, useState, useEffect, useCallback } from "react";
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
import {
    createMenuMaster,
    deleteMenuMaster,
    getMenuMasterById,
    updateMenuMaster,
} from "../../functions/Master/menuMasterFunc";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { MenuContext } from "../../context/MenuContext";

const initialState = {
    menuName: "",
    menuGroup: "",
    menuUrl: "",
    sequence: "",
    isActive: true,
    isParent: false,
    parentMenu: null,
};

const MenuMaster = () => {
    const { currentPagePermissions } = useContext(MenuContext);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const [departments, setDepartments] = useState([]);

    const [selectedMenuGroup, setSelectedMenuGroup] = useState(null);
    const [menuGroupList, setMenuGroupList] = useState([]);
    const [selectedParentMenu, setSelectedParentMenu] = useState(null);
    const [parentMenuList, setParentMenuList] = useState([]);

    const [query, setQuery] = useState("");
    const [_id, set_Id] = useState("");
    const [remove_id, setRemove_id] = useState("");

    // Debounced search function for menu groups
    const loadMenuGroupOptions = useCallback(
        async (inputValue, callback) => {
            try {
                const response = await axios.get('/api/menugroups', {
                    params: {
                        search: inputValue,
                        isActive: true,
                        limit: 50
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (response.data.success) {
                    const options = response.data.data
                        .filter(group => !group.isLink) // Only non-link groups for menus
                        .map(group => ({
                            value: group.id,
                            label: group.menugroupName,
                        }));
                    callback(options);
                } else {
                    callback([]);
                }
            } catch (error) {
                console.error('Error loading menu groups:', error);
                callback([]);
            }
        },
        []
    );

    // Debounced search function for parent menus
    const loadParentMenuOptions = useCallback(
        async (inputValue, callback) => {
            if (!selectedMenuGroup) {
                callback([]);
                return;
            }

            try {
                const response = await axios.get('/api/menu', {
                    params: {
                        search: inputValue,
                        menugroupId: selectedMenuGroup.value,
                        isParent: true,
                        isActive: true,
                        limit: 50
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                if (response.data.success) {
                    // Filter out the current menu being edited to prevent self-reference
                    const filteredMenus = response.data.data.filter(menu => 
                        !_id || menu.id.toString() !== _id.toString()
                    );

                    const options = filteredMenus.map(menu => ({
                        value: menu.id,
                        label: menu.menuName,
                    }));
                    callback(options);
                } else {
                    callback([]);
                }
            } catch (error) {
                console.error('Error loading parent menus:', error);
                callback([]);
            }
        },
        [selectedMenuGroup, _id]
    );

    // Load default options for menu groups (called on mount)
    const loadDefaultMenuGroupOptions = useCallback(
        () => loadMenuGroupOptions('', (options) => setMenuGroupList(options)),
        [loadMenuGroupOptions]
    );

    // Load default options for parent menus when menu group changes
    const loadDefaultParentMenuOptions = useCallback(
        () => {
            if (selectedMenuGroup) {
                loadParentMenuOptions('', (options) => setParentMenuList(options));
            } else {
                setParentMenuList([]);
                setSelectedParentMenu(null);
            }
        },
        [loadParentMenuOptions, selectedMenuGroup]
    );

    useEffect(() => {
        loadDefaultMenuGroupOptions();
    }, [loadDefaultMenuGroupOptions]);

    useEffect(() => {
        loadDefaultParentMenuOptions();
    }, [loadDefaultParentMenuOptions]);

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
        getMenuMasterById(_id)
            .then((res) => {
                setValues({
                    ...values,
                    menuName: res.data.data.menuName,
                    menuGroup: res.data.data.menugroupId,
                    menuUrl: res.data.data.url,
                    sequence: res.data.data.sequence,
                    isActive: res.data.data.isActive,
                    isParent: res.data.data.isParent || false,
                    parentMenu: res.data.data.parentMenuId || null,
                });
                setSelectedMenuGroup({
                    value: res.data.data.menugroup.id,
                    label: res.data.data.menugroup.menugroupName,
                });
                
                // Set parent menu if exists
                if (res.data.data.parentMenuId) {
                    // Load parent menus for the selected group
                    loadParentMenuOptions('', (options) => {
                        setParentMenuList(options);
                        const parent = options.find(
                            menu => menu.value === res.data.data.parentMenuId
                        );
                        if (parent) {
                            setSelectedParentMenu(parent);
                        }
                    });
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleCheck = (e) => {
        const { name, checked } = e.target;
        setValues({ ...values, [name]: checked });
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
        
        // If isParent is true, make sure we mark it accordingly
        const dataToSend = {
            ...values,
            menuGroup: selectedMenuGroup.value,
            parentMenu: selectedParentMenu ? selectedParentMenu.value : null,
            isParent: values.isParent
        };
        
        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            createMenuMaster(dataToSend)
                .then((res) => {
                    if (res.data.success) {
                        toast.success("Menu Added Successfully!");
                        setmodal_list(!modal_list);
                        setValues(initialState);
                        setSelectedParentMenu(null);
                        fetchDepartments();
                    }
                })
                .catch((error) => {
                    console.log("Error creating menu master:", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        deleteMenuMaster(remove_id)
            .then((res) => {
                setmodal_delete(!modal_delete);
                toast.success("Menu Removed Successfully!");
                fetchDepartments();
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setIsDeleteLoading(false);
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
        setValues(initialState);
        setSelectedMenuGroup(null);
        setSelectedParentMenu(null);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        let erros = validate(values);
        setFormErrors(erros);
        setIsSubmit(true);

        if (Object.keys(erros).length === 0) {
            setIsLoading(true);
            const dataToSend = {
                ...values,
                menuGroup: selectedMenuGroup.value,
                parentMenu: selectedParentMenu ? selectedParentMenu.value : null,
            };
            updateMenuMaster(_id, dataToSend)
                .then((res) => {
                    setmodal_edit(!modal_edit);
                    setValues(initialState);
                    setSelectedMenuGroup(null);
                    setSelectedParentMenu(null);
                    fetchDepartments();
                    toast.success("Menu Updated Successfully!");
                })
                .catch((err) => {
                    console.log("Error updating menu master:", err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };

    const validate = (values) => {
        const errors = {};

        if (values.menuName === "") {
            errors.menuName = "Menu Name is required!";
        }

        if (selectedMenuGroup === null) {
            errors.menuGroup = "Menu Group is required!";
        }

        // Only require URL for non-parent menus
        if (!values.isParent && values.menuUrl === "") {
            errors.menuUrl = "Menu URL is required for non-parent menus!";
        }

        if (values.sequence === "") {
            errors.sequence = "Sequence is required!";
        }

        // Allow a menu to be both a parent and have a parent for multi-level hierarchy
        // We've removed the restriction that prevented an item from being both a parent and having a parent

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

    const fetchDepartments = useCallback(async () => {
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
            const response = await axios.get('/api/menu', {
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
            console.error('Error fetching menus:', error);
            setDepartments([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query, filter]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPage(newPerPage);
    };
    const handleFilter = (e) => {
        setPageNo(1);
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
            name: "Menu Name",
            selector: (row) => row.menuName,
            sortable: true,
            sortField: "menuName",
            minWidth: "130px",
        },
        {
            name: "Menu Group",
            selector: (row) => row.menugroup?.menugroupName || 'N/A',
            sortable: true,
            sortField: "menugroup.menugroupName",
            minWidth: "130px",
        },
        {
            name: "Menu URL",
            selector: (row) => row.url,
            minWidth: "150px",
        },
        {
            name: "Sequence",
            selector: (row) => row.sequence,
            sortable: true,
            sortField: "sequence",
            minWidth: "130px",
        },
        {
            name: "Action",
            selector: (row) => {
                return (
                    <React.Fragment>
                        <div className="d-flex gap-2">
                            <div className="edit d-flex gap-2">
                                {/* {currentPagePermissions.edit && ( */}
                                <button
                                    className="btn btn-sm btn-success edit-item-btn "
                                    data-bs-toggle="modal"
                                    data-bs-target="#showModal"
                                    onClick={() => handleTog_edit(row.id)}
                                >
                                    Edit
                                </button>
                                {/* )} */}
                                {/* {currentPagePermissions.delete && ( */}
                                <button
                                    className="btn btn-sm btn-danger remove-item-btn"
                                    data-bs-toggle="modal"
                                    data-bs-target="#deleteRecordModal"
                                    onClick={() => tog_delete(row.id)}
                                >
                                    Remove
                                </button>
                                {/* )} */}
                                {/* {!currentPagePermissions.edit && !currentPagePermissions.delete && (
                                    <span className="text-muted">No actions available</span>
                                )} */}
                            </div>
                        </div>
                    </React.Fragment>
                );
            },
            sortable: false,
            minWidth: "180px",
        },
    ];

    document.title = `Menu Master | Shree Balaji Trade-Wing`;

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                {isDeleteLoading && <LoadingOverlay fullScreen />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Master"
                        title="Menu Master"
                        pageTitle="Master"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <FormsHeader
                                        formName="Menu Master"
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
                                                data={departments}
                                                progressPending={loading}
                                                sortServer
                                                onSort={(
                                                    column,
                                                    sortDirection,
                                                    sortedRows
                                                ) => {
                                                    handleSort(
                                                        column,
                                                        sortDirection
                                                    );
                                                }}
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
                                                onChangeRowsPerPage={
                                                    handlePerRowsChange
                                                }
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
                    Add Menu Master
                </ModalHeader>
                <form>
                    {isLoading && <LoadingOverlay />}
                    <ModalBody>
                        <div className="form-floating mb-3">
                            <AsyncSelect
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
                                loadOptions={loadMenuGroupOptions}
                                defaultOptions={menuGroupList}
                                value={selectedMenuGroup}
                                onChange={(selectedOption) => {
                                    setSelectedMenuGroup(selectedOption);
                                }}
                                isClearable
                                cacheOptions
                                debounceTimeout={300}
                            />
                            <label
                                className="form-label"
                                style={{
                                    opacity: 0.7,
                                    transform:
                                        "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                }}
                            >
                                Menu Group <span className="text-danger"> *</span>
                            </label>
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                required
                                name="menuName"
                                value={values.menuName}
                                onChange={handleChange}
                            />
                            <Label>
                                Menu Name <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">
                                    {formErrors.menuName}
                                </p>
                            )}
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                required
                                name="menuUrl"
                                value={values.menuUrl}
                                onChange={handleChange}
                            />
                            <Label>
                                Menu URL <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">
                                    {formErrors.menuUrl}
                                </p>
                            )}
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="number"
                                required
                                name="sequence"
                                value={values.sequence}
                                onChange={handleChange}
                            />
                            <Label>
                                Sequence<span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">
                                    {formErrors.sequence}
                                </p>
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
                            <Label className="form-check-label ms-1">
                                Is Active
                            </Label>
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                name="isParent"
                                checked={values.isParent}
                                onChange={handleCheck}
                                id="isParentCheckbox"
                            />
                            <Label className="form-check-label ms-1" htmlFor="isParentCheckbox">
                                Is Parent Menu (can contain child menus)
                            </Label>
                            {isSubmit && formErrors.isParent && (
                                <p className="text-danger mt-2">
                                    {formErrors.isParent}
                                </p>
                            )}
                        </div>
                            
                        <div className="form-floating mb-3">
                            <AsyncSelect
                                className="basic-single"
                                classNamePrefix="select"
                                placeholder="Select a parent menu"
                                isClearable
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
                                loadOptions={loadParentMenuOptions}
                                defaultOptions={parentMenuList}
                                value={selectedParentMenu}
                                onChange={(selectedOption) => {
                                    setSelectedParentMenu(selectedOption);
                                }}
                                isDisabled={!selectedMenuGroup}
                                cacheOptions
                                debounceTimeout={300}
                            />
                            <label
                                className="form-label"
                                style={{
                                    opacity: 0.7,
                                    transform:
                                        "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                }}
                            >
                                Parent Menu (optional)
                            </label>
                            <small className="form-text text-muted">
                                Select a parent menu to nest this menu under. The path shows the hierarchy.
                            </small>
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
                    Edit Menu
                </ModalHeader>
                <form>
                    {isLoading && <LoadingOverlay />}
                    <ModalBody>
                        <div className="form-floating mb-3">
                            <AsyncSelect
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
                                loadOptions={loadMenuGroupOptions}
                                defaultOptions={menuGroupList}
                                value={selectedMenuGroup}
                                onChange={(selectedOption) => {
                                    setSelectedMenuGroup(selectedOption);
                                }}
                                isClearable
                                cacheOptions
                                debounceTimeout={300}
                            />
                            <label
                                className="form-label"
                                style={{
                                    opacity: 0.7,
                                    transform:
                                        "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                }}
                            >
                                Menu Group{" "}
                                <span className="text-danger"> *</span>
                            </label>
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                required
                                name="menuName"
                                value={values.menuName}
                                onChange={handleChange}
                            />
                            <Label>
                                Menu Name <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">
                                    {formErrors.menuName}
                                </p>
                            )}
                        </div>
                        
                        <div className="form-floating mb-3">
                            <Input
                                type="text"
                                required
                                name="menuUrl"
                                value={values.menuUrl}
                                onChange={handleChange}
                            />
                            <Label>
                                Menu URL <span className="text-danger">*</span>{" "}
                            </Label>
                            {isSubmit && (
                                <p className="text-danger">
                                    {formErrors.menuUrl}
                                </p>
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
                                <p className="text-danger">
                                    {formErrors.sequence}
                                </p>
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
                            <Label className="form-check-label ms-1">
                                Is Active
                            </Label>
                        </div>
                        <div className="form-floating mb-3">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                name="isParent"
                                checked={values.isParent}
                                onChange={handleCheck}
                                id="isParentCheckboxEdit"
                            />
                            <Label className="form-check-label ms-1" htmlFor="isParentCheckboxEdit">
                                Is Parent Menu (can contain child menus)
                            </Label>
                            {isSubmit && formErrors.isParent && (
                                <p className="text-danger mt-2">
                                    {formErrors.isParent}
                                </p>
                            )}
                        </div>
                        
                        <div className="form-floating mb-3">
                            <AsyncSelect
                                className="basic-single"
                                classNamePrefix="select"
                                placeholder="Select a parent menu"
                                isClearable
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
                                loadOptions={loadParentMenuOptions}
                                defaultOptions={parentMenuList}
                                value={selectedParentMenu}
                                onChange={(selectedOption) => {
                                    setSelectedParentMenu(selectedOption);
                                }}
                                isDisabled={!selectedMenuGroup}
                                cacheOptions
                                debounceTimeout={300}
                            />
                            <label
                                className="form-label"
                                style={{
                                    opacity: 0.7,
                                    transform:
                                        "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                                }}
                            >
                                Parent Menu (optional)
                            </label>
                            <small className="form-text text-muted">
                                Select a parent menu to nest this menu under. The path shows the hierarchy.
                            </small>
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
        </React.Fragment>
    );
};

export default MenuMaster;
