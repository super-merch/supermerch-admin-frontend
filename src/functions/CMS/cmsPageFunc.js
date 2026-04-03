import axios from "axios";

export const createCMSPage = async (data) => {
    return await axios.post(`/api/cms-page`, data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
};

export const deleteCMSPage = async (_id) => {
    return await axios.delete(`/api/cms-page/${_id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        validateStatus: function (status) {
            return status < 500;
        },
    });
};

export const getCMSPageById = async (_id) => {
    return await axios.get(`/api/cms-page/${_id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
};

export const updateCMSPage = async (_id, data) => {
    return await axios.put(`/api/cms-page/${_id}`, data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
};
