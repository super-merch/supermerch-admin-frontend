import axios from "axios";

// Create Sales Confirmation
export const createSalesConfirmation = async (salesConfirmationData) => {
  return await axios.post(
    `/api/auth/create/salesconfirmation`,
    salesConfirmationData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};

// Get Sales Confirmation by ID
export const getSalesConfirmationById = async (id) => {
  const response = await axios.get(
    `/api/auth/get/salesconfirmation/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response;
};

// Update Sales Confirmation
export const updateSalesConfirmation = async (id, salesConfirmationData) => {
  return await axios.put(
    `/api/auth/update/salesconfirmation/${id}`,
    salesConfirmationData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};

// Delete Sales Confirmation
export const deleteSalesConfirmation = async (id) => {
  const response = await axios.delete(
    `/api/auth/delete/salesconfirmation/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response;
};

// List Sales Confirmations with parameters
export const listSalesConfirmationByParams = async (params) => {
  const response = await axios.post(
    `/api/auth/listbyparams/salesconfirmation`,
    params,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response;
};

// Get all Sales Confirmations
export const getAllSalesConfirmations = async () => {
  const response = await axios.get(
    `/api/auth/list/salesconfirmation`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response;
};

// Get next PI Ref No
export const getNextPIRefNo = async () => {
  const response = await axios.get(
    `/api/auth/next-pi-ref-no/salesconfirmation`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response;
};
