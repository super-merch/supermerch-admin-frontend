
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

const AlSuppliers = () => {
  const { fetchSuppliers, suppliers, allProductLoading } =
    useContext(AdminContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [ignoredSuppliers, setIgnoredSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState({});
  const [loading, setLoading] = useState(false);
  const [ignored, setIgnored] = useState(false);
  const [margins, setMargins] = useState({}); // Track margin input per supplier
  const [supplierMargins, setSupplierMargins] = useState({}); // Track existing margins from DB
  const itemsPerPage = 15;
  const [addLoading, setAddLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
    fetchSupplierMargins();
  }, []);

  // Fetch supplier margins from API
  const fetchSupplierMargins = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/product-margin/list-margin/supplier`
      );
      if (response.ok) {
        const data = await response.json();
        // Convert array to object with supplierId as key
        const marginsObj = {};
        data.data.forEach(item => {
          marginsObj[item.supplierId] = item.margin;
        });
        setSupplierMargins(marginsObj);
        setMargins(marginsObj); // Initialize input fields with existing margins
      }
    } catch (error) {
      console.error("Error fetching supplier margins:", error);
    }
  };

  const fetchIgnoredSuppliers = async () => {
    setLoading(true);
    setIgnored(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ignored-suppliers`
      );
      if (!response.ok) {
        setLoading(false);
        throw new Error("Failed to fetch ignored suppliers");
      }
      const data = await response.json();
      if (!data || !data.data) {
        setLoading(false);
        throw new Error("Unexpected API response structure");
      }
      setIgnoredSuppliers(data.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error fetching ignored suppliers:", err);
    }
  };

  if (allProductLoading || loading)
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="ml-4 text-lg font-semibold">Loading Suppliers...</p>
      </div>
    );

  // Pagination logic
  const totalPages = Math.ceil(
    (!ignored ? suppliers.length : ignoredSuppliers.length > 0
      ? ignoredSuppliers.length
      : 1) /
      (!ignored
        ? itemsPerPage
        : ignoredSuppliers.length > 0
        ? ignoredSuppliers.length
        : 1)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSuppliers = suppliers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleViewSupplier = (supplier) => {
    navigate(`/supplier/${supplier.id}`, { state: supplier });
  };

  const deactivateSupplier = async (supplier) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ignore-supplier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supplierId: supplier.id }),
      }
    );
    if (response.ok) {
      toast.success("Supplier deactivated successfully!");
      fetchSuppliers();
    } else {
      const errorData = await response.json();
      toast.error(errorData.message);
    }
  };

  const activateSupplier = async (supplier) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/unignore-supplier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supplierId: supplier.id }),
      }
    );
    if (response.ok) {
      toast.success("Supplier activated successfully!");
      fetchIgnoredSuppliers();
    } else {
      const errorData = await response.json();
      toast.error(errorData.message);
    }
  };
  const handleViewCategories = (supplier) => {
    navigate(`/supplier-categories`, { state: supplier });
  }

  // Handle margin input change
  const handleMarginChange = (supplierId, value) => {
    setMargins((prev) => ({ ...prev, [supplierId]: value }));
  };

  // Add or update margin
  const handleAddMargin = async (supplier) => {
    setAddLoading(true);
  const marginValue = parseFloat(margins[supplier.id]);
  if (isNaN(marginValue)) {
    toast.error("Please enter a valid margin");
    setAddLoading(false);
    return;
  }
  
  // Set loading for this specific supplier
  setLoadingSuppliers(prev => ({ ...prev, [supplier.id]: 'adding' }));
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/product-margin/add-margin/supplier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId: supplier.id,
          margin: marginValue,
        }),
      }
    );

    if (response.ok) {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/myapi`
      );
      
      const data = await response.json();
      toast.success(data.message || "Margin added/updated successfully");
      // Update local state
      setSupplierMargins(prev => ({ ...prev, [supplier.id]: marginValue }));
      // Emit custom event when margin changes
      window.dispatchEvent(new CustomEvent('supplierMarginChanged', {
        detail: { supplierId: supplier.id }
      }));
      fetchSupplierMargins();
      setAddLoading(false);
    }
  } catch (error) {
    console.error("Error adding/updating margin:", error);
    toast.error("Error adding/updating margin");
    setAddLoading(false);
  } finally {
    // Clear loading for this specific 
    setAddLoading(false);
    setLoadingSuppliers(prev => {
      const newState = { ...prev };
      delete newState[supplier.id];
      return newState;
    });
  }
};
  // Delete margin
  const handleDeleteMargin = async (supplier) => {
  // Set loading for this specific supplier
  setLoadingSuppliers(prev => ({ ...prev, [supplier.id]: 'deleting' }));
  setAddLoading(true);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/product-margin/del-margin/supplier?supplierId=${supplier.id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/myapi`
      );
      
      const data = await response.json();
      toast.success(data.message || "Margin deleted successfully");
      // Update local state
      setSupplierMargins(prev => {
        const newState = { ...prev };
        delete newState[supplier.id];
        return newState;
      });
      setMargins(prev => {
        const newState = { ...prev };
        delete newState[supplier.id];
        return newState;
      });
      // Refresh margins from server
      fetchSupplierMargins();
      setAddLoading(false);
    } else {
      const errorData = await response.json();
      toast.error(errorData.message);
      setAddLoading(false);
    }
  } catch (error) {
    console.error("Error deleting margin:", error);
    toast.error("Error deleting margin");
    setAddLoading(false);
  } finally {
    // Clear loading for this specific supplier
    setLoadingSuppliers(prev => {
      const newState = { ...prev };
      delete newState[supplier.id];
      return newState;
    });
    setAddLoading(false);
  }
};

  return (
    <div className="px-4 pb-6 lg:pb-10 md:pb-10 lg:px-10 md:px-10 sm:px-6">
      <h1 className="pt-6 pb-6 text-2xl font-bold text-center text-red-600">
        All Suppliers
      </h1>

      <div className="flex gap-2 p-4">
        <button
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !ignored
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            fetchSuppliers();
            setIgnored(false);
          }}
        >
          Active Suppliers
        </button>

        <button
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            ignored
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => {
            fetchIgnoredSuppliers();
            setIgnored(true);
          }}
        >
          Inactive Suppliers
        </button>
      </div>
      {/* loding div */}
      {addLoading && (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Updating Margin...</p>
        </div>
      )}
      <Table>
        <TableCaption>A list of all suppliers.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Manage Margin</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            <TableHead className="text-right">View Categories</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {(ignored ? ignoredSuppliers : currentSuppliers).map((sup) => {
            const createdAt = new Date(sup.created_at).toLocaleDateString();
            const hasExistingMargin = supplierMargins[sup.id] !== undefined;
            
            return (
              <TableRow key={sup.id}>
                <TableCell>{sup.name}</TableCell>
                <TableCell>{sup.country}</TableCell>
                <TableCell>{!ignored ? "Yes" : "No"}</TableCell>
                <TableCell>{createdAt}</TableCell>
                {/* Margin Management Cell */}
                <TableCell>
  <div className="flex items-center gap-2">
    <input
      type="number"
      className="w-24 p-1 border rounded"
      placeholder="Margin"
      value={margins[sup.id] || ""}
      onChange={(e) =>
        handleMarginChange(sup.id, e.target.value)
      }
    />
    <Button
      onClick={() => handleAddMargin(sup)}
      disabled={loadingSuppliers[sup.id]}
      className={`${loadingSuppliers[sup.id] ? "cursor-not-allowed bg-blue-400 hover:bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
    >
      {loadingSuppliers[sup.id] === 'adding' 
        ? (hasExistingMargin ? "Updating..." : "Adding...") 
        : (hasExistingMargin ? "Update" : "Add")
      }
    </Button>
    {hasExistingMargin && (
      <Button
        onClick={() => handleDeleteMargin(sup)}
        disabled={loadingSuppliers[sup.id]}
        className={`${loadingSuppliers[sup.id] ? "cursor-not-allowed bg-red-400 hover:bg-red-400" : "bg-red-600 hover:bg-red-700"}`}
      >
        {loadingSuppliers[sup.id] === 'deleting' ? "Deleting..." : "Delete"}
      </Button>
    )}
  </div>
  {hasExistingMargin && (
    <div className="text-sm text-gray-600 mt-1">
      Current: {supplierMargins[sup.id]}
    </div>
  )}
</TableCell>
                <TableCell>
                  {!ignored ? (
                    <Button
                      className="bg-red-700 hover:bg-red-600 mr-1 my-1"
                      onClick={() => deactivateSupplier(sup)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      className="bg-green-700 hover:bg-green-600 mr-1 my-1"
                      onClick={() => activateSupplier(sup)}
                    >
                      Activate
                    </Button>
                  )}
                </TableCell>
                <TableCell><Button
                      className="bg-blue-700 hover:bg-blue-600 mr-1 my-1"
                     onClick={() => handleViewCategories(sup)}
                    >
                      Categories
                    </Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end gap-4 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Previous
        </button>
        <span className="text-lg font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AlSuppliers;
