import axios from "axios";

export const createEmployeeTypeMaster = async (values) => {
    return await axios.post(
        `/api/auth/create/employee-type-master`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getEmployeeTypeMaster = async (_id) => {
    return await axios.get(
        `/api/auth/get/employee-type-master/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmployeeTypeMaster = async (_id,values) => {
    return await axios.put(
        `/api/auth/update/employee-type-master/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmployeeTypeMaster = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/employee-type-master/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listAllEmployeeTypes = async () => {
    return await axios.get(
        `/api/auth/list/employee-type-master`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};