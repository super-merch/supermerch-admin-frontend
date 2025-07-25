import axios from "axios";

const backednUrl = import.meta.env.VITE_BACKEND_URL;

// Get all users
// export const UserApi = async () => {
//   try {
//     const response = await axios.get("${backednUrl}/api/auth/users", {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token if using auth
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching ", error);
//     throw error;
//   }
// };

// Edit user
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
