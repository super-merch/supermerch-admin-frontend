import axios from "axios";

// PromoContent API functions
export const createPromoContent = async (data) => {
    return await axios.post(
        `/api/promo-content`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getPromoContentById = async (_id) => {
    return await axios.get(
        `/api/promo-content/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updatePromoContent = async (_id, data) => {
    return await axios.put(
        `/api/promo-content/${_id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deletePromoContent = async (_id) => {
    return await axios.delete(
        `/api/promo-content/${_id}`,
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

export const getPromoContentList = async (page = 1, limit = 100, search = "") => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);
    
    return await axios.get(
        `/api/promo-contents?${params}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
