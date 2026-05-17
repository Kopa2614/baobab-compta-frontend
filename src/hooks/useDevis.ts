import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Devis } from '@/types';

export function useDevis(params: { page?: number; statut?: string; search?: string } = {}) {
  return useQuery<PaginatedResponse<Devis>>({
    queryKey: ['devis', params],
    queryFn: async () => {
      const { data } = await api.get('/devis', {
        params: {
          page: params.page ?? 1,
          statut: params.statut || undefined,
          search: params.search || undefined,
        },
      });
      return data;
    },
  });
}

export function useDevisDetail(id: string) {
  return useQuery<Devis>({
    queryKey: ['devis', id],
    queryFn: async () => {
      const { data } = await api.get(`/devis/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post('/devis', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
    },
  });
}

export function useUpdateDevisStatut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: Devis['statut'] }) =>
      api.patch(`/devis/${id}/statut`, { statut }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['devis', id] });
    },
  });
}

export function useConvertirDevis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/devis/${id}/convertir`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
