import axios from "axios";

export const createAboutUsBanner = async (formData) => {
    return await axios.post(
        `/api/about-us-banners`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const deleteAboutUsBanner = async (_id) => {
    return await axios.delete(
        `/api/about-us-banners/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            validateStatus: function (status) {
                return status < 500;
            },
        }
    );
};

export const getAboutUsBannerById = async (_id) => {
    return await axios.get(
        `/api/about-us-banners/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateAboutUsBanner = async (_id, formData) => {
    return await axios.put(
        `/api/about-us-banners/${_id}`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const listAllAboutUsBanners = async () => {
    return await axios.get(
        `/api/about-us-banners/all/list`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
