import React from "react";

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
  size = "sm",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  ariaLabel,
}) => {
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    outline: "border border-gray-200 hover:bg-gray-50 text-gray-700",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || label}
      className={`flex items-center gap-1.5 font-medium rounded-lg transition-colors ${
        variants[variant]
      } ${sizes[size]} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon className="w-3 h-3" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};

export default ActionButton;
