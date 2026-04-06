import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
    useRef,
} from "react";
import {
    Input,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Row,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import {
    getSupplierPriority,
    updateSupplierPriority,
    importSupplierPriority,
} from "../../functions/Curation/curationFunc";

const SupplierPriority = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [query, setQuery] = useState("");

    // Track edited priority values: { [supplierId]: newPriorityValue }
    const [editedPriorities, setEditedPriorities] = useState({});

    // Import modal
    const [importModal, setImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef(null);

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => (pageNo - 1) * perPage + index + 1,
        },
        {
            name: "Supplier Name",
            selector: (row) => (
                <p className="text-wrap">
                    {row.supplierName || row.name || "-"}
                </p>
            ),
            minWidth: "200px",
        },
        {
            name: "Category",
            selector: (row) => (
                <p className="text-wrap">
                    {row.categoryName || "-"}
                </p>
            ),
            minWidth: "200px",
        },
        {
            name: "Current Priority",
            selector: (row) => row.priority ?? 0,
            sortable: true,
        },
        {
            name: "New Priority",
            selector: (row) => {
                const supplierId = row._id || row.id;
                return currentPagePermissions.edit ? (
                    <Input
                        type="number"
                        bsSize="sm"
                        style={{ width: "80px" }}
                        value={
                            editedPriorities[supplierId] !== undefined
                                ? editedPriorities[supplierId]
                                : row.priority ?? 0
                        }
                        onChange={(e) =>
                            handlePriorityChange(supplierId, e.target.value)
                        }
                        min={0}
                    />
                ) : (
                    <span>{row.priority ?? 0}</span>
                );
            },
        },
        {
            name: "Action",
            selector: (row) => {
                const supplierId = row._id || row.id;
                return (
                    <div className="d-flex gap-2">
                        {currentPagePermissions.edit &&
                        editedPriorities[supplierId] !== undefined ? (
                            <Button
                                color="primary"
                                size="sm"
                                onClick={() => handleSavePriority(supplierId)}
                            >
                                Save
                            </Button>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                    </div>
                );
            },
            sortable: false,
            minWidth: "120px",
        },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: pageNo, limit: perPage };
            if (query) params.search = query;
            const response = await getSupplierPriority(params);
            if (response.data.success) {
                setData(response.data.data || []);
                setTotalRows(
                    response.data.pagination?.totalCount ||
                        response.data.total ||
                        0
                );
            } else {
                setData([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching supplier priority:", error);
            toast.error("Failed to fetch supplier priorities");
            setData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage, query]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage) => {
        setPerPage(newPerPage);
    };

    const handlePriorityChange = (supplierId, value) => {
        setEditedPriorities((prev) => ({
            ...prev,
            [supplierId]: value === "" ? "" : Number(value),
        }));
    };

    const handleSavePriority = async (rowId) => {
        const priority = editedPriorities[rowId];
        if (priority === undefined || priority === "") {
            toast.error("Please enter a valid priority number");
            return;
        }
        // Find the row data to get all required fields
        const row = data.find((r) => (r._id || r.id) === rowId);
        setIsLoading(true);
        try {
            const response = await updateSupplierPriority({
                supplierId: row?.supplierId || rowId,
                supplierName: row?.supplierName || "",
                categoryId: row?.categoryId || "",
                categoryName: row?.categoryName || "",
                priorityNumber: Number(priority),
            });
            if (response.data.success) {
                toast.success(
                    response.data.message || "Supplier priority updated"
                );
                setEditedPriorities((prev) => {
                    const updated = { ...prev };
                    delete updated[rowId];
                    return updated;
                });
                fetchData();
            } else {
                toast.error(
                    response.data.message ||
                        "Failed to update supplier priority"
                );
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Error updating supplier priority"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAll = async () => {
        const entries = Object.entries(editedPriorities);
        if (entries.length === 0) {
            toast.info("No changes to save");
            return;
        }
        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;
        for (const [rowId, priority] of entries) {
            try {
                const row = data.find((r) => (r._id || r.id) === rowId);
                const response = await updateSupplierPriority({
                    supplierId: row?.supplierId || rowId,
                    supplierName: row?.supplierName || "",
                    categoryId: row?.categoryId || "",
                    categoryName: row?.categoryName || "",
                    priorityNumber: Number(priority),
                });
                if (response.data.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch {
                errorCount++;
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} supplier priority(ies) updated`);
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} update(s) failed`);
        }
        setEditedPriorities({});
        fetchData();
        setIsLoading(false);
    };

    // Import handlers
    const toggleImportModal = () => {
        setImportModal(!importModal);
        setImportFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "text/csv",
            ];
            if (!validTypes.includes(file.type)) {
                toast.error(
                    "Please upload a valid Excel (.xlsx, .xls) or CSV file"
                );
                e.target.value = "";
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB");
                e.target.value = "";
                return;
            }
            setImportFile(file);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            toast.error("Please select a file to import");
            return;
        }
        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            const response = await importSupplierPriority(formData);
            if (response.data.success) {
                toast.success(
                    response.data.message ||
                        "Supplier priorities imported successfully"
                );
                setImportModal(false);
                setImportFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                fetchData();
            } else {
                toast.error(
                    response.data.message || "Failed to import supplier priorities"
                );
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Error importing supplier priorities"
            );
        } finally {
            setImportLoading(false);
        }
    };

    
  const exportColumns = [{header:"Supplier",key:"supplierName"},{header:"Category",key:"categoryName"},{header:"Priority",key:"priority"}];
  const fetchAllForExport = async () => { try { const r = await getSupplierPriority({page:1,limit:10000}); return r.data?.data||[]; } catch{return data;} };

  document.title = `Supplier Priority | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Curation"
                        title="Supplier Priority"
                        pageTitle="Curation"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            Supplier Priority
                                        </h5>
                                        <div className="d-flex gap-2">
                                            <ExportButtons data={data} columns={exportColumns} fileName="supplier_priority" fetchAll={fetchAllForExport} />
                                            <div className="search-box">
                                                <Input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search..."
                                                    value={query}
                                                    onChange={(e) =>
                                                        setQuery(e.target.value)
                                                    }
                                                />
                                            </div>
                                            {currentPagePermissions.write && (
                                                <Button
                                                    color="info"
                                                    onClick={toggleImportModal}
                                                >
                                                    <i className="ri-upload-2-line align-bottom me-1"></i>
                                                    Import
                                                </Button>
                                            )}
                                            {currentPagePermissions.edit &&
                                                Object.keys(editedPriorities)
                                                    .length > 0 && (
                                                    <Button
                                                        color="primary"
                                                        onClick={handleSaveAll}
                                                    >
                                                        <i className="ri-save-line align-bottom me-1"></i>
                                                        Save All
                                                    </Button>
                                                )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="table-responsive table-card mt-1 mb-1">
                                        <DataTable
                      customStyles={tableCustomStyles}
                      columns={columns}
                                            data={data}
                                            progressPending={loading}
                                            pagination
                                            paginationServer
                                            paginationTotalRows={totalRows}
                                            paginationPerPage={perPage}
                                            paginationRowsPerPageOptions={[
                                                50, 100, 200, 300,
                                            ]}
                                            onChangeRowsPerPage={
                                                handlePerRowsChange
                                            }
                                            onChangePage={handlePageChange}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Import Modal */}
            <Modal
                isOpen={importModal}
                toggle={toggleImportModal}
                centered
            >
                <ModalHeader toggle={toggleImportModal}>
                    Import Supplier Priorities
                </ModalHeader>
                <ModalBody>
                    <div className="mb-3">
                        <p className="text-muted">
                            Upload an Excel (.xlsx, .xls) or CSV file containing
                            supplier priority data.
                        </p>
                        <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            innerRef={fileInputRef}
                        />
                        {importFile && (
                            <div className="mt-2">
                                <small className="text-muted">
                                    Selected: {importFile.name} (
                                    {(importFile.size / 1024).toFixed(1)} KB)
                                </small>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="primary"
                        onClick={handleImport}
                        disabled={!importFile || importLoading}
                    >
                        {importLoading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-1"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Importing...
                            </>
                        ) : (
                            "Import"
                        )}
                    </Button>
                    <Button
                        color="outline-secondary"
                        onClick={toggleImportModal}
                        disabled={importLoading}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default SupplierPriority;
