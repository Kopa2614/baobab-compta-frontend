import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Utilisateur } from '@/types';

export function useUtilisateurs() {
  return useQuery<Utilisateur[]>({
    queryKey: ['utilisateurs'],
    queryFn: async () => {
      const { data } = await api.get('/utilisateurs');
      return data;
    },
  });
}

export function useCreateUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post('/utilisateurs', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    },
  });
}

export function useToggleUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/utilisateurs/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    },
  });
}
