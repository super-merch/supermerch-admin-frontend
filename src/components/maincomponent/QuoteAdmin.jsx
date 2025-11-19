import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import noimage from "../../assets/noimage.png";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Mail,
  Phone,
  Package,
  Truck,
  Image as ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

const QuoteAdmin = () => {
  const { quoteLoading, quoteData, listQuotes, quotesPagination } =
    useContext(AdminContext);

  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [mySearch, setMySearch] = useState("");

  useEffect(() => {
    listQuotes();
  }, []);

  useEffect(() => {
    const filters = {
      searchTerm,
    };
    listQuotes(currentPage, filters);
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = quotesPagination?.totalPages || 1;
  const currentData = quoteData || [];

  // Update pagination handlers:
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (quotesPagination?.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (quotesPagination?.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Update getPageNumbers function:
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const totalPagesCount = quotesPagination?.totalPages || 1;

    if (totalPagesCount <= maxVisiblePages) {
      for (let i = 1; i <= totalPagesCount; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(
        totalPagesCount,
        startPage + maxVisiblePages - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  // Calculate stats
  const totalQuotes = quotesPagination?.totalQuotes || 0;
  const pendingQuotes = currentData.filter(
    (quote) => quote?.delivery?.toLowerCase() === "pending"
  ).length;
  const deliveredQuotes = currentData.filter(
    (quote) => quote?.delivery?.toLowerCase() === "delivered"
  ).length;
  const withFiles = currentData.filter(
    (quote) => quote?.file && quote?.file !== "None"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quotes Management
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage and track all customer quotes
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            onClick={() => {
              listQuotes(currentPage, { searchTerm });
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Quotes</p>
              <p className="text-xl font-bold text-gray-900">{totalQuotes}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {pendingQuotes}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Truck className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Delivered</p>
              <p className="text-xl font-bold text-green-600">
                {deliveredQuotes}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">With Files</p>
              <p className="text-xl font-bold text-purple-600">{withFiles}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {quoteLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm font-medium text-gray-600">
              Loading quotes...
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Filters Section */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes by name, email, or phone..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchTerm(mySearch);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
              Showing{" "}
              <span className="font-semibold">{currentData.length}</span> of{" "}
              <span className="font-semibold">
                {quotesPagination?.totalQuotes || 0}
              </span>{" "}
              quotes
              {searchTerm && (
                <span className="ml-1 text-blue-600">(filtered)</span>
              )}
            </div>
          </div>

          {/* Quotes Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        {searchTerm
                          ? "No quotes found matching your search."
                          : "No quotes available."}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((quote) => (
                      <tr
                        key={quote?._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {quote?.name || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[200px]">
                                {quote?.email || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{quote?.phone || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {quote?.product || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              quote?.delivery?.toLowerCase() === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : quote?.delivery?.toLowerCase() === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                            title={quote?.delivery}
                          >
                            {quote?.delivery?.length > 20
                              ? `${quote?.delivery?.substring(0, 20)}...`
                              : quote?.delivery || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {quote?.file && quote?.file !== "None" ? (
                            <div className="flex justify-center">
                              <img
                                src={quote?.file ?? noimage}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                                alt="Quote file"
                                onClick={() =>
                                  window.open(quote?.file, "_blank")
                                }
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              No file
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div
                            className="max-w-xs truncate text-sm text-gray-600"
                            title={quote?.comment}
                          >
                            {quote?.comment && quote?.comment.length > 30
                              ? `${quote?.comment?.substring(0, 30)}...`
                              : quote?.comment || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-auto"
                            onClick={() =>
                              navigate("/quote-detail", {
                                state: { quote: quote },
                              })
                            }
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {quotesPagination && quotesPagination.totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={!quotesPagination.hasPrevPage}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <div className="flex gap-1">
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!quotesPagination.hasNextPage}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>
                  Page{" "}
                  <span className="font-semibold">
                    {quotesPagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {quotesPagination.totalPages}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuoteAdmin;
