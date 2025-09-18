import React from "react";
import { FaBars } from "react-icons/fa";
import dummy from "../../assets/dummy.webp"
import { useState } from "react";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";

const Navbar = () => {
  const {setShowPopup} = useContext(AdminContext)
  const [profileDropDown, setProfileDropDown] = useState(false)
  return (
    <header className="bg-white shadow p-4 flex items-center justify-between">
     
      <h1 className="text-lg font-semibold text-gray-700">
        SuperMerch Dashboard
      </h1>
      <div className="flex flex-col items-center space-x-4 relative transition-transform duration-300">
        <img onClick={()=> setProfileDropDown(!profileDropDown)} src={dummy} className="w-10 h-10 cursor-pointer rounded-full" alt="" />
        {profileDropDown &&
        <p onClick={()=> setShowPopup(true)} className="bg-white shadow-md border absolute top-10 px-4 py-2 right-3 rounded-md cursor-pointer hover:bg-gray-100">Logout</p>
        }
      </div>
    </header>
  );
};

export default Navbar;
