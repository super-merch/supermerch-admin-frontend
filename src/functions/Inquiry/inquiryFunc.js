import axios from "axios";

export const listInquiries = async () => {
    return await axios.get(
        `/api/auth/list/inquiry`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// export const deleteCurrencyMaster = async (_id) => {
//     return await axios.delete(
//         `/api/auth/delete/currency-master/${_id}`,
//         {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//         }
//     );
// };

// export const getCurrencyMasterById = async (_id) => {
//     return await axios.get(
//         `/api/auth/get/currency-master/${_id}`,
//         {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//         }
//     );
// };

export const changeInquiryStatus = async (_id, values) => {
    return await axios.put(
        `/api/auth/update/inquiry/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// export const getCurrencyByCompanyId = async (companyId) => {
//     return await axios.get(
//         `/api/auth/list/currency-master/${companyId}`,
//         {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//         }
//     );
// }