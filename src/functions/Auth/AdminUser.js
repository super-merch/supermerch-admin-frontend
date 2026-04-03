import axios from "axios";

export const createAdminUser = async (values) => {
    return await axios.post(
        `/api/auth/create/adminUser`,
        values
    );
};

export const removeAdminUser = async (_id) => {
    return await axios.delete(
        `/api/auth/remove/adminUser/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAdminUser = async () => {
    return await axios.get(
        `/api/auth/list/adminUser`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateAdminUser = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/adminUser/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        },
        values
    );
};

export const getAdminUser = async (_id) => {
    return await axios.get(
        `/api/auth/get/adminUser/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
