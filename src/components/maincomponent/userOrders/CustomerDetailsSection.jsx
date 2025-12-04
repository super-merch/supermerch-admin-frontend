import React, { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Building,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ActionButton from "../../ui/ActionButton";

export default function CustomerDetailsSection({
  user,
  totalOrders,
  totalSpent,
  pendingOrders,
  completedOrders,
  formatDate,
  onSendResetPassword,
}) {
  const [sendingReset, setSendingReset] = useState(false);
  if (!user) return null;

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {pendingOrders}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Completed</p>
              <p className="text-xl font-bold text-green-600">
                {completedOrders}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* User Details Card */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-teal-600" />
          Customer Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user.name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user.email || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-xs font-semibold text-gray-900">
                {user.createdAt ? formatDate(user.createdAt) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Password Section */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <p className="text-xs text-gray-600">
            Need to help this customer access their account? Send a{" "}
            <span className="font-semibold text-gray-800">
              password reset link
            </span>{" "}
            to the email on file.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-gray-500">
              Target email:{" "}
              <span className="font-medium text-gray-800">
                {user.email || "No email available"}
              </span>
            </p>
            <ActionButton
              label={
                sendingReset ? "Sending link..." : "Send reset password link"
              }
              onClick={async () => {
                if (!user.email || !onSendResetPassword || sendingReset) return;
                try {
                  setSendingReset(true);
                  await onSendResetPassword(user);
                } finally {
                  setSendingReset(false);
                }
              }}
              loading={sendingReset}
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Shipping Address Section */}
      {user?.defaultShippingAddress && (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Shipping Address
          </h2>
          <div className="space-y-2">
            {user.defaultShippingAddress.companyName && (
              <div className="flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-xs font-semibold text-gray-900">
                    {user.defaultShippingAddress.companyName}
                  </p>
                </div>
              </div>
            )}
            {user.defaultShippingAddress.addressLine && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-xs font-semibold text-gray-900">
                    {user.defaultShippingAddress.addressLine}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {user.defaultShippingAddress.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">City</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {user.defaultShippingAddress.city}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.state && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">State</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {user.defaultShippingAddress.state}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.postalCode && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Postal Code</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {user.defaultShippingAddress.postalCode}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {user.defaultShippingAddress.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
