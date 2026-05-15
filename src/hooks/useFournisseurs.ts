import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Fournisseur } from '@/types';

export function useFournisseurs(page = 1, search = '') {
  return useQuery<PaginatedResponse<Fournisseur>>({
    queryKey: ['fournisseurs', page, search],
    queryFn: async () => {
      const { data } = await api.get('/fournisseurs', {
        params: { page, search: search || undefined },
      });
      return data;
    },
  });
}

export function useFournisseur(id: string) {
  return useQuery<Fournisseur>({
    queryKey: ['fournisseurs', id],
    queryFn: async () => {
      const { data } = await api.get(`/fournisseurs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api.post('/fournisseurs', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
    },
  });
}

export function useUpdateFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Record<string, string>) =>
      api.put(`/fournisseurs/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
    },
  });
}

export function useToggleFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/fournisseurs/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
    },
  });
}
