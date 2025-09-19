import React, { useState, useContext, useEffect } from "react";
import {
  FaHome,
  FaShoppingCart,
  FaUser,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { FaLock } from "react-icons/fa";
import { MdBorderColor } from "react-icons/md";
import { BsChatLeftQuoteFill } from "react-icons/bs";
import { MdDiscount } from "react-icons/md";
import { TbLogs } from "react-icons/tb";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FaBloggerB } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { motion } from "framer-motion";
import { RiCoupon2Fill } from "react-icons/ri";
import { MdLocalShipping } from "react-icons/md";
import { BsFillBoxFill } from "react-icons/bs";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { setAToken, showPopup, setShowPopup } = useContext(AdminContext);
  const navigate = useNavigate(); // State to control popup visibility
  //get params from url

  const handleLogout = () => {
    localStorage.removeItem("aToken");
    setAToken("");
    navigate("/login");
    setShowPopup(false); // Close the popup after logout
  };
  const location = useLocation();


  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } transition-width duration-300 border-r   h-screen fixed flex flex-col text-white bg-[#080a54] z-50`}
    >
      {/* Sidebar Header */}
      <div className="px-4 pt-4 flex items-center  justify-between">
        <h1
          className={` font-bold transition-all duration-300 ${
            !isOpen && "hidden"
          }`}
        >
          <img src="/LOGO.png" className="w-32 " alt="" />
        </h1>
        <button className="text-white" onClick={toggleSidebar}>
          <FaBars size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 overflow-y-auto pb-10 space-y-2">
        <Link
          to="/"
          className={`flex ${location.pathname == "/" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaHome size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Dashboard
          </span>
        </Link>
        <Link
          to="/orders"
          className={`flex ${location.pathname == "/orders" && "bg-blue-700" || location.pathname == "/all-users" && "bg-blue-700" || location.pathname.slice(0, 12) == "/user-orders" && "bg-blue-700" || location.pathname.slice(0, 14) == "/order-details" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <MdBorderColor size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Orders
          </span>
        </Link>

        <Link
          to="/quote"
          className={`flex ${location.pathname == "/quote" && "bg-blue-700" || location.pathname == "/quote-detail" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <BsChatLeftQuoteFill size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Quote
          </span>
        </Link>
        <Link
          to="/products"
          className={`flex ${location.pathname == "/products" && "bg-blue-700" || location.pathname.slice(0, 8) == "/product" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <BsFillBoxFill size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Products
          </span>
        </Link>
        <Link
          to="/suppliers"
          className={`flex ${location.pathname == "/suppliers" && "bg-blue-700" || location.pathname == "/supplier-categories" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <img src="/supplier.png" className="mr-2 w-6 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Suppliers
          </span>
        </Link>
        <Link
          to="/categories"
          className={`flex ${location.pathname == "/categories" && "bg-blue-700" || location.pathname == "/category-detail" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <BiCategory size={20} className="mr-3 text-white"  />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Categories
          </span>
        </Link>
        <Link
          to="/users"
          className={`flex ${location.pathname == "/users" && "bg-blue-700"  } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaUser size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Users
          </span>
        </Link>
        <Link
          to="/user-queries"
          className={`flex ${location.pathname == "/user-queries" && "bg-blue-700" || location.pathname.slice(0, 11) == "/user-query" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaUser size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Users Queries
          </span>
        </Link>
        <Link
          to="/blogs"
          className={`flex ${location.pathname == "/blogs" && "bg-blue-700" || location.pathname == "/add-blog" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaBloggerB size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Blogs
          </span>
        </Link>
        <Link
          to="/reports"
          className={`flex ${location.pathname == "/reports" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaChartBar size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Reports
          </span>
        </Link>
        <Link
          to="/global-discount"
          className={`flex ${location.pathname == "/global-discount" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <MdDiscount size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Global Discount
          </span>
        </Link>
        <Link
          to="/global-margin"
          className={`flex ${location.pathname == "/global-margin" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <MdDiscount size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Global Margin
          </span>
        </Link>
        <Link
          to="/add-Coupen"
          className={`flex ${location.pathname == "/add-coupen" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <RiCoupon2Fill size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Coupon
          </span>
        </Link>
        <Link
          to="/shipping"
          className={`flex ${location.pathname == "/shipping" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <MdLocalShipping size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Shipping Charges
          </span>
        </Link>
        <Link
          to="/change-pass"
          className={`flex ${location.pathname == "/change-pass" && "bg-blue-700" } items-center px-4 py-2 hover:bg-blue-600 group`}
        >
          <FaLock size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Change Password
          </span>
        </Link>
        <button
          onClick={() => setShowPopup(true)} // Open the popup on click
          className="flex items-center px-4 py-2  hover:bg-blue-600 group w-full"
        >
          <FaSignOutAlt size={20} className="mr-3 text-white" />
          <span
            className={`text-white group-hover:text-white transition-all duration-300 ${
              !isOpen && "hidden"
            }`}
          >
            Logout
          </span>
        </button>
      </nav>

      {/* Logout Confirmation Popup */}
      {showPopup && (
        <motion.div className="fixed top-0 bottom-0 right-0 left-0 inset-0 bg-black backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center p-2">
          <motion.div
            initial={{ opacity: 0.2, z: 50 }}
            transition={{ duration: 0.3 }}
            whileInView={{ opacity: 1, z: 0 }}
            viewport={{ once: true }}
            className="flex flex-col w-[100%] sm:max-w-[40%] sm:w-full text-gray-800 justify-center bg-white p-5 rounded-md"
          >
            <p className="text-sm font-semibold">
              Are you sure you want to logout?
            </p>
            <p className="text-sm text-gray-500">
              You can login back at any time. All the changes you've been made
              will not be lost.
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-3 py-1 text-white transition duration-300 border rounded hover:bg-gray-100"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowPopup(false);
                }}
                className="px-3 py-1 bg-red-600 text-white hover:bg-red-500 rounded transition-all"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;
