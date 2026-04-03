import axios from "axios";

export const uploadDueReminders = async (formData) => {
    return await axios.post(
        `/api/auth/upload/due-reminders`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                // You can use this to update a progress bar if needed
                console.log('Upload progress:', percentCompleted);
            },
        }
    );
}; 