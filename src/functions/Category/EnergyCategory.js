import axios from "axios";

export const createEnergyMaster = async (values) => {
  return await axios.post(
    `/api/auth/create/energy-category`,
    values
  );
};

export const removeEnergyMaster = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/energy-category/${_id}`
  );
};

export const listEnergyMaster = async () => {
  return await axios.get(
    `/api/auth/list/energy-category`
  );
};

export const updateEnergyMaster = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/energy-category/${_id}`,
    values
  );
};

export const getEnergyMaster = async (_id) => {
  return await axios.get(
    `/api/auth/get/energy-category/${_id}`
  );
};
