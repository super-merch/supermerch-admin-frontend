import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ActionButton from "../ui/ActionButton";

const Blog = () => {
  const { backednUrl, aToken, blogs, setBlogs, fetchBlogs } =
    useContext(AdminContext);
  const navigate = useNavigate();
  const [expandedBlogs, setExpandedBlogs] = useState({});
  const [deletingBlogs, setDeletingBlogs] = useState({});
  const [deleteModal, setDeleteModal] = useState(null); // { id, title }
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const pageRef = useRef(null);
  const prevDisabled = currentPage === 1;
  let nextDisabled;

  useEffect(() => {
    if (aToken) {
      const getBlogs = async () => {
        setSearching(true);
        const data = await fetchBlogs(currentPage, searchTerm);
        console.log(data);
        setSearchResultsCount(data.searchedBlogs);
        setTotalBlogs(data.total);
        setTotalPages(data.totalPages);
        nextDisabled = currentPage >= data.totalPages;
        setSearching(false);
      };
      getBlogs();
    }
  }, [currentPage, searchTerm]);

  const toggleExpanded = (blogId) => {
    setExpandedBlogs((prev) => ({
      ...prev,
      [blogId]: !prev[blogId],
    }));
  };

  const handleDeleteBlog = async () => {
    if (!deleteModal) return;

    const { id: blogId } = deleteModal;
    setDeletingBlogs((prev) => ({ ...prev, [blogId]: true }));

    try {
      await axios.delete(`${backednUrl}/api/blogs/delete-blog/${blogId}`);

      // Remove the blog from local state
      setBlogs((prev) => prev.filter((blog) => blog._id !== blogId));

      toast.success("Blog deleted successfully");
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error(error?.response?.data?.message || "Failed to delete blog");
    } finally {
      setDeletingBlogs((prev) => ({ ...prev, [blogId]: false }));
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const getPreviewText = (content, maxLength = 150) => {
    const plainText = stripHtmlTags(content);
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };
  if (searching && blogs.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-20 h-20 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full mx-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Blog</h2>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-5">
              Are you sure you want to delete "{deleteModal.title}"? This action
              cannot be undone.
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
                onClick={handleDeleteBlog}
                disabled={deletingBlogs[deleteModal.id]}
                loading={deletingBlogs[deleteModal.id]}
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Blogs Management
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage and view all blog posts
            </p>
          </div>
          <ActionButton
            icon={Plus}
            label="Add Blog"
            onClick={() => navigate("/add-blog")}
            variant="primary"
          />
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Blogs</p>
              <p className="text-xl font-bold text-gray-900">{totalBlogs}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchTerm(searchInput);
              }
            }}
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white shadow-sm border border-gray-200 rounded-xl
                 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                 placeholder:text-gray-400 transition-all"
          />

          {/* Search Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
            />
          </svg>
        </div>
      </div>
      {/* show search term and number and cross number if searchterm is present */}
      {(searchTerm && !searching && searchResultsCount>0) && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            Showing {searchResultsCount} results for "{searchTerm}" <span className="text-red-600 cursor-pointer" onClick={()=>{
              setSearchTerm(null)
              setSearchInput('')
              }} >x</span>
          </p>
        </div>
      )}

      {/* Blogs Table */}
      {blogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No blogs found. Create your first blog!
            </p>
            <ActionButton
              icon={Plus}
              label="Create Blog"
              onClick={() => navigate("/add-blog")}
              variant="primary"
              size="sm"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                    Image
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y relative divide-gray-100">
                {searching && (
                  <div className="absolute w-full h-full bg-black/10 backdrop-blur-sm flex justify-center items-center ">
                    <p className="">Loading ...</p>
                  </div>
                )}
                {blogs.map((blog) => (
                  <React.Fragment key={blog._id}>
                    <tr className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100">
                      {/* Image */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-teal-300 transition-colors shadow-sm">
                          <img
                            src={blog?.image || "/placeholder-image.jpg"}
                            alt={blog?.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 mb-1">
                            {blog?.title || "Untitled"}
                          </span>
                          {expandedBlogs[blog._id] && (
                            <button
                              onClick={() => toggleExpanded(blog._id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                            >
                              <ChevronUp className="w-3 h-3" />
                              Show Less
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {blog.createdAt
                              ? new Date(blog.createdAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Preview */}
                      <td className="px-3 py-3">
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {getPreviewText(blog?.content)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            icon={
                              expandedBlogs[blog._id] ? ChevronUp : ChevronDown
                            }
                            onClick={() => toggleExpanded(blog._id)}
                            variant="outline"
                            size="sm"
                          />
                          <ActionButton
                            icon={Edit}
                            onClick={() => navigate(`/add-blog?id=${blog._id}`)}
                            variant="outline"
                            size="sm"
                          />
                          <ActionButton
                            icon={Trash2}
                            onClick={() =>
                              setDeleteModal({
                                id: blog._id,
                                title: blog?.title || "Untitled",
                              })
                            }
                            disabled={deletingBlogs[blog._id]}
                            loading={deletingBlogs[blog._id]}
                            variant="danger"
                            size="sm"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Content Row */}
                    {expandedBlogs[blog._id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={5} className="px-3 py-4">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Full Content
                              </h3>
                              <button
                                onClick={() => toggleExpanded(blog._id)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <ChevronUp className="w-3 h-3" />
                                Collapse
                              </button>
                            </div>
                            <div
                              className="prose prose-sm max-w-none text-gray-700"
                              dangerouslySetInnerHTML={{
                                __html: blog?.content,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={prevDisabled}
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
                        onClick={() => setCurrentPage(pageNum)}
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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={nextDisabled}
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
          )}
        </div>
      )}
    </div>
  );
};

export default Blog;
