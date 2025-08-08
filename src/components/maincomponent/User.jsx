import React, { useState, useEffect } from "react";
import { editUser, deleteUser } from "../apis/UserApi";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";

const User = () => {
  const { users, setUsers, loading, fetchUsers } = useContext(AdminContext);
  
  // Existing states
  const [editingUser, setEditingUser] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // New states for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const usersPerPage = 10;
  
  console.log(users);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setUpdatedName(user.name || "");
    setUpdatedEmail(user.email || "");
    setShowEditPopup(true);
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

      const updatedData = { name: updatedName, email: updatedEmail };
      const updatedUser = await editUser(editingUser, updatedData);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser
            ? { ...user, name: updatedName, email: updatedEmail }
            : user
        )
      );

      toast.success("User updated successfully!");
      setEditingUser(null);
      setShowEditPopup(false);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      console.error(error);
    }
  };

  const confirmDelete = (userId) => {
    setUserToDelete(userId);
    setShowDeletePopup(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUser(userToDelete);
      setUsers(users.filter((user) => user._id !== userToDelete));
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      toast.error("Error deleting user");
      console.error(error);
    } finally {
      setShowDeletePopup(false);
      setUserToDelete(null);
    }
  };

  // Search and filter logic
  const filteredUsers = users.filter((user) => {
    const userName = (user.name || "").toLowerCase();
    const userEmail = (user.email || "").toLowerCase();
    const userPhone = (user?.defaultAddress?.phone || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return (
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      userPhone.includes(searchLower)
    );
  });

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Users...</p>
      </div>
    );

  return (
    <div className="px-4 overflow-x-auto lg:px-10 md:px-8 sm:px-6">
      <h1 className="py-10 text-2xl font-medium text-center text-black">Users Page</h1>
      
      {/* Search and Results Info */}
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Results Info */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {currentUsers.length} of {totalUsers} users
          {searchTerm && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>

        {/* Clear Search Button */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="mb-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
          >
            Clear Search
          </button>
        )}
      </div>

      <table className="w-full border">
        <thead className="border">
          <tr className="border">
            <th className="p-3 text-left border-r">Sr. No</th>
            <th className="p-3 text-left border-r">Username</th>
            <th className="pl-4 text-left border-r">Email</th>
            <th className="pl-4 text-left border-r">Joined</th>
            <th className="pl-4 text-left border-r">Phone</th>
            <th className="pl-4 text-left border-r">Country</th>
            <th className="pl-4 text-left border-r">Address</th>
            <th className="pl-4 text-left border-r">Postal Code</th>
            <th className="pl-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="border">
          {currentUsers.map((user, index) => (
            <tr key={user._id} className="border">
              <td className="p-4 border">{startIndex + index + 1}</td>
              <td className="p-4 border">{user.name}</td>
              <td className="p-4 border">{user.email}</td>
              <td className="p-4 border">{new Date(user.createdAt).toLocaleString()}</td>
              <td className="p-4 border">{user?.defaultAddress?.phone || "No Phone"}</td>
              <td className="p-4 border">{user?.defaultAddress?.country || "No Country"}</td>
              <td className="p-4 border">{user?.defaultAddress?.addressLine || "No Address"}</td>
              <td className="p-4 border">{user?.defaultAddress?.postalCode || "No Code"}</td>
              <td className="flex p-4">
                <FaEdit
                  className="text-xl cursor-pointer hover:text-blue-600"
                  onClick={() => handleEdit(user)}
                />
                <MdDeleteForever
                  className="ml-4 text-2xl cursor-pointer hover:text-red-600"
                  onClick={() => confirmDelete(user._id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* No Users Found */}
      {currentUsers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No users found matching your search." : "No users found."}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-2 border border-gray-300 rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>

          <span className="ml-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Edit Popup */}
      {showEditPopup && (
        <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black backdrop-blur-sm bg-opacity-50 z-50">
          <div className="p-6 bg-white rounded shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Edit User</h2>
            <input
              type="text"
              value={updatedName}
              onChange={(e) => setUpdatedName(e.target.value)}
              className="w-full p-2 mt-2 border rounded"
              placeholder="Enter username"
            />
            <input
              type="email"
              value={updatedEmail}
              onChange={(e) => setUpdatedEmail(e.target.value)}
              className="w-full p-2 mt-2 border rounded"
              placeholder="Enter email"
            />
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="px-4 py-2 text-white bg-green-500 rounded"
                onClick={handleUpdate}
              >
                Save
              </button>
              <button
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded"
                onClick={() => setShowEditPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed top-0 left-0 flex items-center justify-center w-full h-full bg-black backdrop-blur-sm bg-opacity-50 z-50">
          <div className="p-6 bg-white rounded shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Confirm Deletion</h2>
            <p>Are you sure you want to delete this user?</p>
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="px-4 py-2 text-white bg-red-500 rounded"
                onClick={handleDelete}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;