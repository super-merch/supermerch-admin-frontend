import React, { useState, useEffect, useRef  } from "react";
import { Upload, X, Plus, Trash2, Save, Search  } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    overview: {
      name: "",
      code: "",
      hero_image: "",
      min_qty: 0,
    },
    product: {
      name: "",
      code: "",
      description: "",
      details: [],
      images: [],
      image_data: [],
      prices: {
        price_groups: [
          {
            base_price: {
              price_breaks: [
                { qty: 100, price: 0 },
                { qty: 250, price: 0 },
                { qty: 500, price: 0 },
                { qty: 1000, price: 0 },
                { qty: 2500, price: 0 },
              ],
            },
            additions: [],
          },
        ],
        currency_options: "AUD",
      },
      colours: {
        list: [],
      },
      categorisation: {
        promodata_product_type: {
          type_id: "",
          type_name: "",
          type_group_id: "",
          type_name_text: "",
          type_group_name: "",
        },
        appa_product_type: {},
      },
    },
  });
  const [categorySearch, setCategorySearch] = useState("");
const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
const [filteredCategories, setFilteredCategories] = useState([]);
const categoryDropdownRef = useRef(null);

// Add this useEffect for debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    if (categorySearch.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const searchLower = categorySearch.toLowerCase();
      const filtered = categories
        .map((category) => ({
          ...category,
          subTypes: category.subTypes?.filter((sub) =>
            sub.name.toLowerCase().includes(searchLower) ||
            category.name.toLowerCase().includes(searchLower)
          ),
        }))
        .filter((category) => category.subTypes && category.subTypes.length > 0);
      setFilteredCategories(filtered);
    }
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [categorySearch, categories]);

// Add this useEffect to initialize filtered categories
useEffect(() => {
  setFilteredCategories(categories);
}, [categories]);

