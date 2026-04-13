import axios from "axios";

// FAQ API functions
export const createFAQ = async (data) => {
    return await axios.post(
        `/api/faq`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getFAQById = async (_id) => {
    return await axios.get(
        `/api/faq/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateFAQ = async (_id, data) => {
    return await axios.put(
        `/api/faq/${_id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteFAQ = async (_id) => {
    return await axios.delete(
        `/api/faq/${_id}`,
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

export const getFAQList = async (page = 1, limit = 100, search = "") => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);
    
    return await axios.get(
        `/api/faqs?${params}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
