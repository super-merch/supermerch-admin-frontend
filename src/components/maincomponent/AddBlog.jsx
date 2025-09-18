import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import upload_area from "../../assets/upload_area.png";

const AddBlog = () => {
    const [value, setValue] = useState("");
    const [selectedImages, setSelectedImages] = useState(false);
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    const { backednUrl, aToken, fetchBlogs } = useContext(AdminContext);
    const navigate = useNavigate();
    const { id } = useParams(); // Get blog ID from URL for editing
    
    const isEditMode = Boolean(id);

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline", "strike"],
            [{ align: [] }],
            ["link", "image"],
            ["clean"], // Remove formatting
        ],
    };

    // Fetch blog data for editing
    useEffect(() => {
        if (isEditMode && aToken) {
            fetchBlogData();
        }
    }, [id, aToken]);

    const fetchBlogData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${backednUrl}/api/blogs/get-blog/${id}`);
            const blog = response.data.blog;
            
            setTitle(blog.title);
            setValue(blog.content);
            setCurrentImageUrl(blog.image);
        } catch (error) {
            console.error("Error fetching blog:", error);
            toast.error("Failed to load blog data");
            navigate("/blogs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        
        if (!value.trim()) {
            toast.error("Content is required");
            return;
        }

        if (!isEditMode && !selectedImages) {
            toast.error("Thumbnail image is required");
            return;
        }
        
        if (title.length > 100 || title.length < 10) {
            toast.error("Title must be between 10 and 100 characters");
            return;
        }
        
        if (value.length < 50) {
            toast.error("Content must be at least 50 characters");            
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("content", value);
        formData.append("title", title);
        
        if (selectedImages) {
            formData.append("image", selectedImages);
        }

        try {
            if (isEditMode) {
                await axios.put(`${backednUrl}/api/blogs/update-blog/${id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Blog updated successfully");
            } else {
                await axios.post(`${backednUrl}/api/blogs/save-blog`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Blog saved successfully");
            }
            
            // Reset form
            setValue("");
            setTitle("");
            setSelectedImages(false);
            setCurrentImageUrl("");
            
            // Refresh blogs data
            fetchBlogs();
            
            // Navigate back to blogs list
            navigate("/blogs");
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'saving'} blog`, error);
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Show confirmation if form has data
        if (title || value || selectedImages) {
            if (window.confirm("Are you sure you want to leave? All unsaved changes will be lost.")) {
                navigate("/blogs");
            }
        } else {
            navigate("/blogs");
        }
    };

    const getDisplayImage = () => {
        if (selectedImages) {
            return URL.createObjectURL(selectedImages);
        }
        if (isEditMode && currentImageUrl) {
            return currentImageUrl;
        }
        return upload_area;
    };

    if (isLoading) {
        return (
            <div className="px-4 my-10 space-y-5 lg:px-10">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p>Loading blog data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 my-10 space-y-5 lg:px-10">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Blogs
                </button>
                <h2 className="text-3xl font-semibold">
                    {isEditMode ? "Edit Blog" : "Add New Blog"}
                </h2>
            </div>

            {/* Form Container */}
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
                {/* Thumbnail Upload */}
                <div className="flex flex-col gap-2 mb-6 text-gray-500">
                    <p className="text-sm font-semibold">
                        {isEditMode ? "Update Thumbnail (optional)" : "Upload Thumbnail *"}
                    </p>
                    <label htmlFor="thumbnail" className="w-24 cursor-pointer">
                        <img 
                            className="w-24 h-24 object-cover bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors" 
                            src={getDisplayImage()}
                            alt="Upload thumbnail" 
                        />
                    </label>
                    <input 
                        type="file" 
                        id="thumbnail" 
                        hidden 
                        accept="image/*"
                        onChange={(e) => setSelectedImages(e.target.files[0])} 
                        className="mt-4" 
                    />
                    <p className="text-xs text-gray-400">
                        Click the image to {isEditMode ? "change" : "upload"} thumbnail
                    </p>
                </div>

                {/* Title Input */}
                <div className="flex flex-col w-full mb-6">
                    <label htmlFor="title" className="text-sm font-semibold mb-2">Blog Title *</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        id="title" 
                        className="px-3 py-2 border outline-none border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        placeholder="Enter an engaging blog title..." 
                        maxLength={100}
                    />
                    <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Content Editor */}
                <div className="mb-6">
                    <label className="text-sm font-semibold mb-2 block">Blog Content *</label>
                    <div className="border border-gray-300 rounded-md">
                        <ReactQuill 
                            theme="snow" 
                            value={value} 
                            onChange={setValue} 
                            modules={modules} 
                            placeholder="Write your blog content here..."
                            style={{ minHeight: '300px' }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                    <button 
                        onClick={handleCancel}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSubmitting 
                            ? (isEditMode ? "Updating..." : "Publishing...") 
                            : (isEditMode ? "Update Blog" : "Publish Blog")
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBlog;