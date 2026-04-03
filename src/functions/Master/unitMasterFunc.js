const axios = require("axios");

const createUnit = async (values) => {
    return await axios.post(
        `/api/auth/create/unit`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllUnits = async () => {
    return await axios.get(
        `/api/auth/list/unit`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateUnit = async (id, values) => {
    return await axios.put(
        `/api/auth/update/unit/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteUnit = async (id) => {
    return await axios.delete(
        `/api/auth/delete/unit/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getUnitById = async (id) => {
    return await axios.get(
        `/api/auth/get/unit/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createUnit,
    getAllUnits,
    updateUnit,
    deleteUnit,
    getUnitById,
};
