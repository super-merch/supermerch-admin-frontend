import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { Button } from "../ui/button";
import {
  useBulkImportCategoryPrioritiesMutation,
  useRemovePriorityMutation,
  usePriorities,
} from "../apis/priorityApi";
import { useAddPriorityMutation } from "../apis/priorityApi";

const Prioritisation = () => {
  const { fetchSuppliers, suppliers } = useContext(AdminContext);

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selection, setSelection] = useState({
    supplierId: "",
    supplierName: "",
    categoryId: "",
    categoryName: "",
    priority: "",
  });
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [priorities, setPriorities] = useState([]);

  const addPriorityMutation = useAddPriorityMutation();
  const { data: priorityData, refetch: refetchPriorities } = usePriorities();
  const deletePriorityMutation = useRemovePriorityMutation();
  const bulkImportMutation = useBulkImportCategoryPrioritiesMutation();

  useEffect(() => {
    if (!priorityData || !Array.isArray(priorityData)) return;
    // Normalise API data into the shape used by the table
    const normalised = priorityData.map((row) => ({
      id: row._id,
      key: `${row.supplierId}-${row.categoryId}`,
      supplierId: String(row.supplierId),
      supplierName: row.supplierName,
      categoryId: String(row.categoryId),
      categoryName: row.categoryName,
      priority: Number(row.priority ?? row.priorityNumber ?? 0),
    }));
    setPriorities(normalised);
  }, [priorityData]);

  const supplierMap = useMemo(() => {
    const map = {};
    (suppliers || []).forEach((s) => {
      map[String(s.id)] = s;
    });
    return map;
  }, [suppliers]);

  const categoryMap = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => {
      const id = String(c.groupId ?? c.id ?? c.categoryId);
      map[id] = c.groupName ?? c.name ?? c.categoryName ?? "Unnamed category";
    });
    return map;
  }, [categories]);

  // Load suppliers on first visit if not already loaded
  useEffect(() => {
    const loadSuppliers = async () => {
      if (suppliers && suppliers.length > 0) return;
      try {
        setLoadingSuppliers(true);
        await fetchSuppliers(1, 100);
      } catch (error) {
        console.error("Error   fetching suppliers for prioritisation:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliers();
  }, [fetchSuppliers, suppliers]);

  const handleSupplierChange = async (e) => {
    const supplierId = e.target.value;
    const supplier = supplierMap[String(supplierId)];
    setSelection((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || "",
      categoryId: "",
      categoryName: "",
      priority: "",
    }));
    setCategories([]);

    if (!supplierId) {
      return;
    }

    try {
      setLoadingCategories(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/categories/list-supplier-category?supplierId=${supplierId}`,
        { headers: { "Content-Type": "application/json" } },
      );

      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();
      const cats = data?.data || [];
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching supplier categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleaddPriority = () => {
    if (!selection.supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (!selection.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const numeric = Number(selection.priority);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      toast.error("Priority must be between 0 and 100");
      return;
    }

    const supplier = supplierMap[String(selection.supplierId)];
    const categoryName = categoryMap[String(selection.categoryId)];

    if (!supplier || !categoryName) {
      toast.error("Invalid supplier or category selection");
      return;
    }

    addPriorityMutation.mutate(
      {
        supplierId: String(selection.supplierId),
        supplierName: selection.supplierName,
        categoryId: String(selection.categoryId),
        categoryName,
        priorityNumber: numeric,
      },
      {
        onSuccess: () => {
          setSelection((prev) => ({ ...prev, priority: "" }));
          toast.success("Priority saved successfully");
          refetchPriorities();
        },
        onError: () => {
          toast.error("Failed to save priority");
        },
      },
    );
  };
  const sortedPriorities = useMemo(() => {
    return [...priorities].sort((a, b) => b.priority - a.priority);
  }, [priorities]);

  const handleRemovePriority = (row) => {
    if (window.confirm("Are you sure you want to remove this priority?")) {
      deletePriorityMutation.mutate(
        {
          id: row.id,
        },
        {
          onSuccess: () => {
            toast.success("Priority removed");
            refetchPriorities();
          },
          onError: () => {
            toast.error("Failed to remove priority");
          },
        },
      );
    }
  };

  const buildCsv = (rows) => {
    const headers = [
      "Supplier",
      "SupplierId",
      "Category",
      "CategoryId",
      "Priority",
    ];
    const escape = (val) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          escape(r.supplierName),
          escape(r.supplierId),
          escape(r.categoryName),
          escape(r.categoryId),
          escape(r.priority ?? ""),
        ].join(","),
      ),
    ];
    return lines.join("\n");
  };

  const downloadTemplate = () => {
    let rows = [];

    if (selection.supplierId && categories.length > 0) {
      const supplier = supplierMap[String(selection.supplierId)];
      if (!supplier) {
        toast.error("Selected supplier not found");
        return;
      }
      rows = categories.map((c) => {
        const id = String(c.groupId ?? c.id ?? c.categoryId);
        const name =
          c.groupName ?? c.name ?? c.categoryName ?? "Unnamed category";
        return {
          supplierName: supplier.name,
          supplierId: String(selection.supplierId),
          categoryName: name,
          categoryId: id,
          priority: "",
        };
      });
    }

    const csv = buildCsv(rows);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "priorities-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length === 0) {
          toast.error("Uploaded file is empty");
          return;
        }

        const header = lines[0].split(",");
        const idxSupplier = header.indexOf("Supplier");
        const idxSupplierId = header.indexOf("SupplierId");
        const idxCategory = header.indexOf("Category");
        const idxCategoryId = header.indexOf("CategoryId");
        const idxPriority = header.indexOf("Priority");

        if (
          idxSupplier === -1 ||
          idxSupplierId === -1 ||
          idxCategory === -1 ||
          idxCategoryId === -1 ||
          idxPriority === -1
        ) {
          toast.error("Invalid template headers in uploaded file");
          return;
        }

        const imported = [];

        for (let i = 1; i < lines.length; i += 1) {
          const raw = lines[i];
          if (!raw.trim()) continue;
          const cols = raw.split(",");
          const supplierId = cols[idxSupplierId]?.trim();
          const supplierName = cols[idxSupplier]?.trim();
          const categoryId = cols[idxCategoryId]?.trim();
          const categoryName = cols[idxCategory]?.trim();
          const priorityRaw = cols[idxPriority]?.trim();

          if (!supplierId || !categoryId) continue;
          if (!priorityRaw) continue;

          const numeric = Number(priorityRaw);
          if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
            continue;
          }

          imported.push({
            supplierId,
            supplierName,
            categoryId,
            categoryName,
            priority: numeric,
          });
        }

        if (!imported.length) {
          toast.error("No valid priority rows found in file");
          return;
        }

        bulkImportMutation.mutate(
          { items: imported },
          {
            onSuccess: () => {
              setPriorities((prev) => {
                const map = new Map(prev.map((p) => [p.key, p]));
                imported.forEach((row) => {
                  const key = `${row.supplierId}-${row.categoryId}`;
                  const supplier = supplierMap[String(row.supplierId)] || {};
                  map.set(key, {
                    key,
                    supplierId: String(row.supplierId),
                    supplierName: supplier.name || row.supplierName || "",
                    categoryId: String(row.categoryId),
                    categoryName: row.categoryName || "",
                    priority: row.priority,
                  });
                });
                return Array.from(map.values());
              });

              toast.success("Priorities imported successfully");
            },
            onError: () => {
              toast.error("Failed to import priorities");
            },
          },
        );
      } catch (err) {
        console.error("Error importing priorities:", err);
        toast.error("Failed to import priorities");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Supplier & Category Prioritisation
          </h1>
          <p className="text-xs text-gray-600">
            Select a supplier and category, assign a priority point (0–100), and
            build a list of priorities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={downloadTemplate}
          >
            Download Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleImportClick}
          >
            Import from File
          </Button>
        </div>
      </div>

      {/* Selection & Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="supplier"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Supplier
            </label>
            <select
              id="supplier"
              value={selection.supplierId}
              onChange={handleSupplierChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingSuppliers}
            >
              <option value="">Choose supplier…</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label
              htmlFor="category"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={selection.categoryId}
              onChange={(e) => {
                const id = e.target.value;
                const name = categoryMap[String(id)] || "";
                setSelection((prev) => ({
                  ...prev,
                  categoryId: id,
                  categoryName: name,
                }));
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selection.supplierId || loadingCategories}
            >
              <option value="">
                {loadingCategories ? "Loading categories…" : "Choose category…"}
              </option>
              {categories.map((c) => {
                const id = String(c.groupId ?? c.id ?? c.categoryId);
                const name =
                  c.groupName ?? c.name ?? c.categoryName ?? "Unnamed category";
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label
              htmlFor="priority"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Priority (0–100)
            </label>
            <input
              id="priority"
              type="number"
              min={0}
              max={100}
              value={selection.priority}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setSelection((prev) => ({ ...prev, priority: "" }));
                  return;
                }
                const num = Number(val);
                if (!Number.isFinite(num)) return;
                if (num < 0 || num > 100) return;
                setSelection((prev) => ({ ...prev, priority: val }));
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" onClick={handleaddPriority}>
            Add Priority
          </Button>
        </div>
      </div>

      {/* Priorities List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Priorities List
          </h2>
          <p className="text-xs text-gray-600">
            Total entries:{" "}
            <span className="font-semibold">{sortedPriorities.length}</span>
          </p>
        </div>

        {sortedPriorities.length === 0 ? (
          <p className="text-xs text-gray-500">
            No priorities added yet. Start by selecting a supplier, a category,
            and a priority value, then click Add.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    SN
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Supplier
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Priority
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPriorities.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={`border-b border-gray-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                      {row.supplierName}
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                      {row.categoryName}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-gray-900">
                      {row.priority}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePriority(row)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prioritisation;
