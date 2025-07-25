// import { useState } from "react";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";

// const Blog = () => {

//     const modules = {
//         toolbar: [
//             [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
//             [{ list: "ordered" }, { list: "bullet" }],
//             ["bold", "italic", "underline", "strike"],
//             [{ align: [] }],
//             ["link", "image"],
//             ["clean"], // Remove formatting
//         ],
//     };

//     const [value, setValue] = useState("");

//     return (
//         <div className="px-4 my-10 space-y-5 lg:px-10 md:px-8 sm:px-6">
//             <div className="space-y-5">
//             <h2 className="text-3xl font-semibold text-center">React Quill Editor</h2>
//             <ReactQuill theme="snow" value={value} onChange={setValue} modules={modules}
//             className=""
//             placeholder="Write your blog here..."
//             />
//             </div>
//             <div className="mt-10">
//             <p className="text-sm font-semibold">Preview:</p>
//             <div dangerouslySetInnerHTML={{ __html: value }} />
//             </div>
//         </div>
//     );
// };

// export default Blog
























import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import upload_area from "../../assets/upload_area.png";

const Blog = () => {
    const [value, setValue] = useState("");
    const [selectedImages, setSelectedImages] = useState(false);
    const [title, setTitle] = useState("")

    const { backednUrl, aToken, blogs, setBlogs, fetchBlogs } = useContext(AdminContext)

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

    

    useEffect(() => {
        if (aToken) {
            fetchBlogs();
        }
    }, [aToken]);

    // const handleImageUpload = (e) => {
    //     setSelectedImages([...selectedImages, ...e.target.files]);
    // };

    const handleSubmit = async () => {
        if (!value) return toast.error("Content is required");

        const formData = new FormData();
        formData.append("content", value);
        formData.append("title", title);
        // selectedImages.forEach((image) => formData.append("images", image));
        selectedImages && formData.append("image", selectedImages);



        try {
            await axios.post(`${backednUrl}/api/blogs/save-blog`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setValue("");
            setTitle("")
            setSelectedImages(false);
            fetchBlogs();
            toast.success("Blog saved successfully");
        } catch (error) {
            console.error("Error saving blog", error);
            toast.error(error?.response?.data?.message || error.message);
        }
    };



    return (
        <div className="px-4 my-10 space-y-5 lg:px-10">
            <h2 className="text-3xl font-semibold text-center">Add New Blog</h2>

            <div className="flex flex-col gap-2 mb-8 text-gray-500">
                <p className='text-sm font-semibold'>Upload Thumbnail</p>
                <label htmlFor="thumbnail" className="w-20">
                    <img className='w-20 bg-gray-100 cursor-pointer' src={!selectedImages ? upload_area : URL.createObjectURL(selectedImages)}
                        alt="" />
                </label>
                <input type="file" id="thumbnail" hidden onChange={(e) => setSelectedImages(e.target.files[0])} className="mt-4" required />
            </div>
            <div className="flex flex-col w-full md:w-1/2">
                <label htmlFor="title" className="text-sm font-semibold">Title:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} id="title" className="px-2 py-1 border outline-none border-gray-400 rounded" placeholder="Enter blog title" required />
            </div>
            <ReactQuill theme="snow" value={value} onChange={setValue} modules={modules} placeholder="Write your blog..." />

            <button onClick={handleSubmit} className="px-4 flex py-2 mt-4 bg-blue-500 text-white rounded">
                Upload Blog
            </button>

            <h3 className="text-3xl font-semibold mt-10 text-center">All Blogs</h3>
            {blogs.map((blog) => (
                <div key={blog._id} className="p-2 border rounded-lg mt-4">
                    <div className="flex max-sm:flex-col gap-2 items-center">
                        <img src={blog?.image} className="w-28 max-sm:w-full rounded-md" />
                        <div className="">
                            <h1 className="text-gray-900 font-medium text-lg">{blog?.title}</h1>
                            <p className="text-sm text-indigo-600">{blog.createdAt && new Date(blog?.createdAt).toDateString()}</p>   
                        </div>
                    </div>
                    {/* <div dangerouslySetInnerHTML={{ __html: blog.content }} /> */}
                    {/* <div className="mt-4">
                        {blog.images?.map((img, index) => (
                            <img key={index} src={img} alt="blog-img" className="w-32 h-32 object-cover rounded-md" />
                        ))}
                    </div> */}
                </div>
            ))}
        </div>
    );
};

export default Blog;
