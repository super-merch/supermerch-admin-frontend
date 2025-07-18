import React, { useContext, useEffect, useRef, useState } from "react";
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
} from "@/components/ui/table"
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import { addDiscount, addMargin } from "../apis/UserApi";

const backednUrl = import.meta.env.VITE_BACKEND_URL;

const AlProducts = () => {
  const { fetchProducts, products, allProductLoading, ignoredProductIds } =
    useContext(AdminContext);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [localIgnoredIds, setLocalIgnoredIds] = useState(new Set());
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [customNames, setCustomNames] = useState({});
  const [updatingName, setUpdatingName] = useState(false);
  
  const itemsPerPage = 15;
  const processedProductsRef = useRef(new Set());
  const navigate = useNavigate();

  // useEffect(() => {
  //   const applyDiscountAndMarginToAll = async () => {
  //     setLoading(true);
  //     const newProcessed = new Set();
      
  //     for (const product of products || []) {
  //       const productId = product?.meta?.id;
  //       if (!productId || processedProductsRef.current.has(productId)) continue;

  //       const priceGroups = product?.product?.prices?.price_groups || [];
  //       const baseGroup = priceGroups.find((g) => g?.base_price) || {};
  //       const priceBreaks = baseGroup.base_price?.price_breaks || [];
  //       const price = priceBreaks[0]?.price ? parseFloat(priceBreaks[0].price) : 0;

  //       if (!price) continue;

  //       const existingDiscount = product?.appliedDiscount || 0;
  //       const existingMargin = product?.appliedMargin || 0;

  //       const shouldReapply = !product.priceCalculated || product.lastAppliedPrice !== price;

  //       if (!shouldReapply) continue;

  //       try {
  //         await addDiscount(productId, existingDiscount, price);
  //         await addMargin(productId, existingMargin, price);
  //         newProcessed.add(productId);
  //       } catch (err) {
  //         console.error(`Error updating product ${productId}:`, err);
  //       }
  //     }

  //     processedProductsRef.current = new Set([...processedProductsRef.current, ...newProcessed]);
  //     setLoading(false);
  //   };

  //   if (products?.length > 0) {
  //     applyDiscountAndMarginToAll();
  //   }
  // }, [products]);

  useEffect(() => {
    fetchProducts();
    fetchCustomNames();
  }, []);

  useEffect(() => {
    if (ignoredProductIds) {
      setLocalIgnoredIds(new Set(ignoredProductIds));
    }
  }, [ignoredProductIds]);

  // Fetch custom names from backend
  const fetchCustomNames = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/custom-names`);
      if (response.ok) {
        const data = await response.json();
        setCustomNames(data.customNames || {});
      }
    } catch (error) {
      console.error("Error fetching custom names:", error);
    }
  };

  // Update product name
  const updateProductName = async (productId, newName) => {
    if (!newName.trim()) {
      toast.error("Product name cannot be empty");
      return;
    }

    setUpdatingName(true);
    try {
      const response = await fetch(`${backednUrl}/api/update-product-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productId, 
          customName: newName.trim() 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomNames(prev => ({
          ...prev,
          [productId]: newName.trim()
        }));
        toast.success("Product name updated successfully!");
        setEditingProductId(null);
        setEditingName("");
      } else {
        toast.error("Failed to update product name");
      }
    } catch (error) {
      console.error("Error updating product name:", error);
      toast.error("Error updating product name");
    } finally {
      setUpdatingName(false);
    }
  };

  // Start editing
  const startEditing = (productId, currentName) => {
    setEditingProductId(productId);
    setEditingName(currentName);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProductId(null);
    setEditingName("");
  };

  // Get display name (custom name or original name)
  const getDisplayName = (product) => {
    const productId = product.meta.id;
    return customNames[productId] || product.overview.name || 'No Name';
  };

  if (allProductLoading)
    return (
      <div className='flex items-center justify-center mt-20'>
        <div className='w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin'></div>
        <p className='ml-4 text-lg font-semibold'>Loading Products..</p>
      </div>
    );

  if (loading)
    return (
      <div className='flex items-center justify-center mt-20'>
        <div className='w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin'></div>
        <p className='ml-4 text-lg font-semibold'>Updating Prices...</p>
      </div>
    );

  const uniqueSuppliers = [
    ...new Set(
      products?.map((product) => product.supplier?.supplier || "Unknown")
    ),
  ];

  const filteredProducts = selectedSupplier
    ? products.filter(
        (product) => product.supplier?.supplier === selectedSupplier
      )
    : products;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSupplierChange = (e) => {
    setSelectedSupplier(e.target.value);
    setCurrentPage(1);
  };

  const handleViewProduct = (product) => {
    navigate(`/product/${product.meta.id}`, { state: product });
  };

  const handleActivateProduct = async (product) => {
    console.log("Activate product:", product.meta.id);
    const response = await fetch(`${backednUrl}/api/unignore-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId: product.meta.id }),
    });
    if (response.ok) {
      toast.success("Product activated successfully!");
      setLocalIgnoredIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.meta.id);
        return newSet;
      });
    }
  };

  const handleDeactivateProduct = async (product) => {
    console.log("Deactivate product:", product.meta.id);
    const response = await fetch(`${backednUrl}/api/ignore-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId: product.meta.id }),
    });
    if (response.ok) {
      toast.success("Product deactivated successfully!");
      setLocalIgnoredIds(prev => {
        const newSet = new Set(prev);
        newSet.add(product.meta.id);
        return newSet;
      });
    }
  };

  return (
    <div className="px-4 pb-6 lg:pb-10 md:pb-10 lg:px-10 md:px-10 sm:px-6">
      <h1 className="pt-6 pb-6 text-2xl font-bold text-center text-red-600">
        All Products
      </h1>

      <div className="flex justify-end mb-4">
        <select
          value={selectedSupplier}
          onChange={handleSupplierChange}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Suppliers</option>
          {uniqueSuppliers.map((supplier, index) => (
            <option key={index} value={supplier}>
              {supplier}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableCaption>A list of All Products.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentProducts.map((product, index) => {
            const priceGroups = product.product?.prices?.price_groups || [];
            const basePrice = priceGroups.find((group) => group?.base_price) || {};
            const priceBreaks = basePrice.base_price?.price_breaks || [];
            const realPrice =
              priceBreaks.length > 0 && priceBreaks[0]?.price !== undefined
                ? priceBreaks[0].price
                : "0";
            
            const isIgnored = localIgnoredIds.has(product.meta.id);
            const productId = product.meta.id;
            const displayName = getDisplayName(product);
            const isEditing = editingProductId === productId;

            return (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <img
                    src={
                      product.overview.hero_image
                        ? product.overview.hero_image
                        : 'cap.png'
                    }
                    alt=''
                    className='w-8 rounded-full'
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder="Enter product name"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateProductName(productId, editingName);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                          onClick={() => updateProductName(productId, editingName)}
                          disabled={updatingName}
                        >
                          {updatingName ? "..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={cancelEditing}
                          disabled={updatingName}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex-1">{displayName}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={() => startEditing(productId, displayName)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.overview.code || 'No Code'}</TableCell>
                <TableCell>${realPrice}</TableCell>
                <TableCell className="text-right">
                  {isIgnored ? (
                    <Button
                      className="bg-green-700 hover:bg-green-600 mr-1 my-1"
                      onClick={() => handleActivateProduct(product)}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      className="bg-red-700 hover:bg-red-600 mr-1 my-1"
                      onClick={() => handleDeactivateProduct(product)}
                    >
                      Deactivate
                    </Button>
                  )}
                  <Button 
                    className="bg-blue-700 hover:bg-blue-600 mr-1 my-1" 
                    onClick={() => handleViewProduct(product)}
                  >
                    View More
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end gap-4 mt-12">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
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
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AlProducts;