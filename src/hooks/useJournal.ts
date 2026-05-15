import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, JournalEcriture, RapportMensuel } from '@/types';

export function useJournal(params: { date_debut: string; date_fin: string; page?: number }) {
  return useQuery<PaginatedResponse<JournalEcriture>>({
    queryKey: ['journal', params],
    queryFn: async () => {
      const { data } = await api.get('/journal', { params: { ...params, per_page: 50 } });
      return data;
    },
    enabled: !!(params.date_debut && params.date_fin),
  });
}

export function useRapportPeriode(date_debut: string, date_fin: string) {
  return useQuery<RapportMensuel>({
    queryKey: ['rapport-periode', date_debut, date_fin],
    queryFn: async () => {
      const { data } = await api.get('/rapports/mensuel', { params: { date_debut, date_fin } });
      return data;
    },
    enabled: !!(date_debut && date_fin),
  });
}
