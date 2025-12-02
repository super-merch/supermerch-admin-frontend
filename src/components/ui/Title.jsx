import React from "react";

const Title = ({
  title,
  subtitle,
  className = "",
  titleClass = "",
  subtitleClass = "",
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex flex-col ${className}`.trim()}>
        <h1
          className={`text-lg font-semibold text-gray-900 ${titleClass}`.trim()}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`text-xs text-gray-500 mt-0.5 ${subtitleClass}`.trim()}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default Title;
