import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
// Product-level prioritize APIs (CategoryDetails)
const PRIORITY_BASE_URL = `${backendUrl}/api/priority`;
// Supplier/category-level priorities (Prioritisation)
const CATEGORY_PRIORITY_BASE_URL = `${backendUrl}/api/priority`;

// ---------- Raw API functions ----------

export const fetchPriorities = async () => {
  const response = await axios.get(`${PRIORITY_BASE_URL}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const addPriority = async (payload) => {
  const response = await axios.post(`${PRIORITY_BASE_URL}/add`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const removePriority = async ({ id }) => {
  const response = await axios.delete(`${PRIORITY_BASE_URL}/remove`, {
    data: { id },
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const bulkImportCategoryPriorities = async ({ items }) => {
  const response = await axios.post(
    `${CATEGORY_PRIORITY_BASE_URL}/bulk`,
    { items },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

// ---------- React Query hooks (product prioritize) ----------

export const usePriorities = (options = {}) =>
  useQuery({
    queryKey: ["priorities"],
    queryFn: fetchPriorities,
    ...options,
  });

export const useAddPriorityMutation = (categoryId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPriority,
    onSuccess: () => {
      if (categoryId) {
        queryClient.invalidateQueries(["priorities", categoryId]);
      }
    },
  });
};

export const useRemovePriorityMutation = (categoryId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePriority,
    onSuccess: () => {
      if (categoryId) {
        queryClient.invalidateQueries(["priorities", categoryId]);
      }
    },
  });
};

export const useBulkImportCategoryPrioritiesMutation = () =>
  useMutation({
    mutationFn: bulkImportCategoryPriorities,
  });
