import axios from "axios";

export const createBlogsComment = async (values) => {
    return await axios.post(
      `/api/auth/create/blogsComment`,
      values
    );
  };
  
  export const removeBlogsComment = async (_id) => {
    return await axios.delete(
      `/api/auth/remove/blogsComment/${_id}`
    );
  };
  
  export const listBlogsComment= async () => {
    return await axios.get(
      `/api/auth/list/blogsComment`
    );
  };
  
  
  export const updateBlogsComment= async (_id, values) => {
    return await axios.put(
      `/api/auth/update/blogsComment/${_id}`,
      values
    );
  };
  
  export const getBlogsComment= async (_id) => {
    return await axios.get(
      `/api/auth/get/blogsComment/${_id}`
    );
  };
  