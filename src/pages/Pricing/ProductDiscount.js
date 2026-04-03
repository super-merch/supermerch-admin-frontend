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
import { addProductDiscount } from "../../functions/Pricing/discountFunc";

const ProductDiscount = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [searchedProductId, setSearchedProductId] = useState("");
  const [discount, setDiscount] = useState("");
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
      // Use the discount list endpoint with productId filter to check existing discount
      const response = await addProductDiscount({
        productId: productId.trim(),
        getOnly: true,
      });
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setProductData(data);
        setDiscount(data.discount ?? "");
        setSearchedProductId(productId.trim());
      } else {
        setProductData(null);
        setDiscount("");
        setSearchedProductId(productId.trim());
      }
    } catch (error) {
      console.error("Error fetching product discount:", error);
      // Product may not have a discount set yet — allow setting one
      setProductData(null);
      setDiscount("");
      setSearchedProductId(productId.trim());
      if (error.response?.status !== 404) {
        // Silently handle — user can still set a discount
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDiscount = async (e) => {
    e.preventDefault();

    if (!searchedProductId) {
      toast.error("Please search for a product first");
      return;
    }
    if (discount === "" || isNaN(discount) || Number(discount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    setIsLoading(true);
    try {
      const response = await addProductDiscount({
        productId: searchedProductId,
        discount: Number(discount),
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Product discount updated successfully"
        );
        if (response.data.data) {
          setProductData(response.data.data);
          setDiscount(response.data.data.discount ?? discount);
        }
      } else {
        toast.error(
          response.data.message || "Failed to update product discount"
        );
      }
    } catch (error) {
      console.error("Error setting product discount:", error);
      toast.error(
        error.response?.data?.message || "Failed to update product discount"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setProductId("");
    setSearchedProductId("");
    setDiscount("");
    setProductData(null);
    setHasSearched(false);
  };

  document.title = `Product Discount | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Product Discount"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Product Discount</h5>
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

                  {/* Result / Set Discount Section */}
                  {hasSearched && searchedProductId && (
                    <Col xxl={12}>
                      <Card className="border">
                        <CardHeader className="bg-light">
                          <h6 className="card-title mb-0">
                            Discount for Product:{" "}
                            <Badge color="info">{searchedProductId}</Badge>
                          </h6>
                        </CardHeader>
                        <CardBody>
                          {productData && (
                            <div className="mb-3">
                              <p className="text-muted mb-1">
                                Current Discount
                              </p>
                              <h5>
                                {productData.discount != null
                                  ? `${productData.discount}%`
                                  : "Not set"}
                              </h5>
                            </div>
                          )}
                          {!productData && (
                            <div className="mb-3">
                              <p className="text-muted">
                                No discount currently set for this product. You
                                can set one below.
                              </p>
                            </div>
                          )}

                          {currentPagePermissions.edit && (
                            <Form onSubmit={handleSetDiscount}>
                              <Row className="align-items-end">
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="number"
                                      className="form-control"
                                      name="discount"
                                      value={discount}
                                      onChange={(e) =>
                                        setDiscount(e.target.value)
                                      }
                                      step="0.01"
                                      min="0"
                                      placeholder="Discount %"
                                    />
                                    <label className="form-label">
                                      Discount Percentage (%)
                                    </label>
                                  </div>
                                </Col>
                                <Col lg={4} className="mb-3">
                                  <Button type="submit" color="success">
                                    Save Discount
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

export default ProductDiscount;
