import axios from "axios";

export const createGrindCategoryMaster = async (values) => {
    return await axios.post(
      `/api/auth/create/grindMaster`,
      values
    );
  };
  
  export const removeGrindCategoryMaster = async (_id) => {
    return await axios.delete(
      `/api/auth/remove/grindMaster/${_id}`
    );
  };
  
  export const listGrindCategoryMaster = async () => {
    return await axios.get(
      `/api/auth/list/grindMaster`
    );
  };
  
  
  export const updateGrindCategoryMaster = async (_id, values) => {
    return await axios.put(
      `/api/auth/update/grindMaster/${_id}`,
      values
    );
  };
  
  export const getGrindCategoryMaster = async (_id) => {
    return await axios.get(
      `/api/auth/get/grindMaster/${_id}`
    );
  };
  