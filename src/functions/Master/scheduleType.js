const axios = require("axios");

const createScheduleType = async (values) => {
    return await axios.post(
        `/api/auth/create/schedule-type`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getAllScheduleTypes = async () => {
    return await axios.get(
        `/api/auth/list/schedule-type`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const updateScheduleType = async (id, values) => {
    return await axios.put(
        `/api/auth/update/schedule-type/${id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const deleteScheduleType = async (id) => {
    return await axios.delete(
        `/api/auth/delete/schedule-type/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

const getScheduleTypeById = async (id) => {
    return await axios.get(
        `/api/auth/get/schedule-type/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

module.exports = {
    createScheduleType,
    getAllScheduleTypes,
    updateScheduleType,
    deleteScheduleType,
    getScheduleTypeById,
};
