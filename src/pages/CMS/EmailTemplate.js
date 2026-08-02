import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
} from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";

const LABELS = {
  customer_enquiry_received: "Customer — enquiry received",
  internal_new_enquiry: "Internal — new enquiry",
  customer_quote_request_received: "Customer — quote request received",
  internal_new_quote_request: "Internal — new quote request",
};

const EMPTY = {
  status: "",
  subject: "",
  preheader: "",
  greetings: "",
  message: "",
  lastLine: "",
  audience: "CUSTOMER",
  category: "OTHER",
  enabled: true,
  requiredVariables: [],
  optionalVariables: [],
  version: 1,
};

const variableText = (values) => (values || []).map((value) => `{{${value}}}`).join(", ");

const EmailTemplate = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [templates, setTemplates] = useState({});
  const [selectedKey, setSelectedKey] = useState("");
  const [values, setValues] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const canEdit = Boolean(currentPagePermissions?.edit);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/checkout/email-templates");
      if (!response.data?.success) throw new Error("Template list failed");
      const next = response.data.templates || {};
      setTemplates(next);
      const firstKey = selectedKey && next[selectedKey] ? selectedKey : Object.keys(next)[0] || "";
      setSelectedKey(firstKey);
      setValues(firstKey ? { ...EMPTY, ...next[firstKey], status: firstKey } : EMPTY);
    } catch (error) {
      toast.error("Could not load email templates");
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    fetchTemplates();
    // Load once on entry; save explicitly refreshes the selected template.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseTemplate = (key) => {
    setSelectedKey(key);
    setValues({ ...EMPTY, ...templates[key], status: key });
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    if (!values.status || !values.subject.trim() || !values.message.trim()) {
      toast.error("Template key, subject and message are required");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put("/api/checkout/email-templates", {
        ...values,
        version: Number(values.version) || 1,
      });
      if (!response.data?.success) throw new Error("Template save failed");
      setTemplates((current) => ({
        ...current,
        [values.status]: { ...values },
      }));
      toast.success("Email template saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save email template");
    } finally {
      setLoading(false);
    }
  };

  const previewDocument = useMemo(
    () => `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"></head><body style="font-family:Arial,sans-serif;color:#334155;padding:20px"><div style="color:#64748b;font-size:12px;margin-bottom:16px">${values.preheader || ""}</div><p>${values.greetings || ""}</p><div>${values.message || ""}</div><p style="margin-top:24px">${values.lastLine || ""}</p></body></html>`,
    [values],
  );

  document.title = `Email Templates | ${adminData?.companyName || "SuperMerch"}`;

  return (
    <div className="page-content">
      {loading && <LoadingOverlay />}
      <Container fluid>
        <BreadCrumb maintitle="CMS" title="Email Templates" pageTitle="CMS" />
        <Alert color="info">
          Essential customer and internal notifications use secure code defaults until an
          authorised admin saves an override here. Placeholders shown for each template are
          replaced automatically when the email is sent.
        </Alert>
        <Row>
          <Col xl={4}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">Templates</h5>
              </CardHeader>
              <CardBody className="p-2">
                {Object.keys(templates).length === 0 && (
                  <p className="text-muted m-2">No templates are available.</p>
                )}
                {Object.entries(templates).map(([key, template]) => (
                  <Button
                    key={key}
                    type="button"
                    color={selectedKey === key ? "primary" : "light"}
                    className="w-100 text-start mb-2"
                    onClick={() => chooseTemplate(key)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <span>{LABELS[key] || key}</span>
                      <Badge color={template.enabled === false ? "secondary" : "success"}>
                        {template.enabled === false ? "Disabled" : "Active"}
                      </Badge>
                    </div>
                    <small className="d-block mt-1 opacity-75">
                      {template.category || "OTHER"} · {template.audience || "CUSTOMER"}
                    </small>
                  </Button>
                ))}
              </CardBody>
            </Card>
          </Col>

          <Col xl={8}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{LABELS[selectedKey] || selectedKey || "Select a template"}</h5>
                  {!canEdit && <Badge color="warning">Read only</Badge>}
                </div>
              </CardHeader>
              <CardBody>
                {!selectedKey ? (
                  <p className="text-muted">Select a template to view its content.</p>
                ) : (
                  <Form onSubmit={saveTemplate}>
                    <Row>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="subject">Subject</Label>
                          <Input id="subject" name="subject" value={values.subject} onChange={updateField} disabled={!canEdit} />
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup switch className="mt-md-4 pt-md-2">
                          <Input type="switch" id="enabled" name="enabled" checked={values.enabled !== false} onChange={updateField} disabled={!canEdit} />
                          <Label for="enabled" check>Template active</Label>
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Label for="preheader">Inbox preview text</Label>
                      <Input id="preheader" name="preheader" value={values.preheader} onChange={updateField} disabled={!canEdit} />
                    </FormGroup>
                    <FormGroup>
                      <Label for="greetings">Greeting</Label>
                      <Input id="greetings" name="greetings" value={values.greetings} onChange={updateField} disabled={!canEdit} />
                    </FormGroup>
                    <FormGroup>
                      <Label for="message">Message (basic HTML supported)</Label>
                      <Input type="textarea" rows={9} id="message" name="message" value={values.message} onChange={updateField} disabled={!canEdit} />
                    </FormGroup>
                    <FormGroup>
                      <Label for="lastLine">Sign-off</Label>
                      <Input type="textarea" rows={3} id="lastLine" name="lastLine" value={values.lastLine} onChange={updateField} disabled={!canEdit} />
                    </FormGroup>

                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="audience">Audience</Label>
                          <Input type="select" id="audience" name="audience" value={values.audience} onChange={updateField} disabled={!canEdit}>
                            <option value="CUSTOMER">Customer</option>
                            <option value="INTERNAL">Internal</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="category">Category</Label>
                          <Input type="select" id="category" name="category" value={values.category} onChange={updateField} disabled={!canEdit}>
                            {["ENQUIRY", "QUOTE", "ORDER", "ARTWORK", "ACCOUNT", "SYSTEM", "OTHER"].map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="version">Version</Label>
                          <Input type="number" min="1" id="version" name="version" value={values.version} onChange={updateField} disabled={!canEdit} />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Alert color="light" className="border">
                      <strong>Required placeholders:</strong>{" "}
                      {variableText(values.requiredVariables) || "None"}
                    </Alert>

                    <Label>Safe preview</Label>
                    <iframe
                      title="Email template preview"
                      sandbox=""
                      srcDoc={previewDocument}
                      style={{ width: "100%", minHeight: 330, border: "1px solid #dee2e6", borderRadius: 6, background: "#fff" }}
                    />

                    {canEdit && (
                      <div className="d-flex justify-content-end mt-3">
                        <Button color="success" type="submit">Save template</Button>
                      </div>
                    )}
                  </Form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EmailTemplate;
