import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, FraisGeneraux, CategorieFrais } from '@/types';

export function useCreateCategorie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nom: string; description?: string }) =>
      api.post('/frais/categories', payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['frais-categories'] }),
  });
}

export function useUpdateCategorie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; nom: string; description?: string }) =>
      api.put(`/frais/categories/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['frais-categories'] }),
  });
}

export function useDeleteCategorie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/frais/categories/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['frais-categories'] }),
  });
}

export function useFrais(page = 1) {
  return useQuery<PaginatedResponse<FraisGeneraux>>({
    queryKey: ['frais', page],
    queryFn: async () => {
      const { data } = await api.get('/frais', { params: { page } });
      return data;
    },
  });
}

export function useFraisCategories() {
  return useQuery<CategorieFrais[]>({
    queryKey: ['frais-categories'],
    queryFn: async () => {
      const { data } = await api.get('/frais/categories');
      return data;
    },
  });
}

export function useCreateFrais() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post('/frais', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
