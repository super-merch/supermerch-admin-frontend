import axios from "axios";

export const createSOP = async (values) => {
    return await axios.post(
        `/api/auth/create/sop`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const deleteSOP = async (_id) => {
    return await axios.delete(
        `/api/auth/delete/sop/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            validateStatus: function (status) {
                return status < 500;
            }
        }
    );
};

export const getSOPById = async (_id) => {
    return await axios.get(
        `/api/auth/get/sop/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateSOP = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/sop/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// export const getServiceGroupList = async () => {
//     return await axios.get(
//         `/api/auth/list/service-group`,
//         {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//         }
//     );
// };
