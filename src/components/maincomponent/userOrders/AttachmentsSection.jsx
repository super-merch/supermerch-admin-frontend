import React, { useState } from "react";
import { FileText, Paperclip, UploadCloud, X, Package } from "lucide-react";
import ActionButton from "../../ui/ActionButton";

export default function AttachmentsSection({ user }) {
  const [attachments, setAttachments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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

  const handleAddAttachment = () => {
    if (!file) return;
    const newAttachment = {
      id: Date.now(),
      name: fileName || file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [newAttachment, ...prev]);
    setIsModalOpen(false);
    setFile(null);
    setFileName("");
    setDragActive(false);
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

        {attachments.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {attachments.map((att, index) => (
                  <tr key={att.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[220px]">
                          {att.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {formatSize(att.size)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">
                      {formatTime(att.createdAt)}
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
                  Add Attachment
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
                label="Add"
                onClick={handleAddAttachment}
                disabled={!file}
                variant="primary"
                size="sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
