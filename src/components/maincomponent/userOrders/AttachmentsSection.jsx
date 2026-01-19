import React, { useEffect, useState } from "react";
import {
  FileText,
  Paperclip,
  UploadCloud,
  X,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import ActionButton from "../../ui/ActionButton";
import { toast } from "react-toastify";

export default function AttachmentsSection({ user, userOrders, userId }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${
    import.meta.env.VITE_CLOUDINARY_NAME
  }/upload`;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    mode: null, // 'add' | 'edit' | 'delete'
    attachment: null,
    formData: { fileName: "", file: null },
  });
  const [previewState, setPreviewState] = useState({
    open: false,
    attachment: null,
  });
  const [actionLoading, setActionLoading] = useState(null); // 'add' | 'edit' | 'delete'

  const fetchAllAttachments = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const allAttachments = [];

      const response = await fetch(
        `${backendUrl}/api/auth/get-order-attachments/${userId}`
      );
      const data = await response.json();

      if (response.ok && data.attachments) {
        data.attachments.forEach((att) => {
          allAttachments.push({
            ...att,
            orderId: userId,
            userId: userId,
            orderNumber: userId.slice(-6),
          });
        });
      }

      setAttachments(allAttachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      toast.error("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAttachments();
  }, [userId, backendUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload to Cloudinary");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleFiles = (files) => {
    const selected = files && files[0];
    if (!selected) return;

    // Create preview URL for images
    let previewUrl = null;
    if (selected.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(selected);
    }

    setFilePreview(previewUrl);
    setModalState((prev) => ({
      ...prev,
      formData: {
        file: selected,
        fileName: prev.formData.fileName || selected.name,
      },
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeFile = () => {
    // Revoke preview URL to free memory
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);

    // Clear file input
    const input = document.getElementById("attachment-file-input");
    if (input) {
      input.value = "";
    }

    setModalState((prev) => ({
      ...prev,
      formData: { ...prev.formData, file: null },
    }));
  };

  const closeModal = () => {
    // Clean up preview URL
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setModalState({
      open: false,
      mode: null,
      attachment: null,
      formData: { fileName: "", file: null },
    });
    setDragActive(false);
  };

  const openModal = (mode, attachment = null) => {
    // Clear any existing preview
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);

    setModalState({
      open: true,
      mode,
      attachment,
      formData: {
        fileName: attachment?.title || "",
        file: null,
      },
    });
  };

  const handleAddAttachment = async () => {
    const { fileName, file } = modalState.formData;
    if (!file || !fileName) {
      toast.error("Please provide both file name and file");
      return;
    }

    setActionLoading("add");
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);

      const response = await fetch(
        `${backendUrl}/api/auth/add-order-attachments/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachment: cloudinaryUrl,
            title: fileName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Attachment added successfully");
        await fetchAllAttachments();
        closeModal();
      } else {
        toast.error(data.message || "Failed to add attachment");
      }
    } catch (error) {
      console.error("Error adding attachment:", error);
      toast.error("Failed to add attachment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAttachment = async () => {
    const { fileName, file } = modalState.formData;
    const { attachment } = modalState;

    if (!fileName || !attachment) return;

    setActionLoading("edit");
    try {
      let attachmentUrl = attachment.attachment;

      if (file) {
        toast.info("Uploading file...");
        attachmentUrl = await uploadToCloudinary(file);
      }

      const response = await fetch(
        `${backendUrl}/api/auth/update-order-attachment/${userId}/${attachment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachment: attachmentUrl,
            title: fileName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Attachment updated successfully");
        await fetchAllAttachments();
        closeModal();
      } else {
        toast.error(data.message || "Failed to update attachment");
      }
    } catch (error) {
      console.error("Error updating attachment:", error);
      toast.error("Failed to update attachment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAttachment = async () => {
    const { attachment } = modalState;
    if (!attachment) return;

    setActionLoading("delete");
    try {
      const response = await fetch(
        `${backendUrl}/api/auth/delete-order-attachment/${userId}/${attachment._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Attachment deleted successfully");
        setAttachments((prev) =>
          prev.filter((att) => att._id !== attachment._id)
        );
        closeModal();
      } else {
        toast.error(data.message || "Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    } finally {
      setActionLoading(null);
    }
  };

  const formatSize = (size) => {
    if (!size && size !== 0) return "";
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Helper function to check if URL is an image
  const isImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    // Check for file extensions
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return true;
    // Check for data URLs
    if (url.startsWith("data:image/")) return true;
    // Check for Cloudinary URLs (they often have image format indicators)
    if (
      url.includes("cloudinary") &&
      /\.(jpg|jpeg|png|gif|webp)/i.test(url.split("/").pop())
    )
      return true;
    // Check content type from URL if available
    if (url.includes("image/")) return true;
    return false;
  };

  // Helper function to render file attachment view
  const renderFileView = (fileObj, previewUrl, title, showRemove = true) => {
    // Determine if it's an image and get the image URL
    let isImage = false;
    let imageUrl = null;

    if (previewUrl) {
      // Preview URL provided (for new file uploads)
      isImage = true;
      imageUrl = previewUrl;
    } else if (fileObj && typeof fileObj === "object" && fileObj.type) {
      // File object (new upload)
      isImage = fileObj.type.startsWith("image/");
      imageUrl = previewUrl;
    } else if (typeof fileObj === "string") {
      // URL string (existing attachment)
      isImage = isImageUrl(fileObj);
      imageUrl = fileObj;
    }

    const fileName = title || fileObj?.name || fileObj || "";

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {isImage && imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={fileName}
              className="w-full h-48 object-contain bg-white"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
            <div className="hidden w-full h-48 items-center justify-center bg-gray-100">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <div className="p-3 border-t border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ImageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-800 truncate">
                  {fileName}
                </span>
              </div>
              {showRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-800 truncate">{fileName}</span>
            </div>
            {showRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 mt-3">
        <div className="flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">User not found.</p>
        </div>
      </div>
    );
  }

  const isModalLoading =
    actionLoading === "add" ||
    actionLoading === "edit" ||
    actionLoading === "delete";

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-3">
        <div className="border-b border-gray-100 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Attachments</p>
              <p className="text-[11px] text-gray-500">
                Store files and documents related to this customer.
              </p>
            </div>
          </div>
          <ActionButton
            label="Add attachment"
            onClick={() => openModal("add")}
            variant="primary"
            size="sm"
          />
        </div>

        {loading ? (
          <div className="w-full h-full py-12 justify-center items-center flex">
            <div className="w-12 h-12 rounded-full border border-black border-dashed animate-spin"></div>
          </div>
        ) : attachments.length === 0 ? (
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <FileText className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              No attachments added yet.
            </p>
            <p className="text-[11px] text-gray-500">
              Click &quot;Add attachment&quot; to upload files for this
              customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Size
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Added
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attachments.map((att, index) => (
                  <tr key={att._id || att.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800">
                      <div
                        onClick={() =>
                          setPreviewState({ open: true, attachment: att })
                        }
                        className="flex items-center gap-1.5 cursor-pointer hover:text-teal-600 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[220px]">
                          {att.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {formatSize(att.attachment?.length)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {formatTime(att.date)}
                    </td>
                    <td className="px-3 py-2 flex gap-2 text-sm text-gray-700">
                      <ActionButton
                        label="Update"
                        onClick={() => openModal("edit", att)}
                        variant="primary"
                        size="sm"
                      />
                      <ActionButton
                        label="Delete"
                        onClick={() => openModal("delete", att)}
                        variant="danger"
                        size="sm"
                        loading={
                          actionLoading === "delete" &&
                          modalState.attachment?._id === att._id
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modalState.mode === "add" || modalState.mode === "edit") &&
        modalState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 rounded-lg">
                    <Paperclip className="w-4 h-4 text-teal-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {modalState.mode === "edit"
                      ? "Update Attachment"
                      : "Add Attachment"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    File name
                  </label>
                  <input
                    type="text"
                    value={modalState.formData.fileName}
                    onChange={(e) =>
                      setModalState((prev) => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          fileName: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter a friendly name for this file"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    File
                  </label>

                  {/* Show current attachment in edit mode */}
                  {modalState.mode === "edit" &&
                    modalState.attachment &&
                    !modalState.formData.file && (
                      <div className="mb-2">
                        {renderFileView(
                          modalState.attachment.attachment,
                          null,
                          `Current: ${modalState.attachment.title}`,
                          false
                        )}
                      </div>
                    )}

                  {/* Show selected/new file */}
                  {modalState.formData.file &&
                    renderFileView(
                      modalState.formData.file,
                      filePreview,
                      modalState.formData.file.name,
                      true
                    )}

                  {/* Upload area */}
                  <div
                    className={`border-2 border-dashed rounded-lg px-3 py-4 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                    } ${
                      modalState.formData.file ||
                      (modalState.mode === "edit" && modalState.attachment)
                        ? "mt-2"
                        : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      const input = document.getElementById(
                        "attachment-file-input"
                      );
                      if (input) input.click();
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud className="w-6 h-6 text-gray-400" />
                      <p className="text-sm font-medium text-gray-800">
                        {modalState.formData.file
                          ? "Replace file (drag & drop or click)"
                          : "Drag & drop your file here"}
                      </p>
                      {!modalState.formData.file && (
                        <p className="text-[11px] text-gray-500">
                          or click to browse from your computer
                        </p>
                      )}
                    </div>
                    <input
                      id="attachment-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={closeModal}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <ActionButton
                  label={modalState.mode === "edit" ? "Update" : "Add"}
                  onClick={
                    modalState.mode === "edit"
                      ? handleUpdateAttachment
                      : handleAddAttachment
                  }
                  disabled={
                    modalState.mode === "edit"
                      ? !modalState.formData.fileName
                      : !modalState.formData.file
                  }
                  variant="primary"
                  size="sm"
                  loading={isModalLoading}
                />
              </div>
            </div>
          </div>
        )}

      {/* Delete Modal */}
      {modalState.mode === "delete" && modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Delete Attachment
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &quot;
              {modalState.attachment?.title}&quot;? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label="Delete"
                onClick={handleDeleteAttachment}
                variant="danger"
                size="sm"
                loading={actionLoading === "delete"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewState.open && previewState.attachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-3 p-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 rounded-lg">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {previewState.attachment.title}
                </h2>
              </div>
              <button
                onClick={() =>
                  setPreviewState({ open: false, attachment: null })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
              <img
                src={previewState.attachment.attachment}
                alt={previewState.attachment.title}
                className="max-w-full max-h-[70vh] object-contain rounded"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="hidden flex-col items-center gap-2 text-gray-500">
                <FileText className="w-12 h-12" />
                <p className="text-sm">Preview not available</p>
                <a
                  href={previewState.attachment.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline text-sm"
                >
                  Open in new tab
                </a>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <a
                href={previewState.attachment.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
