import axios from "axios";

export const createClient = async (values) => {
    return await axios.post(
        `/api/auth/create/client`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteClient = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/client/${_id}`,
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

export const getClientById = async (_id) => {
    return await axios.get(
        `/api/auth/get/client/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateClient= async (_id, values) => {
    return await axios.put(
        `/api/auth/update/client/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllClients = async () => {
    return await axios.get(
        `/api/auth/list/client`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}
