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
  getGlobalMargin,
  setGlobalMargin,
} from "../../functions/Pricing/marginFunc";
import {
  getGlobalDiscount,
  setGlobalDiscount,
} from "../../functions/Pricing/discountFunc";

const GlobalPricing = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);

  // Margin state
  const [margin, setMargin] = useState("");
  const [marginActive, setMarginActive] = useState(true);

  // Discount state
  const [discount, setDiscount] = useState("");
  const [discountActive, setDiscountActive] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [marginRes, discountRes] = await Promise.all([
        getGlobalMargin(),
        getGlobalDiscount(),
      ]);

      if (marginRes.data.success) {
        const d = marginRes.data.data;
        setMargin(d.globalMargin ?? "");
        setMarginActive(d.isActive ?? true);
      }
      if (discountRes.data.success) {
        const d = discountRes.data.data;
        setDiscount(d.discount ?? "");
        setDiscountActive(d.isActive ?? true);
      }
    } catch (error) {
      console.error("Error fetching global pricing:", error);
      toast.error("Failed to fetch global pricing settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarginSubmit = async (e) => {
    e.preventDefault();
    if (margin === "" || margin === null) {
      toast.error("Margin percentage is required");
      return;
    }
    if (isNaN(margin) || Number(margin) < 0) {
      toast.error("Please enter a valid margin percentage");
      return;
    }
    setIsLoading(true);
    try {
      const response = await setGlobalMargin({
        globalMargin: Number(margin),
        isActive: marginActive,
      });
      if (response.data.success) {
        toast.success(response.data.message || "Global margin updated successfully");
        // Same reason as the discount handler below: confirm what was stored
        // rather than leaving the field showing unconfirmed input.
        await fetchData();
      } else {
        toast.error(response.data.message || "Failed to update global margin");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update global margin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    if (discount === "" || discount === null) {
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
        isActive: discountActive,
      });
      if (response.data.success) {
        toast.success(response.data.message || "Global discount updated successfully");
        // Re-read what was actually stored. Without this the page kept showing
        // whatever was typed and never refreshed after mount, so a tab left
        // open all day would happily POST its stale value over a later change.
        await fetchData();
      } else {
        toast.error(response.data.message || "Failed to update global discount");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update global discount");
    } finally {
      setIsLoading(false);
    }
  };

  document.title = `Global Pricing | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Pricing" title="Global Pricing" pageTitle="Pricing" />
          <Row>
            {/* Global Margin Card */}
            <Col lg={6}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">
                    <i className="ri-percent-line me-2"></i>Global Margin
                  </h5>
                </CardHeader>
                <CardBody>
                  <Form onSubmit={handleMarginSubmit}>
                    <div className="form-floating mb-3">
                      <input
                        type="number"
                        className="form-control"
                        name="margin"
                        value={margin}
                        onChange={(e) => setMargin(e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="Margin %"
                      />
                      <label className="form-label">
                        Margin Percentage (%)
                        <span className="text-danger"> *</span>
                      </label>
                    </div>
                    <div className="form-check mb-3">
                      <Input
                        type="checkbox"
                        name="marginActive"
                        checked={marginActive}
                        onChange={(e) => setMarginActive(e.target.checked)}
                      />
                      <Label className="form-check-label">Is Active</Label>
                    </div>
                    {currentPagePermissions.edit && (
                      <Button type="submit" color="success">
                        Save Global Margin
                      </Button>
                    )}
                  </Form>
                </CardBody>
              </Card>
            </Col>

            {/* Global Discount Card */}
            <Col lg={6}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">
                    <i className="ri-price-tag-3-line me-2"></i>Global Discount
                  </h5>
                </CardHeader>
                <CardBody>
                  <Form onSubmit={handleDiscountSubmit}>
                    <div className="form-floating mb-3">
                      <input
                        type="number"
                        className="form-control"
                        name="discount"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="Discount %"
                      />
                      <label className="form-label">
                        Discount Percentage (%)
                        <span className="text-danger"> *</span>
                      </label>
                    </div>
                    <div className="form-check mb-3">
                      <Input
                        type="checkbox"
                        name="discountActive"
                        checked={discountActive}
                        onChange={(e) => setDiscountActive(e.target.checked)}
                      />
                      <Label className="form-check-label">Is Active</Label>
                    </div>
                    {currentPagePermissions.edit && (
                      <Button type="submit" color="success">
                        Save Global Discount
                      </Button>
                    )}
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default GlobalPricing;
