import axios from "axios";

export const createBranch = async (values) => {
    return await axios.post(
        `/api/auth/create/branch`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteBranch = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/branch/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getBranchById = async (_id) => {
    return await axios.get(
        `/api/auth/get/branch/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateBranch= async (_id, values) => {
    return await axios.put(
        `/api/auth/update/branch/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllBranches = async () => {
    return await axios.get(
        `/api/auth/list/branch`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}
