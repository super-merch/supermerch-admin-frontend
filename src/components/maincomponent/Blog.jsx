import { useState, useEffect } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";

const Blog = () => {
    const { backednUrl, aToken, blogs, setBlogs, fetchBlogs } = useContext(AdminContext);
    const navigate = useNavigate();
    const [expandedBlogs, setExpandedBlogs] = useState({});
    const [deletingBlogs, setDeletingBlogs] = useState({});

    useEffect(() => {
        if (aToken) {
            fetchBlogs();
        }
    }, [aToken]);

    const toggleExpanded = (blogId) => {
        setExpandedBlogs(prev => ({
            ...prev,
            [blogId]: !prev[blogId]
        }));
    };

    const handleDeleteBlog = async (blogId, blogTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingBlogs(prev => ({ ...prev, [blogId]: true }));

        try {
            await axios.delete(`${backednUrl}/api/blogs/delete-blog/${blogId}`);
            
            // Remove the blog from local state
            setBlogs(prev => prev.filter(blog => blog._id !== blogId));
            
            toast.success("Blog deleted successfully");
        } catch (error) {
            console.error("Error deleting blog:", error);
            toast.error(error?.response?.data?.message || "Failed to delete blog");
        } finally {
            setDeletingBlogs(prev => ({ ...prev, [blogId]: false }));
        }
    };

    const stripHtmlTags = (html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
    };

    const getPreviewText = (content, maxLength = 200) => {
        const plainText = stripHtmlTags(content);
        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + "..."
            : plainText;
    };

    return (
        <div className="px-4 my-10 space-y-5 lg:px-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-semibold">All Blogs</h2>
                <button 
                    onClick={() => navigate('/add-blog')}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Add Blog
                </button>
            </div>
            {blogs.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    <p>No blogs found. Create your first blog!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Blog Image */}
                                    <div className="lg:w-1/3">
                                        <img 
                                            src={blog?.image} 
                                            alt={blog?.title}
                                            className="w-full h-48 object-cover rounded-md" 
                                        />
                                    </div>
                                    
                                    {/* Blog Content */}
                                    <div className="lg:w-2/3 space-y-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                                {blog?.title}
                                            </h1>
                                            <p className="text-sm text-indigo-600 mb-4">
                                                {blog.createdAt && new Date(blog?.createdAt).toDateString()}
                                            </p>
                                        </div>
                                        
                                        {/* Blog Content Preview */}
                                        <div className="prose max-w-none">
                                            <div 
                                                className="text-gray-700 line-clamp-4"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: blog?.content?.substring(0, 300) + (blog?.content?.length > 300 ? '...' : '') 
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Blog Actions */}
                                        <div className="flex gap-3 pt-4">
                                            <button onClick={() => toggleExpanded(blog._id)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                                                {expandedBlogs[blog._id] ? "VIew Less Content" : "View Full Content"}
                                            </button>
                                            
                                            <button onClick={()=>handleDeleteBlog(blog._id, blog.title)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Full Content - Only shown when expanded */}
                                {expandedBlogs[blog._id] && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold mb-3">Full Content:</h3>
                                        <div 
                                            className="prose max-w-none text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: blog?.content }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Blog;