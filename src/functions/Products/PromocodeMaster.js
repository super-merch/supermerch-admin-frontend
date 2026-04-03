import axios from "axios";

export const createPromocodeMaster = async (values) => {
  return await axios.post(
    `/api/auth/create/PromocodeMaster`,
    values
  );
};

export const removePromocodeMaster = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/PromocodeMaster/${_id}`
  );
};

export const listPromocodeMaster = async () => {
  return await axios.get(
    `/api/auth/list/PromocodeMaster`
  );
};

export const updatePromocodeMaster = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/PromocodeMaster/${_id}`,
    values
  );
};

export const getPromocodeMaster = async (_id) => {
  return await axios.get(
    `/api/auth/get/PromocodeMaster/${_id}`
  );
};
