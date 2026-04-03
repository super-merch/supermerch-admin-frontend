import axios from "axios";

export const createPackage = async (values) => {
    return await axios.post(
        `/api/auth/create/package`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deletePackage = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/package/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getPakcageById = async (_id) => {
    return await axios.get(
        `/api/auth/get/package/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updatePackage = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/package/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};