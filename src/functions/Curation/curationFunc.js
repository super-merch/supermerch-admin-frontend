import axios from "axios";

// Trending
export const addTrending = async (data) => await axios.post("/api/trending/add-trending", data);
export const removeTrending = async (id) => await axios.delete(`/api/trending/remove-trending/${id}`);
export const getTrending = async (params) => await axios.get("/api/client-products-trending", { params });

// New Arrivals
export const addNewArrival = async (data) => await axios.post("/api/newArrival/add-newarrival", data);
export const removeNewArrival = async (id) => await axios.delete(`/api/newArrival/remove-newarrival/${id}`);
export const getNewArrivals = async (params) => await axios.get("/api/client-products-newArrival", { params });

// Best Sellers
export const addBestSeller = async (data) => await axios.post("/api/bestSeller/add-bestSeller", data);
export const removeBestSeller = async (id) => await axios.delete(`/api/bestSeller/remove-bestSeller/${id}`);
export const getBestSellers = async (params) => await axios.get("/api/client-products-bestSellers", { params });

// 24-Hour Production
export const add24Hour = async (data) => await axios.post("/api/24hour/add", data);
export const remove24Hour = async (id) => await axios.delete(`/api/24hour/remove/${id}`);
export const get24Hour = async (params) => await axios.get("/api/24hour/get-products", { params });

// Australia Made
export const addAustraliaMade = async (data) => await axios.post("/api/australia/add", data);
export const removeAustraliaMade = async (id) => await axios.delete(`/api/australia/remove/${id}`);
export const getAustraliaMade = async (params) => await axios.get("/api/australia/get-products", { params });

// Category Ordering
export const getCategoryOrder = async (params) => await axios.get("/api/prioritize/list", { params });
export const updateCategoryOrder = async (data) => await axios.post("/api/prioritize/update", data);

// Supplier Priority
export const getSupplierPriority = async (params) => await axios.get("/api/priority/list", { params });
export const updateSupplierPriority = async (data) => await axios.post("/api/priority/update", data);
export const importSupplierPriority = async (data) => await axios.post("/api/priority/import", data);
