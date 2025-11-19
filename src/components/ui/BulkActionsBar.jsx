import React from "react";
import ActionButton from "./ActionButton";
import { X, Package, Clock, Plus, Minus } from "lucide-react";

const BulkActionsBar = ({
  bulkMode,
  selectedCount,
  onModeChange,
  onCancel,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  loading = false,
}) => {
  if (!bulkMode) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          Bulk Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={Plus}
            label="Bulk Add to Australia"
            onClick={() => onModeChange("australia-add")}
            variant="success"
          />
          <ActionButton
            icon={Minus}
            label="Bulk Remove from Australia"
            onClick={() => onModeChange("australia-remove")}
            variant="danger"
          />
          <ActionButton
            icon={Clock}
            label="Bulk Add to 24Hr Production"
            onClick={() => onModeChange("24hour-add")}
            variant="primary"
          />
          <ActionButton
            icon={Minus}
            label="Bulk Remove from 24Hr Production"
            onClick={() => onModeChange("24hour-remove")}
            variant="warning"
          />
        </div>
      </div>
    );
  }

  const getModeLabel = () => {
    switch (bulkMode) {
      case "australia-add":
        return "Bulk Add to Australia";
      case "australia-remove":
        return "Bulk Remove from Australia";
      case "24hour-add":
        return "Bulk Add to 24 Hour Production";
      case "24hour-remove":
        return "Bulk Remove from 24 Hour Production";
      default:
        return "";
    }
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border-2 border-teal-300 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-teal-900">
          {getModeLabel()}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-700 mb-2">
        {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected
      </p>
      <div className="flex gap-2">
        <ActionButton
          label="Select All Eligible"
          onClick={onSelectAll}
          variant="outline"
          size="sm"
        />
        <ActionButton
          label="Deselect All"
          onClick={onDeselectAll}
          variant="outline"
          size="sm"
        />
        <ActionButton
          label={bulkMode.includes("add") ? "Add Selected" : "Remove Selected"}
          onClick={onBulkAction}
          disabled={selectedCount === 0 || loading}
          loading={loading}
          variant="primary"
          size="sm"
        />
      </div>
    </div>
  );
};

export default BulkActionsBar;
