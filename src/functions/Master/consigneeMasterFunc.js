const axios = require("axios");

const createConsignee = async (values) => {
    return await axios.post(
        `/api/auth/create/consignee`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllConsignees = async () => {
    return await axios.get(
        `/api/auth/list/consignee`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateConsignee = async (id, values) => {
    return await axios.put(
        `/api/auth/update/consignee/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteConsignee = async (id) => {
    return await axios.delete(
        `/api/auth/delete/consignee/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getConsigneeById = async (id) => {
    return await axios.get(
        `/api/auth/get/consignee/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createConsignee,
    getAllConsignees,
    updateConsignee,
    deleteConsignee,
    getConsigneeById,
};
