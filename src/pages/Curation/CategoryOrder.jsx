import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/button";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const METAL_PENS_PRESET = [
  { productId: "1621", position: 1, note: "Concorde Pen - $0.90, 8 colours (cheapest)" },
  { productId: "1574", position: 2, note: "Napier Pen - $1.42, 11 colours, laser engrave" },
  { productId: "2383", position: 3, note: "Panama Pen - $1.44, 12 colours" },
  { productId: "43676", position: 4, note: "Toledo Pen - $1.76, 13 colours (widest range)" },
  { productId: "13643", position: 5, note: "Edison Pen - $2.10, laser engrave, 33 photos" },
];

const CategoryOrder = () => {
  const [categoryId, setCategoryId] = useState("PY-06");
  const [rows, setRows] = useState(
    METAL_PENS_PRESET.map((p) => ({ productId: p.productId, position: p.position, note: p.note }))
  );
  const [pinning, setPinning] = useState(false);
  const [pinned, setPinned] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);

  const fetchPinned = async (catId) => {
    if (!catId) return;
    setLoadingPinned(true);
    try {
      const res = await axios.get(backendUrl + "/api/prioritize/list", {
        params: { categoryId: catId },
      });
      const data = res.data?.data;
      setPinned(Array.isArray(data?.productIds) ? data.productIds : []);
    } catch {
      setPinned([]);
    } finally {
      setLoadingPinned(false);
    }
  };

  const updateRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const addRow = () =>
    setRows((prev) => [...prev, { productId: "", position: prev.length + 1, note: "" }]);

  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handlePin = async () => {
    if (!categoryId.trim()) { toast.error("Enter a Category ID"); return; }
    const valid = rows.filter((r) => r.productId.trim() && Number(r.position) > 0);
    if (!valid.length) { toast.error("Add at least one product ID with a position"); return; }
    setPinning(true);
    let ok = 0, fail = 0;
    for (const row of valid) {
      try {
        const res = await axios.post(backendUrl + "/api/prioritize/update", {
          categoryId: categoryId.trim(),
          productId: row.productId.trim(),
          position: Number(row.position),
        });
        if (res.data?.success) ok++; else fail++;
      } catch { fail++; }
    }
    setPinning(false);
    if (ok) toast.success(ok + " product" + (ok > 1 ? "s" : "") + " pinned");
    if (fail) toast.error(fail + " failed");
    if (ok) fetchPinned(categoryId);
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Category Order - Pin Products</h1>
      <p className="text-xs text-gray-600 mb-4">Pinned products appear at the top before the general sort. Position 1 = first result.</p>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
        <div className="mb-3 flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category ID</label>
            <input type="text" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} onBlur={() => fetchPinned(categoryId)} placeholder="e.g. PY-06" className="rounded border border-gray-200 px-3 py-2 text-sm w-36" />
          </div>
          <p className="text-xs text-gray-500 pb-1">PY-06 = Metal Pens | PY-11 = Plastic Pens | PY-12 = Stylus Pens</p>
        </div>
        <table className="min-w-full text-sm mb-3 border border-gray-200 rounded">
          <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left text-xs w-20">Position</th><th className="px-3 py-2 text-left text-xs w-36">Product ID</th><th className="px-3 py-2 text-left text-xs">Note</th><th className="px-3 py-2 w-16"></th></tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-1"><input type="number" min={1} value={row.position} onChange={(e) => updateRow(i, "position", e.target.value)} className="w-14 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                <td className="px-3 py-1"><input type="text" value={row.productId} onChange={(e) => updateRow(i, "productId", e.target.value)} placeholder="e.g. 1621" className="w-28 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                <td className="px-3 py-1 text-xs text-gray-500">{row.note}</td>
                <td className="px-3 py-1 text-center"><button type="button" onClick={() => removeRow(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>+ Add Row</Button>
          <Button size="sm" onClick={handlePin} disabled={pinning}>{pinning ? "Pinning..." : "Pin " + rows.filter((r) => r.productId).length + " Products"}</Button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Currently Pinned - {categoryId || "..."}</h2>
          <button type="button" onClick={() => fetchPinned(categoryId)} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
        {loadingPinned ? <p className="text-xs text-gray-500">Loading...</p> : pinned.length === 0 ? <p className="text-xs text-gray-500">No products pinned yet. Pin some above and click Refresh.</p> : (
          <ol className="list-decimal list-inside space-y-1">{pinned.map((id, i) => <li key={i} className="text-sm text-gray-800">Product ID: <span className="font-mono font-semibold">{id}</span></li>)}</ol>
        )}
      </div>
    </div>
  );
};

export default CategoryOrder;
