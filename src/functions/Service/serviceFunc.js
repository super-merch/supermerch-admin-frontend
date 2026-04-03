import axios from "axios";

export const createService = async (values) => {
    return await axios.post(
        `/api/auth/create/service`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteService = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/service/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getServiceById = async (_id) => {
    return await axios.get(
        `/api/auth/get/service/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateService = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/service/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getServiceList = async () => {
    return await axios.get(
        `/api/auth/list/service`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getServiceGroupList = async () => {
    return await axios.get(
        `/api/auth/list/servicegroup`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listServiceByGroupId = async (serviceGroupId) => {
    return await axios.get(
        `/api/auth/list-by-group/service/${serviceGroupId}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listServiceByEquipmentTypeId = async (equipmentTypeId) => {
    return await axios.get(
        `/api/auth/list-by-equipment-type/service/${equipmentTypeId}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};