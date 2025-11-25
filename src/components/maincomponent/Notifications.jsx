import React, { useState, useEffect, useContext } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Calendar,
  X,
  ShoppingBag,
  FileText,
  Users,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import ActionButton from "../ui/ActionButton";
import ConfirmModal from "../ui/confirmModel";

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
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    variant: "danger",
  });

  useEffect(() => {
    setSelectAll(false);
    setSelectedNotifications([]);
  }, [page]);
  const showConfirmModal = (message, onConfirm, confirmText = "Confirm", variant = "danger") => {
  setConfirmModal({
    isOpen: true,
    message,
    onConfirm,
    confirmText,
    variant
  });
};

const closeConfirmModal = () => {
  setConfirmModal({
    isOpen: false,
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    variant: "danger"
  });
};

  // Sync selectAll state with selectedNotifications
  useEffect(() => {
    if (notifications.length > 0) {
      const allSelected =
        selectedNotifications.length === notifications.length &&
        notifications.every((n) => selectedNotifications.includes(n._id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedNotifications, notifications]);

  // Mark all notifications as seen
  const markAllAsSeen = async () => {
    showConfirmModal(
      "Are you sure you want to mark all notifications as read?",
      async () => {
        try {
          setLoading(true);
          await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/notifications/update-notification`,
            {},
            { headers: { aToken } }
          );
          await fetchNotifications(page);
          setUnseenMessages(0);
          toast.success("All notifications marked as read!");
        } catch (error) {
          console.error("Error marking notifications as seen:", error);
          toast.error("Failed to mark all notifications as read");
        } finally {
          setLoading(false);
        }
      },
      "Mark All as Read",
      "success"
    );
  };

  const markNotificationSeen = async (id,dontShowModel) => {
    if(dontShowModel){
      try {
        await axios.post(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/notifications/mark-notification-seen/${id}`,
          {},
          { headers: { aToken } }
        );
        await fetchNotifications(page);
        setUnseenMessages(Math.max(0, unseenMessages - 1));
      } catch (error) {
        console.error("Error marking notifications as seen:", error);
        toast.error("Failed to mark notification as read");
      }
      return
    }
    showConfirmModal(
      "Are you sure you want to mark this notification as read?",
      async () => {
        try {
          await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/notifications/mark-notification-seen/${id}`,
            {},
            { headers: { aToken } }
          );
          await fetchNotifications(page);
          setUnseenMessages(Math.max(0, unseenMessages - 1));
        } catch (error) {
          console.error("Error marking notifications as seen:", error);
          toast.error("Failed to mark notification as read");
        }
      },
      "Mark as Read",
      "success"
    );
    return null;
  };
  const deleteNotification = async (id) => {
    showConfirmModal(
      "Are you sure you want to delete this notification?",
      async () => {
        try {
          const data = await axios.delete(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/notifications/delete-notification/${id}`,
            { headers: { aToken } }
          );
          if (data.data.data.seen == false) {
            setUnseenMessages(Math.max(0, unseenMessages - 1));
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
          console.error("Error deleting notification:", error);
          toast.error("Failed to delete notification");
        }
      },
      "Delete",
      "danger"
    );
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
    showConfirmModal(
      "Are you sure you want to mark these notifications as read?",
      async () => {
        try {
          setLoading(true);
          const unseenSelected = notifications.filter(
            (n) => selectedNotifications.includes(n._id) && !n.seen
          );
          await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/notifications/bulk-mark-seen`,
            { ids: selectedNotifications },
            { headers: { aToken } }
          );
          await fetchNotifications(page);
          setUnseenMessages(
            Math.max(0, unseenMessages - unseenSelected.length)
          );
          setSelectedNotifications([]);
          setSelectAll(false);
          toast.success("Selected notifications marked as seen!");
        } catch (error) {
          console.error("Error marking notifications as seen:", error);
          toast.error("Failed to mark notifications as seen");
        } finally {
          setLoading(false);
        }
      },
      "Mark as Read",
      "success"
    );
  };

  // Bulk delete
  const bulkDelete = async () => {
    showConfirmModal(
      "Are you sure you want to delete these notifications?",
      async () => {
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
          if (
            selectAll ||
            selectedNotifications.length === notifications.length
          ) {
            newPage = page - 1;
            setPage(newPage);
          }
          await fetchNotifications(newPage);
          setUnseenMessages(
            Math.max(0, unseenMessages - unseenSelected.length)
          );
          setSelectedNotifications([]);
          setSelectAll(false);
          toast.success("Selected notifications deleted successfully!");
        } catch (error) {
          console.error("Error deleting notifications:", error);
          toast.error("Failed to delete notifications");
        } finally {
          setLoading(false);
        }
      },
      "Delete Selected",
      "danger"
    );
  };

  const notificationNavigate = (type, id, notiId) => {
    markNotificationSeen(id,true);
    if (!type) return;
    if (type === "order") {
      navigate("/order-details/" + notiId);
    } else if (type === "quote") {
      navigate("/admin-quote-detail/" + notiId);
    } else if (type === "user") {
      navigate("/user-orders/" + notiId);
    } else if (type === "query") {
      navigate("/user-query/" + notiId);
    } else if (type === "userQuote") {
      navigate("/quote-detail/" + notiId);
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

  // Format date - modern version
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `Today, ${hours}:${minutes}`;
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Get notification type icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return ShoppingBag;
      case "quote":
        return FileText;
      case "user":
        return Users;
      case "query":
        return MessageSquare;
      case "userQuote":
        return FileText;
      default:
        return Bell;
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.seen).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Manage and track all your system notifications
              </p>
            </div>
            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              onClick={() => fetchNotifications(page)}
              variant="outline"
            />
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Total Notifications
                </p>
                <p className="text-xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedNotifications.length > 0 && (
          <div className="bg-teal-50 rounded-lg p-3 border-2 border-teal-300 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-teal-900">
                  {selectedNotifications.length} notification
                  {selectedNotifications.length !== 1 ? "s" : ""} selected
                </h3>
                <div className="flex gap-2">
                  <ActionButton
                    label="Select All"
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  />
                  <ActionButton
                    label="Deselect All"
                    onClick={() => {
                      setSelectedNotifications([]);
                      setSelectAll(false);
                    }}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <ActionButton
                  icon={Check}
                  label="Mark as Read"
                  onClick={bulkMarkAsSeen}
                  variant="success"
                  size="sm"
                  loading={loading}
                />
                <ActionButton
                  icon={Trash2}
                  label="Delete"
                  onClick={bulkDelete}
                  variant="danger"
                  size="sm"
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {notifications.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                All Notifications
              </h3>
              <ActionButton
                icon={Check}
                label="Mark All as Read"
                onClick={markAllAsSeen}
                variant="outline"
                size="sm"
                loading={loading}
              />
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto relative">
            {loading && notifications.length > 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            )}
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Bell className="w-12 h-12 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">
                          No notifications yet
                        </p>
                        <p className="text-xs text-gray-400">
                          You'll see notifications here when they arrive
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification) => {
                    const TypeIcon = getNotificationIcon(notification.type);
                    return (
                      <tr
                        key={notification._id}
                        className={`group transition-colors border-b border-gray-100 ${
                          !notification.seen
                            ? "bg-blue-50/30 hover:bg-blue-100/40"
                            : "hover:bg-teal-50/30"
                        } ${
                          selectedNotifications.includes(notification._id)
                            ? "bg-teal-100/30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(
                              notification._id
                            )}
                            onChange={() =>
                              handleSelectNotification(notification._id)
                            }
                            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>
                        <td
                          onClick={() => {
                            notificationNavigate(
                              notification.type,
                              notification._id,
                              notification.id
                            );
                          }}
                          className="px-3 py-3 cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`p-1.5 rounded-lg ${
                                !notification.seen
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <TypeIcon
                                className={`w-3.5 h-3.5 ${
                                  !notification.seen
                                    ? "text-blue-600"
                                    : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-relaxed ${
                                  !notification.seen
                                    ? "text-gray-900 font-semibold"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.text}
                              </p>
                              {!notification.seen && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {notification.type || "general"}
                          </span>
                        </td>
                        <td
                          onClick={() => {
                            notificationNavigate(
                              notification.type,
                              notification._id,
                              notification.id
                            );
                          }}
                          className="px-3 py-3 cursor-pointer whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDate(notification.addedAt)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {!notification.seen && (
                              <ActionButton
                                icon={Check}
                                onClick={() =>
                                  markNotificationSeen(notification._id)
                                }
                                variant="success"
                                size="sm"
                                title="Mark as read"
                              />
                            )}
                            <ActionButton
                              icon={Trash2}
                              onClick={() =>
                                deleteNotification(notification._id)
                              }
                              variant="danger"
                              size="sm"
                              title="Delete"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
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
                              ? "bg-teal-600 text-white"
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
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
      />
    </div>
  );
}
