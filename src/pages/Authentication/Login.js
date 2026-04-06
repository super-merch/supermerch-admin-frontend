import React, { useContext, useState } from "react";
import {
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Row,
    Button,
    Form,
} from "reactstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../assets/images/image.png";
import { MenuContext } from "../../context/MenuContext";

const initialState = {
    email: "",
    password: "",
};

const Login = () => {
    const { fetchMenus } = useContext(MenuContext);
    const { setAdminData } = useContext(AuthContext);
    const navigate = useNavigate();
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errEmail, setErrEmail] = useState(false);
    const [errPassword, setErrPassword] = useState(false);

    // Forgot password states
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Loading states
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isSendOtpLoading, setIsSendOtpLoading] = useState(false);
    const [isResendOtpLoading, setIsResendOtpLoading] = useState(false);
    const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

    // Countdown timer for OTP resend
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpResendDisabled, setOtpResendDisabled] = useState(false);

    // Timer interval ref
    const timerRef = React.useRef(null);

    // Handle timer effect
    React.useEffect(() => {
        if (otpCountdown > 0) {
            timerRef.current = setInterval(() => {
                setOtpCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setOtpResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [otpCountdown]);

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const login = async (e) => {
        e.preventDefault();
        setIsSubmit(true);
        setFormErrors(validate(values));

        // If validation errors, don't proceed
        if (Object.keys(validate(values)).length > 0) return;

        setIsLoginLoading(true);

        try {
            const response = await axios.post(
                "/api/auth/admin-login",
                {
                    email: values.email,
                    password: values.password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    validateStatus: function (status) {
                        return status >= 200 && status <= 500;
                    },
                }
            );

            if (response.data.success) {
                localStorage.setItem("aToken", response.data.token);
                setAdminData({ email: response.data.email });
                fetchMenus();
                navigate("/dashboard");
                toast.success("Login successful!");
            } else {
                toast.error(response.data.message || "Authentication failed!");
            }
        } catch (error) {
            toast.error(error.message || "Authentication failed!");
        } finally {
            setIsLoginLoading(false);
        }
    };

    const validate = (values) => {
        const errors = {};
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!values.email) {
            errors.email = "Email is required!";
            setErrEmail(true);
        } else if (!regex.test(values.email)) {
            errors.email = "Invalid Email address!";
            setErrEmail(true);
        } else {
            setErrEmail(false);
        }
        if (!values.password) {
            errors.password = "Password is required!";
            setErrPassword(true);
        } else {
            setErrPassword(false);
        }
        return errors;
    };

    // Handle forgot password email submission with countdown
    const handleSendOTP = () => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!forgotPasswordEmail || !regex.test(forgotPasswordEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSendOtpLoading(true);
        axios
            .post(
                `/api/auth/send-otp`,
                {
                    email: forgotPasswordEmail,
                },
                {
                    validateStatus: function (status) {
                        return status >= 200 && status <= 500;
                    },
                }
            )
            .then((res) => {
                setIsSendOtpLoading(false);
                if (res.data.success) {
                    toast.success("OTP sent to your email");
                    setForgotPasswordStep(2);

                    // Start the countdown timer
                    setOtpResendDisabled(true);
                    setOtpCountdown(60);
                } else {
                    toast.error(res.data.message || "Failed to send OTP");
                }
            })
            .catch((err) => {
                setIsSendOtpLoading(false);
                toast.error(
                    (err.response?.data?.message) || err.message || "Failed to send OTP"
                );
            });
    };

    // Handle OTP resend
    const handleResendOTP = () => {
        if (otpResendDisabled) return;

        setIsResendOtpLoading(true);
        axios
            .post(
                `/api/auth/send-otp`,
                {
                    email: forgotPasswordEmail,
                },
                {
                    validateStatus: function (status) {
                        return status >= 200 && status <= 500;
                    },
                }
            )
            .then((res) => {
                setIsResendOtpLoading(false);
                if (res.data.success) {
                    toast.success("OTP resent to your email");

                    // Start the countdown timer
                    setOtpResendDisabled(true);
                    setOtpCountdown(60);
                } else {
                    toast.error(res.data.message || "Failed to resend OTP");
                }
            })
            .catch((err) => {
                setIsResendOtpLoading(false);
                toast.error(err.message || "Failed to resend OTP");
            });
    };

    // Handle OTP + password reset (SM combines verify OTP + reset in one call)
    const handleResetPassword = () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password should be at least 6 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setIsResetPasswordLoading(true);
        axios
            .post(
                `/api/auth/change-password`,
                {
                    otp: otp,
                    newPassword: newPassword,
                },
                {
                    validateStatus: function (status) {
                        return status >= 200 && status <= 500;
                    },
                }
            )
            .then((res) => {
                setIsResetPasswordLoading(false);
                if (res.data.success) {
                    toast.success("Password reset successfully");
                    setForgotPasswordMode(false);
                    setForgotPasswordStep(1);
                    setForgotPasswordEmail("");
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                } else {
                    toast.error(res.data.message || "Failed to reset password");
                }
            })
            .catch((err) => {
                setIsResetPasswordLoading(false);
                toast.error(err.message || "Failed to reset password");
            });
    };

    // Handle back to login
    const handleBackToLogin = () => {
        setForgotPasswordMode(false);
        setForgotPasswordStep(1);
        setForgotPasswordEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
    };

    document.title = `Sign in | Super Merch`;

    // Render forgot password form based on current step
    const renderForgotPasswordForm = () => {
        switch (forgotPasswordStep) {
            case 1: // Email input
                return (
                    <>
                        <div className="text-center">
                            <h2 className="text-white">FORGOT PASSWORD</h2>
                            <p className="text-muted">
                                Enter your email to reset password
                            </p>
                        </div>
                        <div className="p-2 mt-4">
                            <div className="mb-3">
                                <Label
                                    htmlFor="forgotPasswordEmail"
                                    className="form-label text-white"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="forgotPasswordEmail"
                                    className="form-control"
                                    placeholder="Enter email"
                                    type="email"
                                    value={forgotPasswordEmail}
                                    onChange={(e) =>
                                        setForgotPasswordEmail(e.target.value)
                                    }
                                    disabled={isSendOtpLoading}
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    color=""
                                    style={{ backgroundColor: "#f3b11c" }}
                                    className="w-100 text-white fw-bold"
                                    onClick={handleSendOTP}
                                    disabled={isSendOtpLoading}
                                >
                                    {isSendOtpLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Sending...
                                        </>
                                    ) : (
                                        "Send OTP"
                                    )}
                                </Button>
                            </div>
                            <div className="mt-3 text-center">
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        style={{ color: "#f3b11c" }}
                                        className="fw-medium"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleBackToLogin();
                                        }}
                                        disabled={isSendOtpLoading}
                                    >
                                        Back to Login
                                    </a>
                                </p>
                            </div>
                        </div>
                    </>
                );
            case 2: // OTP + New Password (SM combines verify + reset)
                return (
                    <>
                        <div className="text-center">
                            <h2 className="text-white">RESET PASSWORD</h2>
                            <p className="text-muted">
                                Enter the OTP sent to your email and your new password
                            </p>
                        </div>
                        <div className="p-2 mt-4">
                            <div className="mb-3">
                                <Label htmlFor="otp" className="form-label text-white">
                                    OTP
                                </Label>
                                <Input
                                    id="otp"
                                    className="form-control"
                                    placeholder="Enter 6-digit OTP"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={isResetPasswordLoading}
                                />
                                {otpCountdown > 0 && (
                                    <small className="text-muted">
                                        You can resend OTP in{" "}
                                        {formatTime(otpCountdown)}
                                    </small>
                                )}
                            </div>
                            <div className="mb-3">
                                <Label
                                    htmlFor="newPassword"
                                    className="form-label text-white"
                                >
                                    New Password
                                </Label>
                                <Input
                                    id="newPassword"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    disabled={isResetPasswordLoading}
                                />
                            </div>
                            <div className="mb-3">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="form-label text-white"
                                >
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    disabled={isResetPasswordLoading}
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    color=""
                                    style={{ backgroundColor: "#f3b11c" }}
                                    className="w-100 text-white fw-bold"
                                    onClick={handleResetPassword}
                                    disabled={isResetPasswordLoading}
                                >
                                    {isResetPasswordLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </div>
                            <div className="mt-3 d-flex justify-content-between">
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        className="fw-medium text-white"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setForgotPasswordStep(1);
                                        }}
                                        disabled={isResetPasswordLoading}
                                    >
                                        Back
                                    </a>
                                </p>
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        className={`fw-medium ${
                                            otpResendDisabled ||
                                            isResendOtpLoading
                                                ? "text-muted"
                                                : "text-white"
                                        }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (
                                                !otpResendDisabled &&
                                                !isResendOtpLoading
                                            ) {
                                                handleResendOTP();
                                            }
                                        }}
                                        style={{
                                            cursor:
                                                otpResendDisabled ||
                                                isResendOtpLoading
                                                    ? "default"
                                                    : "pointer",
                                        }}
                                    >
                                        {isResendOtpLoading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                Resending...
                                            </>
                                        ) : (
                                            "Resend OTP"
                                        )}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="auth-wrapper d-flex" style={{ height: "100vh" }}>
            <div
                className="left-panel d-flex align-items-center justify-content-center"
                style={{
                    backgroundColor: "#00124e",
                    width: "50%",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img src={logo} alt="login" height={130} />
            </div>
            <div
                className="right-panel d-flex align-items-center justify-content-center"
                style={{
                    width: "50%",
                    backgroundColor: "#f3b11c",
                    height: "100vh",
                }}
            >
                <Container>
                    <Row className="justify-content-center">
                        <Col md={8} lg={6} xl={7}>
                            <Card className="overflow-hidden shadow-2xl">
                                <CardBody className="p-4" style={{backgroundColor:"#00124e"}}>
                                    {!forgotPasswordMode ? (
                                        <>
                                            <div className="text-center">
                                                <h2 className="text-white">
                                                    LOGIN
                                                </h2>
                                            </div>
                                            <Form>
                                                <div className="p-2 mt-4">
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="email"
                                                            className="form-label text-white"
                                                        >
                                                            Email
                                                        </Label>
                                                        <Input
                                                            onSubmit={login}
                                                            name="email"
                                                            className={
                                                                errEmail &&
                                                                isSubmit
                                                                    ? "form-control is-invalid"
                                                                    : "form-control"
                                                            }
                                                            placeholder="Enter email"
                                                            type="email"
                                                            onChange={
                                                                handleChange
                                                            }
                                                            value={values.email}
                                                        />
                                                        {isSubmit &&
                                                            formErrors.email && (
                                                                <p className="text-danger">
                                                                    {
                                                                        formErrors.email
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                    <div className="mb-3">
                                                        <Label
                                                            className="form-label text-white"
                                                            htmlFor="password-input"
                                                        >
                                                            Password
                                                        </Label>
                                                        <div className="position-relative auth-pass-inputgroup mb-3">
                                                            <Input
                                                                onSubmit={login}
                                                                name="password"
                                                                type={
                                                                    showPassword
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                className={
                                                                    errPassword &&
                                                                    isSubmit
                                                                        ? "form-control is-invalid"
                                                                        : "form-control pe-5"
                                                                }
                                                                placeholder="Enter Password"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    values.password
                                                                }
                                                            />
                                                            <button
                                                                className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                                                type="button"
                                                                onClick={() =>
                                                                    setShowPassword(
                                                                        !showPassword
                                                                    )
                                                                }
                                                            >
                                                                {showPassword ? (
                                                                    <i className="ri-eye-off-fill align-middle"></i>
                                                                ) : (
                                                                    <i className="ri-eye-fill align-middle"></i>
                                                                )}
                                                            </button>
                                                        </div>
                                                        {isSubmit &&
                                                            formErrors.password && (
                                                                <p className="text-danger">
                                                                    {
                                                                        formErrors.password
                                                                    }
                                                                </p>
                                                            )}
                                                        <div className="text-end mb-2">
                                                            <a
                                                                style={{color:"#f3b11c"}}
                                                                className="fw-bold"
                                                                href="#"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.preventDefault();
                                                                    setForgotPasswordMode(
                                                                        true
                                                                    );
                                                                }}
                                                            >
                                                                Forgot Password?
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button
                                                            type="submit"
                                                            // color="primary"
                                                            className="w-100 border-0 fw-bold"
                                                            onClick={login}
                                                            disabled={
                                                                isLoginLoading
                                                            }
                                                            style={{backgroundColor:"#f3b11c"}}
                                                        >
                                                            {isLoginLoading ? (
                                                                <>
                                                                    <span
                                                                        className="spinner-border spinner-border-sm me-2"
                                                                        role="status"
                                                                        aria-hidden="true"
                                                                    ></span>
                                                                    Logging
                                                                    in...
                                                                </>
                                                            ) : (
                                                                "Login"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Form>
                                        </>
                                    ) : (
                                        renderForgotPasswordForm()
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
};

export default withRouter(Login);
