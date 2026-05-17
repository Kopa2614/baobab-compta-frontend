import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginatedResponse, Facture } from '@/types';

export function useFactures(params: {
  page?: number;
  statut?: string;
  search?: string;
  date_debut?: string;
  date_fin?: string;
}) {
  return useQuery<PaginatedResponse<Facture>>({
    queryKey: ['factures', params],
    queryFn: async () => {
      const { data } = await api.get('/factures', {
        params: {
          page: params.page ?? 1,
          statut: params.statut || undefined,
          search: params.search || undefined,
          date_debut: params.date_debut || undefined,
          date_fin: params.date_fin || undefined,
        },
      });
      return data;
    },
  });
}

export function useFacture(id: string) {
  return useQuery<Facture>({
    queryKey: ['factures', id],
    queryFn: async () => {
      const { data } = await api.get(`/factures/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post('/factures', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useSendFactureEmail() {
  return useMutation({
    mutationFn: ({ id, email, pdfBase64 }: { id: string; email: string; pdfBase64: string }) =>
      api.post(`/factures/${id}/envoyer-email`, { email, pdf_base64: pdfBase64 }).then((r) => r.data),
  });
}

export function useAnnulerFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      api.patch(`/factures/${id}/annuler`, { motif }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
