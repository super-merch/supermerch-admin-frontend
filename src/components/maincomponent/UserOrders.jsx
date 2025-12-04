import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import ActionButton from "../ui/ActionButton";
import TabsHeader from "./userOrders/TabsHeader";
import CustomerDetailsSection from "./userOrders/CustomerDetailsSection";
import OrdersTableSection from "./userOrders/OrdersTableSection";
import AttachmentsSection from "./userOrders/AttachmentsSection";
import NotesSection from "./userOrders/NotesSection";

export default function UserOrders() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState({});
  const { state: userName } = useLocation();
  const [user, setUser] = useState(null);
  const { userOrders, fetchUserOrders, updateOrderStatus, getSingleUser } =
    useContext(AdminContext);
  const [activeTab, setActiveTab] = useState("customer");

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatus(orderId, newStatus);
      await fetchUserOrders(id);
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setStatusLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchUserOrders(id);
      const data = await getSingleUser(id);
      setUser(data.user);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getOrders = async () => {
      setLoading(true);
      try {
        await fetchUserOrders(id);
        const data = await getSingleUser(id);
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, [id]);

  const navigate = useNavigate();

  // Calculate stats
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );
  const pendingOrders = userOrders.filter(
    (order) => order.status === "Pending"
  ).length;
  const completedOrders = userOrders.filter(
    (order) => order.status === "Complete"
  ).length;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading user orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <ActionButton
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
            ariaLabel="Go back"
            className="!px-2 !py-1"
          />
          <ActionButton
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={loading}
            loading={loading}
            variant="outline"
            size="sm"
            ariaLabel="Refresh user orders"
            className="!px-2 !py-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <TabsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
      />

      {/* Tab Content */}
      {activeTab === "customer" && (
        <CustomerDetailsSection
          user={user}
          totalOrders={totalOrders}
          totalSpent={totalSpent}
          pendingOrders={pendingOrders}
          completedOrders={completedOrders}
          formatDate={formatDate}
        />
      )}

      {activeTab === "orders" && (
        <OrdersTableSection
          user={user}
          userOrders={userOrders}
          statusLoading={statusLoading}
          handleStatusChange={handleStatusChange}
          navigate={navigate}
          formatDate={formatDate}
        />
      )}

      {activeTab === "attachments" && (
        <AttachmentsSection
          user={user}
          userOrders={userOrders}
          formatDate={formatDate}
          userId={id}
        />
      )}

      {activeTab === "notes" && (
        <NotesSection userId={id} userOrders={userOrders} />
      )}
    </div>
  );
}
