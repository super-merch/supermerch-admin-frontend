const axios = require("axios");

const createBuyer = async (values) => {
    return await axios.post(
        `/api/auth/create/buyer`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllBuyers = async () => {
    return await axios.get(
        `/api/auth/list/buyer`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateBuyer = async (id, values) => {
    return await axios.put(
        `/api/auth/update/buyer/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteBuyer = async (id) => {
    return await axios.delete(
        `/api/auth/delete/buyer/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getBuyerById = async (id) => {
    return await axios.get(
        `/api/auth/get/buyer/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createBuyer,
    getAllBuyers,
    updateBuyer,
    deleteBuyer,
    getBuyerById,
};
