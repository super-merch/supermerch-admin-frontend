import axios from "axios";

export const createBlogs = async (values) => {
  return await axios.post(
    `/api/auth/create/blogs`,
    values
  );
};

export const removeBlogs = async (_id) => {
  return await axios.delete(
    `/api/auth/remove/blogs/${_id}`
  );
};

export const listBlogs = async () => {
  return await axios.get(
    `/api/auth/list/blogs`
  );
};

export const updateBlogs = async (_id, values) => {
  return await axios.put(
    `/api/auth/update/blogs/${_id}`,
    values
  );
};

export const getBlogs = async (_id) => {
  return await axios.get(
    `/api/auth/get/blogs/${_id}`
  );
};

export const uploadImage = async (body) => {
  return await axios.post(
    `/api/auth/cms-blog/image-upload`,
    body
  );
};
