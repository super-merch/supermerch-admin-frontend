import React, { useState, useContext } from "react";
import {
  Input,
  Label,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Container,
  Row,
  Button,
  Badge,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  getProductMargin,
  addProductMargin,
} from "../../functions/Pricing/marginFunc";

const ProductMargin = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [searchedProductId, setSearchedProductId] = useState("");
  const [margin, setMargin] = useState("");
  const [productData, setProductData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!productId.trim()) {
      toast.error("Please enter a product ID");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await getProductMargin(productId.trim());
      if (response.data.success) {
        const data = response.data.data;
        setProductData(data);
        setMargin(data.margin ?? "");
        setSearchedProductId(productId.trim());
      } else {
        setProductData(null);
        setMargin("");
        setSearchedProductId(productId.trim());
      }
    } catch (error) {
      console.error("Error fetching product margin:", error);
      // Product may not have a margin set yet — allow setting one
      setProductData(null);
      setMargin("");
      setSearchedProductId(productId.trim());
      if (error.response?.status !== 404) {
        toast.error(
          error.response?.data?.message || "Failed to fetch product margin"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMargin = async (e) => {
    e.preventDefault();

    if (!searchedProductId) {
      toast.error("Please search for a product first");
      return;
    }
    if (margin === "" || isNaN(margin) || Number(margin) < 0) {
      toast.error("Please enter a valid margin percentage");
      return;
    }

    setIsLoading(true);
    try {
      const response = await addProductMargin({
        productId: searchedProductId,
        margin: Number(margin),
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Product margin updated successfully"
        );
        // Re-fetch to get updated data
        const refreshResponse = await getProductMargin(searchedProductId);
        if (refreshResponse.data.success) {
          setProductData(refreshResponse.data.data);
          setMargin(refreshResponse.data.data.margin ?? "");
        }
      } else {
        toast.error(response.data.message || "Failed to update product margin");
      }
    } catch (error) {
      console.error("Error setting product margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to update product margin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setProductId("");
    setSearchedProductId("");
    setMargin("");
    setProductData(null);
    setHasSearched(false);
  };

  document.title = `Product Margin | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Product Margin"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Product Margin</h5>
                </CardHeader>
                <CardBody>
                  {/* Search Section */}
                  <Col xxl={12}>
                    <Card className="border">
                      <CardBody>
                        <div className="live-preview">
                          <Form onSubmit={handleSearch}>
                            <Row className="align-items-end">
                              <Col lg={4}>
                                <div className="form-floating mb-3">
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="productId"
                                    value={productId}
                                    onChange={(e) =>
                                      setProductId(e.target.value)
                                    }
                                    placeholder="Enter Product ID"
                                  />
                                  <label className="form-label">
                                    Product ID{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                </div>
                              </Col>
                              <Col lg={4} className="mb-3">
                                <div className="d-flex gap-2">
                                  <Button type="submit" color="primary">
                                    <i className="ri-search-line align-bottom me-1"></i>
                                    Search
                                  </Button>
                                  <Button
                                    color="outline-secondary"
                                    onClick={handleClear}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </Col>
                            </Row>
                          </Form>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Result / Set Margin Section */}
                  {hasSearched && searchedProductId && (
                    <Col xxl={12}>
                      <Card className="border">
                        <CardHeader className="bg-light">
                          <h6 className="card-title mb-0">
                            Margin for Product:{" "}
                            <Badge color="info">{searchedProductId}</Badge>
                          </h6>
                        </CardHeader>
                        <CardBody>
                          {productData && (
                            <div className="mb-3">
                              <p className="text-muted mb-1">Current Margin</p>
                              <h5>
                                {productData.margin != null
                                  ? `${productData.margin}%`
                                  : "Not set"}
                              </h5>
                            </div>
                          )}
                          {!productData && (
                            <div className="mb-3">
                              <p className="text-muted">
                                No margin currently set for this product. You
                                can set one below.
                              </p>
                            </div>
                          )}

                          {currentPagePermissions.edit && (
                            <Form onSubmit={handleSetMargin}>
                              <Row className="align-items-end">
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="number"
                                      className="form-control"
                                      name="margin"
                                      value={margin}
                                      onChange={(e) =>
                                        setMargin(e.target.value)
                                      }
                                      step="0.01"
                                      min="0"
                                      placeholder="Margin %"
                                    />
                                    <label className="form-label">
                                      Margin Percentage (%)
                                    </label>
                                  </div>
                                </Col>
                                <Col lg={4} className="mb-3">
                                  <Button type="submit" color="success">
                                    Save Margin
                                  </Button>
                                </Col>
                              </Row>
                            </Form>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ProductMargin;
