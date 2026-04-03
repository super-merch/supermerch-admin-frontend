import axios from "axios";

export const createEmailSetup = async (values) => {
    return await axios.post(
        `/api/email-setup`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmailSetup = async (_id) => {
    return await axios.delete(
        `/api/email-setup/${_id}`,
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

export const getEmailSetupById = async (_id) => {
    return await axios.get(
        `/api/email-setup/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmailSetup= async (_id, values) => {
    return await axios.put(
        `/api/email-setup/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllEmailSetup = async () => {
    return await axios.get(
        `/api/active/email-setup`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}
