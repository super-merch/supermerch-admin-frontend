import axios from "axios";

export const createServiceGroup = async (values) => {
    return await axios.post(
        `/api/auth/create/service-group`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteServiceGroup = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/service-group/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            validateStatus: function (status) {
                return status < 500;
            }
        }
    );
};

export const getServiceGroupById = async (_id) => {
    return await axios.get(
        `/api/auth/get/service-group/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateServiceGroup = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/service-group/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getServiceGroupList = async () => {
    return await axios.get(
        `/api/auth/list/service-group`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
