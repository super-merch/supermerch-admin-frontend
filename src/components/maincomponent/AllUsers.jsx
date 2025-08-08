import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";

const AllUsers = () => {
  const { users, loading, fetchUsers } = useContext(AdminContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-4xl font-bold text-center">All Users</h1>
      
      <button
        className="bg-gray-500 hover:bg-gray-600 text-white mb-6 py-2 px-4 rounded"
        onClick={() => navigate('/orders')}
      >
        ← Back to Orders
      </button>

      <div className="overflow-x-auto">
        <table className="w-full border border-collapse border-gray-200 table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border border-gray-300">User ID</th>
              <th className="px-4 py-2 border border-gray-300">User Name</th>
              <th className="px-4 py-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {user._id}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {user.name}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  <button
                    className="px-4 py-2 text-center text-white bg-blue-500 rounded"
                    onClick={() => navigate(`/user-orders/${user._id}`, { state: user.name })}
                  >
                    View User's Orders
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllUsers;