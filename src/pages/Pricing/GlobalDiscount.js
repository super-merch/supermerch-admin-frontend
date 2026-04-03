import React, { useState, useEffect, useContext, useCallback } from "react";
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
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import {
  getGlobalDiscount,
  setGlobalDiscount,
} from "../../functions/Pricing/discountFunc";

const GlobalDiscount = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [discount, setDiscount] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchGlobalDiscount = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getGlobalDiscount();
      if (response.data.success) {
        const data = response.data.data;
        setDiscount(data.discount ?? "");
        setIsActive(data.isActive ?? true);
      }
    } catch (error) {
      console.error("Error fetching global discount:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch global discount"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalDiscount();
  }, [fetchGlobalDiscount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (discount === "" || discount === null || discount === undefined) {
      toast.error("Discount percentage is required");
      return;
    }

    if (isNaN(discount) || Number(discount) < 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    setIsLoading(true);
    try {
      const response = await setGlobalDiscount({
        discount: Number(discount),
        isActive,
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Global discount updated successfully"
        );
        fetchGlobalDiscount();
      } else {
        toast.error(
          response.data.message || "Failed to update global discount"
        );
      }
    } catch (error) {
      console.error("Error setting global discount:", error);
      toast.error(
        error.response?.data?.message || "Failed to update global discount"
      );
    } finally {
      setIsLoading(false);
    }
  };

  document.title = `Global Discount | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Global Discount"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Global Discount Settings</h5>
                </CardHeader>
                <CardBody>
                  <Col xxl={12}>
                    <Card>
                      <CardBody>
                        <div className="live-preview">
                          <Form onSubmit={handleSubmit}>
                            <Row>
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
                                    <span className="text-danger"> *</span>
                                  </label>
                                </div>
                              </Col>
                            </Row>
                            <div className="mt-3">
                              <Row>
                                <Col lg={2}>
                                  <div className="form-check mb-2">
                                    <Input
                                      type="checkbox"
                                      name="isActive"
                                      checked={isActive}
                                      onChange={(e) =>
                                        setIsActive(e.target.checked)
                                      }
                                    />
                                    <Label className="form-check-label">
                                      Is Active
                                    </Label>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                            <div className="mt-4">
                              {currentPagePermissions.edit && (
                                <Button type="submit" color="success">
                                  Save Global Discount
                                </Button>
                              )}
                            </div>
                          </Form>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default GlobalDiscount;
