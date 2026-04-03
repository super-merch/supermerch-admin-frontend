import axios from "axios";

export const createProductsDetails = async (values) => {
  return await axios.post(
    `/api/auth/create/product-details`,
    values
  );
};

export const removeProductsDetails = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/product-details/${_id}`
  );
};

export const listProductsDetails = async () => {
  return await axios.get(
    `/api/auth/list/product-details`
  );
};

export const updateProductsDetails = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/product-details/${_id}`,
    values
  );
};

export const getProductsDetails = async (_id) => {
  return await axios.get(
    `/api/auth/get/product-details/${_id}`
  );
};
