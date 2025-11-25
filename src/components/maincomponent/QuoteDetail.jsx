import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MessageSquare,
  Truck,
  FileImage,
} from "lucide-react";

const QuoteDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quote,setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];
  const getQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/checkout/get-single-quote/${id}`);
      const data = await response.json();
      setQuote(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quote:", error);
      setLoading(false);
    }
  }
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-content, #printable-content * {
        visibility: visible;
      }
      #printable-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
      }
      .no-print {
        display: none !important;
      }
      .print-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1d4ed8;
      }
      .print-section {
        page-break-inside: avoid;
        margin-bottom: 15px;
      }
      .print-section.product-details-section {
  page-break-inside: auto !important;
}
      /* Force grid to single column in print */
      .lg\\:grid-cols-2 {
        grid-template-columns: 1fr !important;
      }
      /* Remove large gaps in print */
      .gap-8 {
        gap: 1rem !important;
      }
      /* Reduce spacing */
      .mt-8 {
        margin-top: 1.5rem !important;
      }
      .pt-6 {
        padding-top: 1rem !important;
      }
      .space-y-6 > * + * {
        margin-top: 1rem !important;
      }
      img {
        max-width: 100%;
        max-height: 400px;
        page-break-inside: avoid;
      }
    }
  `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  useEffect(() => {
    getQuote();
  }, []);
  if(loading){
    return(
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Loading...</p>
      </div>
    )
  }
  // If no quote data, redirect back
  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">No quote data found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header - Hidden in print */}
        <div className="flex items-center gap-4 mb-6 no-print">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Quote Details</h1>
        </div>

        <div
          id="printable-content"
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Print Header */}
          <div className="print-header bg-blue-700 text-white px-6 py-4">
            {/* <h2 className="text-xl font-semibold">Quote ID: {quote._id}</h2> */}
            <p className="text-base mt-1">
              <span className="font-semibold" >Date:</span> {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div className="space-y-6 print-section">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Customer Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-gray-800 font-medium">{quote.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-gray-800">{quote.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-gray-800">{quote.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="space-y-6 print-section">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Quote Details
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Comment
                      </p>
                      <p className="text-gray-800 leading-relaxed break-words">
                        {quote.comment}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        Delivery Information
                      </p>
                      <p className="text-gray-800 leading-relaxed break-words">
                        {quote.delivery}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Show product details properly in a section */}
            <div className="mt-8 pt-6 border-t flex flex-col border-gray-200 print-section product-details-section">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Product Details
              </h3>
              <div>
                <h1>Product:</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed break-words">
                    {quote.product}
                  </p>
                </div>
              </div>
              <div>
                <h1>ID:</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed break-words">
                    {quote.productId}
                  </p>
                </div>
              </div>
              <div>
                <h1>Description:</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed break-words">
                    {quote.description}
                  </p>
                </div>
              </div>
              <div>
                <h1>Quantity:</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed break-words">
                    {quote.quantity}
                  </p>
                </div>
              </div>
              <div>
                <h1>Price:</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed break-words">
                    {quote.price}
                  </p>
                </div>
              </div>
            </div>

            {/* File Attachment Section */}
            {quote.file && quote.file !== "None" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-blue-600" />
                  Attached File
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col items-center">
                    <img
                      src={quote.file}
                      alt="Quote attachment"
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "block";
                      }}
                    />
                    <div
                      style={{ display: "none" }}
                      className="text-gray-600 p-8"
                    >
                      <FileImage className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Unable to load image</p>
                      <a
                        href={quote.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View original file
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4 justify-end no-print">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to List
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              >
                Print Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
