import axios from "axios";

// Search countries with pagination and search
export const searchCountries = async (searchValue = "", page = 1, limit = 10) => {
    try {
        const response = await axios.get(`/api/country`, {
            params: {
                search: searchValue,
                page,
                limit,
                isActive: true
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error searching countries:", error);
        throw error;
    }
};

// Search states by country with pagination and search
export const searchStatesByCountry = async (countryId, searchValue = "", page = 1, limit = 10,) => {
    try {
        const response = await axios.get(`/api/states/by-country/${countryId}`, {
            params: {
                search: searchValue,
                page,
                limit,
                isActive: true
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error searching states:", error);
        throw error;
    }
};

// Search cities by state with pagination and search
export const searchCitiesByState = async (stateId, searchValue = "", page = 1, limit = 10) => {
    try {
        const response = await axios.get(`/api/cities/by-state/${stateId}`, {
            params: {
                search: searchValue,
                page,
                limit,
                isActive: true
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error searching cities:", error);
        throw error;
    }
};