'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');

  const [vue, setVue] = useState<'login' | 'oublie'>('login');
  const [emailOublie, setEmailOublie] = useState('');
  const [oubliePending, setOubliePending] = useState(false);
  const [oublieSuccess, setOublieSuccess] = useState(false);
  const [oublieError, setOublieError] = useState('');

  async function handleOublie(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOublie.trim() || !emailOublie.includes('@')) {
      setOublieError('Adresse email invalide'); return;
    }
    setOubliePending(true);
    setOublieError('');
    try {
      await api.post('/auth/forgot-password', { email: emailOublie });
    } catch {}
    setOubliePending(false);
    setOublieSuccess(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" alt="Baobab Gestion" width={140} height={95} className="object-contain" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {vue === 'login' ? 'Connectez-vous à votre espace' : 'Réinitialiser le mot de passe'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* ── Formulaire connexion ── */}
          {vue === 'login' && (
            <form
              onSubmit={async (e) => { e.preventDefault(); await login(email, mot_de_passe); }}
              className="space-y-4"
            >
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
                required
              />
              <div className="space-y-1">
                <Input
                  label="Mot de passe"
                  type="password"
                  value={mot_de_passe}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setVue('oublie'); setEmailOublie(email); setOublieSuccess(false); setOublieError(''); }}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full justify-center mt-2" size="lg">
                Se connecter
              </Button>
            </form>
          )}

          {/* ── Formulaire mot de passe oublié ── */}
          {vue === 'oublie' && (
            <div className="space-y-4">
              {oublieSuccess ? (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-4 text-center">
                    <p className="text-sm font-semibold text-teal-700 mb-1">Email envoyé ✓</p>
                    <p className="text-xs text-teal-600">
                      Si cette adresse est enregistrée, vous recevrez les instructions de réinitialisation.
                    </p>
                  </div>
                  <button
                    onClick={() => setVue('login')}
                    className="w-full text-sm text-slate-500 hover:text-gray-700 font-medium"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOublie} className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Entrez votre adresse email. Vous recevrez un lien pour créer un nouveau mot de passe.
                  </p>
                  <Input
                    label="Adresse email"
                    type="email"
                    value={emailOublie}
                    onChange={(e) => setEmailOublie(e.target.value)}
                    placeholder="vous@example.com"
                    required
                  />
                  {oublieError && <p className="text-sm text-red-600">{oublieError}</p>}
                  <Button type="submit" loading={oubliePending} className="w-full justify-center" size="lg">
                    Envoyer le lien
                  </Button>
                  <button
                    type="button"
                    onClick={() => setVue('login')}
                    className="w-full text-sm text-slate-400 hover:text-gray-600 font-medium"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
