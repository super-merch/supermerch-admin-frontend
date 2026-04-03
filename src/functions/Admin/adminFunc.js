import axios from "axios";

export const getCompany = async (_id) => {
    return await axios.get(
        `/api/auth/get/company-master/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateCompany = async (_id,data) => {
    return await axios.put(
        `/api/auth/update/company-master/${_id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}

export const updateCompanyImages = async (_id,data) => {
    return await axios.put(
        `/api/auth/upload-images/company-details/${_id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );
}

export const deleteCompanyImages = async (_id,data) => {
    return await axios.delete(
        `/api/auth/delete-images/company-details/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: data
        }
    );
}
