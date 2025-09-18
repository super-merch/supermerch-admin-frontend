import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { Search } from "lucide-react";

const AllUsers = () => {
  const { 
    users, 
    setUsers, 
    loading, 
    fetchUsers, 
    usersPagination  // Add this to AdminContext
  } = useContext(AdminContext);
  
  const navigate = useNavigate();

  // Pagination and search states
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

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-20">
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

      {/* Search and Results Info */}
      <div className="mb-6">
        <div className="mb-4 relative max-w-md mx-auto">
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-blue-600 cursor-pointer"
            />
          </div>
        </div>
        
        {/* Results Info */}
        <div className="text-sm text-gray-600 text-center">
          Showing {users.length} of {usersPagination?.totalUsers || 0} users
          from page: {currentPage}
          {searchTerm && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>

        {/* Clear Search Button */}
        <div className="mt-2 text-center">
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

      <div className="overflow-x-auto">
        <table className="w-full border border-collapse border-gray-200 table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border border-gray-300">Sr. No</th>
              <th className="px-4 py-2 border border-gray-300">User Name</th>
              <th className="px-4 py-2 border border-gray-300">User Email</th>
              <th className="px-4 py-2 border border-gray-300">Joined</th>
              <th className="px-4 py-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {((currentPage - 1) * 15) + index + 1}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {user.name}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {user.email}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  {user.createdAt.slice(0,10)}
                </td>
                <td className="px-4 py-2 text-center border border-gray-300">
                  <button
                    className="px-4 py-2 text-center text-white bg-blue-500 rounded hover:bg-blue-600"
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

      {/* No Users Found */}
      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No users found matching your search." : "No users found."}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
};

export default AllUsers;