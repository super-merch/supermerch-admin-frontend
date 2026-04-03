import axios from "axios";

export const createCountry = async (values) => {
    return await axios.post(
        `/api/country`,
        values,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listCountry = async () => {
    return await axios.get(
        `/api/country`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const removeCountry = async (_id) => {
    return await axios.delete(
        `/api/country/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const removeAndUpdateCountry = async (_id) => {
    return await axios.put(
        `/api/auth/location/country/${_id}`
    );
};

export const updateCountry = async (_id, values) => {
    return await axios.put(
        `/api/country/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getCountry = async (_id) => {
    return await axios.get(
        `/api/country/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// ////////////////////////////////////////STATE//////////////////////////////

export const createState = async (values) => {
    return await axios.post(
        `/api/state`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getStateByCountry = async (_id) => {
    return await axios.get(
        `/api/states/by-country/${_id}`
    );
};

export const removeState = async (_id) => {
    return await axios.delete(
        `/api/state/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const listState = async () => {
    return await axios.get(
        `/api/states`
    );
};

export const removeAndUpdatState = async (_id) => {
    return await axios.put(
        `/api/auth/location/state/${_id}`
    );
};

export const updateState = async (_id, values) => {
    return await axios.put(
        `/api/state/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getState = async (_id) => {
    return await axios.get(
        `/api/state/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// ////////////////////////////////////////CITY//////////////////////////////

export const createCity = async (values) => {
    return await axios.post(
        `/api/city`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getCityByState = async (_id) => {
  return await axios.get(
      `/api/cities/by-state/${_id}`
  );
};


export const listCity = async () => {
    return await axios.get(
        `/api/cities`
    );
};

export const removeCity = async (_id) => {
    return await axios.delete(
        `/api/city/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const removeAndUpdateCity = async (_id) => {
    return await axios.put(
        `/api/auth/location/city/${_id}`
    );
};

export const getCity = async (_id) => {
    return await axios.get(
        `/api/city/${_id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const updateCity = async (_id, values) => {
    return await axios.put(
        `/api/city/${_id}`,
        values,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

// LOCATION

export const getLocation = async () => {
    return await axios.get(
        `/api/list/location`
        ,{
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};