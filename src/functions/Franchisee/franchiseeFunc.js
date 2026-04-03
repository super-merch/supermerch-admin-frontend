import axios from "axios";

export const createFranchisee = async (values) => {
    return await axios.post(
        `/api/auth/create/franchisee`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteFranchisee = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/franchisee/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getFranchiseeById = async (_id) => {
    return await axios.get(
        `/api/auth/get/franchisee/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateFranchisee = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/franchisee/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};