import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { startImpersonation } from '@/lib/impersonate';
import type { EntrepriseAdmin } from '@/types';

export function useAdminDashboard() {
  return useQuery<{
    total_entreprises: number;
    entreprises_actives: number;
    entreprises_inactives: number;
    total_utilisateurs: number;
    nouvelles_ce_mois: number;
  }>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
  });
}

export function useAdminEntreprises(search = '') {
  return useQuery<{ data: EntrepriseAdmin[]; total: number; last_page: number }>({
    queryKey: ['admin', 'entreprises', search],
    queryFn: () => api.get('/admin/entreprises', { params: { search: search || undefined } }).then((r) => r.data),
  });
}

export function useAdminEntreprise(id: string) {
  return useQuery<EntrepriseAdmin>({
    queryKey: ['admin', 'entreprises', id],
    queryFn: () => api.get(`/admin/entreprises/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateAdminEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      nom: string;
      email?: string;
      telephone?: string;
      adresse?: string;
      ninea?: string;
      gerant_nom: string;
      gerant_prenom?: string;
      gerant_email: string;
      gerant_telephone?: string;
      gerant_password: string;
    }) => api.post('/admin/entreprises', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useToggleAdminEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/entreprises/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useToggleAdminUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/utilisateurs/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/utilisateurs/${id}/reset-password`, { nouveau_mot_de_passe: password }).then((r) => r.data),
  });
}

export function useSuperAdmins() {
  return useQuery<{ id: string; nom: string; prenom?: string; email: string; telephone?: string; actif: boolean; created_at: string }[]>({
    queryKey: ['admin', 'super-admins'],
    queryFn: () => api.get('/admin/super-admins').then((r) => r.data),
  });
}

export function useResetSuperAdminPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/super-admins/${id}/reset-password`, { nouveau_mot_de_passe: password }).then((r) => r.data),
  });
}

export function useCreateSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nom: string; prenom?: string; email: string; telephone?: string; password: string }) =>
      api.post('/admin/super-admins', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'super-admins'] });
    },
  });
}

export function useImpersonate() {
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/entreprises/${id}/impersonate`).then((r) => r.data),
    onSuccess: (data) => {
      startImpersonation(data.token, data.utilisateur, data.entreprise);
      router.push('/dashboard');
    },
  });
}
