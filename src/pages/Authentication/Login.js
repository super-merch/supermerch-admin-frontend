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
import logo from "../../assets/images/logo.png";
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
    const [rememberMe, setRememberMe] = useState(false);
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
                await fetchMenus();
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

    const pageStyles = {
        wrapper: {
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 16px",
            background:
                "linear-gradient(135deg, #f7f9ff 0%, #eef3ff 52%, #f7fbff 100%)",
        },
        card: {
            width: "100%",
            maxWidth: "470px",
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            padding: "36px 28px 34px",
        },
        logoWrap: {
            display: "flex",
            justifyContent: "center",
            marginBottom: "18px",
        },
        logo: {
            width: "100%",
            maxWidth: "250px",
            height: "auto",
            objectFit: "contain",
        },
        title: {
            fontSize: "34px",
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#2f6df6",
            textAlign: "center",
            marginBottom: "6px",
        },
        subtitle: {
            textAlign: "center",
            color: "#8a94a6",
            fontSize: "14px",
            marginBottom: "26px",
        },
        label: {
            fontSize: "14px",
            fontWeight: 600,
            color: "#3b4558",
            marginBottom: "10px",
        },
        input: {
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #d7dce6",
            padding: "14px 16px",
            fontSize: "15px",
            color: "#1f2937",
            backgroundColor: "#ffffff",
            outline: "none",
            boxShadow: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        },
        inputFocus: {
            borderColor: "#2f6df6",
            boxShadow: "0 0 0 3px rgba(47, 109, 246, 0.14)",
        },
        passwordWrap: {
            position: "relative",
        },
        passwordInput: {
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #d7dce6",
            padding: "14px 48px 14px 16px",
            fontSize: "15px",
            color: "#1f2937",
            backgroundColor: "#ffffff",
            outline: "none",
            boxShadow: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        },
        eyeButton: {
            position: "absolute",
            top: "50%",
            right: "12px",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            color: "#7a869a",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
        },
        rememberRow: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "18px",
        },
        checkbox: {
            width: "16px",
            height: "16px",
            accentColor: "#2f6df6",
        },
        rememberLabel: {
            fontSize: "14px",
            color: "#64748b",
            userSelect: "none",
        },
        submitButton: {
            width: "100%",
            marginTop: "24px",
            padding: "15px 18px",
            border: "none",
            borderRadius: "10px",
            background: "linear-gradient(90deg, #2f6df6 0%, #2355db 100%)",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: "0 10px 22px rgba(35, 85, 219, 0.28)",
        },
        errorText: {
            marginTop: "8px",
            color: "#dc2626",
            fontSize: "13px",
        },
    };

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
                                    <button
                                        type="button"
                                        style={{
                                            color: "#f3b11c",
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                        }}
                                        className="fw-medium"
                                        onClick={handleBackToLogin}
                                        disabled={isSendOtpLoading}
                                    >
                                        Back to Login
                                    </button>
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
                                    <button
                                        type="button"
                                        className="fw-medium text-white"
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                        }}
                                        onClick={() => setForgotPasswordStep(1)}
                                        disabled={isResetPasswordLoading}
                                    >
                                        Back
                                    </button>
                                </p>
                                <p className="mb-0">
                                    <button
                                        type="button"
                                        className={`fw-medium ${
                                            otpResendDisabled ||
                                            isResendOtpLoading
                                                ? "text-muted"
                                                : "text-white"
                                        }`}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                            cursor:
                                                otpResendDisabled ||
                                                isResendOtpLoading
                                                    ? "default"
                                                    : "pointer",
                                        }}
                                        onClick={() => {
                                            if (
                                                !otpResendDisabled &&
                                                !isResendOtpLoading
                                            ) {
                                                handleResendOTP();
                                            }
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
                                    </button>
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
        <div style={pageStyles.wrapper}>
            <Card style={pageStyles.card} className="border-0">
                <CardBody className="p-0">
                    {!forgotPasswordMode ? (
                        <Form onSubmit={login}>
                            <div style={pageStyles.logoWrap}>
                                <img src={logo} alt="Super Merch" style={pageStyles.logo} />
                            </div>

                            <div className="text-center">
                                <div style={pageStyles.title}>Login</div>
                                <div style={pageStyles.subtitle}>
                                    Welcome back! Please login to continue
                                </div>
                            </div>

                            <div className="mb-4">
                                <Label htmlFor="email" style={pageStyles.label}>
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    onSubmit={login}
                                    name="email"
                                    className={
                                        errEmail && isSubmit
                                            ? "form-control is-invalid"
                                            : "form-control"
                                    }
                                    placeholder="Enter your email"
                                    type="email"
                                    onChange={handleChange}
                                    value={values.email}
                                    style={pageStyles.input}
                                />
                                {isSubmit && formErrors.email && (
                                    <p style={pageStyles.errorText}>
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="mb-3">
                                <Label htmlFor="password-input" style={pageStyles.label}>
                                    Password
                                </Label>
                                <div style={pageStyles.passwordWrap}>
                                    <Input
                                        id="password-input"
                                        onSubmit={login}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        className={
                                            errPassword && isSubmit
                                                ? "form-control is-invalid"
                                                : "form-control"
                                        }
                                        placeholder="Enter your password"
                                        onChange={handleChange}
                                        value={values.password}
                                        style={pageStyles.passwordInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={pageStyles.eyeButton}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <i className={showPassword ? "ri-eye-off-line fs-5" : "ri-eye-line fs-5"}></i>
                                    </button>
                                </div>
                                {isSubmit && formErrors.password && (
                                    <p style={pageStyles.errorText}>
                                        {formErrors.password}
                                    </p>
                                )}
                            </div>

                            <div style={pageStyles.rememberRow}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={pageStyles.checkbox}
                                />
                                <Label
                                    htmlFor="rememberMe"
                                    style={pageStyles.rememberLabel}
                                    className="mb-0"
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                onClick={login}
                                disabled={isLoginLoading}
                                style={pageStyles.submitButton}
                            >
                                {isLoginLoading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Logging in...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </Form>
                    ) : (
                        renderForgotPasswordForm()
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default withRouter(Login);
