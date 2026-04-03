import axios from "axios";

export const createServiceFrequency = async (values) => {
    return await axios.post(
        `/api/auth/create/service-frequency`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteServiceFrequency = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/service-frequency/${_id}`,
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

export const getServiceFrequencyById = async (_id) => {
    return await axios.get(
        `/api/auth/get/service-frequency/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateServiceFrequency = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/service-frequency/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getServiceFrequencyList = async () => {
    return await axios.get(
        `/api/auth/list/service-frequency`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};