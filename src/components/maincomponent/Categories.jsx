//Component to list categories with subcategories in separate tables in the admin panel
import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import { useNavigate } from "react-router-dom";

export default function Categories() {
  const { categories, fetchCategories } = useContext(AdminContext);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading,setLoading] = useState(false)
  useEffect(() => {
    const getCategories = async () => {
      setLoading(true)
      await fetchCategories();
      setLoading(false)
    };
    getCategories();
    console.log(categories);
  }, []);

  const navigate = useNavigate();

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  // circuler loading icon
  if(loading){
    return (
      <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="ml-4 text-lg font-semibold">Loading Categories...</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold m-2">Categories</h1>
      
      {categories.length > 0 ? (
        categories.map((category) => (
          <div key={category?._id} className="bg-white rounded-lg shadow">
            {/* Main Category Header */}
            <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {category?.name} (ID: {category?.id})
                  </h2>
                  <span className="text-sm text-gray-600">
                    {category?.subTypes?.length || 0} subcategories
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                    onClick={() =>
                      navigate("/category-detail", {
                        state: { id: category.id, name: category.name },
                      })
                    }
                  >
                    View Category
                  </button>
                  <button
                    className="px-3 py-1 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {expandedCategories[category.id] ? 'Hide' : 'Show'} Subcategories
                  </button>
                </div>
              </div>
            </div>

            {/* Subcategories Table */}
            {expandedCategories[category.id] && category?.subTypes && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                        Subcategory Name
                      </th>
                      <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                        Subcategory ID
                      </th>
                      <th className="px-4 py-3 text-left border border-gray-300 font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.subTypes.map((subType, index) => (
                      <tr
                        key={subType?.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="font-medium text-gray-900">
                            {subType?.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          {subType?.id}
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <button
                            className="px-2 py-2 text-sm text-center text-white bg-blue-700 hover:bg-blue-800 rounded"
                            onClick={() =>
                              navigate("/category-detail", {
                                state: { 
                                  id: subType.id, 
                                  name: subType.name,
                                  parentCategory: category.name,
                                  parentId: category.id
                                },
                              })
                            }
                          >
                            View More
                          </button>
                        </td>
                      </tr>
                    ))}
                    {category.subTypes.length === 0 && (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No subcategories available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center text-gray-500">
            No categories available
          </div>
        </div>
      )}
    </div>
  );
}