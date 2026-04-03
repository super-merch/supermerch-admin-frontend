import axios from "axios";

// Create Product
export const createProduct = async (productData) => {
  return await axios.post(`/api/auth/create/product`, productData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
}

// Get Product by ID
export const getProduct = async (id) => {
  return await axios.get(`/api/auth/get/product/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// Update Product
export const updateProduct = async (id, productData) => {
  return await axios.put(`/api/auth/update/product/${id}`, productData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// Remove Product
export const removeProduct = async (id) => {
  return await axios.delete(`/api/auth/delete/product/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// List Products by parameters
export const listProductsByParams = async (params) => {
  return await axios.post(`/api/auth/list/product`, params, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
}

// Get all active Products (for dropdowns)
export const getAllActiveProducts = async () => {
  return await axios.get(`/api/auth/list/product`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};
