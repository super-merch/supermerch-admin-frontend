import axios from "axios";
import { api } from "../config";

// default
axios.defaults.baseURL = api.API_URL;
// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

axios.defaults.validateStatus = function (status) {
  return true; // default
};

// Request interceptor: inject atoken header on every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aToken");
    if (token) {
      config.headers["atoken"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize Mongoose _id → id in API responses
const normalizeId = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeId);
  const result = { ...obj };
  if (result._id && !result.id) {
    result.id = result._id;
  }
  // Normalize nested arrays (e.g. data[].menus[])
  Object.keys(result).forEach((key) => {
    if (Array.isArray(result[key])) {
      result[key] = result[key].map(normalizeId);
    } else if (result[key] && typeof result[key] === "object" && result[key]._id) {
      result[key] = normalizeId(result[key]);
    }
  });
  return result;
};

// Response interceptor: handle auth expiry + normalize IDs
axios.interceptors.response.use(
  (response) => {
    // Auto-logout on auth failure
    if (
      response.data &&
      response.data.success === false &&
      response.data.message === "Not Authorized Login Again"
    ) {
      localStorage.removeItem("aToken");
      localStorage.removeItem("_id");
      window.location.replace("/");
    }
    // Normalize _id → id in response data
    if (response.data && response.data.data) {
      response.data.data = normalizeId(response.data.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Sets the default authorization (kept for backward compatibility)
 * @param {*} token
 */
const setAuthorization = (token) => {
  // Store as aToken for SM backend
  if (token) {
    localStorage.setItem("aToken", token);
  }
};

class APIClient {
  get = (url, params) => {
    let response;

    let paramKeys = [];

    if (params) {
      Object.keys(params).map((key) => {
        paramKeys.push(key + "=" + params[key]);
        return paramKeys;
      });

      const queryString =
        paramKeys && paramKeys.length ? paramKeys.join("&") : "";
      response = axios.get(`${url}?${queryString}`, params);
    } else {
      response = axios.get(`${url}`, params);
    }

    return response;
  };

  create = (url, data) => {
    return axios.post(url, data);
  };

  update = (url, data) => {
    return axios.patch(url, data);
  };

  put = (url, data) => {
    return axios.put(url, data);
  };

  delete = (url, config) => {
    return axios.delete(url, { ...config });
  };
}

const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export { APIClient, setAuthorization, getLoggedinUser };
