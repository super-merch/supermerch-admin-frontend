import axios from "axios";

export const createEmployeeMaster = async (values) => {
    return await axios.post(
        `/api/auth/create/employee-master`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getEmployeeMaster = async (_id) => {
    return await axios.get(
        `/api/auth/getbyid/employee-master/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateEmployeeMaster = async (_id,values) => {
    return await axios.put(
        `/api/auth/update/employee-master/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteEmployeeMaster = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/employee-master/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};