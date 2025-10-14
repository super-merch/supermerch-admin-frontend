import React, { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

const EmailTemplatesManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState('Delivered');

  const statuses = [
    'Delivered',
    'Artwork Pending',
    'ArtWork Approved',
    'Branding in progress',
    'Production Complete',
    'Shipped/In Transit',
    'Cancelled',
    'Returned',
    'On Hold'
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
      }
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/email-templates`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: activeStatus,
            message: templates[activeStatus] || ''
          })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Template saved successfully');
      } else {
        toast.error(data.message || 'Failed to save template');
      }
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Email Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                    ? 'bg-blue-50 border-l-4 border-l-blue-600 font-semibold'
                    : ''
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
              Edit the message template for this status. Use placeholders like {'{customerName}'}, {'{orderId}'}, {'{date}'} which will be replaced with actual values.
            </p>

            <textarea
              value={templates[activeStatus] || ''}
              onChange={(e) =>
                setTemplates({ ...templates, [activeStatus]: e.target.value })
              }
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
              placeholder="Enter your email message template here..."
            />

            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <h4 className="font-semibold text-sm mb-2">Available Placeholders:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><code className="bg-gray-200 px-1 rounded">{'{customerName}'}</code> - Customer's name</p>
                <p><code className="bg-gray-200 px-1 rounded">{'{orderId}'}</code> - Order ID</p>
                <p><code className="bg-gray-200 px-1 rounded">{'{date}'}</code> - Current date</p>
                <p><code className="bg-gray-200 px-1 rounded">{'{status}'}</code> - Order status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={saveTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesManager;