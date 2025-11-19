import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import AddressAutocomplete from "../AddressAutoComplete";
import {
  ArrowLeft,
  Edit,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  Building,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Send,
  X,
  Trash2,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const Products = () => {
  const { id } = useParams();
  const {
    orders,
    updateOrder,
    fetchOrders,
    sendNote,
    getOrderComments,
    updateOrderComment,
    addOrderComment,
    getLogo,
    deleteOrderComment,
  } = useContext(AdminContext);

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const navigate = useNavigate();
  const [orderComments, setOrderComments] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // Add this useEffect to fetch comments when checkout data loads
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      const result = await getOrderComments(checkout._id);
      if (result.success) {
        setOrderComments(result.data);
      }
      setLoadingComments(false);
    };

    fetchComments();
  }, [checkout?._id]);

  const handleAddOrUpdateComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setAddingComment(true);

    try {
      let result;
      if (orderComments) {
        // Update existing comments
        const updatedComments = [...orderComments.comments, newComment];
        result = await updateOrderComment(checkout._id, updatedComments);
        if (result.success) {
          setOrderComments({
            ...orderComments,
            comments: updatedComments,
          });
        }
      } else {
        // Add first comment
        result = await addOrderComment(checkout._id, newComment);
        if (result.success) {
          setOrderComments(result.data);
        }
      }

      if (result.success) {
        setNewComment("");
      }
    } catch (error) {
      console.error("Error handling comment:", error);
    } finally {
      setAddingComment(false);
    }
  };
  const handleDeleteComment = async (commentIndex) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setLoadingComments(true);
    const result = await deleteOrderComment(checkout._id, commentIndex);

    if (result.success) {
      setOrderComments(result.data);
    }
    setLoadingComments(false);
  };
  const [logo, setLogo] = useState("");
  useEffect(() => {
    const mountData = async () => {
      let mounted = true;

      // Reset UI immediately when id changes so previous data doesn't flash
      setCheckout(null);
      setLoading(true);

      // If orders are not loaded yet, keep showing loader until they arrive
      if (!orders || orders.length === 0) {
        return () => {
          mounted = false;
        };
      }

      // Find the order (one pass)
      const found = orders.find((o) => o._id === id) || null;

      if (mounted) {
        setCheckout(found);
        setLoading(false);
        if (found.artworkOption == "upload") {
          const logo = await getLogo(found.logoId);
          setLogo(logo);
        }
      }

      return () => {
        mounted = false;
      };
    };

    mountData();
  }, [id, orders]);

  const handleEditClick = () => {
    if (!checkout) {
      toast.error("Order not found");
      return;
    }

    setEditData({
      user: {
        firstName: checkout.user?.firstName || "",
        lastName: checkout.user?.lastName || "",
        email: checkout.user?.email || "",
        phone: checkout.user?.phone || "",
      },
      billingAddress: {
        firstName: checkout.billingAddress?.firstName || "",
        lastName: checkout.billingAddress?.lastName || "",
        addressLine: checkout.billingAddress?.addressLine || "",
        country: checkout.billingAddress?.country || "",
        state: checkout.billingAddress?.state || "",
        city: checkout.billingAddress?.city || "",
        postalCode: checkout.billingAddress?.postalCode || "",
        companyName: checkout.billingAddress?.companyName || "",
      },
      shippingAddress: {
        firstName: checkout.shippingAddress?.firstName || "",
        lastName: checkout.shippingAddress?.lastName || "",
        addressLine: checkout.shippingAddress?.addressLine || "",
        country: checkout.shippingAddress?.country || "",
        state: checkout.shippingAddress?.state || "",
        city: checkout.shippingAddress?.city || "",
        postalCode: checkout.shippingAddress?.postalCode || "",
        companyName: checkout.shippingAddress?.companyName || "",
        email: checkout.shippingAddress?.email || "",
        phone: checkout.shippingAddress?.phone || "",
      },
      products:
        checkout.products?.map((product) => ({
          ...product,
          name: product.name || "",
          quantity: product.quantity || 0,
          price: product.price || 0,
          subTotal: product.subTotal || 0,
        })) || [],
    });
    setShowEditModal(true);
  };

  const handleInputChange = (section, field, value, index = null) => {
    setEditData((prev) => {
      const newData = { ...prev };

      if (section === "products" && index !== null) {
        newData.products = [...prev.products];
        newData.products[index] = {
          ...newData.products[index],
          [field]:
            field === "quantity" || field === "price"
              ? Number(value) || 0
              : value,
        };

        // Recalculate subTotal when quantity or price changes
        if (field === "quantity" || field === "price") {
          const product = newData.products[index];
          product.subTotal = product.quantity * product.price;
        }
      } else {
        newData[section] = {
          ...prev[section],
          [field]: value,
        };
      }

      return newData;
    });
  };

  const handleUpdateOrder = async () => {
    if (!editData) return;
    if (
      !checkout.user ||
      !checkout.billingAddress ||
      !checkout.shippingAddress ||
      !checkout.products
    ) {
      toast.error("Please fill all input fields");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateOrder(id, editData);

      if (result.success) {
        toast.success("Order updated successfully!");
        setShowEditModal(false);
        // Refresh the orders to get updated data
        await fetchOrders(id);
      } else {
        toast.error("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };
  const [noteLoading, setNoteLoading] = useState(false);
  const handleSendNote = async (
    note,
    email,
    user,
    billingAddress,
    shippingAddress,
    products
  ) => {
    setNoteLoading(true);
    try {
      const res = await sendNote(
        note,
        email,
        user,
        billingAddress,
        shippingAddress,
        products
      );
      if (res) {
        setNote("");
      }
      setNoteLoading(false);
    } catch (error) {
      console.error("Error sending note:", error);
      toast.error("Failed to send note");
      setNoteLoading(false);
    }
  };

  const formatCurrency = (v) =>
    typeof v === "number"
      ? `$${v.toFixed(2)}`
      : `$${Number(v || 0).toFixed(2)}`;

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
      "Artwork Pending": "bg-orange-100 text-orange-800",
      "ArtWork Approved": "bg-blue-100 text-blue-800",
      "Branding in progress": "bg-purple-100 text-purple-800",
      "Production Complete": "bg-indigo-100 text-indigo-800",
      "Shipped/In Transit": "bg-cyan-100 text-cyan-800",
      Returned: "bg-pink-100 text-pink-800",
      "On Hold": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status) => {
    return status === "Received"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No order data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Order ID: {checkout.orderId || checkout._id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Order
            </button>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    checkout.status
                  )}`}
                >
                  {checkout.status || "N/A"}
                </span>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                    checkout.paymentStatus
                  )}`}
                >
                  {checkout.paymentStatus || "N/A"}
                </span>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {checkout.orderDate
                    ? new Date(checkout.orderDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <button
                  onClick={() => navigate(`/user-orders/${checkout.userId}`)}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {checkout.user?.firstName} {checkout.user?.lastName}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="p-2 bg-cyan-100 rounded-lg">
                <User className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-3">
          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Products ({checkout.products?.length || 0})
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {checkout.products?.map((product, idx) => (
                    <tr
                      key={product._id || idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.id && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Code: {product.id}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {product.color && (
                            <div>
                              Color:{" "}
                              <span className="font-medium">
                                {product.color}
                              </span>
                            </div>
                          )}
                          {product.print && (
                            <div>
                              Print:{" "}
                              <span className="font-medium">
                                {product.print}
                              </span>
                            </div>
                          )}
                          {product.size && product.size !== "None" && (
                            <div>
                              Size:{" "}
                              <span className="font-medium">
                                {product.size}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {product.supplierName || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {product.quantity || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(product.subTotal)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Artwork & Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Artwork Details */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Artwork Details
                </h3>
                {checkout.artworkOption === "upload" && logo && (
                  <div className="mb-3 flex items-center justify-center">
                    <img
                      src={logo.logo}
                      alt="Uploaded Logo"
                      className="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
                    />
                  </div>
                )}
                {checkout.artworkOption !== "upload" && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Artwork Option:
                    </p>
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {checkout.artworkOption === "on_file"
                        ? "Already On File"
                        : checkout.artworkOption === "no_artwork"
                        ? "No Artwork"
                        : checkout.artworkOption || "N/A"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {checkout.artworkOption === "text"
                      ? "Text to be printed:"
                      : "Artwork Instruction:"}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-200">
                    {checkout.artworkMessage || "No instructions provided"}
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(checkout.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Setup Fee</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(checkout.setupFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-gray-900">
                      {checkout.discount ? `${checkout.discount}%` : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (10%)</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(checkout.gst)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(checkout.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Billing Address */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Billing Address
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {checkout.billingAddress?.firstName ||
                      checkout.user?.firstName}{" "}
                    {checkout.billingAddress?.lastName}
                  </p>
                  <p className="text-gray-600">
                    {checkout.billingAddress?.addressLine}
                  </p>
                  <p className="text-gray-600">
                    {checkout.billingAddress?.city},{" "}
                    {checkout.billingAddress?.state}{" "}
                    {checkout.billingAddress?.postalCode}
                  </p>
                  <p className="text-gray-600">
                    {checkout.billingAddress?.country}
                  </p>
                  {checkout.billingAddress?.companyName && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <Building className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {checkout.billingAddress.companyName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-600" />
                  Shipping Address
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {checkout.shippingAddress?.firstName}{" "}
                    {checkout.shippingAddress?.lastName}
                  </p>
                  <p className="text-gray-600">
                    {checkout.shippingAddress?.addressLine}
                  </p>
                  <p className="text-gray-600">
                    {checkout.shippingAddress?.city},{" "}
                    {checkout.shippingAddress?.state}{" "}
                    {checkout.shippingAddress?.postalCode}
                  </p>
                  <p className="text-gray-600">
                    {checkout.shippingAddress?.country}
                  </p>
                  {checkout.shippingAddress?.companyName && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <Building className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {checkout.shippingAddress.companyName}
                      </span>
                    </div>
                  )}
                  {checkout.shippingAddress?.email && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-blue-600">
                        {checkout.shippingAddress.email}
                      </span>
                    </div>
                  )}
                  {checkout.shippingAddress?.phone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">
                        {checkout.shippingAddress.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Send Note */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              Send Note to User
            </h3>
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your message..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="4"
              />
              <button
                onClick={() =>
                  handleSendNote(
                    note,
                    checkout.shippingAddress?.email,
                    checkout.user,
                    checkout.billingAddress,
                    checkout.shippingAddress,
                    checkout.products
                  )
                }
                disabled={noteLoading || !note.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {noteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-3">
          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Order Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-900">
                  {checkout.products?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(checkout.shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Setup Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(checkout.setupFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(checkout.gst)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-gray-900">
                  {checkout.discount ? `${checkout.discount}%` : "0%"}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 text-base text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(checkout.total)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Payment Status:</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                  checkout.paymentStatus
                )}`}
              >
                {checkout.paymentStatus || "N/A"}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Order Reference:</p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {checkout.orderId || checkout._id}
              </p>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-600" />
              Customer Info
            </h4>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">
                {checkout.user?.firstName} {checkout.user?.lastName}
              </p>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-blue-600">{checkout.user?.email}</span>
              </div>
              {checkout.user?.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{checkout.user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Order Comments
            </h4>

            {loadingComments ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {orderComments?.comments &&
                orderComments.comments.length > 0 ? (
                  <div className="mb-3 max-h-64 overflow-y-auto space-y-2">
                    {orderComments.comments.map((comment, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border-l-2 border-blue-500 flex justify-between items-start gap-2"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-blue-600 text-xs">
                            Comment {index + 1}:
                          </span>
                          <p className="mt-1">{comment}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(index)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3 text-center py-2">
                    No comments yet.
                  </p>
                )}

                {/* Add new comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a new comment..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                  />
                  <button
                    onClick={handleAddOrUpdateComment}
                    disabled={addingComment || !newComment.trim()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingComment && (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {addingComment
                      ? "Adding..."
                      : orderComments
                      ? "Add Comment"
                      : "Add First Comment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit className="w-6 h-6 text-blue-600" />
                  Edit Order Details
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                {/* User Details */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    User Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editData.user.firstName}
                        onChange={(e) =>
                          handleInputChange("user", "firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editData.user.lastName}
                        onChange={(e) =>
                          handleInputChange("user", "lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editData.user.email}
                        onChange={(e) =>
                          handleInputChange("user", "email", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="number"
                        value={editData.user.phone}
                        onChange={(e) =>
                          handleInputChange("user", "phone", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Billing Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Address Line
                      </label>
                      <AddressAutocomplete
                        key={`billing-${editData.billingAddress.addressLine}`}
                        placeholder="Start typing address..."
                        defaultValue={editData.billingAddress.addressLine || ""}
                        countryCode="au" // optional — change/remove if you want global search
                        email="admin@supermerch.com" // polite id for Nominatim
                        onSelect={(place) => {
                          const addr = place.address || {};
                          handleInputChange(
                            "billingAddress",
                            "addressLine",
                            place.display_name || ""
                          );
                          handleInputChange(
                            "billingAddress",
                            "city",
                            addr.city ||
                              addr.town ||
                              addr.village ||
                              addr.hamlet ||
                              ""
                          );
                          handleInputChange(
                            "billingAddress",
                            "state",
                            addr.state || ""
                          );
                          handleInputChange(
                            "billingAddress",
                            "postalCode",
                            addr.postcode || ""
                          );
                          handleInputChange(
                            "billingAddress",
                            "country",
                            addr.country || "Australia"
                          );
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={editData.billingAddress.companyName}
                        onChange={(e) =>
                          handleInputChange(
                            "billingAddress",
                            "companyName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editData.billingAddress.country}
                        onChange={(e) =>
                          handleInputChange(
                            "billingAddress",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editData.billingAddress.state}
                        onChange={(e) =>
                          handleInputChange(
                            "billingAddress",
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editData.billingAddress.city}
                        onChange={(e) =>
                          handleInputChange(
                            "billingAddress",
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={editData.billingAddress.postalCode}
                        onChange={(e) =>
                          handleInputChange(
                            "billingAddress",
                            "postalCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.firstName}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "firstName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.lastName}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "lastName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editData.shippingAddress.email}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "email",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="number"
                        value={editData.shippingAddress.phone}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "phone",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Address Line
                      </label>
                      {/* Shipping Address - Address Line (replaced) */}
                      <AddressAutocomplete
                        key={`shipping-${editData.shippingAddress.addressLine}`}
                        placeholder="Start typing address..."
                        defaultValue={
                          editData.shippingAddress.addressLine || ""
                        }
                        countryCode="au"
                        email="admin@supermerch.com"
                        onSelect={(place) => {
                          const addr = place.address || {};
                          handleInputChange(
                            "shippingAddress",
                            "addressLine",
                            place.display_name || ""
                          );
                          handleInputChange(
                            "shippingAddress",
                            "city",
                            addr.city ||
                              addr.town ||
                              addr.village ||
                              addr.hamlet ||
                              ""
                          );
                          handleInputChange(
                            "shippingAddress",
                            "state",
                            addr.state || ""
                          );
                          handleInputChange(
                            "shippingAddress",
                            "postalCode",
                            addr.postcode || ""
                          );
                          handleInputChange(
                            "shippingAddress",
                            "country",
                            addr.country || ""
                          );
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.companyName}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "companyName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.country}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.state}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.city}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={editData.shippingAddress.postalCode}
                        onChange={(e) =>
                          handleInputChange(
                            "shippingAddress",
                            "postalCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Products
                  </h3>
                  {editData.products.map((product, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <h4 className="font-semibold text-sm mb-3 text-gray-900">
                        Product {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              handleInputChange(
                                "products",
                                "name",
                                e.target.value,
                                index
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              handleInputChange(
                                "products",
                                "quantity",
                                e.target.value,
                                index
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.price.toFixed(2)}
                            onChange={(e) =>
                              handleInputChange(
                                "products",
                                "price",
                                e.target.value,
                                index
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Subtotal
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.subTotal.toFixed(2)}
                            readOnly
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {updating && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {updating ? "Updating..." : "Update Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
