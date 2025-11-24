import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";

export default function UserOrders() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { state: userName } = useLocation();
  const [user, setUser] = useState(null);
  const { userOrders, fetchUserOrders, updateOrderStatus, getSingleUser } =
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
      const data = await getSingleUser(id);
      setUser(data.user);
      console.log(data.user);
    };
    getOrders();
  }, []);
  const navigate = useNavigate();
  return (
    <div className="p-8">
      {/* Display back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Back
        </button>
      </div>
      <h1 className="mb-4 text-2xl font-bold text-center">
        {" "}
        {userName} Orders
      </h1>

      {/* show users details from the usersOrders first element inside userOrders[0].user */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          User Details
        </h2>
        <div className="grid grid-cols-3 gap-2 text-base">
          <div>
            <span className="font-medium text-gray-600">Name: </span>
            <span className="text-gray-800">{user?.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Email: </span>
            <span className="text-gray-800">{user?.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Joined: </span>
            <span className="text-gray-800">
              {user?.createdAt.slice(0, 10)}
            </span>
          </div>
          {user?.defaultShippingAddress && (
            <>
              <div>
                <span className="font-medium text-gray-600">
                  Company Name:{" "}
                </span>
                <span className="text-gray-800">
                  {user?.defaultShippingAddress?.companyName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">State: </span>
                <span className="text-gray-800">
                  {user?.defaultShippingAddress?.state}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Postal Code: </span>
                <span className="text-gray-800">
                  {user?.defaultShippingAddress?.postalCode}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">City: </span>
                <span className="text-gray-800">
                  {user?.defaultShippingAddress?.city}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone: </span>
                <span className="text-gray-800">
                  {user?.defaultShippingAddress?.phone}
                </span>
              </div>
            </>
          )}
        </div>
        {user?.defaultShippingAddress && (
          <div className="mt-3 max-w-2xl">
            <span className="font-medium  text-gray-600">Address: </span>
            <span className="text-gray-800">
              {user?.defaultShippingAddress?.addressLine}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="ml-4 text-lg font-semibold">Loading orders...</p>
          </div>
        ) : user ? (
          <div>
            <div className="flex items-center justify-start gap-5 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Total Orders</h2>
              <span className="text-lg font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                {userOrders.length}
              </span>
            </div>

            {userOrders.length > 0 ? (
              <table className="w-full border border-collapse border-gray-200 table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 border border-gray-300">
                      Order ID
                    </th>
                    <th className="px-4 py-2 border border-gray-300">
                      Order Date
                    </th>
                    <th className="px-4 py-2 border border-gray-300">Status</th>
                    <th className="px-4 py-2 border border-gray-300">
                      Total Payment
                    </th>
                    <th className="px-4 py-2 border border-gray-300">
                      Actions
                    </th>
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
                          onClick={() =>
                            navigate(`/order-details/${order._id}`)
                          }
                        >
                          View More
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="w-full flex items-center justify-center py-12">
                <p>No orders found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <p className="text-lg font-semibold">User not found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
