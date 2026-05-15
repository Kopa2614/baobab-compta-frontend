import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Produit } from '@/types';

export function useProduits(search = '') {
  return useQuery<PaginatedResponse<Produit>>({
    queryKey: ['produits', search],
    queryFn: async () => {
      const { data } = await api.get('/produits', {
        params: { search: search || undefined },
      });
      return data;
    },
  });
}

export function useAllProduits() {
  return useQuery<Produit[]>({
    queryKey: ['produits-all'],
    queryFn: async () => {
      const { data } = await api.get('/produits/all');
      return data;
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateProduit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/produits', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['produits-all'] });
    },
  });
}

export function useUpdateProduit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Record<string, unknown>) =>
      api.put(`/produits/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['produits-all'] });
    },
  });
}

export function useToggleProduit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/produits/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['produits-all'] });
    },
  });
}
