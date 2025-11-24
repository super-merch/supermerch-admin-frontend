import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  MapPin,
  FileText,
  MessageSquare,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminQuoteDetails() {
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin-quotes/get-quote/${id}`
      );
      const data = await response.json();

      if (data.success) {
        setQuote(data.data);
        console.log(data.data);
      }
    } catch (error) {
      console.error("Error fetching quote details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      accepted: "bg-green-100 text-green-800 border-green-300",
      declined: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${colors[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading quote details...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Quote not found</p>
          <button
            onClick={handleGoBack}
            className="text-blue-600 hover:underline"
          >
            Go back to quotes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Quotes</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Quote #{quote.quoteNumber}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Created: {formatDateShort(quote.createdAt)}
                </span>
                {quote.deadline && (
                  <span className="flex items-center gap-1">
                    📅 Deadline: {formatDateShort(quote.deadline)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(quote.status)}
              {quote.quotePdf && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <FileText size={16} />
                  Preview PDF
                </button>
              )}
              <button
                onClick={() => navigate(`/add-admin-quote?id=${quote._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit size={16} />
                Edit
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {quote.items.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-2xl font-bold text-gray-900">
                ${quote.subtotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discount</p>
              <p className="text-2xl font-bold text-red-600">
                -${(quote.discount?.amount || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold text-green-600">
                ${quote.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
              <User size={22} className="text-blue-600" />
              Customer Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Customer Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {quote.customer.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Email Address
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {quote.customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Customer Type
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {quote.customer.type}
                  </p>
                </div>
              </div>

              {quote.customer.defaultAddress &&
                Object.keys(quote.customer.defaultAddress).length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MapPin size={14} /> Billing Address
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {quote.customer.defaultAddress.firstName && (
                        <p className="font-medium text-gray-900">
                          {quote.customer.defaultAddress.firstName}{" "}
                          {quote.customer.defaultAddress.lastName}
                        </p>
                      )}
                      {quote.customer.defaultAddress.companyName && (
                        <p className="text-gray-700">
                          {quote.customer.defaultAddress.companyName}
                        </p>
                      )}
                      {quote.customer.defaultAddress.addressLine && (
                        <p className="text-gray-700">
                          {quote.customer.defaultAddress.addressLine}
                        </p>
                      )}
                      {quote.customer.defaultAddress.additional && (
                        <p className="text-gray-600 text-sm">
                          {quote.customer.defaultAddress.additional}
                        </p>
                      )}
                      <p className="text-gray-700">
                        {[
                          quote.customer.defaultAddress.city,
                          quote.customer.defaultAddress.state,
                          quote.customer.defaultAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {quote.customer.defaultAddress.country && (
                        <p className="text-gray-700">
                          {quote.customer.defaultAddress.country}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {quote.customer.defaultShippingAddress &&
                Object.keys(quote.customer.defaultShippingAddress).length >
                  0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Package size={14} /> Shipping Address
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {quote.customer.defaultShippingAddress.firstName && (
                        <p className="font-medium text-gray-900">
                          {quote.customer.defaultShippingAddress.firstName}{" "}
                          {quote.customer.defaultShippingAddress.lastName}
                        </p>
                      )}
                      {quote.customer.defaultShippingAddress.companyName && (
                        <p className="text-gray-700">
                          {quote.customer.defaultShippingAddress.companyName}
                        </p>
                      )}
                      {quote.customer.defaultShippingAddress.addressLine && (
                        <p className="text-gray-700">
                          {quote.customer.defaultShippingAddress.addressLine}
                        </p>
                      )}
                      <p className="text-gray-700">
                        {[
                          quote.customer.defaultShippingAddress.city,
                          quote.customer.defaultShippingAddress.state,
                          quote.customer.defaultShippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {quote.customer.defaultShippingAddress.country && (
                        <p className="text-gray-700">
                          {quote.customer.defaultShippingAddress.country}
                        </p>
                      )}
                      {(quote.customer.defaultShippingAddress.email ||
                        quote.customer.defaultShippingAddress.phone) && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                          {quote.customer.defaultShippingAddress.email && (
                            <p className="text-gray-600">
                              📧 {quote.customer.defaultShippingAddress.email}
                            </p>
                          )}
                          {quote.customer.defaultShippingAddress.phone && (
                            <p className="text-gray-600">
                              📞 {quote.customer.defaultShippingAddress.phone}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Quote Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Package size={22} className="text-blue-600" />
              Quote Items ({quote.items.length})
            </h2>
            <div className="space-y-4">
              {quote.items.map((item, index) => (
                <div
                  key={item._id || index}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition"
                >
                  <div className="flex gap-4">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {item.productName}
                          </h3>
                          <div className="flex gap-3 mt-1 text-sm text-gray-600">
                            {item.productCode && (
                              <span>Code: {item.productCode}</span>
                            )}
                            {item.productSKU && (
                              <span>SKU: {item.productSKU}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Item Total</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 mb-3">
                        {item.color && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Color
                            </p>
                            <p className="font-semibold text-gray-900">
                              {item.color}
                            </p>
                          </div>
                        )}
                        {item.size && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">
                              Size
                            </p>
                            <p className="font-semibold text-gray-900">
                              {item.size}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 uppercase">
                            Quantity
                          </p>
                          <p className="font-semibold text-gray-900">
                            {item.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">
                            Setup
                          </p>
                          <p className="font-semibold text-gray-900">
                            {item.setup}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">
                            Unit Price
                          </p>
                          <p className="font-semibold text-gray-900">
                            ${item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {item.decoration && item.decoration.method && (
                        <div className="border bg-gray-100 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-blue-800 uppercase mb-2">
                            Decoration Details
                          </p>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Method</p>
                              <p className="font-semibold text-gray-900">
                                {item.decoration.method}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Price</p>
                              <p className="font-semibold text-gray-900">
                                ${item.decoration.price.toFixed(2)}
                              </p>
                            </div>
                            {item.decoration.description && (
                              <div>
                                <p className="text-gray-600">Description</p>
                                <p className="font-semibold text-gray-900">
                                  {item.decoration.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {item.customDescription && (
                        <div className="border bg-gray-100 rounded p-3 mb-2">
                          <p className="text-xs text-blue-800 font-semibold uppercase mb-1">
                            Custom Description
                          </p>
                          <p className="text-sm text-gray-900">
                            {item.customDescription}
                          </p>
                        </div>
                      )}

                      {item.groupName && (
                        <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Group: {item.groupName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="mt-6 pt-6 border-t-2 border-gray-300">
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between text-gray-700 text-lg">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">
                    ${quote.subtotal.toFixed(2)}
                  </span>
                </div>

                {quote.discount && quote.discount.amount > 0 && (
                  <div className="flex justify-between text-gray-700 text-lg">
                    <span className="font-medium">
                      Discount
                      {quote.discount.type === "percentage"
                        ? ` (${quote.discount.value}%)`
                        : " (Fixed)"}
                      :
                    </span>
                    <span className="font-semibold text-red-600">
                      -${quote.discount.amount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-400">
                  <span className="text-xl font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-3xl font-extrabold text-green-600">
                    ${quote.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          {quote.comments && quote.comments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                <MessageSquare size={22} className="text-blue-600" />
                Comments ({quote.comments.length})
              </h2>
              <div className="space-y-3">
                {quote.comments.map((comment, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                  >
                    <p className="text-gray-900 font-medium mb-2">
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-semibold">
                        👤 {comment.addedBy}
                      </span>
                      <span>•</span>
                      <span>🕒 {formatDate(comment.addedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Created By */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
              <User size={20} className="text-blue-600" />
              Created By
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                {quote.createdBy.name}
              </p>
              <p className="text-sm text-gray-600">{quote.createdBy.email}</p>
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Calendar size={20} className="text-blue-600" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(quote.createdAt)}
                  </p>
                </div>
              </div>
              {quote.sentAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Sent</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.sentAt)}
                    </p>
                  </div>
                </div>
              )}
              {quote.viewedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Viewed</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.viewedAt)}
                    </p>
                  </div>
                </div>
              )}
              {quote.deadline && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Deadline</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.deadline)}
                    </p>
                  </div>
                </div>
              )}
              {quote.respondedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Responded</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.respondedAt)}
                    </p>
                  </div>
                </div>
              )}
              {quote.expiresAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Expires</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quote.expiresAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reference */}
          {quote.reference && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                <FileText size={20} className="text-blue-600" />
                Reference
              </h3>
              <p className="text-gray-900 font-semibold text-lg">
                {quote.reference}
              </p>
            </div>
          )}

          {/* Company Details */}
          {quote.companyDetails && quote.companyDetails.name && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">
                Company Details
              </h3>
              <div className="space-y-2">
                {quote.companyDetails.logo && (
                  <img
                    src={quote.companyDetails.logo}
                    alt={quote.companyDetails.name}
                    className="w-32 h-32 object-contain mb-3"
                  />
                )}
                <p className="font-bold text-gray-900 text-lg">
                  {quote.companyDetails.name}
                </p>
                {quote.companyDetails.address && (
                  <p className="text-sm text-gray-600">
                    {quote.companyDetails.address}
                  </p>
                )}
                {quote.companyDetails.phone && (
                  <p className="text-sm text-gray-600">
                    📞 {quote.companyDetails.phone}
                  </p>
                )}
                {quote.companyDetails.email && (
                  <p className="text-sm text-gray-600">
                    📧 {quote.companyDetails.email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* PDF Preview Modal */}
{showPdfModal && quote.quotePdf && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setShowPdfModal(false)}
  >
    <div 
      className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-bold text-gray-900">
          Quote #{quote.quoteNumber} - PDF Preview
        </h3>
        <div className="flex items-center gap-2">
          
           <a href={quote.quotePdf}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Open in New Tab
          </a>
          <button
            onClick={() => setShowPdfModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${quote.quotePdf}#toolbar=0`}
          className="w-full h-full"
          title="Quote PDF Preview"
          allow="fullscreen"
        />
      </div>
    </div>
  </div>
)}
    </div>
  );
}
