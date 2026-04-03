import axios from "axios";

export const createDesignation = async (values) => {
    return await axios.post(
        `/api/auth/create/designation`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getDesignation = async (_id) => {
    return await axios.get(
        `/api/auth/getbyid/designation/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateDesignation = async (_id,values) => {
    return await axios.put(
        `/api/auth/update/designation/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteDesignation = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/designation/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};