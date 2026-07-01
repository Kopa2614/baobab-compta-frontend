'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, removeToken } from '@/lib/auth';
import type { Utilisateur, Entreprise } from '@/types';

interface AuthState {
  utilisateur: Utilisateur | null;
  entreprise: Entreprise | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ utilisateur: null, entreprise: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function readStorage() {
      const stored = localStorage.getItem('baobab_user');
      if (stored) {
        try { setState(JSON.parse(stored)); } catch {}
      }
    }

    readStorage();
    window.addEventListener('baobab_user_updated', readStorage);
    return () => window.removeEventListener('baobab_user_updated', readStorage);
  }, []);

  async function login(email: string, mot_de_passe: string, force = false): Promise<'needs_confirmation' | void> {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, mot_de_passe, force });
      if (data.needs_confirmation) {
        return 'needs_confirmation';
      }
      localStorage.removeItem('baobab_admin_session');
      setToken(data.token);
      const authState: AuthState = { utilisateur: data.utilisateur, entreprise: data.entreprise };
      setState(authState);
      localStorage.setItem('baobab_user', JSON.stringify(authState));
      router.push(data.utilisateur.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    removeToken();
    localStorage.removeItem('baobab_user');
    localStorage.removeItem('baobab_admin_session');
    setState({ utilisateur: null, entreprise: null });
    router.push('/login');
  }

  return { ...state, loading, error, login, logout };
}
