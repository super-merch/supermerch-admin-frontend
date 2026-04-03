import axios from "axios";

export const createCompanyLocation = async (values) => {
    return await axios.post(
      `/api/auth/create/company-locations`,
      values
    );
  };
  
  export const removeCompanyLocation = async (_id) => {
    return await axios.delete(
      `/api/auth/remove/company-locations/${_id}`
    );
  };
  
  export const listCompanyLocation = async () => {
    return await axios.get(
      `/api/auth/list/company-locations`
    );
  };
  
  
  export const updateCompanyLocation = async (_id, values) => {
    return await axios.put(
      `/api/auth/update/company-locations/${_id}`,
      values
    );
  };
  
  export const getCompanyLocation = async (_id) => {
    return await axios.get(
      `/api/auth/get/company-locations/${_id}`
    );
  };

  export const findCompanyLocation = async (_id, country, city) => {
    return await axios.get(
      `/api/auth/find/company-locations/${country}/${city}`
    );
  };
  