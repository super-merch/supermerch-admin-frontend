import axios from "axios";

export const createOpenPO = async (values) => {
    return await axios.post(
        `/api/auth/create/open-po`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );
};

export const deleteOpenPO = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/open-po/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            validateStatus: function (status) {
                return status < 500;
            },
        }
    );
};

export const getOpenPOById = async (_id) => {
    return await axios.get(
        `/api/auth/get/open-po/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateOpenPO= async (_id, values) => {
    return await axios.put(
        `/api/auth/update/open-po/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );
};