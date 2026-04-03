import axios from "axios";

export const createPackageGroup = async (values) => {
    return await axios.post(
        `/api/auth/create/package-group`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deletePackageGroup = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/package-group/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getPackageGroup = async (_id) => {
    return await axios.get(
        `/api/auth/get/package-group/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updatePackageGroup = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/package-group/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};