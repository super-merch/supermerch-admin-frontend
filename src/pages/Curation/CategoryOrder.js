import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Row,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import tableCustomStyles from "../../Components/Common/tableStyles";
import ExportButtons from "../../Components/Common/ExportButtons";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
    addCategoryOrder,
    getCategoryOrder,
    getPrioritizeForCategory,
    removeCategoryOrder,
    updateCategoryOrder,
} from "../../functions/Curation/curationFunc";


const CategoryOrder = () => {
    const { adminData } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);

    // Pin products form state
    const [pinCategoryId, setPinCategoryId] = useState("");
    const [pinRows, setPinRows] = useState([{ productId: "", position: 1 }]);
    const [pinning, setPinning] = useState(false);

    // Expanded row state for viewing/editing existing pinned products
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);
    const [expandedProducts, setExpandedProducts] = useState([]);
    const [expandedLoading, setExpandedLoading] = useState(false);
    const [expandedCategoryName, setExpandedCategoryName] = useState("");

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => (pageNo - 1) * perPage + index + 1,
            width: "80px",
        },
        {
            name: "Category ID",
            selector: (row) => (
                <p className="text-wrap">{row.categoryId || "-"}</p>
            ),
        },
        {
            name: "Category Name",
            selector: (row) => (
                <p className="text-wrap">
                    {row.categoryName || row.name || "-"}
                </p>
            ),
            minWidth: "250px",
        },
        {
            name: "Pinned Products",
            selector: (row) => (row.productIds || []).length,
            sortable: true,
        },
        {
            name: "Manage",
            cell: (row) => (
                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleRowExpand(row)}
                >
                    {expandedCategoryId === row.categoryId ? "‚ñ≤ Close" : "‚ñº Edit"}
                </button>
            ),
            width: "110px",
        },
    ];

    const ExpandedRowComponent = () => (
        <div className="p-3 bg-light border-bottom">
            <h6 className="mb-2">
                Pinned products for <strong>{expandedCategoryName}</strong> ({expandedCategoryId})
            </h6>
            {expandedLoading ? (
                <p className="text-muted small">Loading‚Ä¶</p>
            ) : expandedProducts.length === 0 ? (
                <p className="text-muted small">No products pinned.</p>
            ) : (
                <table className="table table-sm table-bordered mb-2" style={{ maxWidth: 500 }}>
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: 60 }}>Position</th>
                            <th>Product ID</th>
                            <th style={{ width: 120 }}>Move to</th>
                            <th style={{ width: 80 }}>Remove</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expandedProducts.map((p) => (
                            <tr key={p.productId}>
                                <td className="align-middle">{p.position}</td>
                                <td className="align-middle font-monospace">{p.productId}</td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            defaultValue={p.position}
                                            min={1}
                                            style={{ width: 60 }}
                                            onBlur={(e) => {
                                                const val = Number(e.target.value);
                                                if (val > 0 && val !== p.position) {
                                                    handleExpandedReorder(p.productId, val);
                                                }
                                            }}
                                        />
                                    </div>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleExpandedRemove(p.productId)}
                                    >
                                        ‚úï
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <small className="text-muted">
                Change position by editing the "Move to" field and clicking away. Remove unpins the product from this category.
            </small>
        </div>
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: pageNo, limit: perPage };
            const response = await getCategoryOrder(params);
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
            console.error("Error fetching category order:", error);
            toast.error("Failed to fetch category ordering");
            setData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [pageNo, perPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePageChange = (page) => setPageNo(page);
    const handlePerRowsChange = async (newPerPage) => setPerPage(newPerPage);

    const updatePinRow = (index, field, value) => {
        setPinRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addPinRow = () => {
        setPinRows((prev) => [
            ...prev,
            { productId: "", position: prev.length + 1 },
        ]);
    };

    const removePinRow = (index) => {
        setPinRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRowExpand = async (row) => {
        const catId = row.categoryId;
        if (expandedCategoryId === catId) {
            setExpandedCategoryId(null);
            setExpandedProducts([]);
            return;
        }
        setExpandedCategoryId(catId);
        setExpandedCategoryName(row.categoryName || row.name || catId);
        setExpandedLoading(true);
        try {
            const res = await getPrioritizeForCategory(catId);
            const ids = res.data?.data?.productIds || [];
            setExpandedProducts(ids.map((id, i) => ({ productId: id, position: i + 1 })));
        } catch {
            setExpandedProducts([]);
        } finally {
            setExpandedLoading(false);
        }
    };

    const handleExpandedReorder = async (productId, newPosition) => {
        try {
            await updateCategoryOrder({
                categoryId: expandedCategoryId,
                productId,
                newPosition: Number(newPosition),
            });
            // Refresh
            const res = await getPrioritizeForCategory(expandedCategoryId);
            const ids = res.data?.data?.productIds || [];
            setExpandedProducts(ids.map((id, i) => ({ productId: id, position: i + 1 })));
            toast.success("Reordered");
        } catch {
            toast.error("Failed to reorder");
        }
    };

    const handleExpandedRemove = async (productId) => {
        try {
            await removeCategoryOrder({ categoryId: expandedCategoryId, productId });
            setExpandedProducts((prev) => prev.filter((p) => p.productId !== productId));
            toast.success(`Product ${productId} removed`);
            fetchData();
        } catch {
            toast.error("Failed to remove");
        }
    };

    const handlePinSubmit = async () => {
        const validRows = pinRows.filter(
            (r) => r.productId.trim() && r.position > 0
        );
        if (!pinCategoryId.trim()) {
            toast.error("Please enter a Category ID");
            return;
        }
        if (validRows.length === 0) {
            toast.error("Add at least one product ID and position");
            return;
        }

        setPinning(true);

        // Step 1: add each product (creates category entry if new, no-ops if already there)
        for (const row of validRows) {
            try {
                await addCategoryOrder({
                    categoryId: pinCategoryId.trim(),
                    categoryName: pinCategoryId.trim(),
                    productId: row.productId.trim(),
                });
            } catch (err) {
                // ignore "already prioritized" errors
            }
        }

        // Step 2: reorder each product to its target position
        let successCount = 0;
        let failCount = 0;

        for (const row of validRows) {
            try {
                const res = await updateCategoryOrder({
                    categoryId: pinCategoryId.trim(),
                    productId: row.productId.trim(),
                    newPosition: Number(row.position),
                });
                if (res.data?.success) {
                    successCount++;
                } else {
                    failCount++;
                    console.error("Failed row:", row, res.data);
                }
            } catch (err) {
                failCount++;
                console.error("Error pinning product:", row, err);
            }
        }

        setPinning(false);

        if (successCount > 0) {
            toast.success(
                `${successCount} product${successCount > 1 ? "s" : ""} pinned successfully`
            );
            fetchData();
        }
        if (failCount > 0) {
            toast.error(`${failCount} product${failCount > 1 ? "s" : ""} failed to pin`);
        }
    };

    const exportColumns = [
        { header: "Category ID", key: "categoryId" },
        { header: "Category Name", key: "categoryName" },
        { header: "Products", key: "productIds" },
    ];
    const fetchAllForExport = async () => {
        try {
            const r = await getCategoryOrder({ page: 1, limit: 10000 });
            return r.data?.data || [];
        } catch {
            return data;
        }
    };

    document.title = `Category Ordering | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        maintitle="Curation"
                        title="Category Ordering"
                        pageTitle="Curation"
                    />

                    {/* ‚îÄ‚îÄ Pin Products Form ‚îÄ‚îÄ */}
                    <Row className="mb-4">
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h5 className="card-title mb-0">
                                        Pin Products to Category
                                    </h5>
                                    <small className="text-muted">
                                        Pinned products appear at the top of the
                                        category listing before the general sort.
                                        Position 1 = first result.
                                    </small>
                                </CardHeader>
                                <CardBody>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Category ID
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            style={{ maxWidth: 200 }}
                                            value={pinCategoryId}
                                            onChange={(e) =>
                                                setPinCategoryId(e.target.value)
                                            }
                                            placeholder="e.g. PY-06"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Products to Pin
                                        </label>
                                        <table className="table table-bordered table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: 60 }}>
                                                        Position
                                                    </th>
                                                    <th>Product ID</th>
                                                    <th style={{ width: 60 }}>
                                                        Remove
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pinRows.map((row, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                value={row.position}
                                                                min={1}
                                                                onChange={(e) =>
                                                                    updatePinRow(
                                                                        i,
                                                                        "position",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={row.productId}
                                                                onChange={(e) =>
                                                                    updatePinRow(
                                                                        i,
                                                                        "productId",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="e.g. 1621"
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() =>
                                                                    removePinRow(i)
                                                                }
                                                            >
                                                                ‚úï
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary me-2"
                                            onClick={addPinRow}
                                        >
                                            + Add Row
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={handlePinSubmit}
                                            disabled={pinning}
                                        >
                                            {pinning
                                                ? "Pinning‚Ä¶"
                                                : `Pin ${pinRows.filter((r) => r.productId).length} Products`}
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* ‚îÄ‚îÄ Existing Priority List ‚îÄ‚îÄ */}
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            Category Ordering
                                        </h5>
                                        <div className="d-flex gap-2">
                                            <ExportButtons
                                                data={data}
                                                columns={exportColumns}
                                                fileName="category_order"
                                                fetchAll={fetchAllForExport}
                                            />
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
                                            expandableRows
                                            expandableRowsComponent={ExpandedRowComponent}
                                            expandableRowExpanded={(row) =>
                                                row.categoryId === expandedCategoryId
                                            }
                                            onRowExpandToggled={(expanded, row) =>
                                                handleRowExpand(row)
                                            }
                                        />
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

export default CategoryOrder;
