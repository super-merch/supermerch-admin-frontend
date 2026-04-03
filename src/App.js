import React from "react";
import "./assets/scss/themes.scss";
import "react-toastify/dist/ReactToastify.css";
import Route from "./Routes";
import axios from "axios";

import { AuthProvider } from "./context/AuthContext";
import { MenuProvider } from "./context/MenuContext";
import { ToastContainer } from "react-toastify";
import config from "./config";

function App() {
    axios.defaults.baseURL = config.api.API_URL;
    axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token") || ""}`;
    axios.defaults.headers.post["Content-Type"] = "application/json";
    axios.defaults.headers.post["Accept"] = "application/json";
    axios.defaults.validateStatus = function (status) {
        return true;
    }

    return (
        <React.Fragment>
            <AuthProvider>
                <MenuProvider>
                    <ToastContainer />
                    <Route />
                </MenuProvider>
            </AuthProvider>
        </React.Fragment>
    );
}

export default App;
