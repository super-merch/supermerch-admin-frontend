import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AdminProfile = () => {
  const aToken = localStorage.getItem("aToken");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin-profile/get`,
        {
          headers: { aToken },
        }
      );
      if (response.data.success) {
        setProfile(response.data.admin);
        setProfileData({
          name: response.data.admin.name || "",
          email: response.data.admin.email || "",
          phone: response.data.admin.phone || "",
          address: response.data.admin.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const validateProfile = () => {
    const errors = {};

    if (!profileData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!profileData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = "Invalid email format";
    }

    if (!profileData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(profileData.phone)) {
      errors.phone = "Invalid phone number format";
    }

    if (!profileData.address.trim()) {
      errors.address = "Address is required";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleProfileSave = async () => {
    if (!validateProfile()) {
      return;
    }

    setSavingProfile(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin-profile/update`,
        profileData,
        {
          headers: { aToken },
        }
      );
      if (response.data.success) {
        setProfile(response.data.admin);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileData({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
    setProfileErrors({});
    setIsEditing(false);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Admin Profile
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      handleProfileChange("name", e.target.value)
                    }
                    className={`w-full px-3 py-2 border ${
                      profileErrors.name ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your name"
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile?.name || "Not set"}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      handleProfileChange("email", e.target.value)
                    }
                    className={`w-full px-3 py-2 border ${
                      profileErrors.email ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your email"
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.email}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile?.email || "Not set"}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      handleProfileChange("phone", e.target.value)
                    }
                    className={`w-full px-3 py-2 border ${
                      profileErrors.phone ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your phone number"
                  />
                  {profileErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile?.phone || "Not set"}
                </p>
              )}
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) =>
                      handleProfileChange("address", e.target.value)
                    }
                    className={`w-full px-3 py-2 border ${
                      profileErrors.address
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your address"
                  />
                  {profileErrors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.address}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile?.address || "Not set"}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={handleProfileCancel}
                disabled={savingProfile}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
