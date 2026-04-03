import axios from "axios";

export const getUserBillingAddress = async (_id) => {
  return await axios.get(
    `/api/auth/get/userBillingAddress/${_id}`
  );
};
