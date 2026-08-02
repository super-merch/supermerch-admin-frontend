import axios from "axios";

// User Quote Requests (submitted from SuperMerch frontend via "Express Quote")
export const getUserQuotes = async (params) => await axios.get("/api/checkout/list-quote", { params });
export const markUserQuoteResponded = async (id) =>
  await axios.patch(`/api/checkout/quote/${id}/respond`);

// Admin Quotes
export const getAdminQuotes = async (params) => await axios.get("/api/admin-quotes", { params });
export const getAdminQuoteById = async (id) => await axios.get(`/api/admin-quotes/${id}`);
export const createAdminQuote = async (data) => await axios.post("/api/admin-quotes/create", data);
export const updateAdminQuote = async (id, data) => await axios.put(`/api/admin-quotes/${id}`, data);
export const deleteAdminQuote = async (id) => await axios.delete(`/api/admin-quotes/${id}`);
