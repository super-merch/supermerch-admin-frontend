import React, { useContext } from "react";
import BarChart from "./BarChart";
import CurcleChart from "./CurcleChart";
import { AdminContext } from "../../context/AdminContext";
import { Newspaper, ShoppingCart, Users } from "lucide-react";

const Charts = ({ isOpen }) => {
  const {
    users,
    orders,
    orderCompleted,
    orderPending,
    products,
    blogs,
    quoteData,
    allProductLoading,
    pagination,
    prodLength
  } = useContext(AdminContext);
  if (allProductLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          {/* Text */}
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        isOpen ? "max-w-[95%]" : "max-w-full"
      } lg:px-3 md:px-3 px-0 w-full mx-auto my-5 max-sm:p-2`}
    >
      <div className="flex flex-wrap gap-3">
        <div
          className="flex flex-col justify-center items-center gap-2 bg-white p-6 min-w-52 rounded border-2 shadow-sm 
                border-gray-100 cursor-pointer hover:scale-105 transition-all max-sm:w-full"
        >
          {/* <img className='w-14' src={assets.doctor_icon} alt="" /> */}
          <Users className="text-blue-500 w-8 h-8" />
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-xl">Users</p>
            <p className="text-xl font-semibold text-gray-600">
              {users?.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center gap-2 bg-white p-6 min-w-52 rounded border-2 shadow-sm border-gray-100 cursor-pointer hover:scale-105 transition-all max-sm:w-full">
          {/* <img className='w-14' src={assets.appointments_icon} alt="" /> */}
          <ShoppingCart className="text-blue-500 w-8 h-8" />
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-xl">Orders</p>
            <p className="text-xl font-semibold text-gray-600">
              {pagination?.totalOrders||orders?.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center gap-2 bg-white p-6 min-w-52 rounded border-2 shadow-sm border-gray-100 cursor-pointer hover:scale-105 transition-all max-sm:w-full">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <ShoppingCart className="text-blue-500 w-8 h-8" />
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-xl">products</p>
            <p className="text-xl font-semibold text-gray-600">
              {prodLength||products?.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center gap-2 bg-white p-6 min-w-52 rounded border-2 shadow-sm border-gray-100 cursor-pointer hover:scale-105 transition-all max-sm:w-full">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <Newspaper className="text-blue-500 w-8 h-8" />
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-xl">Blogs</p>
            <p className="text-xl font-semibold text-gray-600">
              {blogs?.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center gap-2 bg-white p-6 min-w-52 rounded border-2 shadow-sm border-gray-100 cursor-pointer hover:scale-105 transition-all max-sm:w-full">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <Newspaper className="text-blue-500 w-8 h-8" />
          <div className="text-center">
            <p className="text-gray-600 font-semibold text-xl">Quotes</p>
            <p className="text-xl font-semibold text-gray-600">
              {quoteData?.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid my-5 grid-cols-1 md:grid-cols-2 justify-center gap-4 mt-5">
        <div className="lg:p-5  md:p-4 sm:p-3 p-0 rounded-md bg-white  shadow-md">
          <BarChart />
        </div>
        <div className="p-5 w-full  rounded-md flex justify-center items-center  mx-auto bg-white  shadow-md">
          <CurcleChart />
        </div>
        {/* <div className="p-5 w-full rounded-md mx-auto bg-white  shadow-md">
                    <CurcleChart />
                </div>
                <div className="p-5 w-full rounded-md h-full mx-auto bg-white  shadow-md">
                </div> */}
      </div>
    </div>
  );
};

export default Charts;
