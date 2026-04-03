import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import UiContent from "../../Components/Common/UiContent";
import { APIClient } from "../../helpers/api_helper";

const api = new APIClient();

const CATEGORIES = [
  { key: "userQuotes", label: "User Quotes" },
  { key: "adminQuotes", label: "Admin Quotes" },
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "userQuery", label: "User Query / Support" },
];

const PushNotificationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/push-notifications/get");
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category, type) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category]?.[type],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/push-notifications/update", settings);
      if (res.success) {
        toast.success("Settings saved successfully");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Notification Settings" pageTitle="Setup" />
          <Row>
            <Col lg={8}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title mb-0">Push Notification Settings</h5>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving || loading}
                    >
                      {saving ? <Spinner size="sm" className="me-1" /> : null}
                      Save Settings
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner />
                    </div>
                  ) : settings ? (
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Category</th>
                            <th className="text-center" style={{ width: 120 }}>Email</th>
                            <th className="text-center" style={{ width: 120 }}>Notification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CATEGORIES.map((cat) => (
                            <tr key={cat.key}>
                              <td className="fw-medium">{cat.label}</td>
                              <td className="text-center">
                                <div className="form-check form-switch d-flex justify-content-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={settings[cat.key]?.email || false}
                                    onChange={() => handleToggle(cat.key, "email")}
                                  />
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="form-check form-switch d-flex justify-content-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={settings[cat.key]?.notification || false}
                                    onChange={() => handleToggle(cat.key, "notification")}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No settings found.</p>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default PushNotificationSettings;
