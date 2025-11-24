import React, { useEffect, useRef } from "react";
import dummy from "../../assets/dummy.webp";
import { useState, useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { Bell, LogOut, Settings, ChevronDown, User } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { setShowPopup } = useContext(AdminContext);
  const [profileDropDown, setProfileDropDown] = useState(false);
  const aToken = localStorage.getItem("aToken");
  const [isSeen, setIsSeen] = useState(true);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const getNotificationStatus = async () => {
    try {
      const response = await axios(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/get-last-notification`,
        {
          headers: { aToken },
        }
      );
      const data = response.data;
      if (data) {
        setIsSeen(data.seen);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getNotificationStatus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropDown(false);
      }
    };

    if (profileDropDown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropDown]);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Brand Section */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            SuperMerch Dashboard
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications Button - Icon Only */}
          <button
            ref={notificationRef}
            onClick={() => {
              setIsSeen(true);
              navigate("/notifications");
            }}
            className="relative p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-teal-300 transition-all duration-200 group"
          >
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
            {!isSeen && (
              <>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75"></span>
              </>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropDown(!profileDropDown)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group"
            >
              <div className="relative">
                <img
                  src={dummy}
                  className="w-9 h-9 rounded-full ring-2 ring-gray-200 group-hover:ring-teal-300 transition-all"
                  alt="Profile"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-all duration-200 ${
                  profileDropDown ? "rotate-180 text-teal-600" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {profileDropDown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden">
                {/* Profile Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Account Menu
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Admin User
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/change-pass");
                      setProfileDropDown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-150"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-1"></div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/change-pass");
                      setProfileDropDown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-150"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
                {/* Divider */}
                <div className="border-t border-gray-200 my-1"></div>
                {/* Logout */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowPopup(true);
                      setProfileDropDown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
