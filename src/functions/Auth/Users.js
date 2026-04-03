import axios from "axios";

export const createUsers = async (values) => {
    return await axios.post(
      `/api/auth/create/users`,
      values
    );
  };
  
  export const removeUsers = async (_id) => {
    return await axios.delete(
      `/api/auth/remove/users/${_id}`
    );
  };
  
  export const listUsers = async () => {
    return await axios.get(
      `/api/auth/list/users`
    );
  };
  
  
  export const updateUsers = async (_id, values) => {
    return await axios.put(
      `/api/auth/update/users/${_id}`,
      values
    );
  };
  
  export const getUsers = async (_id) => {
    return await axios.get(
      `/api/auth/get/users/${_id}`
    );
  };
  