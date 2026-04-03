import axios from "axios";

export const createEmailFor = async (values) => {
    return await axios.post(
        `/api/email-for`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmailFor = async (_id) => {
    return await axios.delete(
        `/api/email-for/${_id}`,
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

export const getEmailForById = async (_id) => {
    return await axios.get(
        `/api/email-for/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmailFor= async (_id, values) => {
    return await axios.put(
        `/api/email-for/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllEmailFor = async () => {
    return await axios.get(
        `/api/active/email-for`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}
