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
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import axios from "axios";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";

const ShippingConfig = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const initialState = {
    freeShippingThreshold: "",
    defaultShippingRate: "",
    expressRate: "",
    isActive: true,
  };

  const [values, setValues] = useState(initialState);

  const fetchShippingConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/shipping", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        const config = response.data.data;
        setValues({
          freeShippingThreshold: config.freeShippingThreshold || "",
          defaultShippingRate: config.defaultShippingRate || "",
          expressRate: config.expressRate || "",
          isActive: config.isActive !== undefined ? config.isActive : true,
        });
      }
    } catch (error) {
      console.error("Error fetching shipping config:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load shipping configuration");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShippingConfig();
  }, [fetchShippingConfig]);

  const validate = (values) => {
    const errors = {};
    if (values.freeShippingThreshold === "" || values.freeShippingThreshold === null) {
      errors.freeShippingThreshold = "Free shipping threshold is required";
    }
    if (values.defaultShippingRate === "" || values.defaultShippingRate === null) {
      errors.defaultShippingRate = "Default shipping rate is required";
    }
    if (values.expressRate === "" || values.expressRate === null) {
      errors.expressRate = "Express rate is required";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "/api/shipping",
          {
            freeShippingThreshold: parseFloat(values.freeShippingThreshold),
            defaultShippingRate: parseFloat(values.defaultShippingRate),
            expressRate: parseFloat(values.expressRate),
            isActive: values.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "Shipping Configuration Saved Successfully");
          setIsSubmit(false);
          setFormErrors({});
        } else {
          toast.error(response.data.message || "Cannot save shipping configuration");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error saving shipping configuration");
      }
      setIsLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setFormErrors({});
    fetchShippingConfig();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  document.title = `Shipping Configuration | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Settings" title="Shipping Configuration" pageTitle="Settings" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Shipping Configuration</h4>
                </CardHeader>
                <CardBody>
                  <Col xxl={12}>
                    <Card>
                      <CardBody>
                        <div className="live-preview">
                          <Form>
                            <Row>
                              <Row>
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="number"
                                      className="form-control"
                                      required
                                      name="freeShippingThreshold"
                                      min="0"
                                      step="0.01"
                                      value={values.freeShippingThreshold}
                                      onChange={handleChange}
                                    />
                                    <label className="form-label">
                                      Free Shipping Threshold ($){" "}
                                      <span className="text-danger"> *</span>
                                    </label>
                                    {isSubmit && (
                                      <p className="text-danger">
                                        {formErrors.freeShippingThreshold}
                                      </p>
                                    )}
                                  </div>
                                </Col>
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="number"
                                      className="form-control"
                                      required
                                      name="defaultShippingRate"
                                      min="0"
                                      step="0.01"
                                      value={values.defaultShippingRate}
                                      onChange={handleChange}
                                    />
                                    <label className="form-label">
                                      Default Shipping Rate ($){" "}
                                      <span className="text-danger"> *</span>
                                    </label>
                                    {isSubmit && (
                                      <p className="text-danger">
                                        {formErrors.defaultShippingRate}
                                      </p>
                                    )}
                                  </div>
                                </Col>
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="number"
                                      className="form-control"
                                      required
                                      name="expressRate"
                                      min="0"
                                      step="0.01"
                                      value={values.expressRate}
                                      onChange={handleChange}
                                    />
                                    <label className="form-label">
                                      Express Rate ($){" "}
                                      <span className="text-danger"> *</span>
                                    </label>
                                    {isSubmit && (
                                      <p className="text-danger">
                                        {formErrors.expressRate}
                                      </p>
                                    )}
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
                                        value={values.isActive}
                                        onChange={handlecheck}
                                        checked={values.isActive}
                                      />
                                      <Label className="form-check-label">
                                        Is Active
                                      </Label>
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                              <Col lg={12}>
                                <FormsFooter
                                  handleSubmit={handleSubmit}
                                  handleSubmitCancel={handleCancel}
                                />
                              </Col>
                            </Row>
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

export default ShippingConfig;
