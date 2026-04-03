import axios from "axios";

export const createGeneralCMS = async (formData) => {
    return await axios.post(
        `/api/general-cms`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const deleteGeneralCMS = async (_id) => {
    return await axios.delete(
        `/api/general-cms/${_id}`,
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

export const getGeneralCMSById = async (_id) => {
    return await axios.get(
        `/api/general-cms/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateGeneralCMS = async (_id, formData) => {
    return await axios.put(
        `/api/general-cms/${_id}`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};
