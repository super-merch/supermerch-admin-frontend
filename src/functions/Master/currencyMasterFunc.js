import axios from "axios";

export const createCurrency = async (values) => {
    return await axios.post(
        `/api/auth/create/currency`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getCurrency = async (_id) => {
    return await axios.get(
        `/api/auth/get/currency/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateCurrency = async (_id,values) => {
    return await axios.put(
        `/api/auth/update/currency/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteCurrency = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/currency/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};