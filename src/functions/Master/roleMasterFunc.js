const axios = require("axios");

export const createRole = async (values) => {
    return await axios.post(
        `/api/role`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getAllRoles = async (params) => {
    return await axios.get(
        `/api/roles`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            params: {
                ...params,
            },
        }
    );
};

export const updateRole = async (id, values) => {
    return await axios.put(
        `/api/role/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const removeRole = async (id) => {
    return await axios.delete(
        `/api/role/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getRole = async (id) => {
    return await axios.get(
        `/api/role/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
