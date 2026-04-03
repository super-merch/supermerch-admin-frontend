import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import { AuthProtected } from "./AuthProtected";
import { AuthContext } from "../context/AuthContext";
// import LoadingScreen from '../Components/Common/LoadingScreen';

const Index = () => {
    const { adminData, loading } = useContext(AuthContext);

    return (
        <React.Fragment>
            {/* {loading && <LoadingScreen />} */}
            {loading && (
                <div className="w-100 vh-100 d-flex align-items-center justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            {!loading && (
                <>
                    <Routes>
                        <Route>
                            {!adminData &&
                                publicRoutes.map((route, idx) => (
                                    <Route
                                        path={route.path}
                                        element={
                                            <NonAuthLayout>
                                                {route.component}
                                            </NonAuthLayout>
                                        }
                                        key={idx}
                                        exact={true}
                                    />
                                ))}
                        </Route>

                        <Route>
                            {adminData &&
                                authProtectedRoutes.map((route, idx) => (
                                    <Route
                                        path={route.path}
                                        element={
                                            <AuthProtected>
                                                <VerticalLayout>
                                                    {route.component}
                                                </VerticalLayout>
                                            </AuthProtected>
                                        }
                                        key={idx}
                                        exact={true}
                                    />
                                ))}
                        </Route>
                    </Routes>
                </>
            )}
        </React.Fragment>
    );
};

export default Index;
