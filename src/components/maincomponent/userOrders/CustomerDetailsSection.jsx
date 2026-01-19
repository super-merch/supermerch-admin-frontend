import React, { useContext, useState } from "react";
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
  Edit,
  X,
  LandmarkIcon,
} from "lucide-react";
import ActionButton from "../../ui/ActionButton";
import { toast } from "react-toastify";
import { editUser } from "@/components/apis/UserApi";
import { AdminContext } from "@/components/context/AdminContext";
import AddressAutocomplete from "@/components/AddressAutoComplete";
import axios from "axios";
import { FaLandmark } from "react-icons/fa";

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
  const { setUsers, fetchUsers } = useContext(AdminContext);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [updatedLastName, setUpdatedLastName] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const handleEdit = (user) => {
    setEditingUser(user._id);
    setUpdatedName(user.name || "");
    setUpdatedLastName(user.lastName || "");
    setUpdatedEmail(user.email || "");
    setEditModal(true);
  };
  const handleEditCompany = (user) => {
    setEditingUser(user._id);
    setCompanyName(user.companyName || "");
    setCompanyEmail(user.companyEmail || "");
    setCompanyAddress(user.companyAddress || "");
    setEditCompanyModal(true);
  };
  const handleUpdate = async () => {
    try {
      if (!updatedName || !updatedEmail) {
        toast.error("Name and email cannot be empty");
        return;
      }

      if (updatedName.length > 20) {
        return toast.error("Name should be less than 20 characters");
      }

      setUpdateLoading(true);
      const updatedData = {
        name: updatedName,
        email: updatedEmail,
        lastName: updatedLastName,
      };
      await editUser(editingUser, updatedData);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === editingUser
            ? { ...user, name: updatedName, email: updatedEmail }
            : user
        )
      );
      user.name = updatedName;
      user.email = updatedEmail;
      user.lastName = updatedLastName;
      toast.success("User updated successfully!");
      setEditingUser(null);
      setEditModal(false);
      // Refresh current page
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      console.error(error);
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleCompanyUpdate = async () => {
    try {
      if (!companyName) {
        toast.error("Name cannot be empty");
        return;
      }

      setUpdateLoading(true);
      const updatedData = { companyName, companyEmail, companyAddress };
      await editUser(editingUser, updatedData);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === editingUser
            ? { ...user, companyName, companyEmail, companyAddress }
            : user
        )
      );
      user.companyName = companyName;
      user.companyEmail = companyEmail;
      user.companyAddress = companyAddress;
      toast.success("User updated successfully!");
      setEditingUser(null);
      setEditCompanyModal(false);
      // Refresh current page
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      console.error(error);
    } finally {
      setUpdateLoading(false);
    }
  };
  const handleEditClick = () => {
    setEditData({
      shippingAddress: {
        firstName: user?.defaultShippingAddress?.firstName || "",
        lastName: user?.defaultShippingAddress?.lastName || "",
        addressLine: user?.defaultShippingAddress?.addressLine || "",
        country: user?.defaultShippingAddress?.country || "",
        state: user?.defaultShippingAddress?.state || "",
        city: user?.defaultShippingAddress?.city || "",
        postalCode: user?.defaultShippingAddress?.postalCode || "",
        companyName: user?.defaultShippingAddress?.companyName || "",
        email: user?.defaultShippingAddress?.email || "",
        phone: user?.defaultShippingAddress?.phone || "",
      },
    });
    setShowEditModal(true);
  };
  const handleUpdateOrder = async () => {
    if (!editData) {
      console.log(editData);
      toast.error("Please fill all input fields");
      return;
    }

    setUpdating(true);
    try {
      const result = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/users/${user?._id}`,
        {
          shippingAddress: editData?.shippingAddress,
        }
      );

      if (result.data.success) {
        toast.success("User updated successfully!");
        setShowEditModal(false);
        user.defaultShippingAddress = editData?.shippingAddress;
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
  const handleInputChange = (section, field, value, index = null) => {
    setEditData((prev) => {
      const newData = { ...prev };
      newData[section] = {
        ...prev[section],
        [field]: value,
      };

      return newData;
    });
  };
  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
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
              <p className="text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                $
                {totalSpent.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
              <p className="text-sm text-gray-500 mb-1">Pending</p>
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
              <p className="text-sm text-gray-500 mb-1">Completed</p>
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
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        {/* Inside Customer Details Card - replace the header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-teal-600" />
            Customer Details
          </h2>
          {!isEditingCustomer ? (
            <ActionButton
              icon={Edit}
              label="Edit"
              onClick={() => {
                setIsEditingCustomer(true);
                handleEdit(user);
                setUpdatedName(user.name || "");
                setUpdatedLastName(user.lastName || "");
                setUpdatedEmail(user.email || "");
              }}
              variant="outline"
              size="sm"
            />
          ) : (
            <div className="flex gap-2">
              <ActionButton
                label="Cancel"
                onClick={() => setIsEditingCustomer(false)}
                variant="outline"
                size="sm"
              />
              <ActionButton
                label="Save"
                onClick={async () => {
                  await handleUpdate();
                  setIsEditingCustomer(false);
                }}
                loading={updateLoading}
                variant="primary"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Replace the fields grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">First Name</p>
              {isEditingCustomer ? (
                <input
                  type="text"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  maxLength={20}
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name || "N/A"}
                </p>
              )}
            </div>
          </div>
          {(user.lastName || isEditingCustomer) && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Last Name</p>
                {isEditingCustomer ? (
                  <input
                    type="text"
                    value={updatedLastName}
                    onChange={(e) => setUpdatedLastName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.lastName || "N/A"}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Email</p>
              {isEditingCustomer ? (
                <input
                  type="email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.email || "N/A"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.createdAt ? formatDate(user.createdAt) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Password Section */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <p className="text-sm text-gray-600">
            Need to help this customer access their account? Send a{" "}
            <span className="font-semibold text-gray-800">
              password reset link
            </span>{" "}
            to the email on file.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ActionButton
              label={
                sendingReset
                  ? "Sending link..."
                  : "Send reset password link to user."
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
      {user.companyName && (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          {/* Inside Company Details Card - replace the header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <LandmarkIcon className="w-4 h-4 text-teal-600" />
              Company Details
            </h2>
            {!isEditingCompany ? (
              <ActionButton
                icon={Edit}
                label="Edit"
                onClick={() => {
                  handleEditCompany(user)
                  setIsEditingCompany(true);
                  setCompanyName(user.companyName || "");
                  setCompanyEmail(user.companyEmail || "");
                  setCompanyAddress(user.companyAddress || "");
                }}
                variant="outline"
                size="sm"
              />
            ) : (
              <div className="flex gap-2">
                <ActionButton
                  label="Cancel"
                  onClick={() => setIsEditingCompany(false)}
                  variant="outline"
                  size="sm"
                />
                <ActionButton
                  label="Save"
                  onClick={async () => {
                    await handleCompanyUpdate();
                    setIsEditingCompany(false);
                  }}
                  loading={updateLoading}
                  variant="primary"
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Replace the fields grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5">
              <LandmarkIcon className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Company Name</p>
                {isEditingCompany ? (
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.companyName || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <LandmarkIcon className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Company Email</p>
                {isEditingCompany ? (
                  <input
                    type="text"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.companyEmail || "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <LandmarkIcon className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Company Address</p>
                {isEditingCompany ? (
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.companyAddress || "N/A"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address Section */}
      {user?.defaultShippingAddress && (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              Shipping Address
            </h2>
            <div className="flex items-center gap-2">
              <ActionButton
                icon={Edit}
                label="Edit"
                onClick={handleEditClick}
                variant="outline"
                size="sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            {user.defaultShippingAddress.companyName && (
              <div className="flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.defaultShippingAddress.companyName}
                  </p>
                </div>
              </div>
            )}
            {user.defaultShippingAddress.addressLine && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-semibold text-gray-900">
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
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.defaultShippingAddress.city}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.state && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.defaultShippingAddress.state}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.postalCode && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Postal Code</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.defaultShippingAddress.postalCode}
                    </p>
                  </div>
                </div>
              )}
              {user.defaultShippingAddress.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.defaultShippingAddress.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit className="w-6 h-6 text-blue-600" />
                  Edit Shipping Address
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
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
                        type="text"
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
}
