import axios from "axios";

export const removeDueReminderFromFiles = async (fileId) => {
    return await axios.delete(
        `/api/auth/delete/due-reminder-file/${fileId}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
