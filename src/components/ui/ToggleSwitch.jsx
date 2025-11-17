import React from "react";

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  loading = false,
  label,
  size = "md",
}) => {
  const sizes = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const dotSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const translateSizes = {
    sm: "translate-x-[1.125rem]", // 18px for w-8 switch with w-3 dot
    md: "translate-x-[1.375rem]", // 22px for w-11 switch with w-5 dot
    lg: "translate-x-[1.875rem]", // 30px for w-14 switch with w-6 dot
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      {label && (
        <span className="text-xs text-gray-600 font-medium">{label}</span>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled || loading}
          className="sr-only"
        />
        <div
          className={`${sizes[size]} rounded-full transition-colors duration-200 ease-in-out ${
            checked
              ? "bg-teal-600"
              : "bg-gray-300"
          } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div
            className={`${dotSizes[size]} absolute top-0.5 left-0.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
              checked ? translateSizes[size] : "translate-x-0"
            } ${loading ? "opacity-50" : ""}`}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 border border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </label>
  );
};

export default ToggleSwitch;

