import React from "react";
import { Calendar, DollarSign, Package, Eye } from "lucide-react";
import ActionButton from "../../ui/ActionButton";

export default function OrdersTableSection({
  user,
  userOrders,
  statusLoading,
  handleStatusChange,
  navigate,
  formatDate,
}) {
  console.log(userOrders);
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 mt-3">
        <div className="flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">User not found.</p>
        </div>
      </div>
    );
  }

  if (userOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 mt-3">
        <div className="flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            No orders found for this user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" rounded-lg border border-gray-100 overflow-hidden mt-3">
      <div className="overflow-x-auto">
        <table className="w- mx-auto">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Order ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Order Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Products
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Total(inc. GST)
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                Payment Status
              </th>

              {/* <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {userOrders.map((order, index) => (
              <tr
                key={order._id}
                className="group hover:bg-teal-50/30 transition-colors border-b border-gray-100"
              >
                {/* Serial Number */}
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                </td>

                {/* Order ID */}
                <td
                  className="px-3 py-3 cursor-pointer hover:underline"
                  onClick={() => navigate(`/order-details/${order._id}`)}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Package className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </td>

                {/* Order Date */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {order.orderDate ? formatDate(order.orderDate) : "N/A"}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <select
                    value={order.status || "Pending"}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    disabled={statusLoading[order._id]}
                    className="text-xs font-medium px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  {order?.products?.length || 0}
                </td>
                {/* Total */}
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-gray-900">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span>{order.total?.toFixed(2) || "0.00"}</span>
                  </div>
                </td>

                {/* Payment Status */}
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="text-xs text-gray-600">
                    {order.paymentStatus || "N/A"}
                  </span>
                </td>

                {/* Actions */}
                {/* <td className="px-3 py-3 whitespace-nowrap text-center">
                  <ActionButton
                    icon={Eye}
                    onClick={() => navigate(`/order-details/${order._id}`)}
                    variant="outline"
                    size="sm"
                  />
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
