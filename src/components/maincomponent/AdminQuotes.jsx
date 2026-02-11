import React, { useState, useEffect } from "react";
import { Trash2, Edit, Eye, X } from "lucide-react";
import { IoIosSearch, IoMdSearch } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialSearch = searchParams.get("search") || "";
  const initialFilter = searchParams.get("filter") || "";
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    filteredTotal: 0,
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    quoteId: null,
    quoteNumber: "",
  });
  const navigate = useNavigate();
  const updateQuoteParams = (nextParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(nextParams).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  useEffect(() => {
    const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);
    const urlSearch = searchParams.get("search") || "";
    const urlFilter = searchParams.get("filter") || "";
    if (page !== urlPage) setPage(urlPage);
    if (searchQuery !== urlSearch) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
    }
    if (filter !== urlFilter) setFilter(urlFilter);
  }, [searchParams]);

  // Fetch quotes
  const fetchQuotes = async (searchTerm, filter) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/admin-quotes/get-quotes?page=${page}${
          searchTerm ? `&search=${searchTerm}` : ""
        }${filter ? `&filter=${filter}` : ""}`
      );
      const data = await response.json();

      if (data.success) {
        setQuotes(data.data);
        setTotalPages(data.totalPages);
        calculateStats(
          data.total,
          data.pending,
          data.declined,
          data.accepted,
          data.filteredTotal
        );
        setSearchInput("");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (
    total,
    pending,
    declined,
    accepted,
    filteredTotal
  ) => {
    const stats = {
      total: total,
      pending: pending,
      accepted: accepted,
      declined: declined,
      filteredTotal: filteredTotal,
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchQuotes(searchQuery, filter);
  }, [page, searchQuery, filter]);

  // Delete quote
  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin-quotes/delete-quote/${
          deleteModal.quoteId
        }`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {
        setQuotes(quotes.filter((q) => q._id !== deleteModal.quoteId));
        setDeleteModal({ show: false, quoteId: null, quoteNumber: "" });
        fetchQuotes(); // Refresh to update stats
      }
    } catch (error) {
      console.error("Error deleting quote:", error);
    }
  };

  // Get product names
  const getProductNames = (items) => {
    if (!items || items.length === 0) return "No products";
    if (items.length === 1) return items[0].productName;
    return `${items[0].productName} +${items.length - 1} more`;
  };

  // Status badge
  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-3">
      {/* Header */}
      <div className="mb-3 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quotes Management</h1>
        <button
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          onClick={() => navigate("/add-admin-quote")}
        >
          + Add Quote
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Total Quotes</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Accepted</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {stats.accepted}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Declined</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {stats.declined}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="mb-3 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search quotes..."
            onChange={(e) => setSearchInput(e.target.value)}
            value={searchInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setSearchQuery(searchInput);
                updateQuoteParams({
                  page: 1,
                  search: searchInput,
                  filter,
                });
              }
            }}
            className="w-64 px-4 py-2 border rounded-md focus:outline-none focus:ring-1 transition-all duration-300 focus:ring-blue-500"
          />
          <IoIosSearch
            onClick={() => {
              setPage(1);
              setSearchQuery(searchInput);
              updateQuoteParams({
                page: 1,
                search: searchInput,
                filter,
              });
            }}
            className="text-2xl cursor-pointer hover:text-slate-600"
          />
        </div>
        {/* dropdown for filtering */}
        <div className="mb-6 flex gap-2 items-center">
          <select
            className="w-64 px-4 py-2 border rounded-md focus:outline-none focus:ring-1 transition-all duration-300 focus:ring-blue-500"
            onChange={(e) => {
              setPage(1);
              setFilter(e.target.value);
              updateQuoteParams({
                page: 1,
                search: searchQuery,
                filter: e.target.value,
              });
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      {searchQuery && !loading && (
        <div>
          <p className="text-gray-500 pb-2 text-sm font-medium">
            {/* show cross sign as well */}
            Showing {stats.filteredTotal} results for "{searchQuery}"
            <span
              onClick={() => {
                setPage(1);
                setSearchQuery("");
                setSearchInput("");
                updateQuoteParams({
                  page: 1,
                  search: null,
                  filter,
                });
              }}
              className="text-red-500 cursor-pointer"
            >
              X
            </span>
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading quotes...</div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">No quotes found</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quote.quoteNumber}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 hover:cursor-pointer hover:underline"
                        onClick={() =>
                          navigate(`/admin-quote-detail/${quote._id}`)
                        }
                      >
                        {quote.customer.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {quote.customer.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {quote.createdBy.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div
                          className="max-w-xs truncate"
                          title={quote.items
                            .map((i) => i.productName)
                            .join(", ")}
                        >
                          {getProductNames(quote.items).length > 20
                            ? `${getProductNames(quote.items).slice(0, 20)}...`
                            : getProductNames(quote.items)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        $
                        {quote?.total.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {quote?.comments[0]?.text.length > 15
                          ? `${quote?.comments[0]?.text.slice(0, 15)}...`
                          : quote?.comments[0]?.text}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin-quote-detail/${quote._id}`)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/add-admin-quote?id=${quote._id}`)
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModal({
                                show: true,
                                quoteId: quote._id,
                                quoteNumber: quote.quoteNumber,
                              })
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    const nextPage = Math.max(1, page - 1);
                    setPage(nextPage);
                    updateQuoteParams({
                      page: nextPage,
                      search: searchQuery,
                      filter,
                    });
                  }}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    const nextPage = Math.min(totalPages, page + 1);
                    setPage(nextPage);
                    updateQuoteParams({
                      page: nextPage,
                      search: searchQuery,
                      filter,
                    });
                  }}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm Delete
                </h3>
                <button
                  onClick={() =>
                    setDeleteModal({
                      show: false,
                      quoteId: null,
                      quoteNumber: "",
                    })
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete quote{" "}
                <span className="font-semibold">{deleteModal.quoteNumber}</span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() =>
                    setDeleteModal({
                      show: false,
                      quoteId: null,
                      quoteNumber: "",
                    })
                  }
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
