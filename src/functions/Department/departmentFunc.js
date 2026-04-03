import axios from "axios";

export const createDepartment = async (values) => {
    return await axios.post(
        `/api/auth/create/department`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteDepartment = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/department/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getDepartmentById = async (_id) => {
    return await axios.get(
        `/api/auth/get/department/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateDepartment = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/department/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllDepartments = async () => {
    return await axios.get(
        `/api/auth/list/department`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}