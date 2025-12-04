import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backednUrl = import.meta.env.VITE_BACKEND_URL;

  const [users, setUsers] = useState([]);
  const [ignoredProductIds, setIgnoredProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [allProductLoading, setAllProductLoading] = useState(true);
  const [unseenMessages, setUnseenMessages] = useState(0);
  const [userOrders, setUserOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [prodLength, setProdLength] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [orderCount, setOrderCount] = useState({});
  const [userStats, setUserStats] = useState({
    deliveredOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    totalOrders: 0,
    pages: 1,
  });

  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : false
  );

  const [showPopup, setShowPopup] = useState(false);

  const [quoteData, setQuoteData] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [blogs, setBlogs] = useState([]);
  const [totalBlogs, setTotalBlogs] = useState(0);

  useEffect(() => {
    if (aToken) {
      localStorage.setItem("aToken", aToken);
    } else {
      localStorage.removeItem("aToken");
    }
  }, [aToken]);

  const fetchSupplierProductNumber = async (supplier) => {
    setAllProductLoading(true);

    try {
      const response = await fetch(
        `${backednUrl}/api/client-products?filter=false&page=1&limit=1&supplier=${supplier}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }
      return data.item_count;
    } catch (err) {
      console.log(err.message);
    } finally {
      setAllProductLoading(false);
    }
  };

  const [arrivalProducts, setArrivalProducts] = useState([]);
  const fetchNewArrivalProduct = async (page = 1, sort = "", limit) => {
    try {
      if (!limit) limit = 100; // Default to 100 if limit is not provided
      const response = await fetch(
        `${backednUrl}/api/client-products-newArrival?page=${page}&limit=${limit}&sort=${sort}?filter=true`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      // Validate response structure if needed
      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setArrivalProducts(data.data);
      // Uncomment if total_pages is needed
      // setTotalPages(data.total_pages);
      return data.data;
    } catch (err) {
      toast.error(err.message);
    }
  };
  const [bestSellerProducts, setBestSellerProducts] = useState([]);

  const fetchBestSellerProduct = async (page = 1, sort = "", limit) => {
    try {
      if (!limit) limit = 100; // Default to 100 if limit is not provided
      const response = await fetch(
        `${backednUrl}/api/client-products-bestSellers?page=${page}&limit=${limit}&sort=${sort}?filter=true`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      // Validate response structure if needed
      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setBestSellerProducts(data.data);
      // Uncomment if total_pages is needed
      // setTotalPages(data.total_pages);
      return data.data;
    } catch (err) {
      console.log(err.message);
    }
  };

  const [searchedProducts, setSearchedProducts] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add this function to your AdminContext

  const fetchSearchedProducts = async (
    searchTerm,
    categpryId,
    myLimit,
    supplierId
  ) => {
    setSearchLoading(true);
    try {
      // Set limit to 100 to get maximum products for admin, no pagination needed
      const limit = myLimit || 100;
      const response = await fetch(
        supplierId
          ? `${backednUrl}/api/client-product/category/search?searchTerm=${searchTerm}&page=1&limit=${limit}&filter=false&categoryId=${categpryId}&supplierId=${supplierId}`
          : `${backednUrl}/api/client-product/category/search?searchTerm=${searchTerm}&page=1&limit=${limit}&filter=false&categoryId=${categpryId}`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      // Validate response structure
      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setSearchedProducts(data); // Store the full response object
      return data;
    } catch (err) {
      console.log(err.message);
      throw err; // Re-throw so the component can handle it
    } finally {
      setSearchLoading(false);
    }
  };

  const [supplierLoading, setSupplierLoading] = useState(false);

  const [suppliersPagination, setSuppliersPagination] = useState(null);
  const [supplierCount, setSupplierCount] = useState(0);

  const fetchSuppliers = async (page = 1, limit, tag) => {
    setSupplierLoading(true);

    try {
      const response = await fetch(
        `${backednUrl}/api/supplier-products?page=${page}&limit=${limit || 15}${
          tag ? `&tag=${tag}` : ""
        }`
      );
      if (!response.ok) throw new Error("Failed to fetch Suppliers");

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setSuppliers(data.data);
      setSupplierCount(data.item_count);

      // Set pagination info from API response
      setSuppliersPagination({
        currentPage: data.page,
        totalPages: Math.ceil(data.item_count / 15),
        totalSuppliers: data.item_count,
        itemsPerPage: data.items_per_page || 15,
        hasNextPage: data.page < Math.ceil(data.item_count / 15),
        hasPrevPage: data.page > 1,
      });

      return data.data;
    } catch (err) {
      console.log(err.message);
    } finally {
      setSupplierLoading(false);
    }
  };
  const [deactiveSuppliers, setDeactiveSuppliers] = useState(0);
  const deactivateSuppliers = async () => {
    try {
      const response = await fetch(`${backednUrl}/api/ignored-suppliers`);
      if (!response.ok) throw new Error("Failed to fetch Suppliers");

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setDeactiveSuppliers(data.item_count);
    } catch (err) {
      console.log(err.message);
    }
  };
  const getLogo = async (id) => {
    try {
      const response = await fetch(`${backednUrl}/api/checkout/get-logo/${id}`);
      if (!response.ok) throw new Error("Failed to fetch Suppliers");

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }
      return data.data;
    } catch (err) {
      console.log(err.message);
    }
  };

  const [usersPagination, setUsersPagination] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: filters.searchTerm || "",
        sortBy: filters.sortBy || "createdAt",
        sortOrder: filters.sortOrder || "desc",
        orderMonth: filters.orderMonth ? filters.orderMonth : null,
        orderYear: filters.orderYear ? filters.orderYear : null,
        orderAmountMin: filters.orderAmountMin ? filters.orderAmountMin : null,
        orderAmountMax: filters.orderAmountMax ? filters.orderAmountMax : null,
        orderCountMin: filters.orderCountMin ? filters.orderCountMin : null,
        orderCountMax: filters.orderCountMax ? filters.orderCountMax : null,
      };

      const response = await axios.get(`${backednUrl}/api/auth/users`, {
        headers: { aToken },
        params,
      });

      setUsers(response.data.data);
      setUsersPagination(response.data.pagination || null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("User not found");
      setLoading(false);
      if (error.response.data.message == "Not Authorized Login Again") {
        const handleLogout = () => {
          localStorage.removeItem("aToken");
          setAToken("");
          navigate("/login");
          setShowPopup(false); // Close the popup after logout
        };
        handleLogout();
      }
    }
  };
  const getSingleUser = async (id) => {
    try {
      const response = await axios.get(
        `${backednUrl}/api/auth/single-user/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to fetch user");
    }
  };
  const [pagination, setPagination] = useState(null);
  const fetchUserOrders = async (id, page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/checkout/user-order/${id}?page=${page}&limit=${limit}`,
        { headers: { aToken } }
      );

      setUserOrders(response.data.orders);
      setUserStats({
        deliveredOrders: response.data.delivered,
        pendingOrders: response.data.pending,
        totalSpent: response.data.totalSpent,
        totalOrders: response.data.total,
        pages: response.data.pages,
      });
    } catch (error) {
      console.error("Error fetching user's orders:", error);
      toast.error("Not a registered user");
    }
  };
  const fetchOrders = async (id = "", page = 1, filters = {}, limit) => {
    setLoading(true);
    try {
      const url = id
        ? `${backednUrl}/api/checkout/products/${id}`
        : `${backednUrl}/api/checkout/products`;

      const params = id
        ? {}
        : {
            page,
            limit: 10,
            search: filters.searchTerm || "",
            status: filters.filterStatus || "All",
            date: filters.filterDate || "",
            sortBy: filters.sortBy || "orderDate",
            sortOrder: filters.sortOrder || "desc",
          };

      const response = await axios.get(url, {
        headers: { aToken },
        params,
      });

      setOrders(response.data.data);
      setOrderCount({
        total: response.data.pagination.totalOrders,
        pending: response.data.pendingOrders,
        cancelled: response.data.cancelledOrders,
        delivered: response.data.deliveredOrders,
      });

      setPagination(response.data.pagination || null);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
      setLoading(false);
    }
  };
  // Add these to your AdminContext or API service
  const addOrderComment = async (orderId, comment) => {
    try {
      const response = await fetch(`${backednUrl}/api/comments/add-comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // your auth token
        },
        body: JSON.stringify({
          OrderId: orderId,
          comments: comment,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Comment added successfully");
        return { success: true, data };
      }
      return { success: false };
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return { success: false };
    }
  };
  const deleteOrderComment = async (orderId, commentIndex,orderComments) => {
    try {
      const updatedComments = orderComments?.comments.filter(
        (_, index) => index !== commentIndex
      );

      if (updatedComments.length === 0) {
        // Delete the entire document if no comments left
        const deleteResponse = await fetch(
          `${backednUrl}/api/comments/delete-comment/${orderId}`,
          {
            method: "DELETE",
          }
        );

        if (deleteResponse.ok) {
          toast.success("Comment deleted successfully");
          return { success: true, data: null };
        }
      } else {
        // Update with remaining comments
        const updateResponse = await fetch(
          `${backednUrl}/api/comments/update-comment/${orderId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ comments: updatedComments }),
          }
        );

        if (updateResponse.ok) {
          toast.success("Comment deleted successfully");
          return {
            success: true,
            data: {  comments: updatedComments },
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
      return { success: false };
    }
  };

  const updateOrderComment = async (orderId, comments) => {
    try {
      const response = await fetch(
        `${backednUrl}/api/comments/update-comment/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comments }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Comment updated successfully");
        return { success: true, data };
      }
      return { success: false };
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
      return { success: false };
    }
  };

  const getOrderComments = async (orderId) => {
    try {
      const response = await fetch(
        `${backednUrl}/api/comments/get-comment/${orderId}`
      );
      if (response.status === 404) {
        return { success: true, data: null };
      }
      const data = await response.json();
      if (response.ok) {
        return { success: true, data };
      }
      return { success: false };
    } catch (error) {
      console.error("Error fetching comments:", error);
      return { success: false };
    }
  };

  const updateOrder = async (orderId, orderData) => {
    try {
      const response = await axios.put(
        `${backednUrl}/api/checkout/checkout/${orderId}`,
        orderData,
        {
          headers: { aToken },
        }
      );

      if (response.data.success) {
        // Update the local orders state with the updated order
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
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
  const [paramProducts, setParamProducts] = useState([]);
  const [paramLoading, setParamLoading] = useState(false);
  const [totalApiPages, setTotalApiPages] = useState(0);
  const fetchProducts = async (page = 1, limit = 25, supplier, category) => {
    setAllProductLoading(true);
    try {
      const response = await fetch(
        `${backednUrl}/api/client-products?filter=false&page=${page}&limit=${limit}${
          supplier ? `&supplier=${supplier}` : ""
        }${category ? `&product_type_ids=${category}` : ""}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setProducts(data.data);
      if (data.ignoredProductIds) {
        setIgnoredProductIds(new Set(data.ignoredProductIds));
      }
      setProdLength(data.item_count);
      const pages = Math.ceil(data.item_count / limit);
      setTotalApiPages(pages);
      return data;
    } catch (err) {
      console.log(err.message);
    } finally {
      setAllProductLoading(false);
    }
  };
  const [trendingProducts, setTrendingProducts] = useState([]);
  const fetchTrendingProduct = async (page = 1, limit = 25, supplier) => {
    try {
      const response = await fetch(
        `${backednUrl}/api/client-products-trending?page=${page}&limit=${limit}&filter=true${
          supplier ? `&supplier=${supplier}` : ""
        }`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setTrendingProducts(data.data);
      const pages = Math.ceil(data.item_count / limit);
      setTotalApiPages(pages);
      return data;
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchParamProducts = async (
    categoryId,
    page = 1,
    supplierId = null,
    limit = 25
  ) => {
    setParamLoading(true);
    try {
      const response = await fetch(
        supplierId
          ? `${backednUrl}/api/params-products?product_type_ids=${categoryId}&supplier_id=${supplierId}&items_per_page=${limit}&page=${page}`
          : `${backednUrl}/api/params-products?product_type_ids=${categoryId}&items_per_page=${limit}&page=${page}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }

      setParamProducts(data);
      setTotalApiPages(data.total_pages);
      return data;
    } catch (err) {
      console.log(err.message);
    } finally {
      setParamLoading(false);
    }
  };

  const fetchSearchedProduct = async (
    searchTerm,
    sortOption,
    supplier,
    category,
    page = 1,
    limit = 25
  ) => {
    setSearchLoading(true);
    try {
      let url = `${backednUrl}/api/client-products/search?searchTerm=${searchTerm}&page=${page}&limit=${limit}&filter=false${
        supplier ? `&supplier=${supplier}` : ""
      }${category ? `&product_type_ids=${category}` : ""}`;

      if (sortOption === "australia") {
        url = `${backednUrl}/api/australia/get-products?search=${searchTerm}&page=${page}&limit=${limit}&filter=false${
          supplier ? `&supplier=${supplier}` : ""
        }${category ? `&product_type_ids=${category}` : ""}`;
      }
      if (sortOption === "24hrProducts") {
        url = `${backednUrl}/api/24hour/get-products?search=${searchTerm}&page=${page}&limit=${limit}&filter=false${
          supplier ? `&supplier=${supplier}` : ""
        }${category ? `&product_type_ids=${category}` : ""}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Unexpected API response structure");
      }
      console.log(data);
      setSearchedProducts(data);

      setTotalApiPages(data.total_pages);
      return data;
    } catch (err) {
      console.log(err.message);
      throw err;
    } finally {
      setSearchLoading(false);
    }
  };

  //delete order
  const [deleteLoading, setDeleteLoading] = useState({}); // Object instead of boolean

  const deleteOrder = async (_id) => {
    // Set loading for specific order
    setDeleteLoading((prev) => ({ ...prev, [_id]: true }));

    try {
      const response = await axios.delete(
        `${backednUrl}/api/checkout/delete/${_id}`,
        {
          headers: { aToken },
        }
      );

      if (response.data.success) {
        toast.success("Order deleted successfully!");
        await fetchOrders();
      } else {
        toast.error(response.data.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        `Failed to delete order: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      // Clear loading for specific order
      setDeleteLoading((prev) => {
        const newState = { ...prev };
        delete newState[_id];
        return newState;
      });
    }
  };
  const [categories, setCategories] = useState([]);
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${backednUrl}/api/v1-categories`, {
        headers: { aToken },
      });
      setCategories(response.data.data);
      return response.data;
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };
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

  const fetchBlogs = async (page, searchTerm) => {
    try {
      const { data } = await axios.get(
        `${backednUrl}/api/blogs/get-blogs${page && `?page=${page}`}${
          searchTerm && `&search=${searchTerm}`
        }`
      );
      setBlogs(data.blogs); // Note: updated to access data.blogs
      setTotalBlogs(data.totalBlogs);
      return {
        total: data.totalBlogs,
        totalPages: data.totalPages,
        searchedBlogs: data.searchedBlogs || 0,
      };
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };
  const [quotesPagination, setQuotesPagination] = useState(null);
  const listQuotes = async (page = 1, filters = {}) => {
    setQuoteLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: filters.searchTerm || "",
        sortBy: filters.sortBy || "createdAt",
        sortOrder: filters.sortOrder || "desc",
      };

      const { data } = await axios.get(
        `${backednUrl}/api/checkout/list-quote`,
        {
          headers: { aToken },
          params,
        }
      );

      if (data.success) {
        setQuoteData(data.quotes);
        setQuotesPagination(data.pagination || null);
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
  const sendNote = async (
    note,
    email,
    user,
    billingAddress,
    shippingAddress,
    products
  ) => {
    try {
      if (!note || note.length <= 10) {
        toast.error("Note must be at least 10 characters long");
        return;
      }
      const response = await axios.post(
        `${backednUrl}/api/checkout/send-note`,
        { note, email, user, billingAddress, shippingAddress, products }
      );
      const data = response.data;
      if (data.success) {
        toast.success(data.message);
        return true;
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const orderPending = orders.filter((order) => order.status === "Pending");
  const orderCompleted = orders.filter((order) => order.status === "Complete");
  const fetchAustraliaProducts = async (page, limit, supplier, category) => {
    try {
      const response = await axios.get(
        `${backednUrl}/api/australia/get-products?page=${page || 1}&limit=${
          limit || 25
        }${supplier && `&supplier=${supplier}`}${
          category && `&product_type_ids=${category}`
        }`
      );
      const pages = Math.ceil(response.data.item_count / limit);
      setTotalApiPages(pages);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };
  const fetchProductionProducts = async (page, limit, supplier, category) => {
    try {
      const response = await axios.get(
        `${backednUrl}/api/24hour/get-products?page=${page || 1}&limit=${
          limit || 25
        }${supplier && `&supplier=${supplier}`}${
          category && `&product_type_ids=${category}`
        }`
      );
      const pages = Math.ceil(response.data.item_count / limit);
      setTotalApiPages(pages);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (aToken) {
      fetchUsers();
      fetchOrders();
      fetchProducts();
      fetchSuppliers();
      deactivateSuppliers();
      fetchBlogs(1);
      listQuotes();
    }
  }, [aToken]);
  const value = {
    users,
    setUsers,
    loading,
    fetchUsers,
    setLoading,
    suppliersPagination,
    fetchSupplierProductNumber,
    sendNote,
    orders,
    supplierLoading,
    fetchOrders,
    deleteOrderComment,
    updateOrderStatus,
    fetchProductionProducts,
    aToken,
    getLogo,
    setAToken,
    fetchUserOrders,
    userOrders,
    orderPending,
    orderCompleted,
    usersPagination,
    fetchProducts,
    products,
    fetchSuppliers,
    supplierCount,
    deactiveSuppliers,
    suppliers,
    deleteOrder,
    setSuppliers,
    fetchAustraliaProducts,
    addOrderComment,
    updateOrderComment,
    getOrderComments,
    getSingleUser,
    setProducts,
    deleteLoading,
    backednUrl,
    allProductLoading,
    showPopup,
    prodLength,
    setShowPopup,
    fetchSearchedProducts, // Add this
    searchedProducts,
    fetchSearchedProduct, // Add this
    searchLoading,
    blogs,
    totalBlogs,
    setBlogs,
    fetchBlogs,
    userStats,
    listQuotes,
    totalApiPages,
    paramLoading,
    quoteData,
    setParamProducts,
    setQuoteData,
    quoteLoading,
    pagination,
    setQuoteLoading,
    updateOrder,
    fetchTrendingProduct,
    setOrderCount,
    orderCount,
    trendingProducts,
    fetchBestSellerProduct,
    bestSellerProducts,
    fetchNewArrivalProduct,
    arrivalProducts,
    setAllProductLoading,
    quotesPagination,
    categories,
    fetchCategories,
    paramProducts,
    fetchParamProducts,
    setUnseenMessages,
    unseenMessages,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
