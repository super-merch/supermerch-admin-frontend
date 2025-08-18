import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOneQuery } from "../apis/ContactApi";
import { toast } from "react-toastify";
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaComments } from "react-icons/fa";

const UserQuery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueryDetail();
  }, [id]);

  const fetchQueryDetail = async () => {
    try {
      setLoading(true);
      const response = await getOneQuery(id);
      setQuery(response?.data);
    } catch (error) {
      toast.error("Error fetching query details");
      console.error("Error fetching query details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/user-queries"); // Adjust this path to match your routing
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Query Details...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Query Not Found</h2>
          <p className="text-gray-600 mb-6">The requested query could not be found.</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Queries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Queries
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Query Details</h1>
        </div>

        {/* Query Detail Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">{query.title}</h2>
            <p className="text-blue-100 text-sm mt-1">Query ID: {query._id}</p>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>
                
                <div className="flex items-center space-x-3">
                  <FaUser className="text-gray-500 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{query.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-gray-500 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{query.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaPhone className="text-gray-500 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{query.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Query Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Query Information
                </h3>

                <div className="flex items-center space-x-3">
                  <FaCalendar className="text-gray-500 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-600">Date Submitted</p>
                    <p className="font-medium text-gray-900">{formatDate(query.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaTag className="text-gray-500 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {query.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-t border-gray-200 pt-2 flex items-center">
                <FaComments className="mr-2 text-gray-500" />
                Message
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {query.message}
                </p>
              </div>
            </div>

            {/* Additional Information */}
            {query.updatedAt && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(query.updatedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              onClick={handleGoBack}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Queries
            </button>
            <div className="text-sm text-gray-500">
              Query submitted on {new Date(query.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserQuery;