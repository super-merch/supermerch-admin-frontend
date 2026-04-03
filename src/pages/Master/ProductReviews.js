import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Badge,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Input,
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import UiContent from "../../Components/Common/UiContent";
import DataTable from "../../Components/Common/DataTable";
import { APIClient } from "../../helpers/api_helper";

const api = new APIClient();

const ProductReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState("");

  // Respond modal
  const [respondModal, setRespondModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState("");

  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filterApproved) params.isApproved = filterApproved;

      const res = await api.get("/reviews", { params });
      if (res.success) {
        setReviews(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [search, filterApproved]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id) => {
    try {
      const res = await api.put(`/reviews/${id}/approve`);
      if (res.success) {
        toast.success("Review approved");
        fetchReviews(pagination.currentPage);
      }
    } catch (err) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.put(`/reviews/${id}/reject`);
      if (res.success) {
        toast.success("Review rejected");
        fetchReviews(pagination.currentPage);
      }
    } catch (err) {
      toast.error("Failed to reject review");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await api.delete(`/reviews/${id}`);
      if (res.success) {
        toast.success("Review deleted");
        fetchReviews(pagination.currentPage);
      }
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const openRespondModal = (review) => {
    setSelectedReview(review);
    setResponseText(review.adminResponse || "");
    setRespondModal(true);
  };

  const handleRespond = async () => {
    try {
      const res = await api.put(`/reviews/${selectedReview._id}/respond`, { response: responseText });
      if (res.success) {
        toast.success("Response added");
        setRespondModal(false);
        fetchReviews(pagination.currentPage);
      }
    } catch (err) {
      toast.error("Failed to add response");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`ri-star-${i < rating ? "fill" : "line"}`}
        style={{ color: i < rating ? "#f7b84b" : "#cbd5e1", fontSize: 14 }}
      />
    ));
  };

  const columns = [
    {
      header: "Product",
      cell: (row) => row.productId?.overview?.name || "—",
    },
    {
      header: "Customer",
      cell: (row) => {
        const u = row.userId;
        return u ? `${u.name || ""} ${u.lastName || ""}`.trim() || u.email : "—";
      },
    },
    {
      header: "Rating",
      cell: (row) => <span>{renderStars(row.rating)}</span>,
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge color={row.isApproved ? "success" : "warning"} className="text-uppercase">
          {row.isApproved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      header: "Verified",
      cell: (row) =>
        row.isVerifiedPurchase ? (
          <Badge color="info">Verified</Badge>
        ) : (
          <span className="text-muted">No</span>
        ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          {!row.isApproved && (
            <button className="btn btn-sm btn-success" onClick={() => handleApprove(row._id)} title="Approve">
              <i className="ri-check-line" />
            </button>
          )}
          {row.isApproved && (
            <button className="btn btn-sm btn-warning" onClick={() => handleReject(row._id)} title="Reject">
              <i className="ri-close-line" />
            </button>
          )}
          <button className="btn btn-sm btn-info" onClick={() => openRespondModal(row)} title="Respond">
            <i className="ri-reply-line" />
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row._id)} title="Delete">
            <i className="ri-delete-bin-line" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Product Reviews" pageTitle="Website Users" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Product Reviews</h5>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 140 }}
                        value={filterApproved}
                        onChange={(e) => setFilterApproved(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                      </select>
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={reviews}
                    isLoading={loading}
                    pagination={pagination}
                    onPageChange={(page) => fetchReviews(page)}
                    onSearch={(val) => setSearch(val)}
                    searchPlaceholder="Search reviews..."
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Respond Modal */}
      <Modal isOpen={respondModal} toggle={() => setRespondModal(false)}>
        <ModalHeader toggle={() => setRespondModal(false)}>
          Respond to Review
        </ModalHeader>
        <ModalBody>
          {selectedReview && (
            <div className="mb-3">
              <div className="mb-2">{renderStars(selectedReview.rating)}</div>
              <p className="fw-medium">{selectedReview.title}</p>
              <p className="text-muted">{selectedReview.comment}</p>
              <hr />
            </div>
          )}
          <Input
            type="textarea"
            rows={4}
            placeholder="Write your response..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-light" onClick={() => setRespondModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleRespond} disabled={!responseText.trim()}>
            Submit Response
          </button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </React.Fragment>
  );
};

export default ProductReviews;
