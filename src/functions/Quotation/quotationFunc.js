import axios from "axios";

// User Quote Requests
export const getUserQuotes = async (params) => await axios.get("/api/quotes", { params });

// Admin Quotes
export const getAdminQuotes = async (params) => await axios.get("/api/admin-quotes", { params });
export const getAdminQuoteById = async (id) => await axios.get(`/api/admin-quotes/${id}`);
export const createAdminQuote = async (data) => await axios.post("/api/admin-quotes/create", data);
export const updateAdminQuote = async (id, data) => await axios.put(`/api/admin-quotes/${id}`, data);
export const deleteAdminQuote = async (id) => await axios.delete(`/api/admin-quotes/${id}`);
