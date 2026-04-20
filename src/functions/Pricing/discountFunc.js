import axios from "axios";

export const getGlobalDiscount = async () => {
    return await axios.get("/api/add-discount/list-discount");
};
export const setGlobalDiscount = async (data) => {
    return await axios.post("/api/add-discount/add-discount", data);
};
export const addSupplierDiscount = async (data) => {
    return await axios.post("/api/add-discount/add-supplier-discounts", data);
};
export const getSupplierDiscounts = async (params) => {
    return await axios.get("/api/add-discount/list-supplier-discounts", { params });
};
export const getProductDiscount = async (productId) => {
    return await axios.get(`/api/add-discount/discounts/${productId}`);
};
export const addProductDiscount = async (data) => {
    return await axios.post("/api/add-discount/add-discount", data);
};
