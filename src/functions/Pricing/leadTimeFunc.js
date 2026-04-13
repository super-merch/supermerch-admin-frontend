import axios from "axios";

export const getSupplierLeadTimes = async (params) => {
  return await axios.get("/api/supplier-lead-time/list", { params });
};

export const saveSupplierLeadTime = async (data) => {
  return await axios.post("/api/supplier-lead-time/save", data);
};

export const deleteSupplierLeadTime = async (supplierId) => {
  return await axios.delete(`/api/supplier-lead-time/delete?supplierId=${supplierId}`);
};

export const getPromodataLeadTimeDefaults = async (supplierIds) => {
  return await axios.get(`/api/supplier-lead-time/promodata-defaults?supplierIds=${supplierIds}`);
};
