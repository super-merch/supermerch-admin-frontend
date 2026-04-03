import axios from "axios";

export const searchPromodataSuppliers = async (params) => {
    return await axios.post("/api/supplier/search", params);
};
export const listLocalSuppliers = async (params) => {
    return await axios.get("/api/supplier-products", { params });
};
export const ignoreSupplier = async (data) => {
    return await axios.post("/api/ignore-supplier", data);
};
export const unignoreSupplier = async (data) => {
    return await axios.post("/api/unignore-supplier", data);
};
export const getIgnoredSuppliers = async (params) => {
    return await axios.get("/api/ignored-suppliers", { params });
};
export const ignoreProduct = async (data) => {
    return await axios.post("/api/ignore-product", data);
};
export const unignoreProduct = async (data) => {
    return await axios.post("/api/unignore-product", data);
};
export const getIgnoredProducts = async (params) => {
    return await axios.get("/api/ignored-products", { params });
};
export const getSupplierCategories = async (params) => {
    return await axios.get("/api/category-products", { params });
};
