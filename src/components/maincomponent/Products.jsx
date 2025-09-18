import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";

const Products = () => {
  const { id } = useParams();
  const { orders, updateOrder, fetchOrders } = useContext(AdminContext);

  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
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
    }
    console.log(found);

    return () => {
      mounted = false;
    };
  }, [id, orders]);

  const handleEditClick = () => {
    if (!checkout) return;
    
    setEditData({
      user: {
        firstName: checkout.user?.firstName || '',
        lastName: checkout.user?.lastName || '',
        email: checkout.user?.email || '',
        phone: checkout.user?.phone || ''
      },
      billingAddress: {
        addressLine: checkout.billingAddress?.addressLine || '',
        country: checkout.billingAddress?.country || '',
        state: checkout.billingAddress?.state || '',
        city: checkout.billingAddress?.city || '',
        postalCode: checkout.billingAddress?.postalCode || '',
        companyName: checkout.billingAddress?.companyName || ''
      },
      shippingAddress: {
        firstName: checkout.shippingAddress?.firstName || '',
        lastName: checkout.shippingAddress?.lastName || '',
        addressLine: checkout.shippingAddress?.addressLine || '',
        country: checkout.shippingAddress?.country || '',
        state: checkout.shippingAddress?.state || '',
        city: checkout.shippingAddress?.city || '',
        postalCode: checkout.shippingAddress?.postalCode || '',
        companyName: checkout.shippingAddress?.companyName || '',
        email: checkout.shippingAddress?.email || '',
        phone: checkout.shippingAddress?.phone || ''
      },
      products: checkout.products?.map(product => ({
        ...product,
        name: product.name || '',
        quantity: product.quantity || 0,
        price: product.price || 0,
        subTotal: product.subTotal || 0
      })) || []
    });
    setShowEditModal(true);
  };

  const handleInputChange = (section, field, value, index = null) => {
    setEditData(prev => {
      const newData = { ...prev };
      
      if (section === 'products' && index !== null) {
        newData.products = [...prev.products];
        newData.products[index] = {
          ...newData.products[index],
          [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value
        };
        
        // Recalculate subTotal when quantity or price changes
        if (field === 'quantity' || field === 'price') {
          const product = newData.products[index];
          product.subTotal = product.quantity * product.price;
        }
      } else {
        newData[section] = {
          ...prev[section],
          [field]: value
        };
      }
      
      return newData;
    });
  };

  const handleUpdateOrder = async () => {
    if (!editData) return;
    
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
      {/* Display back button and edit button */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Orders
        </button>
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Edit Order
        </button>
      </div>
      
      <h1 className="mb-8 text-2xl font-bold text-center">Checkout Details</h1>
      
      {/* Display status */}
      <div className="mb-1 ">
        <p className="text-lg font-semibold">
          Order Status: <span className="text-blue-600">{checkout.status}</span>
        </p>
      </div>
      
      {/* Display order id */}
      <div className="flex justify-between">
        <div className="mb-6 ">
          <p className="text-lg font-semibold">
            Order ID: <span className="text-gray-600">{checkout._id}</span>
          </p>
        </div>
        {/* Display order date */}
        <div className="mb-6 ">
          <p className="text-lg font-semibold">
            Order Date:{" "}
            <span className="text-gray-600">
              {new Date(checkout.orderDate).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
      
      <div className="p-4 mb-8 border border-gray-300 rounded">
        <div className="flex flex-wrap items-start justify-start gap-10 lg:justify-evenly md:justify-evenly ">
          <div>
            <h2 className="mb-4 text-xl font-bold">Billing</h2>
            <p className="pb-1.5">
              <strong>Name:</strong> {checkout.user?.firstName}{" "}
              {checkout.user?.lastName || ""}
            </p>
            <p className="pb-1.5">
              <strong>Address: </strong> {checkout.billingAddress?.addressLine}
            </p>
            <p className="pb-1.5">
              <strong>Country:</strong> {checkout.billingAddress?.country}
            </p>
            <p className="pb-1.5">
              <strong>State:</strong> {checkout.billingAddress?.state}
            </p>
            <p className="pb-1.5">
              <strong>City:</strong> {checkout.billingAddress?.city}
            </p>
            <p className="pb-1.5">
              <strong>Postal Code:</strong>{" "}
              {checkout.billingAddress?.postalCode}
            </p>
            {/* <p className=" flex items-center gap-1.5">
              <strong>Email:</strong>{" "}
              <span className="font-medium text-blue-500 underline cursor-pointer">
                {checkout.user?.email}
              </span>
            </p>
            <p className="flex mt-1.5 items-center gap-1.5">
              <strong>Phone:</strong>{" "}
              <p className="font-semibold text-gray-600">
                {checkout.user?.phone}
              </p>
            </p> */}
            <p className="pb-1.5">
              <strong>Company: </strong>{" "}
              {checkout.billingAddress?.companyName || "No Name"}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold">Shipping</h2>
            <p className="pb-1.5">
              <strong>Name:</strong> {checkout.shippingAddress?.firstName}{" "}
              {checkout.shippingAddress?.lastName || ""}
            </p>
            <p className="pb-1.5">
              <strong>Country:</strong> {checkout.shippingAddress?.country}
            </p>
            <p className="pb-1.5">
              <strong>State:</strong> {checkout.shippingAddress?.state}
            </p>
            <p className="pb-1.5">
              <strong>City:</strong> {checkout.shippingAddress?.city}
            </p>
            <p className="pb-1.5">
              <strong>Postal Code:</strong>{" "}
              {checkout.shippingAddress?.postalCode}
            </p>
            <p className="pb-1.5">
              <strong>Address: </strong> {checkout.shippingAddress?.addressLine}
            </p>
            <p className="pb-1.5">
              <strong>Company: </strong>{" "}
              {checkout.shippingAddress?.companyName || "No Name"}
            </p>
            <p className=" flex items-center gap-1.5">
              <strong>Email:</strong>{" "}
              <p className="font-medium text-blue-500 underline cursor-pointer">
                {checkout.shippingAddress?.email}
              </p>
            </p>
            <p className="flex mt-1.5 items-center gap-1.5">
              <strong>Phone:</strong>{" "}
              <p className="font-semibold text-gray-600">
                {checkout.shippingAddress?.phone}
              </p>
            </p>
          </div>
        </div>

        <h2 className="mt-6 mb-4 text-xl font-bold">Products</h2>
        {checkout.products?.map((product, productIndex) => (
          <div
            key={productIndex}
            className="flex flex-wrap items-center justify-between p-4 mb-4 border border-gray-300 rounded shadow ga-12"
          >
            <div className="">
              <div className="flex items-center gap-4">
                <strong>Image:</strong>{" "}
                <img src={product.image} alt="" className="w-14" />
              </div>
              <div className="flex flex-wrap items-center gap-2 ">
                <strong>Name:</strong>
                <p className=" text-sm font-medium text-gray-600">
                  {" "}
                  {product.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 ">
                <strong>Color:</strong>
                <p className=" text-sm font-medium text-gray-600">
                  {" "}
                  {product.color}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 ">
                <strong>Print:</strong>
                <p className=" text-sm font-medium text-gray-600">
                  {" "}
                  {product.print}
                </p>
              </div>
              {product.size !=="None" && <div className="flex flex-wrap items-center gap-2 ">
                <strong>Size:</strong>
                <p className=" text-sm font-medium text-gray-600">
                  {" "}
                  {product.size}
                </p>
              </div>}
              <div className="flex flex-wrap items-center gap-2 ">
                <strong>Logo Color:</strong>
                <p className=" text-sm font-medium text-gray-600">
                  {" "}
                  {product?.logoColor}
                </p>
              </div>
              <div className="flex items-start gap-4 mt-2">
                <strong>Logo:</strong>{" "}
                {product.logo ? (
                  <img src={product.logo} alt="" className="w-14" />
                ) : (
                  <p>No Logo Image Uploaded</p>
                )}
              </div>
            </div>
            <div className="">
              <div className="flex justify-center gap-4">
                <p className="text-gray-500">Cost</p>
                <p className="text-gray-500">Qty</p>
                <p className="text-gray-500">Total</p>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <p>${product.price.toFixed(2)}</p>
                <p>{product.quantity || 0}</p>
                <p>${product.subTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-10">
          <p className="pb-1.5 flex items-center gap-4 justify-end">
            <strong>Shipping: </strong> <p>${checkout.shipping}</p>
          </p>
          <p className="pb-1.5 flex items-center gap-4 justify-end">
            <strong>Discont: </strong> <p>{checkout.discount}%</p>
          </p>
          <p className="pb-1.5 flex items-center gap-4 justify-end">
            <strong>GST(10%): </strong> <p>${checkout.gst.toFixed(2)}</p>
          </p>
          <p className="pb-1.5 flex items-center gap-2 justify-end">
            <strong>Order Total: </strong>${checkout.total.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
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
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        value={editData.user.firstName}
                        onChange={(e) => handleInputChange('user', 'firstName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editData.user.lastName}
                        onChange={(e) => handleInputChange('user', 'lastName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editData.user.email}
                        onChange={(e) => handleInputChange('user', 'email', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="number"
                        value={editData.user.phone}
                        onChange={(e) => handleInputChange('user', 'phone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line</label>
                      <input
                        type="text"
                        value={editData.billingAddress.addressLine}
                        onChange={(e) => handleInputChange('billingAddress', 'addressLine', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company Name</label>
                      <input
                        type="text"
                        value={editData.billingAddress.companyName}
                        onChange={(e) => handleInputChange('billingAddress', 'companyName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input
                        type="text"
                        value={editData.billingAddress.country}
                        onChange={(e) => handleInputChange('billingAddress', 'country', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={editData.billingAddress.state}
                        onChange={(e) => handleInputChange('billingAddress', 'state', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={editData.billingAddress.city}
                        onChange={(e) => handleInputChange('billingAddress', 'city', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={editData.billingAddress.postalCode}
                        onChange={(e) => handleInputChange('billingAddress', 'postalCode', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.firstName}
                        onChange={(e) => handleInputChange('shippingAddress', 'firstName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.lastName}
                        onChange={(e) => handleInputChange('shippingAddress', 'lastName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editData.shippingAddress.email}
                        onChange={(e) => handleInputChange('shippingAddress', 'email', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="number"
                        value={editData.shippingAddress.phone}
                        onChange={(e) => handleInputChange('shippingAddress', 'phone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.addressLine}
                        onChange={(e) => handleInputChange('shippingAddress', 'addressLine', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company Name</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.companyName}
                        onChange={(e) => handleInputChange('shippingAddress', 'companyName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.country}
                        onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.state}
                        onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.city}
                        onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={editData.shippingAddress.postalCode}
                        onChange={(e) => handleInputChange('shippingAddress', 'postalCode', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Products</h3>
                  {editData.products.map((product, index) => (
                    <div key={index} className="border border-gray-300 rounded p-4 mb-4">
                      <h4 className="font-medium mb-3">Product {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleInputChange('products', 'name', e.target.value, index)}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleInputChange('products', 'quantity', e.target.value, index)}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => handleInputChange('products', 'price', e.target.value, index)}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Subtotal</label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.subTotal}
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
                  {updating ? 'Updating...' : 'Update Order'}
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