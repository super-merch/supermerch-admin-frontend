import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useState } from "react";
import { useEffect } from "react";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backednUrl = import.meta.env.VITE_BACKEND_URL;

  const [users, setUsers] = useState([]);
  const [ignoredProductIds, setIgnoredProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [allProductLoading, setAllProductLoading] = useState(true);
  const [userOrders, setUserOrders] = useState([]);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [prodLength, setProdLength] = useState(0);
  const [suppliers, setSuppliers] = useState([]);

  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : false
  );

  const [showPopup, setShowPopup] = useState(false);

  const [quoteData, setQuoteData] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    if (aToken) {
      localStorage.setItem("aToken", aToken);
    } else {
      localStorage.removeItem("aToken");
    }
  }, [aToken]);

  // client api
  const fetchProducts = async (page = 1) => {
  setAllProductLoading(true);

  try {
    const response = await fetch(
      `${backednUrl}/api/client-products?filter=false&page=${page}&limit=50`
    );
    if (!response.ok) throw new Error("Failed to fetch products");

    const data = await response.json();

    if (!data || !data.data) {
      throw new Error("Unexpected API response structure");
    }

    // If it's page 1, replace products. Otherwise, append to existing products.
    if (page === 1) {
      setProducts(data.data);
    } else {
      setProducts(prevProducts => [...prevProducts, ...data.data]);
    }

    // Set ignored product IDs if they exist in the response
    if (data.ignoredProductIds) {
      setIgnoredProductIds(new Set(data.ignoredProductIds));
    }
    setProdLength(data.item_count)
  } catch (err) {
    setError(err.message);
  } finally {
    setAllProductLoading(false);
  }
};

  const [searchedProducts, setSearchedProducts] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add this function to your AdminContext

  const fetchSearchedProducts = async (searchTerm) => {
    setSearchLoading(true);
    try {
      // Set limit to 100 to get maximum products for admin, no pagination needed
      const limit = 100;
      const response = await fetch(
        `${backednUrl}/api/client-products/search?searchTerm=${searchTerm}&page=1&limit=${limit}&filter=false`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      // Validate response structure
      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setSearchedProducts(data); // Store the full response object
      console.log("Search results:", data);

      return data;
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw so the component can handle it
    } finally {
      setSearchLoading(false);
    }
  };
    const [supplierLoading, setSupplierLoading] = useState(false);

  const fetchSuppliers = async () => {
    setSupplierLoading(true);
    try {
      const response = await fetch(`${backednUrl}/api/supplier-products`);
      if (!response.ok) throw new Error("Failed to fetch Suppliers");

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setSuppliers(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSupplierLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${backednUrl}/api/auth/users`, {
        headers: { aToken },
      });
      setUsers(response.data.reverse());
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };
  const [pagination, setPagination] = useState(null);
  const fetchUserOrders = async (id) => {
    try {
      // 1) fetch exactly as fetchOrders does
      const response = await axios.get(`${backednUrl}/api/checkout/products`, {
        headers: { aToken },
      });

      // 2) pick out the array, reverse it if you want most‑recent first
      const all = response.data.data.reverse();

      // 3) filter by the correct key—userId
      const filtered = all.filter(
        (order) => String(order.userId) === String(id)
      );

      setUserOrders(filtered);
    } catch (error) {
      console.error("Error fetching user's orders:", error);
      toast.error("Failed to fetch user's orders");
    }
  };

  const fetchOrders = async (id = "", page = 1, filters = {},limit) => {
  setLoading(true);
  try {
    const url = id
      ? `${backednUrl}/api/checkout/products/${id}`
      : `${backednUrl}/api/checkout/products`;
    
    const params = id ? {} : {
      page,
      limit: 15,
      search: filters.searchTerm || '',
      status: filters.filterStatus || 'All',
      date: filters.filterDate || '',
      sortBy: filters.sortBy || 'orderDate',
      sortOrder: filters.sortOrder || 'desc'
    };

    const response = await axios.get(url, { 
      headers: { aToken },
      params 
    });
    
    setOrders(response.data.data);
    setPagination(response.data.pagination || null);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching orders:", error);
    toast.error("Failed to fetch orders");
    setLoading(false);
  }
};

const updateOrder = async (orderId, orderData) => {
  try {
    const response = await axios.put(
      `${backednUrl}/api/checkout/checkout/${orderId}`,
      orderData,
      {
        headers: { aToken }
      }
    );
    
    if (response.data.success) {
      // Update the local orders state with the updated order
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? response.data.data : order
        )
      );
      return response.data;
    }
    return response.data;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

  //delete order
  const [deleteLoading, setDeleteLoading] = useState({}); // Object instead of boolean

const deleteOrder = async(_id) => {
  // Set loading for specific order
  setDeleteLoading(prev => ({ ...prev, [_id]: true }));
  
  try {
    const response = await axios.delete(`${backednUrl}/api/checkout/delete/${_id}`, {
      headers: { aToken }
    });
    
    if (response.data.success) {
      toast.success("Order deleted successfully!");
      await fetchOrders();
    } else {
      toast.error(response.data.message || "Failed to delete order");
    }
  } catch (error) {
    console.error('Delete error:', error);
    toast.error(`Failed to delete order: ${error.response?.data?.message || error.message}`);
  } finally {
    // Clear loading for specific order
    setDeleteLoading(prev => {
      const newState = { ...prev };
      delete newState[_id];
      return newState;
    });
  }
}
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (!aToken) {
        toast.error("Authorization aToken is missing");
        return;
      }
      const response = await axios.put(
        `${backednUrl}/api/checkout/status/${orderId}`,
        { status: newStatus },
        { headers: { aToken } }
      );
      if (response.data.success) {
        await fetchOrders();
        toast.success("Order status updated successfully!");
      } else {
        toast.error(
          "Failed to update order status (Backend did not return success)"
        );
      }
    } catch (error) {
      console.error(
        "Error updating order status:",
        error.response?.data || error.message
      );
      toast.error(
        "Failed to update order status: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get(`${backednUrl}/api/blogs/get-blogs`);
      setBlogs(data);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const listQuotes = async () => {
    setQuoteLoading(true);
    try {
      const { data } = await axios.get(
        `${backednUrl}/api/checkout/list-quote`,
        { headers: { aToken } }
      );
      if (data.success) {
        setQuoteData(data.quotes.reverse());
      } else {
        toast.error(data?.error);
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error?.response?.data.message || error.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const orderPending = orders.filter((order) => order.status === "Pending");
  const orderCompleted = orders.filter((order) => order.status === "Complete");

  useEffect(() => {
    if (aToken) {
      fetchUsers();
      fetchOrders();
      fetchProducts();
      fetchSuppliers();
      fetchBlogs();
      listQuotes();
    }
  }, [aToken]);
  const value = {
    users,
    setUsers,
    loading,
    fetchUsers,
    setLoading,
    orders,
    supplierLoading,
    fetchOrders,
    updateOrderStatus,
    aToken,
    setAToken,
    fetchUserOrders,
    userOrders,
    orderPending,
    orderCompleted,
    fetchProducts,
    products,
    fetchSuppliers,
    suppliers,
    deleteOrder,
    setProducts,
    deleteLoading,
    backednUrl,
    allProductLoading,
    showPopup,
    prodLength,
    setShowPopup,
    fetchSearchedProducts,  // Add this
    searchedProducts,       // Add this
    searchLoading,
    blogs,
    setBlogs,
    fetchBlogs,
    listQuotes,
    quoteData,
    setQuoteData,
    quoteLoading,
    pagination,
    setQuoteLoading,
    updateOrder,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
