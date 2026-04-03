import axios from "axios";

export const createEmployee = async (values) => {
    return await axios.post(
        `/api/auth/create/employee`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmployee = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/employee/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getEmployeeById = async (_id) => {
    return await axios.get(
        `/api/auth/get/employee/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmployee = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/employee/${_id}`,
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