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

const GSTConfig = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const initialState = {
    gstPercentage: "",
    gstNumber: "",
    isActive: true,
  };

  const [values, setValues] = useState(initialState);

  const fetchGSTConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/gst", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        const config = response.data.data;
        setValues({
          gstPercentage: config.gstPercentage || "",
          gstNumber: config.gstNumber || "",
          isActive: config.isActive !== undefined ? config.isActive : true,
        });
      }
    } catch (error) {
      console.error("Error fetching GST config:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load GST configuration");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGSTConfig();
  }, [fetchGSTConfig]);

  const validate = (values) => {
    const errors = {};
    if (values.gstPercentage === "" || values.gstPercentage === null) {
      errors.gstPercentage = "GST percentage is required";
    } else if (
      parseFloat(values.gstPercentage) < 0 ||
      parseFloat(values.gstPercentage) > 100
    ) {
      errors.gstPercentage = "GST percentage must be between 0 and 100";
    }
    if (!values.gstNumber) {
      errors.gstNumber = "GST number is required";
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
          "/api/gst",
          {
            gstPercentage: parseFloat(values.gstPercentage),
            gstNumber: values.gstNumber,
            isActive: values.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          toast.success(response.data.message || "GST Configuration Saved Successfully");
          setIsSubmit(false);
          setFormErrors({});
        } else {
          toast.error(response.data.message || "Cannot save GST configuration");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error saving GST configuration");
      }
      setIsLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setFormErrors({});
    fetchGSTConfig();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  document.title = `GST Configuration | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Settings" title="GST Configuration" pageTitle="Settings" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">GST Configuration</h4>
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
                                      name="gstPercentage"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={values.gstPercentage}
                                      onChange={handleChange}
                                    />
                                    <label className="form-label">
                                      GST Percentage (%){" "}
                                      <span className="text-danger"> *</span>
                                    </label>
                                    {isSubmit && (
                                      <p className="text-danger">
                                        {formErrors.gstPercentage}
                                      </p>
                                    )}
                                  </div>
                                </Col>
                                <Col lg={4}>
                                  <div className="form-floating mb-3">
                                    <input
                                      type="text"
                                      className="form-control"
                                      required
                                      name="gstNumber"
                                      value={values.gstNumber}
                                      onChange={handleChange}
                                    />
                                    <label className="form-label">
                                      GST Number{" "}
                                      <span className="text-danger"> *</span>
                                    </label>
                                    {isSubmit && (
                                      <p className="text-danger">
                                        {formErrors.gstNumber}
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

export default GSTConfig;
