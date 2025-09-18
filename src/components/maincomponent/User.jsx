import React, { useState, useEffect } from "react";
import { editUser, deleteUser } from "../apis/UserApi";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { Search } from "lucide-react";


const User = () => {
  const { 
    users, 
    setUsers, 
    loading, 
    fetchUsers, 
    usersPagination  // Add this to AdminContext
  } = useContext(AdminContext);
  
  // Existing states
  const [editingUser, setEditingUser] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Updated pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [mySearch, setMySearch] = useState("");
  

  useEffect(() => {
    fetchUsers();
  }, []);

  // Updated useEffect for pagination and search
  useEffect(() => {
    const filters = {
      searchTerm,
    };
    fetchUsers(currentPage, filters);
  }, [currentPage, searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      // Refresh current page
      fetchUsers(currentPage, { searchTerm });
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
      // Refresh current page
      fetchUsers(currentPage, { searchTerm });
    } catch (error) {
      toast.error("Error deleting user");
      console.error(error);
    } finally {
      setShowDeletePopup(false);
      setUserToDelete(null);
    }
  };

  // Updated pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (usersPagination && currentPage < usersPagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Users...</p>
      </div>
    );

  return (
    <div className="px-4 overflow-x-auto lg:px-10 md:px-8 sm:px-6">
      <h1 className="pt-4 text-2xl font-medium text-start text-black">Users Page</h1>
      
      {/* Updated Search and Results Info */}
      <div className="mb-2 inine">
        <div className="mb-2 relative max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Users
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              className="w-full max-w-md px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              onClick={() => setSearchTerm(mySearch)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-blue-600"
            />
          </div>
        </div>
        
        {/* Updated Results Info */}
        <div className="text-sm text-gray-600">
          Showing {users.length} of {usersPagination?.totalUsers || 0} users
          from page: {currentPage}
          {searchTerm && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>

        {/* Updated Clear Search Button */}
        <div className="mt-2">
          <button
            onClick={() => {
              setSearchTerm("");
              setMySearch("");
            }}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
          >
            Clear Search
          </button>
        </div>
      </div>

      <table className="w-full border">
        <thead className="border">
          <tr className="border">
            <th className="px-2 text-left border-r">Sr. No</th>
            <th className="px-2 text-left border-r">Username</th>
            <th className="pl-2 text-left border-r">Email</th>
            <th className="pl-2 text-left border-r">Joined</th>
            <th className="pl-2 text-left border-r">Phone</th>
            <th className="pl-2 text-left border-r">Country</th>
            <th className="pl-2 text-left border-r">Address</th>
            <th className="pl-2 text-left border-r">Postal Code</th>
            <th className="pl-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody className="border">
          {users.map((user, index) => (
            <tr key={user._id} className="border">
              <td className="p-2 border">
                {((currentPage - 1) * 15) + index + 1}
              </td>
              <td className="p-2 border">{user.name}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">{new Date(user.createdAt).toLocaleString()}</td>
              <td className="p-2 border">{user?.defaultAddress?.phone || "No Phone"}</td>
              <td className="p-2 border">{user?.defaultAddress?.country || "No Country"}</td>
              <td className="p-2 border">{user?.defaultAddress?.addressLine || "No Address"}</td>
              <td className="p-2 border">{user?.defaultAddress?.postalCode || "No Code"}</td>
              <td className="flex items-center px-2">
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
      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No users found matching your search." : "No users found."}
        </div>
      )}

      {/* Updated Pagination */}
      {usersPagination && usersPagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={!usersPagination.hasPrevPage}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from(
              { length: Math.min(5, usersPagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (usersPagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= usersPagination.totalPages - 2) {
                  pageNum = usersPagination.totalPages - 4 + i;
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
              }
            )}
          </div>

          <button
            onClick={goToNextPage}
            disabled={!usersPagination.hasNextPage}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>

          <span className="ml-4 text-sm text-gray-600">
            Page {usersPagination.currentPage} of {usersPagination.totalPages}
          </span>
        </div>
      )}

      {/* Edit Popup - No changes needed */}
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

      {/* Delete Confirmation Popup - No changes needed */}
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