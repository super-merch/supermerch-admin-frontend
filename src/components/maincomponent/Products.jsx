import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import AddressAutocomplete from "../AddressAutoComplete";
import { LuSquareArrowOutUpRight } from "react-icons/lu";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="ml-4 text-lg font-semibold">Loading checkout data...</p>
        </div>
      </div>
    );
  }

  if (!checkout) {
    return <div className="p-8">No checkout data available.</div>;
  }

  return (
    <div className="p-8">
      {/* Header actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back
          </button>
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Edit Order
          </button>
        </div>
        {/* show users name */}

        <div className="text-right">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span className="font-semibold text-blue-600">
              {checkout.status}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Order ID:{" "}
            <span className="font-semibold">
              {checkout.orderId || checkout._id}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Date:{" "}
            <span className="font-semibold">
              {checkout.orderDate
                ? new Date(checkout.orderDate).toLocaleString()
                : "-"}
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">User:</span>
        <span
          onClick={() => navigate(`/user-orders/${checkout.userId} `)}
          className="font-medium cursor-pointer text-blue-800 underline"
        >
          {checkout.user?.firstName} {checkout.user?.lastName}{" "}
          <LuSquareArrowOutUpRight className=" inline pl-1 pb-[6px]" />
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Billing + Shipping + Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Table */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <h3 className="text-lg font-semibold mb-4">Products</h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Image
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Product
                    </th>
                    {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Logo
                    </th> */}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Colour
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Print
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Size
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Supplier
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Product Code
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {checkout.products?.map((product, idx) => (
                    <tr key={product._id || idx}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="w-16 h-12 rounded overflow-hidden border">
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

                      <td className="px-2 py-3 text-sm text-gray-700">
                        <div className="font-medium">{product.name}</div>
                      </td>
                      {/* <td className="text-sm text-gray-700">
                        <img
                          src={product?.logo ? product.logo : ""}
                          className="min-w-20"
                          alt=""
                        />
                      </td> */}

                      <td className="px-2 py-3 text-sm text-gray-700">
                        {product.color || "—"}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700">
                        {product.print || "—"}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700">
                        {product.size && product.size !== "None"
                          ? product.size
                          : "—"}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700 text-right">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700">
                        {product.supplierName || "—"}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700">
                        {product.id || "—"}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700 text-right">
                        {product.quantity || 0}
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-700 text-right">
                        {formatCurrency(product.subTotal)}
                      </td>
                    </tr>
                  ))}

                  {/* If you want a subtotal row per table, keep it here (optional) */}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals (mobile-friendly place) */}
          <div className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
  <div className="flex flex-col md:flex-row md:justify-between gap-6">
    {/* LEFT SECTION - ARTWORK INFO */}
    <div className="w-full md:w-1/2">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
        Artwork Details
      </h2>

      {checkout.artworkOption === "upload" && logo && (
        <div className="mb-4 flex items-center justify-center">
          <img
            src={logo.logo}
            alt="Uploaded Logo"
            className="w-36 h-36 object-contain rounded-lg border border-gray-300 bg-gray-50 p-2 shadow-sm"
          />
        </div>
      )}

      {checkout.artworkOption !== "upload" && (
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-700">
            Artwork Option:
          </p>
          <p className="text-sm capitalize text-gray-600">
            {checkout.artworkOption === "on_file" ? "Already On File": checkout.artworkOption === "no_artwork" ? "No Artwork" : checkout.artworkOption || "N/A"}
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-700">
          {checkout.artworkOption === "text" ? "Text to be printed:" : " Artwork Instruction:"}
        </p>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {checkout.artworkMessage || "No instructions provided"}
        </p>
      </div>
    </div>

    {/* RIGHT SECTION - ORDER SUMMARY */}
    <div className="w-full md:w-1/2">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
        Order Summary
      </h2>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{formatCurrency(checkout.shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Setup Fee</span>
          <span className="font-medium">{formatCurrency(checkout.setupFee)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Discount</span>
          <span className="font-medium">
            {checkout.discount ? `${checkout.discount}%` : "0%"}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">GST (10%)</span>
          <span className="font-medium">{formatCurrency(checkout.gst)}</span>
        </div>

        <div className="border-t pt-3 flex justify-between text-base font-semibold">
          <span>Order Total</span>
          <span>{formatCurrency(checkout.total)}</span>
        </div>
      </div>
    </div>
  </div>
</div>

          {/* Addresses */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <div className="flex flex-col md:flex-row md:justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Billing</h2>
                <p className="text-sm text-gray-700">
                  <strong>
                    {checkout.billingAddress?.firstName || checkout.user?.firstName} {checkout.billingAddress?.lastName}
                  </strong>
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.billingAddress?.addressLine}
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.billingAddress?.city},{" "}
                  {checkout.billingAddress?.state}{" "}
                  {checkout.billingAddress?.postalCode}
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.billingAddress?.country}
                </p>
                <p className="text-sm text-gray-600">
                  Company: {checkout.billingAddress?.companyName || "—"}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Shipping</h2>
                <p className="text-sm text-gray-700">
                  <strong>
                    {checkout.shippingAddress?.firstName}{" "}
                    {checkout.shippingAddress?.lastName}
                  </strong>
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.shippingAddress?.addressLine}
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.shippingAddress?.city},{" "}
                  {checkout.shippingAddress?.state}{" "}
                  {checkout.shippingAddress?.postalCode}
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.shippingAddress?.country}
                </p>
                <p className="text-sm text-gray-600">
                  Company: {checkout.shippingAddress?.companyName || "—"}
                </p>
                <p className="text-sm text-blue-600 underline mt-2">
                  {checkout.shippingAddress?.email}
                </p>
                <p className="text-sm text-gray-600">
                  {checkout.shippingAddress?.phone}
                </p>
              </div>
            </div>
          </div>
          {/* Input for sending note to the user */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <h2 className="text-lg font-semibold mb-2">Send Note to user:</h2>
            <div className="flex flex-col items-end md:flex-row md:justify-between gap-4">
              <textarea
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="border border-gray-300 h-32 rounded-md p-2 w-full"
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
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                {noteLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order summary (sticky-ish) */}
        <aside className="space-y-4">
          <div className="p-4 border border-gray-200 rounded bg-white shadow-sm">
            <h4 className="text-lg font-semibold mb-2">Order Summary</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{checkout.products?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(checkout.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Setup Fee</span>
                <span>{formatCurrency(checkout.setupFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>{formatCurrency(checkout.gst)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>
                  {checkout.discount ? `${checkout.discount}%` : "0%"}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                <span>Total</span>
                <span>{formatCurrency(checkout.total)}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Payment Status:</p>
              <p className="font-medium">{checkout.paymentStatus}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Order Reference:</p>
              <p className="font-medium">{checkout.orderId || checkout._id}</p>
            </div>
          </div>

          {/* Quick contact / shipping info */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <h4 className="text-md font-semibold mb-2">Customer</h4>
            <p className="text-sm text-gray-700">
              {checkout.user?.firstName} {checkout.user?.lastName}
            </p>
            <p className="text-sm text-blue-600 underline">
              {checkout.user?.email}
            </p>
            {/* <p className="text-sm text-gray-700">{checkout.user?.phone}</p> */}
          </div>
          {/* Comments Section - Add this after the Customer card in the aside */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <h4 className="text-md font-semibold mb-3">Order Comments</h4>

            {loadingComments ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Display existing comments */}
                {/* Display existing comments */}
                {orderComments?.comments &&
                orderComments.comments.length > 0 ? (
                  <div className="mb-4">
                    <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {orderComments.comments.map((comment, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-blue-500 flex justify-between items-start gap-2"
                        >
                          <div>
                            <span className="font-medium text-blue-600">
                              Comment {index + 1}:
                            </span>{" "}
                            {comment}
                          </div>
                          <button
                            onClick={() => handleDeleteComment(index)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                            title="Delete comment"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">
                    No comments yet. Add the first comment below.
                  </p>
                )}

                {/* Add new comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a new comment..."
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                    rows="3"
                  />
                  <button
                    onClick={handleAddOrUpdateComment}
                    disabled={addingComment || !newComment.trim()}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                  >
                    {addingComment && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* Edit Modal (unchanged logic & fields) */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Order Details</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-8">
                {/* User Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Details</h3>
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
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
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Products</h3>
                  {editData.products.map((product, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded p-4 mb-4"
                    >
                      <h4 className="font-medium mb-3">Product {index + 1}</h4>
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
                            className="w-full p-2 border border-gray-300 rounded"
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
                            className="w-full p-2 border border-gray-300 rounded"
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
                            className="w-full p-2 border border-gray-300 rounded"
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
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
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
