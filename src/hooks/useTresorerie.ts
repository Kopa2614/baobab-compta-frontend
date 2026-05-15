import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, OperationTresorerie, CompteBancaire, Caisse } from '@/types';

export function useCreateCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/comptes-bancaires', payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes-bancaires'] }),
  });
}

export function useUpdateCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; nom: string; banque?: string; numero_compte?: string }) =>
      api.put(`/comptes-bancaires/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes-bancaires'] }),
  });
}

export function useToggleCompteBancaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/comptes-bancaires/${id}/toggle`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes-bancaires'] }),
  });
}

export function useCreateCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/caisses', payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caisses'] }),
  });
}

export function useUpdateCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; nom: string }) =>
      api.put(`/caisses/${id}`, payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caisses'] }),
  });
}

export function useToggleCaisse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/caisses/${id}/toggle`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caisses'] }),
  });
}

export function useTresorerie(params: {
  source?: 'banque' | 'caisse';
  page?: number;
}) {
  return useQuery<PaginatedResponse<OperationTresorerie>>({
    queryKey: ['tresorerie', params],
    queryFn: async () => {
      const { data } = await api.get('/tresorerie', { params: { ...params, per_page: 20 } });
      return data;
    },
  });
}

export function useComptesBancaires(all = false) {
  return useQuery<CompteBancaire[]>({
    queryKey: ['comptes-bancaires', { all }],
    queryFn: async () => {
      const { data } = await api.get('/comptes-bancaires', { params: all ? { all: 1 } : {} });
      return data;
    },
  });
}

export function useCaisses(all = false) {
  return useQuery<Caisse[]>({
    queryKey: ['caisses', { all }],
    queryFn: async () => {
      const { data } = await api.get('/caisses', { params: all ? { all: 1 } : {} });
      return data;
    },
  });
}

export function useEnregistrerOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post('/tresorerie', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tresorerie'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['comptes-bancaires'] });
      queryClient.invalidateQueries({ queryKey: ['caisses'] });
    },
  });
}
