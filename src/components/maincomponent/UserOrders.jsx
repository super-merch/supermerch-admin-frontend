import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";

export default function UserOrders() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { state: userName } = useLocation();
  const { userOrders, fetchUserOrders, updateOrderStatus } =
    useContext(AdminContext);
  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    await fetchUserOrders(id);
  };
  useEffect(() => {
    const getOrders = async () => {
      setLoading(true);

      await fetchUserOrders(id);
      setLoading(false);
    };
    getOrders();
  }, []);
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-center">
        {" "}
        {userName} Orders
      </h1>
      <div className="overflow-x-auto">
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading orders...</p>
          </div>
        )}
        <div className="flex items-center justify-start gap-5 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Total Orders</h2>
          <span className="text-lg font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {userOrders.length}
          </span>
        </div>

        <table className="w-full border border-collapse border-gray-200 table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border border-gray-300">Order ID</th>
              <th className="px-4 py-2 border border-gray-300">Order Date</th>
              <th className="px-4 py-2 border border-gray-300">Status</th>
              <th className="px-4 py-2 border border-gray-300">
                Total Payment
              </th>
              <th className="px-4 py-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userOrders.map((order) => (
              <tr key={order._id}>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {order._id}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="py-2 text-center border border-gray-300">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="px-1 py-1 border border-gray-600 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  ${order.total.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  <button
                    className="px-4 py-2 text-center text-white bg-blue-500 rounded"
                    onClick={() => navigate(`/order-details/${order._id}`)}
                  >
                    View More
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
