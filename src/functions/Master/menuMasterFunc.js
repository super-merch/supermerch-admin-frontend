const axios = require("axios");

const createMenuMaster = async (data) => {
    // Map the data to match the new API structure
    const menuData = {
        menuName: data.menuName,
        menugroupId: data.menuGroup, // Map to menugroupId
        url: data.menuUrl, // Map to url
        sequence: data.sequence,
        isActive: data.isActive,
        isParent: data.isParent || false,
        parentMenuId: data.parentMenu || null // Map to parentMenuId
    };
    
    return await axios.post(
        `/api/menu`,
        menuData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllMenuMasters = async () => {
    return await axios.get(
        `/api/menu`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateMenuMaster = async (id, data) => {
    // Map the data to match the new API structure
    const menuData = {
        menuName: data.menuName,
        menugroupId: data.menuGroup, // Map to menugroupId
        url: data.menuUrl, // Map to url
        sequence: data.sequence,
        isActive: data.isActive,
        isParent: data.isParent || false,
        parentMenuId: data.parentMenu || null // Map to parentMenuId
    };
    
    return await axios.put(
        `/api/menu/${id}`,
        menuData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteMenuMaster = async (id) => {
    return await axios.delete(
        `/api/menu/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getMenuMasterById = async (data) => {
    return await axios.get(
        `/api/menu/${data}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createMenuMaster,
    getAllMenuMasters,
    updateMenuMaster,
    deleteMenuMaster,
    getMenuMasterById,
};
