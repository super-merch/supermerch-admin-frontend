import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(null);

    const navigate = useNavigate();

    const getAdmin = async () => {
        setLoading(true);
        const token = localStorage.getItem("aToken");
        if (!token) {
            setLoading(false);
            navigate("/");
            return;
        }
        try {
            const response = await axios.get("/api/admin/me", {
                headers: {
                    atoken: token,
                },
            });

            if (response.data.success) {
                setAdminData(response.data.data);
                setRole(response.data.role);
                localStorage.setItem("_id", response.data.data.id);
                setLoading(false);
            } else {
                navigate("/");
                localStorage.removeItem("aToken");
                localStorage.removeItem("_id");
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAdmin();
    }, [navigate]);

    return (
        <AuthContext.Provider
            value={{
                adminData,
                setAdminData,
                getAdmin,
                role,
                loading,
                setLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
