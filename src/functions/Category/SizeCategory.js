import axios from "axios";

export const createSizeMaster = async (values) => {
  return await axios.post(
    `/api/auth/create/size-category`,
    values
  );
};

export const removeSizeMaster = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/size-category/${_id}`
  );
};

export const listSizeMaster = async () => {
  return await axios.get(
    `/api/auth/list/size-category`
  );
};

export const updateSizeMaster = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/size-category/${_id}`,
    values
  );
};

export const getSizeMaster = async (_id) => {
  return await axios.get(
    `/api/auth/get/size-category/${_id}`
  );
};
