import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../context/AdminContext'
import noimage from '../../assets/noimage.png'

const QuoteAdmin = () => {
  const { aToken, quoteLoading, quoteData, listQuotes } = useContext(AdminContext)
  
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState([])

  useEffect(() => {
    listQuotes()
  }, [aToken])

  // Filter data based on search term
  useEffect(() => {
    if (!quoteData) {
      setFilteredData([])
      return
    }

    const filtered = quoteData.filter((quote) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        quote?.name?.toLowerCase().includes(searchLower) ||
        quote?.email?.toLowerCase().includes(searchLower) ||
        quote?.phone?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when searching
  }, [quoteData, searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-center">Quotes</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search quotes using name, email, or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {quoteLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading quotes...</p>
        </div>
      ) : (
        <>
          {/* Results Info */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, filteredData.length)} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
            {searchTerm && (
              <span className="ml-2 text-blue-600">
                (filtered from {quoteData?.length || 0} total)
              </span>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full border border-collapse border-gray-200 table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">Delivery</th>
                  <th className="px-4 py-3 text-center border border-gray-300 font-semibold text-gray-700">File</th>
                  <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">Comment</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((quote, index) => (
                    <tr key={quote?._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 border border-gray-300">
                        <div className="font-medium text-gray-900">{quote?.name}</div>
                      </td>
                      <td className="px-4 py-3 border border-gray-300">
                        <div className="text-gray-600">{quote?.email}</div>
                      </td>
                      <td className="px-4 py-3 border border-gray-300">
                        <div className="text-gray-600">{quote?.phone}</div>
                      </td>
                      <td className="px-4 py-3 border border-gray-300">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          quote?.delivery?.toLowerCase() === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : quote?.delivery?.toLowerCase() === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quote?.delivery}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border border-gray-300">
                        {quote?.file !== "None" ? (
                          <div className="flex justify-center">
                            <img 
                              src={quote?.file ?? noimage} 
                              className="w-10 h-10 rounded object-cover border"
                              alt="Quote file" 
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No file</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border border-gray-300">
                        <div className="max-w-xs truncate text-gray-600" title={quote?.comment}>
                          {quote?.comment || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No quotes found matching your search.' : 'No quotes available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default QuoteAdmin