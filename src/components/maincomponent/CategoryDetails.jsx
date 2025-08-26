import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { IoMdArrowBack, IoMdArrowForward } from "react-icons/io";
import { toast } from "react-toastify";

// Utility function to calculate visible page buttons
const getPaginationButtons = (currentPage, totalPages, maxVisiblePages) => {
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
};

export default function CategoryDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const categoryName = location.state?.name || "Category";
  const { fetchSearchedProducts, setParamProducts, searchLoading } =
    useContext(AdminContext);

  const [currentPage, setCurrentPage] = useState(1);
  const [maxVisiblePages, setMaxVisiblePages] = useState(5);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(1);
  const [mySearch, setMySearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState(false);

  // NEW STATE FOR PRIORITIZATION
  const [prioritizedProducts, setPrioritizedProducts] = useState(() => new Set());
  const [loadingPrioritize, setLoadingPrioritize] = useState({});

  const getSuppliers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-products?limit=200`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      setSuppliers(result.data);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
    }
  };

  // Fetch prioritized IDs only for the current category (efficient)
  useEffect(() => {
    const getPrioritizeForCategory = async () => {
      if (!id) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/prioritize/${id}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const result = await response.json();
        // result.data is either null or the prioritize entry for this category
        const ids = (result.data && Array.isArray(result.data.productIds))
          ? result.data.productIds
          : [];
        const normalized = ids.map((pid) => String(pid));
        setPrioritizedProducts(new Set(normalized));
        // optional debug
        // console.log("prioritized ids for this category:", normalized);
      } catch (err) {
        console.error("Failed to fetch prioritized products for category", err);
      }
    };

    getPrioritizeForCategory();
  }, [id]);

  // NEW FUNCTION: Add/remove toggle
  const handlePrioritizeToggle = (productId, productName) => {
    const idStr = String(productId);
    if (prioritizedProducts.has(idStr)) {
      removeFromPrioritize(productId, productName);
    } else {
      addToPrioritize(productId, productName);
    }
  };

  // Add to prioritize: update Set immutably
  const addToPrioritize = async (productId, productName) => {
    const idStr = String(productId);
    setLoadingPrioritize((prev) => ({ ...prev, [idStr]: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/prioritize/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: id,
            categoryName: categoryName,
            productId: productId,
          }),
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success(`Product "${productName}" has been prioritized!`);
        setPrioritizedProducts((prev) => {
          const next = new Set(prev);
          next.add(idStr);
          return next;
        });
      } else {
        toast.error(result.message || "Failed to prioritize product");
      }
    } catch (error) {
      toast.error("Failed to prioritize product");
      console.error("Error prioritizing product:", error);
    } finally {
      setLoadingPrioritize((prev) => ({ ...prev, [idStr]: false }));
    }
  };

  // Remove from prioritize: update Set immutably
  const removeFromPrioritize = async (productId, productName) => {
    const idStr = String(productId);
    setLoadingPrioritize((prev) => ({ ...prev, [idStr]: true }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/prioritize/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: id,
            productId: productId,
          }),
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success(`Product "${productName}" has been unprioritized!`);
        setPrioritizedProducts((prev) => {
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
      } else {
        toast.error(result.message || "Failed to unprioritize product");
      }
    } catch (error) {
      toast.error("Failed to unprioritize product");
      console.error("Error unprioritizing product:", error);
    } finally {
      setLoadingPrioritize((prev) => ({ ...prev, [idStr]: false }));
    }
  };

  useEffect(() => {
    const searchProducts = async () => {
      setSearch(true);
      const response = await fetchSearchedProducts(
        mySearch,
        id,
        50,
        supplierId
      );
      setParamProducts(response);
    };
    setMySearch("");
    searchProducts();
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    fetchParamProducts(id, currentPage, supplierId);
    setSearch(false);
  }, [supplierId]);

  useEffect(() => {
    getSuppliers();
    // NEW: Fetch prioritized products when component mounts (handled above)
  }, [id]);

  const { fetchParamProducts, paramProducts, paramLoading, totalApiPages } =
    useContext(AdminContext);

  useEffect(() => {
    if (id) {
      fetchParamProducts(id, currentPage, supplierId);
      setSearch(false);
    }
  }, [id, currentPage]);

  useEffect(() => {
    const handleResize = () => {
      setMaxVisiblePages(window.innerWidth <= 767 ? 3 : 5);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalApiPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const currentProducts = paramProducts?.data || [];

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-red-500">No category ID provided</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-5">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <IoMdArrowBack />
              Back
            </button>
            <h1 className="text-2xl font-bold mt-2">{categoryName} Products</h1>
            <p className="text-gray-600">Category ID: {id}</p>
          </div>
          <div className="flex flex-col gap-3">
            {/*dropdown for sortby with options of array of suppliers */}
            <select
              id="supplier"
              value={supplierId || ""}
              onChange={(e) => setSupplierId(e.target.value)}
              className="border rounded-lg p-2 w-64"
            >
              <option value="" disabled>
                -- Choose a Supplier --
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <div>
              {/*search bar */}
              <input
                type="text"
                placeholder="Search products..."
                className="border rounded-lg p-2 w-64"
                value={mySearch}
                onChange={(e) => setMySearch(e.target.value)}
              />
              <button
                onClick={() => setSearchTerm(mySearch)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                {" "}
                Search
              </button>
            </div>
            {/*clear search button */}
            {search && (
              <button
                onClick={() => {
                  fetchParamProducts(id, currentPage, supplierId);
                  setSearch(false);
                }}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                {" "}
                Clear Search
              </button>
            )}
          </div>
        </div>

        {!paramLoading && (
          <div className="text-sm text-gray-600">
            Showing {currentProducts.length} of {paramProducts?.item_count || 0}{" "}
            products
            {totalApiPages > 1 && ` (Page ${currentPage} of ${totalApiPages})`}
          </div>
        )}
      </div>

      {/* Loading State */}
      {(paramLoading || searchLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading Products...</p>
        </div>
      )}

      {/* Products Table */}
      {!paramLoading && (
        <>
          {currentProducts.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              {search && !searchLoading && (
                <p>Showing results for "{searchTerm}"</p>
              )}
              <table className="w-full border border-collapse border-gray-200 table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                      Sr. No
                    </th>
                    <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                      Product ID
                    </th>
                    <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                      Supplier ID
                    </th>
                    <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                      Supplier Name
                    </th>
                    <th className="px-4 py-3 text-center border border-gray-300 font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product, index) => {
                    const productId = product.meta?.id;
                    const idStr = String(productId);
                    const isPrioritized = prioritizedProducts.has(idStr);
                    const isLoading = loadingPrioritize[idStr];

                    return (
                      <tr
                        key={productId}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 border border-gray-300">
                          {(currentPage - 1) * 9 + index + 1}
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="font-medium text-gray-900">
                            {product.overview?.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="text-gray-600 font-mono">
                            {productId || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="text-gray-600 font-mono">
                            {product.supplier?.supplier_id || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="text-gray-600">
                            {product.supplier?.supplier || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-300">
                          <button
                            onClick={() =>
                              handlePrioritizeToggle(
                                productId,
                                product.overview?.name
                              )
                            }
                            disabled={isLoading}
                            className={`px-2 rounded-md py-1 text-white ${
                              isPrioritized ? "bg-red-600" : "bg-blue-600"
                            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {isLoading
                              ? "..."
                              : isPrioritized
                              ? "Unprioritize"
                              : "Prioritize"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">
                No products found for this category, under this supplier. Change
                the supplier to get products.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalApiPages > 1 && !search && (
            <div className="flex items-center justify-center mt-8 space-x-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-10 h-10 border rounded-full transition-colors ${
                  currentPage === 1
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <IoMdArrowBack className="text-xl" />
              </button>

              {getPaginationButtons(
                currentPage,
                totalApiPages,
                maxVisiblePages
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 border rounded-full flex items-center justify-center transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={handleNext}
                disabled={currentPage === totalApiPages}
                className={`flex items-center justify-center w-10 h-10 border rounded-full transition-colors ${
                  currentPage === totalApiPages
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                <IoMdArrowForward className="text-xl" />
              </button>
            </div>
          )}

          {/* Footer Info */}
          {totalApiPages > 1 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Page {currentPage} of {totalApiPages}
            </div>
          )}
        </>
      )}
    </div>
  );
}
