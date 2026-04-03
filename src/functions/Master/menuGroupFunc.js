const axios = require("axios");

const createMenuGroup = async (values) => {
    return await axios.post(
        `/api/menugroup`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllMenuGroups = async () => {
    return await axios.get(
        `/api/menugroups`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateMenuGroup = async (id, values) => {
    return await axios.put(
        `/api/menugroup/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteMenuGroup = async (id) => {
    return await axios.delete(
        `/api/menugroup/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getMenuGroupById = async (id) => {
    return await axios.get(
        `/api/menugroup/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createMenuGroup,
    getAllMenuGroups,
    updateMenuGroup,
    deleteMenuGroup,
    getMenuGroupById,
};
