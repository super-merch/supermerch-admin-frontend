const axios = require("axios");

const createShipper = async (values) => {
    return await axios.post(
        `/api/auth/create/shipper`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllShippers = async () => {
    return await axios.get(
        `/api/auth/list/shipper`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateShipper = async (id, values) => {
    return await axios.put(
        `/api/auth/update/shipper/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteShipper = async (id) => {
    return await axios.delete(
        `/api/auth/delete/shipper/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getShipperById = async (id) => {
    return await axios.get(
        `/api/auth/get/shipper/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createShipper,
    getAllShippers,
    updateShipper,
    deleteShipper,
    getShipperById,
};
