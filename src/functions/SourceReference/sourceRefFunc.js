import axios from "axios";

export const createSourceReference = async (values) => {
    return await axios.post(
        `/api/auth/create/source-reference`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteSourceReference = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/source-reference/${_id}`,
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

export const getSourceReferenceById = async (_id) => {
    return await axios.get(
        `/api/auth/get/source-reference/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateSourceReference = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/source-reference/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getSourceReferenceList = async () => {
    return await axios.get(
        `/api/auth/list/source-reference`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
