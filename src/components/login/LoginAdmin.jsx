import React, { useContext, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const LoginAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { setAToken, backednUrl } = useContext(AdminContext);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(
        `${backednUrl}/api/add-discount/admin-login`,
        {
          email,
          password,
        }
      );

      if (data.success) {
        if (rememberMe) {
          localStorage.setItem("aToken", data.token);
          localStorage.setItem("adminEmail", email);
        }
        setAToken(data.token);
        toast.success("Login successful!");
        navigate("/products");
      } else {
        console.log(data.message, "error msg");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md mx-auto">
        <div className="flex flex-col gap-6 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-3/4 rounded-full flex items-center justify-center p-2">
              <img
                src="/supermerch.png"
                alt="Company Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = "/vite.svg";
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">
                <span className="text-blue-600">Login</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back! Please login to continue
              </p>
            </div>
          </div>

          {/* Email Input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="border border-gray-300 rounded-lg w-full px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="border border-gray-300 rounded-lg w-full px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 pr-12"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-700 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full py-3 rounded-lg text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginAdmin;
