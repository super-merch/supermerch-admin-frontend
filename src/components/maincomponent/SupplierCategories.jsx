import React, { useState, useEffect, useMemo, useContext } from "react";
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";

export default function SupplierCategories() {
  const { state } = useLocation();
  const { supplier, margin } = state || {};
  const { fetchSupplierProductNumber } = useContext(AdminContext);
  const [allAvailableCategories, setAllAvailableCategories] = useState([]); // All categories from API
  const [deactivatedCategories, setDeactivatedCategories] = useState([]); // Categories in the modal/database
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [margins, setMargins] = useState({}); // Track margin input per category
  const [categoryMargins, setCategoryMargins] = useState({}); // Track existing margins from DB
  const [itemCount, setItemCount] = useState(0);
  const [supplierData, setSupplierData] = useState({
    email: "",
    password: "",
    notes: "",
    tags: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isEditingSupplierData, setIsEditingSupplierData] = useState(false);
  const [supplierDataLoading, setSupplierDataLoading] = useState(false);
  const fetchSupplierData = async () => {
    try {
      setSupplierDataLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/supplier/get-supplier?supplierId=${supplier.id}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSupplierData({
            email: data.data.email || "",
            password: data.data.password || "",
            notes: data.data.notes || "",
            tags: data.data.tags || [],
          });
          console.log(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
    } finally {
      setSupplierDataLoading(false);
    }
  };
  useEffect(() => {
    fetchSupplierProductNumber(supplier.id).then((count) => {
      setItemCount(count);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        loadAllAvailableCategories(),
        loadDeactivatedCategories(),
        fetchCategoryMargins(),
        fetchSupplierData(),
      ]);
    } finally {
      setLoading(false);
    }
  }
  const handleSaveSupplierData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier/create-supplier`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: supplier.id,
            supplierName: supplier.name,
            ...supplierData,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Supplier data saved successfully");
        setIsEditingSupplierData(false);
        fetchSupplierData();
      } else {
        toast.error("Failed to save supplier data");
      }
    } catch (error) {
      console.error("Error saving supplier data:", error);
      toast.error("Error saving supplier data");
    }
  };

  const handleAddTag = () => {
    if (
      newTag.trim() &&
      !supplierData.tags.some((t) => t.tag === newTag.trim())
    ) {
      setSupplierData((prev) => ({
        ...prev,
        tags: [...prev.tags, { tag: newTag.trim() }],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSupplierData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.tag !== tagToRemove),
    }));
  };

  // Fetch category margins from API
  const fetchCategoryMargins = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/get-category-margin/supplier`
      );
      if (response.ok) {
        const data = await response.json();
        // Convert array to object with supplierId-categoryId as key
        const marginsObj = {};
        const marginsInput = {};
        data.data.forEach((item) => {
          const key = `${item.supplierId}-${item.categoryId}`;
          marginsObj[key] = item.margin;
          marginsInput[key] = item.margin;
        });
        setCategoryMargins(marginsObj);
        setMargins(marginsInput);
        console.log("Fetched category margins:", data); // Initialize input fields with existing margins
      }
    } catch (error) {
      console.error("Error fetching category margins:", error);
    }
  };

  // Load all available categories from the main API
  function loadAllAvailableCategories() {
    return fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/api/categories/list-supplier-category?supplierId=${supplier.id}`,
      { headers: { "Content-Type": "application/json" } }
    )
      .then((r) => r.json())
      .then((json) => setAllAvailableCategories(json.data || []))
      .catch((err) => {
        console.error("Failed to load available categories:", err);
        setAllAvailableCategories([]);
      });
  }

  // Load deactivated categories from the modal/database
  async function loadDeactivatedCategories() {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/categories/list-activated-supplier-category`,
        { headers: { "Content-Type": "application/json" } }
      );
      const resp = await response.json();
      console.log("Deactivated categories from modal:", resp);
      setDeactivatedCategories(resp.data || []);
    } catch (err) {
      console.error("Failed to load deactivated categories:", err);
      setDeactivatedCategories([]);
    }
  }

  // Deactivate category - adds it to the modal/database
  async function deactivateCategory(cat) {
    setActionLoading(cat.groupId);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/categories/deactivate-supplier-category`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: supplier.id,
            supplierName: supplier.name,
            categoryId: cat.groupId,
            categoryName: cat.groupName,
          }),
        }
      );

      if (response.ok) {
        // Refresh deactivated categories to get updated list
        await loadDeactivatedCategories();
        toast.success("Category deactivated successfully!");
      } else {
        console.error("Failed to deactivate category");
        toast.error("Failed to deactivate category");
      }
    } catch (e) {
      console.error("Error deactivating category:", e);
      toast.error("Error deactivating category");
    } finally {
      setActionLoading(null);
    }
  }
  // Activate category - removes it from the modal/database
  async function activateCategory(cat) {
    setActionLoading(cat.groupId);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/categories/activate-supplier-category`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: supplier.id,
            supplierName: supplier.name,
            categoryId: cat.groupId,
            categoryName: cat.groupName,
          }),
        }
      );

      if (response.ok) {
        // Refresh deactivated categories to get updated list
        await loadDeactivatedCategories();
        toast.success("Category activated successfully!");
      } else {
        console.error("Failed to activate category");
        toast.error("Failed to activate category");
      }
    } catch (e) {
      console.error("Error activating category:", e);
      toast.error("Error activating category");
    } finally {
      setActionLoading(null);
    }
  }

  // Handle margin input change
  const handleMarginChange = (categoryId, value) => {
    const key = `${supplier.id}-${categoryId}`;
    setMargins((prev) => ({ ...prev, [key]: value }));
  };

  // Add or update margin
  const handleAddMargin = async (category) => {
    const key = `${supplier.id}-${category.groupId}`;
    const marginValue = parseFloat(margins[key]);
    if (isNaN(marginValue)) {
      toast.error("Please enter a valid margin");
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/add-category-margin/supplier`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId: category.groupId,
            categoryName: category.groupName,
            supplierId: supplier.id,
            supplierName: supplier.name,
            margin: marginValue,
          }),
        }
      );

      if (response.ok) {
        setAddLoading(true);
        // const resp = await fetch(
        //   `${import.meta.env.VITE_BACKEND_URL}/myapi`
        // );
        setAddLoading(false);
        const data = await response.json();
        toast.success(data.message || "Margin added/updated successfully");
        // Update local state
        setCategoryMargins((prev) => ({ ...prev, [key]: marginValue }));
        fetchCategoryMargins();
      }
    } catch (error) {
      console.error("Error adding/updating margin:", error);
      toast.error("Error adding/updating margin");
    }
  };

  // Delete margin
  const handleDeleteMargin = async (category) => {
    const key = `${supplier.id}-${category.groupId}`;
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/product-margin/delete-category-margin/supplier?categoryId=${
          category.groupId
        }&supplierId=${supplier.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setAddLoading(true);
        // const resp = await fetch(
        //   `${import.meta.env.VITE_BACKEND_URL}/myapi`
        // );
        setAddLoading(false);
        const data = await response.json();
        toast.success(data.message || "Margin deleted successfully");
        // Update local state
        setCategoryMargins((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        setMargins((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        // Refresh margins from server
        fetchCategoryMargins();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message);
      }
    } catch (error) {
      console.error("Error deleting margin:", error);
      toast.error("Error deleting margin");
    }
  };

  // Helper function to check if a category is deactivated
  const isCategoryDeactivated = (categoryId) => {
    const isDeactivated = deactivatedCategories.some(
      (deactivated) =>
        String(deactivated.supplierId) === String(supplier.id) &&
        String(deactivated.categoryId) === String(categoryId)
    );

    return isDeactivated;
  };

  // Create the final categories list with status
  const categoriesWithStatus = useMemo(() => {
    if (!allAvailableCategories || allAvailableCategories.length === 0) {
      return [];
    }

    return allAvailableCategories
      .map((category) => {
        const isDeactivated = isCategoryDeactivated(category.groupId);

        return {
          groupId: category.groupId,
          groupName: category.groupName,
          isActive: !isDeactivated, // Active if NOT in the deactivated modal
          originalCategory: category,
        };
      })
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [allAvailableCategories, deactivatedCategories, supplier.id]);

  return (
    <div className="px-6 py-4">
      {/* Supplier Data Section */}
      <div className="mb-6 p-4 relative bg-white border rounded-lg shadow-sm">
        {supplierDataLoading && (
          <div className="absolute w-full h-full bg-black/10 backdrop-blur-sm top-0 left-0 flex justify-center items-center">
            Loading...
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Supplier Information</h2>
          <Button
            onClick={() => setIsEditingSupplierData(!isEditingSupplierData)}
            variant="outline"
            size="sm"
          >
            {isEditingSupplierData ? "Cancel" : "Edit"}
          </Button>
        </div>

        {isEditingSupplierData ? (
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-2 border rounded"
                placeholder="Enter email"
                value={supplierData.email}
                onChange={(e) =>
                  setSupplierData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-2 border rounded pr-10"
                  placeholder="Enter password"
                  value={supplierData.password}
                  onChange={(e) =>
                    setSupplierData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Enter notes"
                rows="3"
                value={supplierData.notes}
                onChange={(e) =>
                  setSupplierData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveSupplierData} className="w-full">
              Save Supplier Data
            </Button>
          </div>
        ) : (
          <div className="space-y-3 grid grid-cols-2 ">
            {/* Display Mode */}
            {supplierData.email && (
              <div>
                <span className="text-base font-medium text-gray-600">
                  Email:{" "}
                </span>
                <span className="text-base">{supplierData.email}</span>
              </div>
            )}
            {supplierData.password && (
              <div>
                <span className="text-base font-medium text-gray-600">
                  Password:{" "}
                </span>
                <span className="text-base inline-flex items-center gap-2">
                  {showPassword ? supplierData.password : "••••••••"}
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
              </div>
            )}
            {supplierData.notes && (
              <div>
                <span className="text-base font-medium text-gray-600">
                  Note:{" "}
                </span>
                <p className="text-base mt-1 inline text-gray-700">
                  {supplierData.notes}
                </p>
              </div>
            )}
            {supplierData.tags.length>0 && (
              <div>
                <span className="text-base font-medium text-gray-600">
                  Tags:{" "}
                </span>
                <div className="flex gap-2" >

                {supplierData.tags.map((tag) => (
                  <p className="bg-blue-300 px-3 inline rounded-2xl py-1">{tag.tag}</p>
                ))}
                </div>
              </div>
            )}
            {!supplierData.email &&
              !supplierData.password &&
              !supplierData.notes &&
              supplierData.tags.length === 0 && (
                <p className="text-base text-gray-500">
                  No supplier information added yet. Click Edit to add details.
                </p>
              )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Supplier Categories - {supplier?.name || "Unknown Supplier"}
        </h1>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin h-4 w-4" /> Refreshing
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Fetch
            </>
          )}
        </Button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          "Loading supplier categories..."
        ) : (
          <div>
            <p>Active Products: {itemCount}</p>
            <p>Available Categories: {allAvailableCategories.length}</p>
            <p>
              Deactivated Categories:{" "}
              {
                deactivatedCategories.filter(
                  (d) => String(d.supplierId) === String(supplier.id)
                ).length
              }
            </p>
            <p>Supplier ID: {supplier.id}</p>
          </div>
        )}
      </div>

      {/* Loading div for margin operations */}
      {addLoading && (
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Updating Margin...</p>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category ID</TableHead>
            <TableHead>Category Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Manage Margin%</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin h-8 w-8" />
                  <span>Loading categories... This could take a while</span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            categoriesWithStatus.map((cat) => {
              const busy = actionLoading === cat.groupId;
              const key = `${supplier.id}-${cat.groupId}`;
              const hasExistingMargin = categoryMargins[key] !== undefined;

              return (
                <TableRow key={`category-${cat.groupId}`}>
                  <TableCell className="font-mono">{cat.groupId}</TableCell>
                  <TableCell className="font-medium">{cat.groupName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cat.isActive
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Deactivated"}
                    </span>
                  </TableCell>
                  {/* Margin Management Cell */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-24 p-1 border rounded"
                        placeholder="Margin"
                        value={margins[key] || ""}
                        onChange={(e) =>
                          handleMarginChange(cat.groupId, e.target.value)
                        }
                      />
                      <Button
                        onClick={() => handleAddMargin(cat)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {hasExistingMargin ? "Update" : "Add"}
                      </Button>
                      {hasExistingMargin && (
                        <Button
                          onClick={() => handleDeleteMargin(cat)}
                          className="bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    {hasExistingMargin ||
                      (margin && (
                        <div className="text-sm text-gray-600 mt-1">
                          Current: {categoryMargins[key] || margin}
                        </div>
                      ))}
                  </TableCell>
                  <TableCell>
                    {cat.isActive ? (
                      <Button
                        onClick={() => deactivateCategory(cat)}
                        disabled={busy}
                        variant="destructive"
                        size="sm"
                      >
                        {busy ? (
                          <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                            Deactivating...
                          </>
                        ) : (
                          "Deactivate"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => activateCategory(cat)}
                        disabled={busy}
                        variant="default"
                        size="sm"
                      >
                        {busy ? (
                          <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                            Activating...
                          </>
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

          {!loading && categoriesWithStatus.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-lg">No categories found</p>
                  <p className="text-sm">
                    Try fetching data or check if the supplier has any products
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Summary */}
      {!loading && categoriesWithStatus.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">
                Active Categories:{" "}
                {categoriesWithStatus.filter((c) => c.isActive).length}
              </span>
            </div>
            <div>
              <span className="text-red-600 font-medium">
                Deactivated Categories:{" "}
                {categoriesWithStatus.filter((c) => !c.isActive).length}
              </span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">
                Categories with Margins:{" "}
                {
                  Object.keys(categoryMargins).filter((key) =>
                    key.startsWith(`${supplier.id}-`)
                  ).length
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
