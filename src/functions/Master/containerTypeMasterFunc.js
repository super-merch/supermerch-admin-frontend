const axios = require("axios");

const createContainerType = async (values) => {
    return await axios.post(
        `/api/auth/create/containertype`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllContainerTypes = async () => {
    return await axios.get(
        `/api/auth/list/containertype`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateContainerType = async (id, values) => {
    return await axios.put(
        `/api/auth/update/containertype/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteContainerType = async (id) => {
    return await axios.delete(
        `/api/auth/delete/containertype/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getContainerTypeById = async (id) => {
    return await axios.get(
        `/api/auth/get/containertype/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createContainerType,
    getAllContainerTypes,
    updateContainerType,
    deleteContainerType,
    getContainerTypeById,
};
