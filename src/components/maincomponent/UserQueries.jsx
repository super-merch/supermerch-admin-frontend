import React, { useState, useEffect } from "react";
import { getAllQueries, deleteQuery, getOneQuery } from "../apis/ContactApi";
import { MdDeleteForever } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const UserQueries = () => {
  // Data states
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Popup states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);
  
  // Search and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const queriesPerPage = 10;
  
  console.log(queries);

  // Fetch all queries on component mount
  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await getAllQueries();
      if(!response) {
        toast.error("No queries found");
        return
      }
      setQueries(response?.queries || []);
    } catch (error) {
      toast.error("Error fetching queries");
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate()
  const handleViewMore = (queryId) => {
    navigate(`/user-query/${queryId}`);
  };

  const confirmDelete = (queryId) => {
    setQueryToDelete(queryId);
    setShowDeletePopup(true);
  };
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteQuery(queryToDelete);
      setQueries(queries.filter((query) => query._id !== queryToDelete));
      toast.success("Query deleted successfully!");
      fetchQueries(); // Refresh the list
      setDeleteLoading(false);
    } catch (error) {
      toast.error("Error deleting query");
      console.error("Error deleting query:", error);
      setDeleteLoading(false);
    } finally {
      setShowDeletePopup(false);
      setQueryToDelete(null);
      setDeleteLoading(false);
    }
  };

  // Search and filter logic
  const filteredQueries = queries.filter((query) => {
    const queryName = (query.name || "").toLowerCase();
    const queryEmail = (query.email || "").toLowerCase();
    const queryTitle = (query.title || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return (
      queryName.includes(searchLower) ||
      queryEmail.includes(searchLower) ||
      queryTitle.includes(searchLower)
    );
  });

  // Pagination logic
  const totalQueries = filteredQueries.length;
  const totalPages = Math.ceil(totalQueries / queriesPerPage);
  const startIndex = (currentPage - 1) * queriesPerPage;
  const endIndex = startIndex + queriesPerPage;
  const currentQueries = filteredQueries.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Utility function to truncate message
  const truncateMessage = (message) => {
    if (!message) return "No message";
    return message.length > 20 ? message.substring(0, 20) + "..." : message;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Queries...</p>
      </div>
    );

  return (
    <div className="px-4 overflow-x-auto lg:px-10 md:px-8 sm:px-6">
      <h1 className="py-10 text-2xl font-medium text-center text-black">User Queries Page</h1>
      
      {/* Search and Results Info */}
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Queries
          </label>
          <input
            type="text"
            placeholder="Search by name, email, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Results Info */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {currentQueries.length} of {totalQueries} queries
          {searchTerm && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>

        {/* Clear Search Button */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="mb-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
          >
            Clear Search
          </button>
        )}
      </div>

      <table className="w-full border">
        <thead className="border">
          <tr className="border">
            <th className="p-3 text-left border-r">Sr. No</th>
            <th className="p-3 text-left border-r">Name</th>
            <th className="pl-3 text-left border-r">Email</th>
            <th className="pl-3 text-left border-r">Date</th>
            <th className="pl-3 text-left border-r">Type</th>
            <th className="pl-3 text-left border-r">Phone</th>
            <th className="pl-3 text-left border-r">Title</th>
            <th className="pl-3 text-left border-r">Message</th>
            <th className="pl-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="border">
          {currentQueries.map((query, index) => (
            <tr key={query._id} className="border">
              <td className="p-2 border">{startIndex + index + 1}</td>
              <td className="p-2 border">{query.name}</td>
              <td className="p-2 border">{query.email}</td>
              <td className="p-2 border">{new Date(query.createdAt).toLocaleString()}</td>
              <td className="p-2 capitalize border">{query.type || "No Phone"}</td>
              <td className="p-2 border">{query.phone || "No Phone"}</td>
              <td className="p-2 border">{query.title}</td>
              <td className="p-2 border">{truncateMessage(query.message)}</td>
              <td className="flex p-2">
                <FaEye
                  className="text-xl cursor-pointer hover:text-blue-600"
                  onClick={() => handleViewMore(query._id)}
                />
                <MdDeleteForever
                  className="ml-4 text-2xl cursor-pointer hover:text-red-600"
                  onClick={() => confirmDelete(query._id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* No Queries Found */}
      {currentQueries.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No queries found matching your search." : "No queries found."}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-2 border border-gray-300 rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>

          <span className="ml-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black backdrop-blur-sm bg-opacity-50 z-50">
          <div className="p-6 bg-white rounded shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Confirm Deletion</h2>
            <p>Are you sure you want to delete this query?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-white bg-red-500 rounded"
                onClick={handleDelete}
              >
                {deleteLoading ? "Deleting...":"Delete"}
              </button>
              <button
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserQueries;