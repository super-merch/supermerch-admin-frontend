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
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
    getCategoryOrder,
} from "../../functions/Curation/curationFunc";

const CategoryOrder = () => {
    const { adminData } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);


    const columns = [
        {
            name: "Sr No",
            selector: (row, index) => (pageNo - 1) * perPage + index + 1,
            maxWidth: "80px",
        },
        {
            name: "Category ID",
            selector: (row) => (
                <p className="text-wrap">
                    {row.categoryId || "-"}
                </p>
            ),
            maxWidth: "150px",
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
            maxWidth: "180px",
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

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage) => {
        setPerPage(newPerPage);
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
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">
                                            Category Ordering
                                        </h5>
                                        <div className="d-flex gap-2">
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="table-responsive table-card mt-1 mb-1">
                                        <DataTable
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
