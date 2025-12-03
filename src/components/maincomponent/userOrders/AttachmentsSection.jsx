import React, { useEffect, useState } from "react";
import { FileText, Paperclip, UploadCloud, X, Package } from "lucide-react";
import ActionButton from "../../ui/ActionButton";
import { toast } from "react-toastify";

export default function AttachmentsSection({ user, userOrders }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${
    import.meta.env.VITE_CLOUDINARY_NAME
  }/upload`;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const [attachments, setAttachments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const fetchAllAttachments = async () => {
    if (!userOrders || userOrders.length === 0) return;

    setLoading(true);
    try {
      const allAttachments = [];

      for (const order of userOrders) {
        const response = await fetch(
          `${backendUrl}/api/auth/get-order-attachments/${order._id}`
        );
        const data = await response.json();

        if (response.ok && data.attachments) {
          data.attachments.forEach((att) => {
            allAttachments.push({
              ...att,
              orderId: order._id,
              orderNumber: order.orderNumber || order._id.slice(-6),
            });
          });
          console.log(data);
        }
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
  }, [userOrders, backendUrl]);

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 mt-3">
        <div className="flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">User not found.</p>
        </div>
      </div>
    );
  }
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
      return data.secure_url; // Returns the Cloudinary URL
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };
  const handleFiles = (files) => {
    const selected = files && files[0];
    if (!selected) return;
    setFile(selected);
    if (!fileName) {
      setFileName(selected.name);
    }
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

  const handleAddAttachment = async () => {
    if (!file || !fileName) {
      toast.error("Please provide both file name and file");
      return;
    }

    // Select the first order if multiple orders exist
    const orderId = userOrders[0]?._id;
    if (!orderId) {
      toast.error("No order found for this user");
      return;
    }

    setAddLoading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);

      toast.info("Uploading file...");
      const response = await fetch(
        `${backendUrl}/api/auth/add-order-attachments/${orderId}`,
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
        // Refresh attachments
        const refreshResponse = await fetch(
          `${backendUrl}/api/auth/get-order-attachments/${orderId}`
        );
        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.attachments) {
          const updatedAttachments = refreshData.attachments.map((att) => ({
            ...att,
            orderId,
            orderNumber: userOrders[0].orderNumber || orderId.slice(-6),
          }));
          setAttachments(updatedAttachments);
        }

        setIsModalOpen(false);
        setFile(null);
        setFileName("");
        setDragActive(false);
        setAddLoading(false);
      } else {
        toast.error(data.message || "Failed to add attachment");
      }
    } catch (error) {
      console.error("Error adding attachment:", error);
      toast.error("Failed to add attachment");
    } finally {
      setAddLoading(false);
    }
  };
  const handleUpdateAttachment = async () => {
    if (!file || !fileName || !selectedAttachment) return;
    setAddLoading(true);
    try {
      let attachmentUrl;

      // Only upload to Cloudinary if a new file is selected
      if (file) {
        toast.info("Uploading file...");
        attachmentUrl = await uploadToCloudinary(file);
      }

      const response = await fetch(
        `${backendUrl}/api/auth/update-order-attachment/${selectedAttachment.orderId}/${selectedAttachment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachment: attachmentUrl,
            title: file.name,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Attachment updated successfully");
        fetchAllAttachments();

        setIsModalOpen(false);
        setFile(null);
        setFileName("");
        setSelectedAttachment(null);
        setDragActive(false);
      } else {
        toast.error(data.message || "Failed to update attachment");
      }
    } catch (error) {
      console.error("Error updating attachment:", error);
      toast.error("Failed to update attachment");
    } finally {
      setAddLoading(false);
    }
  };
  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setDeleteLoading((prev) => ({ ...prev, [attachmentToDelete._id]: true }));
    try {
      const response = await fetch(
        `${backendUrl}/api/auth/delete-order-attachment/${attachmentToDelete.orderId}/${attachmentToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Attachment deleted successfully");
        setAttachments((prev) =>
          prev.filter((att) => att._id !== attachmentToDelete._id)
        );
        setIsDeleteModalOpen(false);
        setAttachmentToDelete(null);
      } else {
        toast.error(data.message || "Failed to delete attachment");
      }
      setIsModalOpen(false);
      setFile(null);
      setFileName("");
      setSelectedAttachment(null);
      setDragActive(false);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    } finally {
      setDeleteLoading((prev) => ({
        ...prev,
        [attachmentToDelete._id]: false,
      }));
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

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-3">
        <div className="border-b border-gray-100 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Attachments</p>
              <p className="text-[11px] text-gray-500">
                Store files and documents related to this customer.
              </p>
            </div>
          </div>
          <ActionButton
            label="Add attachment"
            onClick={() => setIsModalOpen(true)}
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
                  <tr key={att.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-800">
                      <div
                        onClick={() => {
                          setPreviewAttachment(att);
                          setPreviewModal(true);
                        }}
                        className="flex items-center gap-1.5 cursor-pointer hover:text-teal-600 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[220px]">
                          {att.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {formatSize(att.attachment.length)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {formatTime(att.date)}
                    </td>
                    <td className="px-3 py-2 flex gap-2 text-xs text-gray-700">
                      <ActionButton
                        label="Update"
                        onClick={() => {
                          setSelectedAttachment(att);
                          setFileName(att.title);
                          setIsModalOpen(true);
                        }}
                        variant="primary"
                        size="sm"
                      />
                      <ActionButton
                        label="Delete"
                        onClick={() => {
                          setAttachmentToDelete(att);
                          setIsDeleteModalOpen(true);
                        }}
                        variant="danger"
                        size="sm"
                        loading={deleteLoading[att._id]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Attachment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 rounded-lg">
                  <Paperclip className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {selectedAttachment ? "Update Attachment" : "Add Attachment"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                  setFileName("");
                  setDragActive(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  File name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a friendly name for this file"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">File</label>
                <div
                  className={`border-2 border-dashed rounded-lg px-3 py-4 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
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
                    <p className="text-xs font-medium text-gray-800">
                      Drag & drop your file here
                    </p>
                    <p className="text-[11px] text-gray-500">
                      or click to browse from your computer
                    </p>
                    {file && (
                      <p className="mt-1 text-[11px] text-teal-700">
                        Selected:{" "}
                        <span className="font-medium">{file.name}</span>
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
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                  setFileName("");
                  setDragActive(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label={selectedAttachment ? "Update" : "Add"}
                onClick={
                  selectedAttachment
                    ? handleUpdateAttachment
                    : handleAddAttachment
                }
                disabled={selectedAttachment ? !fileName : !file}
                variant="primary"
                size="sm"
                loading={addLoading}
              />
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Delete Attachment
              </h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setAttachmentToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{attachmentToDelete?.title}"?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setAttachmentToDelete(null);
                  setIsModalOpen(false);
                  setFile(null);
                  setFileName("");
                  setSelectedAttachment(null);
                  setDragActive(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                label="Delete"
                onClick={handleDeleteAttachment}
                variant="danger"
                size="sm"
                loading={deleteLoading[attachmentToDelete?._id]}
              />
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewModal && previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-3 p-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 rounded-lg">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {previewAttachment.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setPreviewModal(false);
                  setPreviewAttachment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
              <img
                src={previewAttachment.attachment}
                alt={previewAttachment.title}
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
                  href={previewAttachment.attachment}
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
                href={previewAttachment.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
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
