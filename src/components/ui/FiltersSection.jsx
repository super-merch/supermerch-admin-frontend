import React from "react";
import { Search, X } from "lucide-react";

const FiltersSection = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  selectedCategory,
  onCategoryChange,
  categories,
  sortOption,
  onSortChange,
  isSearching,
  searchResultsCount,
}) => {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit(e);
              }
            }}
            placeholder="Search products..."
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory || "all"}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">All Products</option>
          <option value="trending">Trending</option>
          <option value="australia">Australia</option>
          <option value="24hrProducts">24 Hour Products</option>
        </select>

        {/* Search Results Info */}
        {isSearching && searchResultsCount !== null && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>
              Showing <span className="font-semibold">{searchResultsCount}</span> results
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersSection;

