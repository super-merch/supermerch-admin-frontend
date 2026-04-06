import React, { useState, useEffect, useContext, useCallback } from "react";
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
    Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import axios from "axios";
import DeleteModal from "../../Components/Common/DeleteModal";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import {
    getAustraliaMade,
    addAustraliaMade,
    removeAustraliaMade,
} from "../../functions/Curation/curationFunc";

const exportColumns = [
    { header: "Product Name", key: "overview.name" },
    { header: "SKU", key: "overview.sku_number" },
    { header: "Supplier", key: "supplier.supplier" },
    { header: "Status", key: "isActive" },
];

const AustraliaMade = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [query, setQuery] = useState("");

    // Add product modal
    const [addModal, setAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Delete modal
    const [modal_delete, setmodal_delete] = useState(false);
    const [remove_id, setRemove_id] = useState("");
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => (pageNo - 1) * perPage + index + 1,
        },
        {
            name: "Product Name",
            selector: (row) => (
                <p className="text-wrap">{row.overview?.name || row.product?.name || row.productName || row.name || "-"}</p>
            ),
            minWidth: "200px",
        },
        {
            name: "SKU",
            selector: (row) => row.overview?.sku_number || row.overview?.code || row.sku || "-",
        },
        {
            name: "Supplier",
            selector: (row) => row.supplier?.supplier || row.overview?.supplier || row.brandName || "-",
        },
        {
            name: "Status",
            selector: (row) => (
                <Badge color={row.isActive !== false ? "success" : "danger"}>
                    {row.isActive !== false ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            name: "Action",
            selector: (row) => (
                <div className="d-flex gap-2">
                    {currentPagePermissions.delete ? (
                        <button
                            className="btn btn-sm btn-danger remove-item-btn"
                            onClick={() => tog_delete(row.meta?.id || row._id || row.id)}
                        >
                            Remove
                        </button>
                    ) : (
                        <span className="text-muted">No actions available</span>
                    )}
                </div>
            ),
            sortable: false,
            minWidth: "120px",
        },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: pageNo, limit: perPage };
            if (query) params.search = query;
            const response = await getAustraliaMade(params);
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
            console.error("Error fetching Australia Made products:", error);
            toast.error("Failed to fetch Australia Made products");
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

    // Product search for add modal
    const handleProductSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearchLoading(true);
        try {
            const response = await axios.get("/api/client-products", {
                params: { search: searchTerm, page: 1, limit: 10 },
            });
            if (response.data.success) {
                setSearchResults(response.data.data || []);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Error searching products:", error);
            toast.error("Failed to search products");
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddProduct = async (productId) => {
        setIsLoading(true);
        try {
            const response = await addAustraliaMade({ productId });
            if (response.data.success) {
                toast.success(
                    response.data.message || "Product added to Australia Made"
                );
                setAddModal(false);
                setSearchTerm("");
                setSearchResults([]);
                fetchData();
            } else {
                toast.error(response.data.message || "Failed to add product");
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Error adding product to Australia Made"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const tog_delete = (id) => {
        setmodal_delete(!modal_delete);
        setRemove_id(id);
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        try {
            const response = await removeAustraliaMade(remove_id);
            if (response.data.success) {
                toast.success(
                    response.data.message ||
                        "Product removed from Australia Made"
                );
                setmodal_delete(false);
                fetchData();
            } else {
                toast.error(
                    response.data.message || "Failed to remove product"
                );
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    "Error removing product from Australia Made"
            );
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleDeleteClose = () => {
        setmodal_delete(false);
    };

    const toggleAddModal = () => {
        setAddModal(!addModal);
        setSearchTerm("");
        setSearchResults([]);
    };

    const fetchAllForExport = async () => {
        try {
            const response = await getAustraliaMade({ page: 1, limit: 10000 });
            return response.data.success ? response.data.data || [] : [];
        } catch (error) {
            console.error("Export fetch error:", error);
            return [];
        }
    };

    document.title = `Australia Made | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                {isLoading && <LoadingOverlay />}
                <Container fluid>
                    <BreadCrumb
                        maintitle="Curation"
                        title="Australia Made"
                        pageTitle="Curation"
                    />
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            Australia Made
                                        </h5>
                                        <div className="d-flex gap-2">
                                            <ExportButtons
                                                data={data}
                                                columns={exportColumns}
                                                fileName="Australia_Made"
                                                fetchAll={fetchAllForExport}
                                            />
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
                                                    color="success"
                                                    onClick={toggleAddModal}
                                                >
                                                    <i className="ri-add-line align-bottom me-1"></i>
                                                    Add Product
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="table-responsive table-card mt-1 mb-1">
                                        <DataTable
                                            columns={columns}
                                            data={data}
                                            customStyles={tableCustomStyles}
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

            {/* Add Product Modal */}
            <Modal isOpen={addModal} toggle={toggleAddModal} centered size="lg">
                <ModalHeader toggle={toggleAddModal}>
                    Add Product to Australia Made
                </ModalHeader>
                <ModalBody>
                    <div className="d-flex gap-2 mb-3">
                        <Input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleProductSearch()
                            }
                        />
                        <Button
                            color="primary"
                            onClick={handleProductSearch}
                            disabled={searchLoading}
                        >
                            {searchLoading ? (
                                <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                            ) : (
                                "Search"
                            )}
                        </Button>
                    </div>
                    {searchResults.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Product Name</th>
                                        <th>SKU</th>
                                        <th>Brand</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((product) => (
                                        <tr key={product.meta?.id || product._id || product.id}>
                                            <td>
                                                {product.overview?.name ||
                                                    product.product?.name ||
                                                    product.productName ||
                                                    product.name ||
                                                    "-"}
                                            </td>
                                            <td>{product.overview?.sku_number || product.overview?.code || product.sku || "-"}</td>
                                            <td>
                                                {product.supplier?.supplier || product.overview?.supplier || product.brandName || "-"}
                                            </td>
                                            <td>
                                                <Button
                                                    color="success"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAddProduct(
                                                            product.meta?.id ||
                                                                product._id ||
                                                                product.id
                                                        )
                                                    }
                                                >
                                                    Add
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-muted py-3">
                            {searchTerm
                                ? "No products found. Try a different search term."
                                : "Enter a search term to find products."}
                        </div>
                    )}
                </ModalBody>
            </Modal>

            <DeleteModal
                show={modal_delete && !isDeleteLoading}
                handleDelete={handleDelete}
                handleDeleteClose={handleDeleteClose}
                setmodal_delete={setmodal_delete}
                disabled={isDeleteLoading}
            />
        </React.Fragment>
    );
};

export default AustraliaMade;
