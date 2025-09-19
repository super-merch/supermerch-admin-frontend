import axios from "axios";

const backednUrl = import.meta.env.VITE_BACKEND_URL;

export const editUser = async (userId, updatedData) => {
  try {
    const response = await axios.put(
      `${backednUrl}/api/auth/users/${userId}`,
      updatedData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(
      `${backednUrl}/api/auth/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const ProductsApi = async (id = "") => {
  try {
    const url = id
      ? `${backednUrl}/api/checkout/products/${id}`
      : `${backednUrl}/api/checkout/products`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Products:", error);
    throw error;
  }
};

export const addGlobalDiscount = async (discount) => {
  try {
    const response = await axios.post(
      `${backednUrl}/api/add-discount/add-global-discount`,
      {
        discount
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

// Get global discount
export const getGlobalDiscount = async () => {
  try {
    const response = await axios.get(
      `${backednUrl}/api/add-discount/global-discount`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

// Remove global discount
export const removeGlobalDiscount = async () => {
  try {
    const response = await axios.delete(
      `${backednUrl}/api/add-discount/remove-global-discount`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};
export const addGlobalMargin = async (margin) => {
  try {
    const response = await axios.post(
      `${backednUrl}/api/add-margin/add-global-margin`,
      {
        margin
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

// Get global margin
export const getGlobalMargin = async () => {
  try {
    const response = await axios.get(
      `${backednUrl}/api/add-margin/global-margin`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

// Remove global margin
export const removeGlobalMargin = async () => {
  try {
    const response = await axios.delete(
      `${backednUrl}/api/add-margin/remove-global-margin`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

export const addDiscount = async (productId, discount, price) => {
  try {
    const response = await axios.post(
      `${backednUrl}/api/add-discount/add-discount`,
      {
        productId,
        discount,
        basePrice: price
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || "Something went wrong";
  }
};

export const addMargin = async (productId, margin, price) => {
  try {
    const response = await axios.post(
      `${backednUrl}/api/product-margin/add-margin`,
      {
        productId,
        margin,
        basePrice: price,
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Something went wrong';
  }
};

export const getDiscount = async()=>{
  try {
    const response = await fetch(`${backednUrl}/api/add-discount/list-discounts`);
    const data = await response.json();
    return data
  } catch (error) {
    throw error
  }

}
// Add these functions to your UserApi.js file

export const getShippingCharges = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shipping/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers if needed
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch shipping charges');
    }

    return { data };
  } catch (error) {
    throw error;
  }
};

export const addShippingCharges = async (shipping) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shipping/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers if needed
      },
      body: JSON.stringify({ shipping }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add shipping charges');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const removeShippingCharges = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/shipping/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers if needed
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove shipping charges');
    }

    return data;
  } catch (error) {
    throw error;
  }
};