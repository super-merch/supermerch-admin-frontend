import React from "react";
import {
  User as UserIcon,
  ShoppingBag,
  FileText,
  StickyNote,
  Paperclip,
  MessageSquare,
} from "lucide-react";

export default function TabsHeader({ activeTab, onTabChange, user }) {
  const tabs = [
    { id: "customer", label: "Customer Details", icon: UserIcon },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "queries", label: "Queries", icon: MessageSquare },
    {
      id: "attachments",
      label: `Attachments (${user?.attachments?.length ?? 0})`,
      icon: Paperclip,
    },

    {
      id: "notes",
      label: `Notes (${user?.notes?.length ?? 0})`,
      icon: StickyNote,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-3">
      <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-200"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-teal-600" : "text-gray-400"
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
