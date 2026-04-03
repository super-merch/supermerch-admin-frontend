import axios from "axios";

export const getGlobalMargin = async () => {
    return await axios.get("/api/product-margin/list-margin");
};
export const setGlobalMargin = async (data) => {
    return await axios.post("/api/product-margin/list-margin", data);
};
export const addSupplierMargin = async (data) => {
    return await axios.post("/api/product-margin/add-margin/supplier", data);
};
export const deleteSupplierMargin = async (data) => {
    return await axios.post("/api/product-margin/del-margin/supplier", data);
};
export const getSupplierMargins = async (params) => {
    return await axios.get("/api/product-margin/list-margin/supplier", { params });
};
export const addCategoryMargin = async (data) => {
    return await axios.post("/api/product-margin/add-category-margin/supplier", data);
};
export const getCategoryMargins = async (supplierId) => {
    return await axios.get(`/api/product-margin/get-category-margin/supplier`, { params: { supplierId } });
};
export const addProductMargin = async (data) => {
    return await axios.post("/api/product-margin/add-margin", data);
};
export const getProductMargin = async (productId) => {
    return await axios.get(`/api/product-margin/margin/${productId}`);
};
