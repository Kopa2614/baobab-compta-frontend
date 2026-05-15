import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Client } from '@/types';

export function useClients(page = 1, search = '') {
  return useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', page, search],
    queryFn: async () => {
      const { data } = await api.get('/clients', {
        params: { page, search: search || undefined },
      });
      return data;
    },
  });
}

export function useAllClients() {
  return useQuery<Client[]>({
    queryKey: ['clients-all'],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: { per_page: 200 } });
      return data.data ?? data;
    },
    staleTime: 1000 * 30,
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api.post('/clients', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Record<string, string>) =>
      api.put(`/clients/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useToggleClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/clients/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
