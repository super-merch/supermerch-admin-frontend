import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Download, RefreshCw } from 'lucide-react';

export default function SupplierCategories() {
  const { state: supplier } = useLocation();
  const [categories, setCategories] = useState([]); // active only
  const [deactivatedCategories, setDeactivated] = useState([]); // deactivated only
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData() }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([loadActive(), loadDeactivated()]);
    } finally {
      setLoading(false);
    }
  }

  function loadActive() {
    return fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/categories/list-supplier-category?supplierId=${supplier.id}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then(r => r.json())
    .then(json => setCategories(json.data || []));
  }

  async function loadDeactivated() {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/categories/list-activated-supplier-category?supplierId=${supplier.id}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    const resp = await response.json()
    console.log(resp)
  }

  async function deactivateCategory(cat) {
    setActionLoading(cat.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/categories/deactivate-supplier-category`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId: supplier.id,
            supplierName: supplier.name,
            categoryId: cat.id,
            categoryName: cat.name
          })
        }
      );
      
      if (response.ok) {
        // Move from active to deactivated lists
        setCategories(prev => prev.filter(c => c.groupId !== cat.id));
        setDeactivated(prev => [
          ...prev,
          { supplierId: supplier.id, categoryId: cat.id, categoryName: cat.name }
        ]);
        loadDeactivated()
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }
  
  async function activateCategory(cat) {
    setActionLoading(cat.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/categories/activate-supplier-category`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId: supplier.id,
            supplierName: supplier.name,
            categoryId: cat.id,
            categoryName: cat.name
          })
        }
      );
      
      if (response.ok) {
        // Move from deactivated to active lists
        setDeactivated(prev => prev.filter(x => x.categoryId !== cat.id));
        setCategories(prev => [
          ...prev,
          { groupId: cat.id, groupName: cat.name }
        ]);
        loadDeactivated()
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  // Create a unified list that maintains order and handles duplicates
  const allCategories = useMemo(() => {
    // Get deactivated categories for this supplier
    const deactivatedForSupplier = deactivatedCategories
      .filter(d => d.supplierId === supplier.id);
    
    // Create a Map to track all categories (active and deactivated)
    const categoryMap = new Map();
    
    // Add active categories
    categories.forEach(c => {
      if (c.groupId && c.groupName) {
        categoryMap.set(c.groupId, {
          id: c.groupId,
          name: c.groupName,
          isActive: true
        });
      }
    });
    
    // Add/update deactivated categories
    deactivatedForSupplier.forEach(d => {
      if (d.categoryId && d.categoryName) {
        categoryMap.set(d.categoryId, {
          id: d.categoryId,
          name: d.categoryName,
          isActive: false
        });
      }
    });
    
    // Convert map to array and sort by name
    return Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, deactivatedCategories, supplier.id]);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Supplier Categories</h1>
        <Button onClick={fetchData} disabled={loading} className="flex items-center gap-2">
          {loading
            ? <><RefreshCw className="animate-spin h-4 w-4" /> Refreshing</>
            : <><Download className="h-4 w-4" /> Fetch</>
          }
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allCategories.map((cat) => {
            const busy = actionLoading === cat.id;
            // Use unique key based on ID only since we're using a Map
            const uniqueKey = `category-${cat.id}`;
            
            return (
              <TableRow key={uniqueKey}>
                <TableCell>{cat.id}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    cat.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cat.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </TableCell>
                <TableCell>
                  {cat.isActive
                    ? <Button onClick={() => deactivateCategory(cat)} disabled={busy}>
                        {busy ? 'Deactivating…' : 'Deactivate'}
                      </Button>
                    : <Button onClick={() => activateCategory(cat)} disabled={busy}>
                        {busy ? 'Activating…' : 'Activate'}
                      </Button>
                  }
                </TableCell>
              </TableRow>
            );
          })}
          {allCategories.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}