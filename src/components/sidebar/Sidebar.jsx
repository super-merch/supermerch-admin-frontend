import React, { useState, useContext } from "react";
import {
  FaHome,
  FaShoppingCart,
  FaUser,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
  
} from "react-icons/fa";
import { MdBorderColor } from "react-icons/md";
import { BsChatLeftQuoteFill } from "react-icons/bs";
import { MdDiscount } from "react-icons/md";
import { TbLogs } from "react-icons/tb";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { setAToken, showPopup, setShowPopup } = useContext(AdminContext);
  const navigate = useNavigate(); // State to control popup visibility

  const handleLogout = () => {
    localStorage.removeItem("aToken");
    setAToken("");
    navigate("/login");
    setShowPopup(false); // Close the popup after logout
  };

  return (
    <div
      className={`${isOpen ? "w-64" : "w-20"
        } transition-width duration-300 border-r min-h-screen fixed flex flex-col bg-white z-50`}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        <h1
          className={`text-xl font-bold transition-all duration-300 ${!isOpen && "hidden"
            }`}
        >
          Dashboard
        </h1>
        <button className="text-black" onClick={toggleSidebar}>
          <FaBars size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 space-y-2">
        <Link
          to="/"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <FaHome size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Home
          </span>
        </Link>
        <Link
          to="/orders"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <MdBorderColor size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Orders
          </span>
        </Link>

        <Link
          to="/quote"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <BsChatLeftQuoteFill size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Quote
          </span>
        </Link>
        <Link
          to="/products"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <FaShoppingCart size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Products
          </span>
        </Link>
        <Link
          to="/suppliers"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <FaShoppingCart size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Suppliers
          </span>
        </Link>
        <Link
          to="/users"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <FaUser size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Users
          </span>
        </Link>
        <Link
          to="/blogs"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <TbLogs size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Blogs
          </span>
        </Link>
        <Link
          to="/reports"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <FaChartBar size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Reports
          </span>
        </Link>
        <Link
          to="/global-discount"
          className="flex items-center px-4 py-2 hover:bg-blue-500 group"
        >
          <MdDiscount size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Global Discount
          </span>
        </Link>
        <button
          onClick={() => setShowPopup(true)} // Open the popup on click
          className="flex items-center px-4 py-2 hover:bg-blue-500 group w-full"
        >
          <FaSignOutAlt size={20} className="mr-3 text-gray-700" />
          <span
            className={`text-gray-700 group-hover:text-white transition-all duration-300 ${!isOpen && "hidden"
              }`}
          >
            Logout
          </span>
        </button>
      </nav>

      {/* Logout Confirmation Popup */}
      {showPopup && (
        <motion.div
          className="fixed top-0 bottom-0 right-0 left-0 inset-0 bg-black backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center p-2">
          <motion.div
            initial={{ opacity: 0.2, z: 50 }}
            transition={{ duration: 0.3 }}
            whileInView={{ opacity: 1, z: 0 }}
            viewport={{ once: true }}
            className='flex flex-col w-[100%] sm:max-w-[40%] sm:w-full text-gray-800 justify-center bg-white p-5 rounded-md'>
            <p className='text-sm font-semibold'>Are you sure you want to logout?</p>
            <p className='text-sm text-gray-500'>You can login back at any time. All the changes you've been made will not be lost.</p>
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-3 py-1 text-gray-700 transition duration-300 border rounded hover:bg-gray-100" onClick={() => setShowPopup(false)}>Cancel</button>
              <button onClick={() => {
                handleLogout();
                setShowPopup(false)
              }} className='px-3 py-1 bg-red-600 text-white hover:bg-red-500 rounded transition-all'>Logout</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;