import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { KpisDashboard, EvolutionPoint } from '@/types';

export function useDashboard(params: { date_debut: string; date_fin: string }) {
  return useQuery<KpisDashboard>({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard', { params });
      return data;
    },
  });
}

export function useDashboardEvolution(mois = 6) {
  return useQuery<EvolutionPoint[]>({
    queryKey: ['dashboard-evolution', mois],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/evolution', { params: { mois } });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
