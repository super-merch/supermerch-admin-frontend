// ContactApi.js
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/contact`; // Adjust this to match your backend URL

// Get all queries
export const getAllQueries = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get`);
    return response.data;
  } catch (error) {
    console.error('Error fetching queries:', error);
    throw error;
  }
};

// Get single query by ID
export const getOneQuery = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-one/${id}`, {
      
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching single query:', error);
    throw error;
  }
};

// Delete query by ID
export const deleteQuery = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/delete/${id}`, {

    }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting query:', error);
    throw error;
  }
};

// Save new query (if needed for other parts of your app)
export const saveQuery = async (queryData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/add`, queryData);
    return response.data;
  } catch (error) {
    console.error('Error saving query:', error);
    throw error;
  }
};