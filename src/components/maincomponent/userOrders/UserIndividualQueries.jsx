import React, { useState, useEffect, useContext } from "react";
import { deleteQuery } from "@/components/apis/ContactApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import {
  MessageSquare,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  User,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import ActionButton from "@/components/ui/ActionButton";
import axios from "axios";
import { AdminContext } from "@/components/context/AdminContext";

const UserIndividualQueries = ({ user }) => {
  const { id } = useParams();
  const [userQueries, setUserQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const { queries } = useContext(AdminContext);
  console.log(user);

  // Data states

  // Popup states
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }

  // Search and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [mySearch, setMySearch] = useState("");
  const queriesPerPage = 10;

  const fetchUserQueries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/contact/user-queries/${
          user?.email
        }`
      );
      setUserQueries(response.data?.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user queries:", error);
      setLoading(false);
    }
  };

  // Fetch all queries on component mount
  useEffect(() => {
    if (userQueries.length === 0) {
      fetchUserQueries();
    }
  }, []);

  const navigate = useNavigate();
  const handleViewMore = (queryId) => {
    navigate(`/user-query/${queryId}`);
  };

  const [deleteLoading, setDeleteLoading] = useState({});
  const handleDelete = async () => {
    if (!deleteModal) return;

    const { id: queryId } = deleteModal;
    setDeleteLoading((prev) => ({ ...prev, [queryId]: true }));

    try {
      await deleteQuery(queryId);
      setUserQueries(userQueries?.filter((query) => query._id !== queryId));
      toast.success("Query deleted successfully!");
      setDeleteModal(null);
    } catch (error) {
      toast.error("Error deleting query");
      console.error("Error deleting query:", error);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [queryId]: false }));
    }
  };

  // Search and filter logic
  const filteredQueries = userQueries.filter((query) => {
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
  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return "No message";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading queries...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Filters Section */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or title..."
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(mySearch);
                }
              }}
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {mySearch && (
              <button
                onClick={() => {
                  setMySearch("");
                  setSearchTerm("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clear Search */}
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setMySearch("");
              }}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
          Showing <span className="font-semibold">{currentQueries.length}</span>{" "}
          of <span className="font-semibold">{totalQueries}</span> queries
          {searchTerm && <span className="ml-1 text-blue-600">(filtered)</span>}
        </div>
      </div>
      {/* Queries Table */}
      {currentQueries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <MessageSquare className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {searchTerm
                ? "No queries found matching your search."
                : "No queries found."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentQueries.map((query, index) => (
                  <tr
                    key={query._id}
                    className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100"
                  >
                    {/* Serial Number */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-600">
                        {startIndex + index + 1}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div
                        className="flex items-center gap-2 hover:cursor-pointer hover:underline"
                        onClick={() => handleViewMore(query._id)}
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {query.name || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Contact (Email & Phone) */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[180px]">
                            {query.email || "N/A"}
                          </span>
                        </div>
                        {query.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{query.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {query.createdAt
                            ? new Date(query.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 capitalize">
                        {query.type || "N/A"}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-3 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {query.title || "No Title"}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="px-3 py-3">
                      <p className="text-xs text-gray-700 line-clamp-2 max-w-xs">
                        {truncateMessage(query.message)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton
                          icon={Eye}
                          onClick={() => handleViewMore(query._id)}
                          variant="outline"
                          size="sm"
                        />
                        <ActionButton
                          icon={Trash2}
                          onClick={() =>
                            setDeleteModal({
                              id: query._id,
                              name: query.name || "Unknown",
                            })
                          }
                          disabled={deleteLoading[query._id]}
                          loading={deleteLoading[query._id]}
                          variant="danger"
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex gap-1">
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
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-teal-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
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
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>
        </div>
      )}{" "}
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full mx-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Query</h2>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-5">
              Are you sure you want to delete the query from "{deleteModal.name}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label="Delete"
                onClick={handleDelete}
                disabled={deleteLoading[deleteModal.id]}
                loading={deleteLoading[deleteModal.id]}
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserIndividualQueries;
