import axios from "axios";

export const updateCompanyNew = async (id, formData) => {
    try {
        const response = await axios.put(
            `/api/company/${id}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating company:", error);
        throw error;
    }
};