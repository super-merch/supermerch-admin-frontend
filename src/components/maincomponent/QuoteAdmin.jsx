import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import noimage from '../../assets/noimage.png'

const QuoteAdmin = () => {

  const { backednUrl, aToken, quoteLoading, setQuoteLoading, quoteData, setQuoteData, listQuotes } = useContext(AdminContext)


  

  useEffect(() => {
    listQuotes()
  }, [aToken])


  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-center">quotes</h1>

      {quoteLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading quotes...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse border-gray-200 table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border border-gray-300">Name</th>
                <th className="px-4 py-2 border border-gray-300">Email</th>
                <th className="px-4 py-2 border border-gray-300">Delivery</th>
                <th className="px-4 py-2 border border-gray-300">
                  Phone
                </th>
                <th className="px-4 py-2 border border-gray-300">
                  File
                </th>
                {/* <th className="px-4 py-2 border border-gray-300">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {quoteData?.map((quote) => (
                <tr key={quote?._id}>
                  <td className="px-4 py-2 text-center border border-gray-300">
                    {quote?.name}
                  </td>
                  <td className="px-4 py-2 text-center border border-gray-300">
                    {quote?.email}
                  </td>
                  <td className="py-2 text-center border border-gray-300">
                    {quote?.delivery}
                  </td>
                  <td className="py-2 text-center border border-gray-300">
                    {quote?.phone}
                  </td>
                  <td className="px-4 py-2 text-center border border-gray-300">
                    <img src={quote?.file ?? noimage} className='w-10 h-10' alt="no image" />
                  </td>
                  {/* <td className="px-4 py-2 text-center border border-gray-300">
                    <button
                      className="px-4 py-2 text-center text-white bg-blue-500 rounded"
                      onClick={() => navigate(`/quote-details/${quote._id}`)}
                    >
                      View More
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default QuoteAdmin
