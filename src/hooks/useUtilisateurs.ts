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

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ ancien, nouveau }: { ancien: string; nouveau: string }) =>
      api.put('/profile/password', { ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau }).then((r) => r.data),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/utilisateurs/${id}/password`, { password }).then((r) => r.data),
  });
}
