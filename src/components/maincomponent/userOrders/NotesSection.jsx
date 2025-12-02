import React, { useState } from "react";
import { StickyNote, Paperclip, Clock } from "lucide-react";
import ActionButton from "../../ui/ActionButton";
import { toast } from "react-toastify";

export default function NotesSection({ userId }) {
  const backednUrl = import.meta.env.VITE_BACKEND_URL;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [notesHistory, setNotesHistory] = useState([]);
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const onAddNote = async (userId, text, files) => {
    const trimmed = text.trim();

    if (!trimmed) toast.error("Note cannot be empty");

    const newNote = {
      text: trimmed,
      attachments: files,
    };

    setNoteText("");

    const response = await fetch(
      `${backednUrl}/api/user-orders/add-order-note/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      }
    );
    const data = await response.json();
    if (response.ok) {
      toast.success("Note added successfully");
      setNotesHistory((prev) => [data, ...prev]);
    } else {
      toast.error("Failed to add note");
    }
  };

  const handleAdd = () => {
    onAddNote(userId, noteText, selectedFiles);
    setFileInputKey((prev) => prev + 1);
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
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {/* <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
              <Paperclip className="w-3.5 h-3.5 text-gray-500" />
              <span>Attach files</span>
              <input
                key={fileInputKey}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {selectedFiles.length > 0 && (
              <p className="text-[11px] text-gray-500">
                {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div> */}
          <ActionButton
            label="Add Note"
            onClick={handleAdd}
            variant="primary"
            size="sm"
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
              {notesHistory.length > 1 ? "s" : ""} in this session
            </p>
          )}
        </div>
        {notesHistory.length === 0 ? (
          <p className="text-[11px] text-gray-500">
            No notes added yet for this customer.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1 custom-scrollbar">
            {notesHistory.map((note) => (
              <div
                key={note.id}
                className="border border-gray-100 rounded-md px-2.5 py-2 bg-gray-50/60"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium text-gray-700">
                    {formatTime(note.createdAt)}
                  </p>
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
                        key={file.name + file.size + idx}
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
