import axios from "axios";

export const getSuperAdmin = async () => {
    return await axios.get(
        `/api/auth/getadmin/superadmin`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};