// Add this useEffect to handle click outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
      setShowCategoryDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
 
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1-categories`
      );
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageUpload = async (e, isHero = false) => {
    const files = Array.from(e.target.files);
    setUploadingImages(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "super_merch");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/desggvwcg/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        return {
          url: data.secure_url,
          alt_text: "",
          updated_at: new Date().toISOString(),
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      if (isHero && uploadedImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          overview: {
            ...prev.overview,
            hero_image: uploadedImages[0].url,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          product: {
            ...prev.product,
            images: [
              ...prev.product.images,
              ...uploadedImages.map((img) => img.url),
            ],
            image_data: [
              ...prev.product.image_data,
              ...uploadedImages.map((img) => ({
                original: img.url,
                alt_text: img.alt_text,
                updated_at: img.updated_at,
              })),
            ],
          },
        }));
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCategoryChange = (groupId, typeId, categoryName, subTypeName) => {
  const category = categories.find((cat) => cat.id === groupId);
  const subType = category?.subTypes.find((sub) => sub.id === typeId);

  if (category && subType) {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        categorisation: {
          ...prev.product.categorisation,
          promodata_product_type: {
            type_id: subType.id,
            type_name: subType.name,
            type_group_id: category.id,
            type_name_text: `${category.name} > ${subType.name}`,
            type_group_name: category.name,
          },
        },
      },
    }));
    setCategorySearch(`${categoryName} > ${subTypeName}`);
    setShowCategoryDropdown(false);
  }
};

  const addDetail = () => {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        details: [...prev.product.details, { name: "", detail: "" }],
      },
    }));
  };

  const updateDetail = (index, field, value) => {
    const newDetails = [...formData.product.details];
    newDetails[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        details: newDetails,
      },
    }));
  };

  const removeDetail = (index) => {
    const newDetails = formData.product.details.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        details: newDetails,
      },
    }));
  };

  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        colours: {
          ...prev.product.colours,
          list: [
            ...prev.product.colours.list,
            { name: "", colours: [""], image: "" },
          ],
        },
      },
    }));
  };

  const updateColor = (index, field, value) => {
    const newColors = [...formData.product.colours.list];
    if (field === "colours") {
      newColors[index].colours = value.split(",").map((c) => c.trim());
    } else {
      newColors[index][field] = value;
    }
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        colours: {
          ...prev.product.colours,
          list: newColors,
        },
      },
    }));
  };

  const removeColor = (index) => {
    const newColors = formData.product.colours.list.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        colours: {
          ...prev.product.colours,
          list: newColors,
        },
      },
    }));
  };

  const updatePriceBreak = (groupIndex, breakIndex, field, value) => {
    const newPriceGroups = [...formData.product.prices.price_groups];
    newPriceGroups[groupIndex].base_price.price_breaks[breakIndex][field] =
      parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        prices: {
          ...prev.product.prices,
          price_groups: newPriceGroups,
        },
      },
    }));
  };

  const generateKey = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const addPrintMethod = () => {
  const newPriceGroups = [...formData.product.prices.price_groups];
  
  // Get base_price from first price_group to reuse
  const basePriceBreaks = newPriceGroups[0].base_price.price_breaks;
  
  // Create new price_group object with same base_price and one addition
  const newPriceGroup = {
    base_price: {
      price_breaks: [...basePriceBreaks] // Copy the base price breaks
    },
    additions: [
      {
        key: generateKey(),
        description: "",
        setup: 0,
        lead_time: "",
        promodata_decoration: "",
        currency: "AUD",
        undecorated: false,
        type: "",
        details: "",
        price_breaks: [
          { qty: 100, price: 0 },
          { qty: 250, price: 0 },
          { qty: 500, price: 0 },
          { qty: 1000, price: 0 },
          { qty: 2500, price: 0 },
        ],
      }
    ],
  };
  
  // Add the new price_group to the array
  newPriceGroups.push(newPriceGroup);
  
  setFormData((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      prices: {
        ...prev.product.prices,
        price_groups: newPriceGroups,
      },
    },
  }));
};

const updatePrintMethod = (groupIndex, field, value) => {
  const newPriceGroups = [...formData.product.prices.price_groups];
  // Update the first (and only) addition in this price_group
  if (field === "setup") {
    newPriceGroups[groupIndex].additions[0][field] = parseFloat(value) || 0;
  } else {
    newPriceGroups[groupIndex].additions[0][field] = value;
  }
  setFormData((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      prices: {
        ...prev.product.prices,
        price_groups: newPriceGroups,
      },
    },
  }));
};

const updatePrintMethodPrice = (groupIndex, breakIndex, field, value) => {
  const newPriceGroups = [...formData.product.prices.price_groups];
  newPriceGroups[groupIndex].additions[0].price_breaks[breakIndex][field] =
    parseFloat(value) || 0;
  setFormData((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      prices: {
        ...prev.product.prices,
        price_groups: newPriceGroups,
      },
    },
  }));
};

const removePrintMethod = (groupIndex) => {
  // Don't allow removing the first price_group (index 0)
  if (groupIndex === 0) {
    alert("Cannot remove the base price group");
    return;
  }
  
  const newPriceGroups = formData.product.prices.price_groups.filter(
    (_, i) => i !== groupIndex
  );
  setFormData((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      prices: {
        ...prev.product.prices,
        price_groups: newPriceGroups,
      },
    },
  }));
};
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        images: prev.product.images.filter((_, i) => i !== index),
        image_data: prev.product.image_data.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        overview: {
          ...formData.overview,
          name: formData.overview.name || formData.product.name,
          code: formData.overview.code || formData.product.code,
        },
        product: {
          ...formData.product,
          name: formData.product.name || formData.overview.name,
          code: formData.product.code || formData.overview.code,
        },
      };

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/custom-products/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Product created successfully!");
        navigate("/products");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Add New Product
          </h1>

          <div className="space-y-8">
            {/* Basic Information */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product: { ...prev.product, name: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    value={formData.product.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product: { ...prev.product, code: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows="4"
                    value={formData.product.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product: {
                          ...prev.product,
                          description: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.overview.min_qty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overview: {
                          ...prev.overview,
                          min_qty: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Category Selection */}
            <section className="border-b pb-6">
  <h2 className="text-xl font-semibold text-gray-700 mb-4">
    Category
  </h2>
  <div ref={categoryDropdownRef} className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Select Category *
    </label>
    <div className="relative">
      <input
        type="text"
        value={categorySearch}
        onChange={(e) => {
          setCategorySearch(e.target.value);
          setShowCategoryDropdown(true);
        }}
        onFocus={() => setShowCategoryDropdown(true)}
        placeholder="Search categories..."
        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    </div>
    
    {showCategoryDropdown && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="px-4 py-2 bg-gray-100 font-medium text-gray-700 text-sm">
                {category.name}
              </div>
              {category.subTypes?.map((subType) => (
                <button
                  key={subType.id}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      category.id,
                      subType.id,
                      category.name,
                      subType.name
                    )
                  }
                  className="w-full text-left px-6 py-2 hover:bg-blue-50 transition-colors"
                >
                  {subType.name}
                </button>
              ))}
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-gray-500 text-center">
            No categories found
          </div>
        )}
      </div>
    )}
    
    {formData.product.categorisation.promodata_product_type.type_name_text && (
      <p className="mt-2 text-sm text-gray-600">
        Selected:{" "}
        {formData.product.categorisation.promodata_product_type.type_name_text}
      </p>
    )}
  </div>
</section>

            {/* Images */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Images
              </h2>

              {/* Hero Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image
                </label>
                <div className="flex items-center gap-4">
                  {formData.overview.hero_image ? (
                    <div className="relative">
                      <img
                        src={formData.overview.hero_image}
                        alt="Hero"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            overview: { ...prev.overview, hero_image: "" },
                          }))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors">
                        <Upload className="text-gray-400" size={32} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="flex flex-wrap gap-4">
                  {formData.product.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors">
                      {uploadingImages ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      ) : (
                        <Upload className="text-gray-400" size={32} />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e)}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Product Details */}
            <section className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Product Details
                </h2>
                <button
                  type="button"
                  onClick={addDetail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                  Add Detail
                </button>
              </div>
              <div className="space-y-4">
                {formData.product.details.map((detail, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <input
                      type="text"
                      placeholder="Name (e.g., Dimensions)"
                      value={detail.name}
                      onChange={(e) =>
                        updateDetail(index, "name", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Detail"
                      value={detail.detail}
                      onChange={(e) =>
                        updateDetail(index, "detail", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeDetail(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Colors */}
            <section className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Colors</h2>
                <button
                  type="button"
                  onClick={addColor}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                  Add Color
                </button>
              </div>
              <div className="space-y-4">
                {formData.product.colours.list.map((color, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <input
                      type="text"
                      placeholder="Color Name"
                      value={color.name}
                      onChange={(e) =>
                        updateColor(index, "name", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Colors (comma separated)"
                      value={color.colours.join(", ")}
                      onChange={(e) =>
                        updateColor(index, "colours", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Pricing */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Base Pricing (AUD)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.product.prices.price_groups[0].base_price.price_breaks.map(
                      (priceBreak, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={priceBreak.qty}
                              onChange={(e) =>
                                updatePriceBreak(
                                  0,
                                  index,
                                  "qty",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={priceBreak.price}
                              onChange={(e) =>
                                updatePriceBreak(
                                  0,
                                  index,
                                  "price",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Print Methods */}
<section className="pb-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-700">
      Print Methods
    </h2>
    <button
      type="button"
      onClick={addPrintMethod}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      <Plus size={20} />
      Add Print Method
    </button>
  </div>


  <div className="space-y-6">
    {formData.product.prices.price_groups.map((group, groupIndex) => {
      // Skip first group (base price) as it has no additions
      if (groupIndex === 0 || !group.additions || group.additions.length === 0) {
        return null;
      }
      
      const method = group.additions[0]; // Get the single addition from this group
      
      return (
        <div
          key={groupIndex}
          className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700 text-lg">
              Print Method {groupIndex}
            </h3>
            <button
              type="button"
              onClick={() => removePrintMethod(groupIndex)}
              className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decoration Type *
              </label>
              <select
                value={method.promodata_decoration || ""}
                onChange={(e) =>
                  updatePrintMethod(
                    groupIndex,
                    "promodata_decoration",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Decoration Type</option>
                <option value="Direct Print: Screen Print">
                  Direct Print: Screen Print
                </option>
                <option value="Direct Print: Pad Print">
                  Direct Print: Pad Print
                </option>
                <option value="Direct Print: Digital Print">
                  Direct Print: Digital Print
                </option>
                <option value="Direct Print: Laser Engraving">
                  Direct Print: Laser Engraving
                </option>
                <option value="Applied Label/Sticker: Clear Label">
                  Applied Label/Sticker: Clear Label
                </option>
                <option value="Applied Label/Sticker: Label with white background">
                  Applied Label/Sticker: White Label
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Time *
              </label>
              <input
                type="text"
                placeholder="e.g., Same Day, 24 Hours, 3 Working Days"
                value={method.lead_time || ""}
                onChange={(e) =>
                  updatePrintMethod(
                    groupIndex,
                    "lead_time",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g., Same Day Print Per Col/Pos"
                value={method.description}
                onChange={(e) =>
                  updatePrintMethod(
                    groupIndex,
                    "description",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setup Cost (AUD)
              </label>
              <input
                type="number"
                step="0.01"
                value={method.setup}
                onChange={(e) =>
                  updatePrintMethod(
                    groupIndex,
                    "setup",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">
              Pricing for this Print Method
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Additional Price (added to base price)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {method.price_breaks.map((priceBreak, breakIndex) => (
                    <tr key={breakIndex} className="border-t">
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={priceBreak.qty}
                          onChange={(e) =>
                            updatePrintMethodPrice(
                              groupIndex,
                              breakIndex,
                              "qty",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={priceBreak.price}
                          onChange={(e) =>
                            updatePrintMethodPrice(
                              groupIndex,
                              breakIndex,
                              "price",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    })}

    {formData.product.prices.price_groups.length === 1 && (
      <div className="text-center py-8 text-gray-500">
        No print methods added yet. Click "Add Print Method" to add one.
      </div>
    )}
  </div>
</section>  

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
