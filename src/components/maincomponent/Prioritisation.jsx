import React, { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { Button } from "../ui/button";

const criteriaConfig = [
  { key: "pictures", label: "Pictures Count" },
  { key: "description", label: "Description Quality" },
  { key: "stock", label: "Stock Items" },
  { key: "manual", label: "Manual" },
  { key: "other", label: "Other" },
];

const Prioritisation = () => {
  const { fetchSuppliers, suppliers } = useContext(AdminContext);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [categories, setCategories] = useState([]);
  const [scores, setScores] = useState({});
  const [categoryIndex, setCategoryIndex] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const supplierMap = useMemo(() => {
    const map = {};
    (suppliers || []).forEach((s) => {
      map[String(s.id)] = s;
    });
    return map;
  }, [suppliers]);

  // Load suppliers on first visit if not already loaded
  useEffect(() => {
    const loadSuppliers = async () => {
      if (suppliers && suppliers.length > 0) return;
      try {
        setLoadingSuppliers(true);
        await fetchSuppliers(1, 100);
      } catch (error) {
        console.error("Error fetching suppliers for prioritisation:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliers();
  }, [fetchSuppliers, suppliers]);

  const handleSupplierChange = async (e) => {
    const supplierId = e.target.value;
    setSelectedSupplierId(supplierId);
    setCategories([]);
    setShowSummary(false);

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

      // Initialize scores and metadata for this supplier's categories
      setScores((prev) => {
        const next = { ...prev };
        cats.forEach((cat) => {
          const catId = String(cat.groupId ?? cat.id ?? cat.categoryId);
          const compoundId = `${supplierId}-${catId}`;
          if (!next[compoundId]) {
            next[compoundId] = {};
          }
        });
        return next;
      });

      setCategoryIndex((prev) => {
        const next = { ...prev };
        cats.forEach((cat) => {
          const catId = String(cat.groupId ?? cat.id ?? cat.categoryId);
          const compoundId = `${supplierId}-${catId}`;
          if (!next[compoundId]) {
            next[compoundId] = {
              supplierId: String(supplierId),
              supplierName: supplierMap[String(supplierId)]?.name || "",
              categoryId: catId,
              categoryName:
                cat.groupName ??
                cat.name ??
                cat.categoryName ??
                "Unnamed category",
            };
          }
        });
        return next;
      });
    } catch (error) {
      console.error("Error fetching supplier categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleScoreChange = (categoryId, key, value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      setScores((prev) => {
        const next = { ...prev };
        const id = String(categoryId);
        next[id] = {
          ...(next[id] || {}),
          [key]: value === "" ? "" : 0,
        };
        return next;
      });
      return;
    }

    setScores((prev) => {
      const next = { ...prev };
      const id = String(categoryId);
      next[id] = {
        ...(next[id] || {}),
        [key]: numeric,
      };
      return next;
    });
  };

  const rows = useMemo(() => {
    return categories.map((cat) => {
      const catId = String(cat.groupId ?? cat.id ?? cat.categoryId);
      const compoundId = `${selectedSupplierId}-${catId}`;
      const rowScores = scores[compoundId] || {};
      const total = criteriaConfig.reduce((sum, c) => {
        const val = Number(rowScores[c.key]);
        return sum + (Number.isFinite(val) ? val : 0);
      }, 0);

      return {
        id: compoundId,
        name:
          cat.groupName ?? cat.name ?? cat.categoryName ?? "Unnamed category",
        scores: rowScores,
        total,
      };
    });
  }, [categories, scores, selectedSupplierId]);

  const summaryRows = useMemo(() => {
    const entries = Object.entries(scores || {});

    const list = entries
      .map(([compoundId, rowScores]) => {
        const meta = categoryIndex[compoundId];
        if (!meta) return null;

        const total = criteriaConfig.reduce((sum, c) => {
          const val = Number(rowScores?.[c.key]);
          return sum + (Number.isFinite(val) ? val : 0);
        }, 0);

        return {
          id: compoundId,
          supplierId: meta.supplierId,
          supplierName:
            meta.supplierName || supplierMap[meta.supplierId]?.name || "",
          categoryId: meta.categoryId,
          categoryName: meta.categoryName,
          scores: rowScores,
          total,
        };
      })
      .filter(Boolean);

    list.sort((a, b) => b.total - a.total);
    return list;
  }, [scores, categoryIndex, supplierMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Supplier Category Prioritisation
          </h1>
          <p className="text-xs text-gray-600">
            Score each category per supplier to calculate its prioritisation
            points.
          </p>
        </div>
        <Button
          variant={showSummary ? "outline" : "default"}
          size="sm"
          onClick={() => {
            if (!summaryRows.length) {
              toast.error("No prioritisation data to show yet.");
              return;
            }
            setShowSummary((prev) => !prev);
          }}
        >
          {showSummary ? "Back to Scoring" : "See Prioritisation Table"}
        </Button>
      </div>

      {!showSummary && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1">
                <label
                  htmlFor="supplier"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Select supplier
                </label>
                <select
                  id="supplier"
                  value={selectedSupplierId}
                  onChange={handleSupplierChange}
                  className="w-full sm:w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {selectedSupplierId && (
                <p className="text-xs text-gray-600">
                  Categories loaded:{" "}
                  <span className="font-semibold">{categories.length}</span>
                </p>
              )}
            </div>
          </div>

          {!selectedSupplierId ? (
            <div className="bg-white rounded-lg shadow-sm border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Select a supplier to view and score its categories.
            </div>
          ) : loadingCategories ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-500">
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-500">
              No categories found for the selected supplier.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      SN
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      Category
                    </th>
                    {criteriaConfig.map((c) => (
                      <th
                        key={c.key}
                        className="px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                        {row.name}
                      </td>
                      {criteriaConfig.map((c) => (
                        <td key={c.key} className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={row.scores?.[c.key] ?? ""}
                            onChange={(e) =>
                              handleScoreChange(row.id, c.key, e.target.value)
                            }
                            className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-semibold text-gray-900">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Overall Prioritisation Table
            </h2>
            <p className="text-xs text-gray-600">
              Total scored rows:{" "}
              <span className="font-semibold">{summaryRows.length}</span>
            </p>
          </div>
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
                {criteriaConfig.map((c) => (
                  <th
                    key={c.key}
                    className="px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                  Total Points
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                    {row.supplierName || row.supplierId}
                  </td>
                  <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                    {row.categoryName}
                  </td>
                  {criteriaConfig.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-center">
                      {row.scores?.[c.key] ?? 0}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-semibold text-gray-900">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Prioritisation;
