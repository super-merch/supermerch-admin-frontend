import { useState, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import upload_area from "../../assets/upload_area.png";
import { useLocation } from "react-router-dom";
import { meta } from "@eslint/js";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AddBlog = () => {
  const [content, setContent] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const { backednUrl, fetchBlogs } = useContext(AdminContext);
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get("id");
  const isEditMode = !!id;

  // ReactQuill modules with image handler
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: [] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["blockquote", "code-block"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
    "blockquote",
    "code-block",
  ];

  // Fetch blog data for editing
  useEffect(() => {
    if (isEditMode) {
      fetchBlogData();
    }
  }, [id]);

  const fetchBlogData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${backednUrl}/api/blogs/get-blog/${id}`
      );
      const blog = response.data.blog;

      setTitle(blog.title);
      setContent(blog.content);
      setCurrentImageUrl(blog.image);
      setMetaTitle(blog.metaTitle);
      setMetaDescription(blog.metaDescription);
    } catch (error) {
      console.error("Error fetching blog:", error);
      toast.error("Failed to load blog data");
      navigate("/blogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }


    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Content is required");
      return;
    }

    if (!isEditMode && !thumbnailFile) {
      toast.error("Thumbnail image is required");
      return;
    }

    if (title.length > 100 || title.length < 10) {
      toast.error("Title must be between 10 and 100 characters");
      return;
    }
    if(!metaTitle){
      toast.error("Meta Title is required")
      return;
    }
    if(!metaDescription){
      toast.error("Meta Description is required")
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("content", content);
    formData.append("title", title);
    formData.append("metaTitle", metaTitle);
    formData.append("metaDescription", metaDescription);

    if (thumbnailFile) {
      formData.append("image", thumbnailFile);
    }

    try {
      let response;
      if (isEditMode) {
        response = await axios.put(
          `${backednUrl}/api/blogs/update-blog/${id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
        );
      } else {
        response = await axios.post(
          `${backednUrl}/api/blogs/save-blog`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
        );
      }

      toast.success(
        response.data.message ||
          `Blog ${isEditMode ? "updated" : "published"} successfully`
      );

      // Reset form
      setContent("");
      setTitle("");
      setThumbnailFile(null);
      setCurrentImageUrl("");

      fetchBlogs();
      navigate("/blogs");
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "saving"} blog`, error);

      if (error.code === "ECONNABORTED") {
        toast.error("Upload timeout. Please try with a smaller image.");
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Failed to save blog. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || content !== "" || thumbnailFile) {
      if (
        window.confirm(
          "Are you sure you want to leave? All unsaved changes will be lost."
        )
      ) {
        navigate("/blogs");
      }
    } else {
      navigate("/blogs");
    }
  };

  const getThumbnailPreview = () => {
    if (thumbnailFile) {
      return URL.createObjectURL(thumbnailFile);
    }
    if (isEditMode && currentImageUrl) {
      return currentImageUrl;
    }
    return upload_area;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading blog data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="group flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm mb-4"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blogs
          </button>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
            </h1>
          </div>
          <p className="mt-2 text-gray-600 ml-7">
            {isEditMode
              ? "Update your blog post content and settings"
              : "Share your thoughts and ideas with the world"}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Thumbnail Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Featured Image{" "}
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <p className="text-sm text-gray-500">
                This image will be used as the thumbnail for your blog post
              </p>
              <div className="flex items-start gap-6">
                <label
                  htmlFor="thumbnail"
                  className="relative group cursor-pointer flex-shrink-0"
                >
                  <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-all duration-200 bg-gray-50 group-hover:bg-blue-50">
                    <img
                      className="w-full h-full object-cover"
                      src={getThumbnailPreview()}
                      alt="Thumbnail preview"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-xl">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {thumbnailFile || currentImageUrl ? "Change" : "Upload"}
                    </span>
                  </div>
                </label>
                <input
                  type="file"
                  id="thumbnail"
                  hidden
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                />
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Image Requirements:</p>
                    <ul className="space-y-1 list-disc list-inside text-gray-500">
                      <li>Recommended size: 1200x630 pixels</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Formats: JPG, PNG, WebP</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>
            {/* input for metaTitle and metaDescription */}
            <div className="space-y-3">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900"
              >
                Meta Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                id="title"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                placeholder="Enter an engaging blog title..."
                maxLength={100}
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900"
              >
                Meta Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                id="title"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                placeholder="Enter an engaging blog title..."
                maxLength={100}
              />
            </div>

            {/* Title Section */}
            <div className="space-y-3">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900"
              >
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="title"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                placeholder="Enter an engaging blog title..."
                maxLength={100}
              />
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500">
                  A compelling title helps attract readers
                </p>
                <span
                  className={`font-medium ${
                    title.length > 90 ? "text-orange-500" : "text-gray-400"
                  }`}
                >
                  {title.length}/100
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Content Editor Section */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Blog Content <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500">
                Use the rich text editor below. You can add images directly into
                your content using the image button in the toolbar.
              </p>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Start writing your blog content here... Use the toolbar to format text and insert images."
                  className="bg-white"
                  style={{ minHeight: "400px" }}
                />
              </div>
              <p className="text-xs text-gray-400">
                💡 Tip: Click the image icon in the toolbar to insert images
                directly into your content
              </p>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isEditMode
                ? "Changes will be visible immediately after updating"
                : "Your blog will be published immediately"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Publishing..."
                  : isEditMode
                  ? "Update Blog"
                  : "Publish Blog"}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Quick Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Use headings to structure your content for better
                  readability
                </li>
                <li>
                  • Add images throughout your content using the image button in
                  the editor
                </li>
                <li>
                  • Keep paragraphs short and focused for better engagement
                </li>
                <li>• Preview your content before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBlog;
