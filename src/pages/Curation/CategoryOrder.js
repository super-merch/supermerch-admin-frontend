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
        },
        {
            name: "Category ID",
            selector: (row) => (
                <p className="text-wrap">
                    {row.categoryId || "-"}
                </p>
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

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage) => {
        setPerPage(newPerPage);
    };

    
  const exportColumns = [{header:"Category ID",key:"categoryId"},{header:"Category Name",key:"categoryName"},{header:"Products",key:"productIds"}];
  const fetchAllForExport = async () => { try { const r = await getCategoryOrder({page:1,limit:10000}); return r.data?.data||[]; } catch{return data;} };

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
                                            <ExportButtons data={data} columns={exportColumns} fileName="category_order" fetchAll={fetchAllForExport} />
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
