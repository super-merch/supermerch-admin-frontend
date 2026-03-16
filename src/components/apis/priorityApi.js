import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
// Product-level prioritize APIs (CategoryDetails)
const PRIORITY_BASE_URL = `${backendUrl}/api/priority`;
// Supplier/category-level priorities (Prioritisation)
const CATEGORY_PRIORITY_BASE_URL = `${backendUrl}/api/priority`;

// ---------- Raw API functions ----------

export const fetchCategoryPriorities = async (categoryId) => {
  if (!categoryId) return null;
  const response = await axios.get(`${PRIORITY_BASE_URL}/${categoryId}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const addPriority = async ({ categoryId, categoryName, productId }) => {
  const response = await axios.post(
    `${PRIORITY_BASE_URL}/add`,
    {
      categoryId,
      categoryName,
      productId,
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

export const removePriority = async ({ categoryId, productId }) => {
  const response = await axios.post(
    `${PRIORITY_BASE_URL}/remove`,
    {
      categoryId,
      productId,
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

export const reorderPriority = async ({
  categoryId,
  productId,
  newPosition,
}) => {
  const response = await axios.post(
    `${PRIORITY_BASE_URL}/reorder`,
    {
      categoryId,
      productId,
      newPosition: Number(newPosition),
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

// ---------- Supplier/Category priority raw APIs ----------

export const upsertCategoryPriority = async ({
  supplierId,
  categoryId,
  priority,
}) => {
  const response = await axios.post(
    `${CATEGORY_PRIORITY_BASE_URL}/upsert`,
    {
      supplierId,
      categoryId,
      priority,
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

export const deleteCategoryPriority = async ({ supplierId, categoryId }) => {
  const response = await axios.delete(`${CATEGORY_PRIORITY_BASE_URL}`, {
    data: { supplierId, categoryId },
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

export const useCategoryPriorities = (categoryId, options = {}) =>
  useQuery({
    queryKey: ["priorities", categoryId],
    queryFn: () => fetchCategoryPriorities(categoryId),
    enabled: !!categoryId,
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

export const useReorderPriorityMutation = (categoryId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderPriority,
    onSuccess: () => {
      if (categoryId) {
        queryClient.invalidateQueries(["priorities", categoryId]);
      }
    },
  });
};

// ---------- React Query hooks (supplier/category priorities) ----------

export const useUpsertCategoryPriorityMutation = () =>
  useMutation({
    mutationFn: upsertCategoryPriority,
  });

export const useDeleteCategoryPriorityMutation = () =>
  useMutation({
    mutationFn: deleteCategoryPriority,
  });

export const useBulkImportCategoryPrioritiesMutation = () =>
  useMutation({
    mutationFn: bulkImportCategoryPriorities,
  });
