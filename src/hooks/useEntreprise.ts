import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Entreprise } from '@/types';

export function useEntreprise() {
  return useQuery<Entreprise>({
    queryKey: ['entreprise'],
    queryFn: async () => {
      const { data } = await api.get('/entreprise');
      return data;
    },
  });
}

export function useUpdateEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Entreprise>) =>
      api.put('/entreprise', payload).then((r) => r.data),
    onSuccess: (updated: Entreprise) => {
      queryClient.invalidateQueries({ queryKey: ['entreprise'] });
      // Synchroniser localStorage pour que le Header reflète les nouveaux infos
      try {
        const raw = localStorage.getItem('baobab_user');
        if (raw) {
          const stored = JSON.parse(raw);
          stored.entreprise = { ...stored.entreprise, ...updated };
          localStorage.setItem('baobab_user', JSON.stringify(stored));
          window.dispatchEvent(new CustomEvent('baobab_user_updated'));
        }
      } catch {}
    },
  });
}
