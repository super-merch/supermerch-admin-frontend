import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOneQuery } from "../apis/ContactApi";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaCalendar,
  FaClock,
  FaComments,
  FaEnvelope,
  FaPhone,
  FaSync,
  FaTag,
  FaUser,
} from "react-icons/fa";

const UserQuery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueryDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQueryDetail = async () => {
    try {
      setLoading(true);
      const response = await getOneQuery(id);
      setQuery(response?.data);
    } catch (error) {
      toast.error("Error fetching query details");
      console.error("Error fetching query details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "—";
    const now = Date.now();
    const value = new Date(dateString).getTime();
    const diff = Math.max(0, now - value);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const initials = useMemo(() => {
    if (!query?.name) return "?";
    const parts = query.name.trim().split(" ").filter(Boolean);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-2xl px-6 py-5 flex items-center gap-3 border border-slate-200/80">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Loading query
            </p>
            <p className="text-xs text-slate-500">Fetching details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Query not found
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            The requested query could not be located. It may have been removed
            or the link is invalid.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-10">
        {/* Top actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow transition"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
              Back to queries
            </button>
            <button
              onClick={fetchQueryDetail}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <FaSync
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {/* Main content */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <FaComments className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Title
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {query.title || "Untitled query"}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {query.message || "No message provided."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    <FaCalendar className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Timeline
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Submission activity
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Submitted
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatDate(query.createdAt)} •{" "}
                        {formatTimeAgo(query.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Last updated
                      </p>
                      <p className="text-xs text-slate-600">
                        {query.updatedAt
                          ? `${formatDate(query.updatedAt)} • ${formatTimeAgo(
                              query.updatedAt
                            )}`
                          : "Not updated yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FaUser className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Contact
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Profile
                    </p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {query.name || "Unknown contact"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created {formatTimeAgo(query.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-800">
                    <div className="flex items-center gap-2 break-all">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FaEnvelope className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                          Email
                        </p>
                        <p className="font-medium">
                          {query.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FaPhone className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                          Phone
                        </p>
                        <p className="font-medium">
                          {query.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FaTag className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                          Type
                        </p>
                        <p className="font-medium">
                          {query.type || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserQuery;
