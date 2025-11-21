import React, { useEffect } from "react";
import { FaBars } from "react-icons/fa";
import dummy from "../../assets/dummy.webp";
import { useState } from "react";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { IoMdNotificationsOutline } from "react-icons/io";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { setShowPopup,setUnseenMessages,unseenMessages } = useContext(AdminContext);
  const [profileDropDown, setProfileDropDown] = useState(false);
  const aToken = localStorage.getItem("aToken");
  const navigate = useNavigate()

  const getNotificationStatus = async () => {
    try {
      const response = await axios(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/notifications/get-unread-notification`,
        {
          headers: { aToken },
        }
      );
      const data =  response.data
      if(data){
        console.log(data)
        setUnseenMessages(data.unreadCount)
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getNotificationStatus();
  }, []);

  return (
    <header className="bg-white shadow p-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-700">
        SuperMerch Dashboard
      </h1>
      <div className="flex justify-center gap-4 items-center">
        <div className="relative">
          <div onClick={() => {
            navigate("/notifications")
            }} className="flex justify-center gap-1 items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-200 hover:bg-gray-300 transition-all duration-200 cursor-pointer">
            <IoMdNotificationsOutline className="w-5 h-5" />
            Notifications
          </div>

          {unseenMessages > 0 && (
            <span className="absolute -top-2 -right-2 flex justify-center items-center text-sm w-5 h-5 bg-red-600 rounded-full text-white">{unseenMessages}</span>
          )}
        </div>
        <div className="flex flex-col items-center space-x-4 relative transition-transform duration-300">
          <img
            onClick={() => setProfileDropDown(!profileDropDown)}
            src={dummy}
            className="w-10 h-10 cursor-pointer rounded-full"
            alt=""
          />
          {profileDropDown && (
            <p
              onClick={() => setShowPopup(true)}
              className="bg-white shadow-md border absolute top-10 px-4 py-2 right-3 rounded-md cursor-pointer hover:bg-gray-100"
            >
              Logout
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
