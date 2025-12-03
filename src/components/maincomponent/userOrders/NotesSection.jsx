import React, { useState, useEffect } from "react";
import { StickyNote, Paperclip, Clock, Trash2, Edit2 } from "lucide-react";
import ActionButton from "../../ui/ActionButton";
import { toast } from "react-toastify";

export default function NotesSection({ userId,userOrders  }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [notesHistory, setNotesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    if (userOrders && userOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(userOrders[0]._id);
    }
  }, [userOrders])
  // Fetch notes on mount
  useEffect(() => {
    if (selectedOrderId) {
      fetchNotes();
    }
  }, [selectedOrderId]);

  const fetchNotes = async () => {
    if (!selectedOrderId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/user-orders/get-order-notes/${selectedOrderId}`  // Changed endpoint
      );
      const data = await response.json();

      if (response.ok) {
        setNotesHistory(data.notes || []);
      } else {
        toast.error(data.message || "Failed to load notes");
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const onAddNote = async () => {
    const trimmed = noteText.trim();

    if (!trimmed) {
      toast.error("Note cannot be empty");
      return;
    }

    if (!selectedOrderId) {
      toast.error("Please select an order");
      return;
    }

    setAddLoading(true);
    try {
      let attachmentsData = [];
      if (selectedFiles.length > 0) {
        attachmentsData = await Promise.all(
          selectedFiles.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve({
                name: file.name,
                data: reader.result,
                size: file.size,
              });
              reader.onerror = reject;
            });
          })
        );
      }

      const response = await fetch(
        `${backendUrl}/api/user-orders/add-order-note/${selectedOrderId}`,  // Changed endpoint
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmed,
            attachments: JSON.stringify(attachmentsData),
            addedBy: "Admin",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Note added successfully");
        setNoteText("");
        setSelectedFiles([]);
        setFileInputKey((prev) => prev + 1);
        await fetchNotes();
      } else {
        toast.error(data.message || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedOrderId) return;
    
    setDeleteLoading(prev => ({ ...prev, [noteId]: true }));
    try {
      const response = await fetch(
        `${backendUrl}/api/user-orders/delete-order-note/${selectedOrderId}/${noteId}`,  // Changed endpoint
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Note deleted successfully");
        setNotesHistory(prev => prev.filter(note => note._id !== noteId));
      } else {
        toast.error(data.message || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteLoading(prev => ({ ...prev, [noteId]: false }));
    }
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
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mt-3 space-y-4">
      {/* Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 rounded-lg">
              <StickyNote className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Internal Notes
              </p>
              <p className="text-[11px] text-gray-500">
                Keep quick remarks and attach related files.
              </p>
            </div>
          </div>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          placeholder="Add internal notes about this customer..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          disabled={addLoading}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
              <Paperclip className="w-3.5 h-3.5 text-gray-500" />
              <span>Attach files</span>
              <input
                key={fileInputKey}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={addLoading}
              />
            </label>
            {selectedFiles.length > 0 && (
              <p className="text-[11px] text-gray-500">
                {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
          <ActionButton
            label={addLoading ? "Adding..." : "Add Note"}
            onClick={onAddNote}
            variant="primary"
            size="sm"
            disabled={addLoading}
            loading={addLoading}
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 p-2">
            <p className="text-[11px] font-medium text-gray-600 mb-1">
              Attachments to add:
            </p>
            <ul className="space-y-0.5 max-h-24 overflow-auto pr-1">
              {selectedFiles.map((file) => (
                <li
                  key={file.name + file.size}
                  className="text-[11px] text-gray-700 flex items-center gap-1.5"
                >
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Previous Notes */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            Previous Notes
          </p>
          {notesHistory.length > 0 && (
            <p className="text-[11px] text-gray-500">
              {notesHistory.length} note
              {notesHistory.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="w-8 h-8 border-3 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500">Loading notes...</p>
          </div>
        ) : notesHistory.length === 0 ? (
          <p className="text-[11px] text-gray-500">
            No notes added yet for this customer.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1 custom-scrollbar">
            {notesHistory.map((note) => (
              <div
                key={note._id}
                className="border border-gray-100 rounded-md px-2.5 py-2 bg-gray-50/60 relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-gray-700">
                    {formatTime(note.createdAt)} • {note.addedBy || "Admin"}
                  </p>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    disabled={deleteLoading[note._id]}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity disabled:opacity-50"
                  >
                    {deleteLoading[note._id] ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {note.text && (
                  <p className="text-xs text-gray-800 whitespace-pre-line mb-1">
                    {note.text}
                  </p>
                )}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {note.attachments.map((file, idx) => (
                      <span
                        key={file.name + idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-700"
                      >
                        <Paperclip className="w-3 h-3 text-gray-500" />
                        <span className="truncate max-w-[120px]">
                          {file.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}