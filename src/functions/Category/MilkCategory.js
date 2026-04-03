import axios from "axios";

export const createMilkCategory = async (values) => {
  return await axios.post(
    `/api/auth/create/milk-category`,
    values
  );
};

export const removeMilkCategory = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/milk-category/${_id}`
  );
};

export const listMilkCategory = async () => {
  return await axios.get(
    `/api/auth/list/milk-category`
  );
};

export const updateMilkCategory = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/milk-category/${_id}`,
    values
  );
};

export const getMilkCategory = async (_id) => {
  return await axios.get(
    `/api/auth/get/milk-category/${_id}`
  );
};
