import React, { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import { toast } from "react-toastify";

const EmailTemplatesManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState("Delivered");

  const statuses = [
    "Delivered",
    "Artwork Pending",
    "ArtWork Approved",
    "Branding in progress",
    "Production Complete",
    "Shipped/In Transit",
    "Cancelled",
    "Returned",
    "On Hold",
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/email-templates`
      );
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
        console.log(data.templates);
      }
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      const tpl = templates[activeStatus] || {};
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/email-templates`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: activeStatus,
            message: tpl.message || "",
            subject: tpl.subject || "",
            greetings: tpl.greetings || "",
            showOrder: !!tpl.showOrder,
            showAddress: !!tpl.showAddress,
            lastLine: tpl.lastLine || "",
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Template saved successfully");
        // optional minimal update: ensure local templates updated from response
        if (data.template) {
          setTemplates((prev) => ({
            ...prev,
            [data.template.status]: data.template,
          }));
        }
      } else {
        toast.error(data.message || "Failed to save template");
      }
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg w-full  mx-auto flex flex-col">
      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Status List */}
        <div className="w-64 border-r overflow-y-auto bg-gray-50">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-100 transition ${
                activeStatus === status
                  ? "bg-blue-50 border-l-4 border-l-blue-600 font-semibold"
                  : ""
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">{activeStatus}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Edit the message template for this status. Use placeholders like{" "}
            {"{customerName}"}, {"{orderId}"}, {"{date}"} which will be replaced
            with actual values.
          </p>

          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={templates[activeStatus]?.subject || ""}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeStatus]: {
                    ...(templates[activeStatus] || {}),
                    subject: e.target.value,
                  },
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Email subject (optional)"
            />

            <input
              type="text"
              value={templates[activeStatus]?.greetings || ""}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeStatus]: {
                    ...(templates[activeStatus] || {}),
                    greetings: e.target.value,
                  },
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Greetings (e.g. Hi {customerName}, )"
            />

            <textarea
              value={templates[activeStatus]?.message || ""}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeStatus]: {
                    ...(templates[activeStatus] || {}),
                    message: e.target.value,
                  },
                })
              }
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
              placeholder="Enter your email message template here..."
            />

            <input
              type="text"
              value={templates[activeStatus]?.lastLine || ""}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeStatus]: {
                    ...(templates[activeStatus] || {}),
                    lastLine: e.target.value,
                  },
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Email footer / signature (optional)"
            />

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!templates[activeStatus]?.showOrder}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeStatus]: {
                        ...(templates[activeStatus] || {}),
                        showOrder: e.target.checked,
                      },
                    })
                  }
                />
                Show Order
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!templates[activeStatus]?.showAddress}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeStatus]: {
                        ...(templates[activeStatus] || {}),
                        showAddress: e.target.checked,
                      },
                    })
                  }
                />
                Show Address
              </label>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <h4 className="font-semibold text-sm mb-2">
                Available Placeholders:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <code className="bg-gray-200 px-1 rounded">
                    {"{customerName}"}
                  </code>{" "}
                  - Customer's name
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">
                    {"{orderId}"}
                  </code>{" "}
                  - Order ID
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">{"{date}"}</code> -
                  Current date
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">{"{status}"}</code>{" "}
                  - Order status
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
        <button
          onClick={saveTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
};

export default EmailTemplatesManager;
