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
    getCategoryOrder,
    updateCategoryOrder,
} from "../../functions/Curation/curationFunc";

// Product IDs to pre-populate for PY-06 (Metal Pens)
const METAL_PENS_PRESET = [
    { id: "1621", name: "Concorde Pen ‚Äî $0.90, 8 colours (cheapest entry point)" },
    { id: "1574", name: "Napier Pen ‚Äî $1.42, 11 colours, laser engrave (best all-rounder)" },
    { id: "2383", name: "Panama Pen ‚Äî $1.44, 12 colours (most colours under $1.50)" },
    { id: "43676", name: "Toledo Pen ‚Äî $1.76, 13 colours (widest colour range)" },
    { id: "13643", name: "Edison Pen ‚Äî $2.10, laser engrave, 33 photos (premium pick)" },
];

const CategoryOrder = () => {
    const { adminData } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);

    // Pin products form state
    const [pinCategoryId, setPinCategoryId] = useState("PY-06");
    const [pinRows, setPinRows] = useState(
        METAL_PENS_PRESET.map((p, i) => ({ productId: p.id, position: i + 1 }))
    );
    const [pinning, setPinning] = useState(false);

    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => (pageNo - 1) * perPage + index + 1,
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
            name: "Prioritized Products",
            selector: (row) => (row.productIds || []).length,
            sortable: true,
        },
    ];

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
        let successCount = 0;
        let failCount = 0;

        for (const row of validRows) {
            try {
                const res = await updateCategoryOrder({
                    categoryId: pinCategoryId.trim(),
                    productId: row.productId.trim(),
                    position: Number(row.position),
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
                                                            {METAL_PENS_PRESET[i] && (
                                                                <small className="text-muted d-block mt-1">
                                                                    {METAL_PENS_PRESET[i].name}
                                                                </small>
                                                            )}
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
