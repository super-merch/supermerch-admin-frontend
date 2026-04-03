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

const GlobalMargin = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [margin, setMargin] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchGlobalMargin = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getGlobalMargin();
      if (response.data.success) {
        const data = response.data.data;
        setMargin(data.globalMargin ?? "");
        setIsActive(data.isActive ?? true);
      }
    } catch (error) {
      console.error("Error fetching global margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch global margin"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalMargin();
  }, [fetchGlobalMargin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (margin === "" || margin === null || margin === undefined) {
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
        isActive,
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Global margin updated successfully"
        );
        fetchGlobalMargin();
      } else {
        toast.error(response.data.message || "Failed to update global margin");
      }
    } catch (error) {
      console.error("Error setting global margin:", error);
      toast.error(
        error.response?.data?.message || "Failed to update global margin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  document.title = `Global Margin | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb
            maintitle="Pricing"
            title="Global Margin"
            pageTitle="Pricing"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Global Margin Settings</h5>
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
                                  Save Global Margin
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

export default GlobalMargin;
