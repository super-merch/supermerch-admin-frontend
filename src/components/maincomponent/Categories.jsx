//Component to list categories with subcategories in separate tables in the admin panel
import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import { useNavigate } from "react-router-dom";
import {
  FolderTree,
  ChevronDown,
  ChevronUp,
  Eye,
  Hash,
  RefreshCw,
  Layers,
} from "lucide-react";
import ActionButton from "../ui/ActionButton";

export default function Categories() {
  const { categories, fetchCategories } = useContext(AdminContext);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const data = await fetchCategories();
      setCount(data.data.length);
      setLoading(false);
    };
    getCategories();
  }, []);

  const navigate = useNavigate();

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };
  const totalCount = categories.reduce(
    (acc, category) => acc + (category.subTypes?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3">
      <style>{`
        .subcategory-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .subcategory-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .subcategory-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .subcategory-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Categories Management
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage and view all product categories and subcategories
            </p>
          </div>
          <ActionButton
            icon={RefreshCw}
            label="Refresh"
            onClick={async () => {
              setLoading(true);
              const data = await fetchCategories();
              setCount(data.data.length);
              setLoading(false);
            }}
            variant="outline"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Categories</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderTree className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Sub-Categories</p>
                <p className="text-xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((category) => {
            const isExpanded = expandedCategories[category.id];
            const subCount = category?.subTypes?.length || 0;

            return (
              <div
                key={category?._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Category Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FolderTree className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-base font-semibold text-gray-900">
                            {category?.name || "Unnamed Category"}
                          </h2>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-200 rounded">
                            <Hash className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-mono text-gray-600">
                              {category?.id}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Layers className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {subCount}{" "}
                            {subCount === 1 ? "subcategory" : "subcategories"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionButton
                        icon={Eye}
                        label="View"
                        onClick={() =>
                          navigate("/category-detail", {
                            state: { id: category.id, name: category.name },
                          })
                        }
                        variant="primary"
                        size="sm"
                      />
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isExpanded
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategories List */}
                {isExpanded && category?.subTypes && (
                  <div className="p-4 bg-white">
                    {subCount > 0 ? (
                      <div
                        className="subcategory-scroll space-y-2 max-h-96 overflow-y-auto pr-2"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#cbd5e1 #f1f5f9",
                        }}
                      >
                        {category.subTypes.map((subType) => (
                          <div
                            key={subType?.id}
                            onClick={() =>
                              navigate("/category-detail", {
                                state: {
                                  id: subType.id,
                                  name: subType.name,
                                  parentCategory: category.name,
                                  parentId: category.id,
                                },
                              })
                            }
                            className="group bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-1.5 bg-gray-200 rounded-lg">
                                  <Layers className="w-3.5 h-3.5 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {subType?.name || "Unnamed Subcategory"}
                                  </h3>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Hash className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs font-mono text-gray-500">
                                      {subType?.id || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                <Eye className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                          <Layers className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          No subcategories available
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-100 rounded-full">
              <FolderTree className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No categories available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
