const axios = require("axios");

const createEquipmentMaster = async (values) => {
    return await axios.post(
        `/api/auth/create/equipment-type-master`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllEquipmentMasters = async () => {
    return await axios.get(
        `/api/auth/list/equipment-type-master`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateEquipmentMaster = async (id, values) => {
    return await axios.put(
        `/api/auth/update/equipment-type-master/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteEquipmentMaster = async (id) => {
    return await axios.delete(
        `/api/auth/delete/equipment-type-master/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getEquipmentMasterById = async (id) => {
    return await axios.get(
        `/api/auth/get/equipment-type-master/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllEquipmentTypesList = async () => {
    return await axios.get(
    `/api/auth/list/equipment-type-master`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    )
};

module.exports = {
    createEquipmentMaster,
    updateEquipmentMaster,
    getAllEquipmentMasters,
    deleteEquipmentMaster,
    getEquipmentMasterById,
    getAllEquipmentTypesList,
};
