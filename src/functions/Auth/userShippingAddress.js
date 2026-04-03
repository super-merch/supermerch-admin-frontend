import axios from "axios";

export const getUserShippingAddress = async (_id) => {
  return await axios.get(
    `/api/auth/get/userShippingAddress/${_id}`
  );
};
