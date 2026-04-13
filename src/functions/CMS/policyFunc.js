import axios from "axios";

// Policy API functions
export const createPolicy = async (data) => {
    return await axios.post(
        `/api/policy`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getPolicyById = async (_id) => {
    return await axios.get(
        `/api/policy/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updatePolicy = async (_id, data) => {
    return await axios.put(
        `/api/policy/${_id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deletePolicy = async (_id) => {
    return await axios.delete(
        `/api/policy/${_id}`,
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

export const getPolicyList = async (page = 1, limit = 100, search = "") => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);
    
    return await axios.get(
        `/api/policies?${params}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
