import axios from "axios";

export const createCategory = async (values) => {
    return await axios.post(
      `/api/auth/create/categoryMaster`,
      values
    );
  };
  
  export const removeCategory = async (_id) => {
    return await axios.delete(
      `/api/auth/remove/categoryMaster/${_id}`
    );
  };
  
  export const listCategory = async () => {
    return await axios.get(
      `/api/auth/list/categoryMaster`
    );
  };
  
  
  export const updateCategory = async (_id, values) => {
    return await axios.put(
      `/api/auth/update/categoryMaster/${_id}`,
      values
    );
  };
  
  export const getCategory = async (_id) => {
    return await axios.get(
      `/api/auth/get/categoryMaster/${_id}`
    );
  };
  