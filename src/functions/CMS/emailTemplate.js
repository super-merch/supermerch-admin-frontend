import axios from "axios";

export const createEmailTemplate = async (values) => {
    return await axios.post(
        `/api/email-template`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmailTemplate = async (_id) => {
    return await axios.delete(
        `/api/email-template/${_id}`,
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

export const getEmailTemplateById = async (_id) => {
    return await axios.get(
        `/api/email-template/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmailTemplate= async (_id, values) => {
    return await axios.put(
        `/api/email-template/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
