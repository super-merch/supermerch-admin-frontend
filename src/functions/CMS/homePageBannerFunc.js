import axios from "axios";

export const createHomePageBanner = async (formData) => {
    return await axios.post(
        `/api/home-page-banners`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const deleteHomePageBanner = async (_id) => {
    return await axios.delete(
        `/api/home-page-banners/${_id}`,
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

export const getHomePageBannerById = async (_id) => {
    return await axios.get(
        `/api/home-page-banners/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateHomePageBanner = async (_id, formData) => {
    return await axios.put(
        `/api/home-page-banners/${_id}`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const listAllHomePageBanners = async () => {
    return await axios.get(
        `/api/home-page-banners/all/list`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
