import React, { useState, useEffect, useContext } from "react";
import { Bell, Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { setUnseenMessages, unseenMessages } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const aToken = localStorage.getItem("aToken");

  useEffect(() => {
    setSelectAll(false);
    setSelectedNotifications([]);
  }, [page]);

  // Mark all notifications as seen
  const markAllAsSeen = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/update-notification`,
        {},
        {
          headers: { aToken },
        }
      );
      await fetchNotifications();
      setUnseenMessages(0);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationSeen = async (id) => {
    try {
      setLoading(true);
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/mark-notification-seen/${id}`,
        {},
        {
          headers: { aToken },
        }
      );
      await fetchNotifications();
      setUnseenMessages(unseenMessages - 1);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    } finally {
      setLoading(false);
    }
  };
  const deleteNotification = async (id) => {
    try {
      setLoading(true);
      const data = await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/delete-notification/${id}`,
        {
          headers: { aToken },
        }
      );
      if (data.data.data.seen == false) {
        setUnseenMessages(unseenMessages - 1);
      }
      let newPage = page;
      if (notifications.length === 1 && page > 1) {
        newPage = page - 1;
        setPage(newPage);
      }
      await fetchNotifications(newPage);
      if (selectedNotifications.includes(id)) {
        setSelectedNotifications(
          selectedNotifications.filter((n) => n !== id)
        );
      }
      toast.success("Notification deleted successfully!");
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/get-notifications?page=${pageNum}`,
        {
          headers: { aToken },
        }
      );
      setNotifications(response.data.data);
      setPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n._id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle individual notification selection
  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(id)) {
        return prev.filter((nId) => nId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Bulk mark as seen
  const bulkMarkAsSeen = async () => {
    try {
      setLoading(true);
      const unseenSelected = notifications.filter(
        (n) => selectedNotifications.includes(n._id) && !n.seen
      );

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/bulk-mark-seen`,
        { ids: selectedNotifications },
        { headers: { aToken } }
      );

      await fetchNotifications(page);
      setUnseenMessages(Math.max(0, unseenMessages - unseenSelected.length));
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success("Selected notifications marked as seen!");
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
      toast.error("Failed to mark notifications as seen");
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    try {
      setLoading(true);
      const unseenSelected = notifications.filter(
        (n) => selectedNotifications.includes(n._id) && !n.seen
      );

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/bulk-delete`,
        { ids: selectedNotifications },
        { headers: { aToken } }
      );
      let newPage = page;

      if (selectAll || selectedNotifications.length === notifications.length) {
        newPage = page - 1;
        setPage(newPage);
      }
      await fetchNotifications(newPage);
      setUnseenMessages(Math.max(0, unseenMessages - unseenSelected.length));
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success("Selected notifications deleted successfully!");
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error("Failed to delete notifications");
    } finally {
      setLoading(false);
    }
  };

  const notificationNavigate = (type, id) => {
    markNotificationSeen(id);
    if (!type) return;
    if (type === "order") {
      navigate("/orders");
    } else if (type === "quote") {
      navigate("/admin-quotes");
    } else if (type === "user") {
      navigate("/all-users");
    } else if (type === "query") {
      navigate("/user-queries");
    } else if (type === "userQuote") {
      navigate("/quote");
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNotifications(newPage);
    }
  };

  // Format date - simple version
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      // Show time if today (e.g., "10:25")
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      // Show date if not today (e.g., "2/12/26")
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      {/* back button */}
      <div className="max-w-5xl mx-auto">
        <button
          className="flex items-center mb-2 gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications{" "}
              <span className="text-base text-gray-500">({total})</span>
            </h3>
            <div className="flex items-center gap-3">
              {selectedNotifications.length > 0 && (
                <>
                  <button
                    onClick={bulkMarkAsSeen}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                  >
                    <Check className="w-4 h-4" />
                    Mark Selected as Read ({selectedNotifications.length})
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedNotifications.length})
                  </button>
                </>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    await markAllAsSeen();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y relative divide-gray-200 bg-white">
                {loading && (
                  <div className="absolute w-full h-full flex justify-center items-center bg-black/10 backdrop-blur-sm">
                    Loading ...
                  </div>
                )}
                {notifications.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No notifications
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification) => (
                    <tr
                      key={notification._id}
                      className={` transition-colors ${
                        !notification.seen
                          ? "bg-blue-100/80 hover:bg-blue-200/70"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(
                            notification._id
                          )}
                          onChange={() =>
                            handleSelectNotification(notification._id)
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td
                        onClick={() => {
                          notificationNavigate(
                            notification.type,
                            notification._id
                          );
                        }}
                        className="px-6 py-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {notification.text}
                          </p>
                        </div>
                      </td>
                      <td
                        onClick={() => {
                          notificationNavigate(
                            notification.type,
                            notification._id
                          );
                        }}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 cursor-pointer"
                      >
                        {new Date(notification.addedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {!notification.seen && (
                            <button
                              onClick={async () => {
                                await markNotificationSeen(notification._id);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await deleteNotification(notification._id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                            page === pageNum
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span
                          key={pageNum}
                          className="px-1 flex items-center text-gray-400 text-sm"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
