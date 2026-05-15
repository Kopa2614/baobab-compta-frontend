'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    entreprise_nom: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    mot_de_passe_confirm: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.mot_de_passe !== form.mot_de_passe_confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        entreprise_nom: form.entreprise_nom,
        nom: form.nom,
        prenom: form.prenom || undefined,
        email: form.email,
        telephone: form.telephone || undefined,
        mot_de_passe: form.mot_de_passe,
      });
      setToken(data.token);
      localStorage.setItem(
        'baobab_user',
        JSON.stringify({ utilisateur: data.utilisateur, entreprise: data.entreprise })
      );
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Baobab Gestion" width={140} height={95} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer votre compte</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion simplifiée pour votre entreprise</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {/* Entreprise */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Votre entreprise</p>
            <Input
              label="Nom de l'entreprise *"
              value={form.entreprise_nom}
              onChange={(e) => set('entreprise_nom', e.target.value)}
              required
            />
          </div>

          {/* Identité */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Votre compte</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nom *"
                  value={form.nom}
                  onChange={(e) => set('nom', e.target.value)}
                  required
                />
                <Input
                  label="Prénom"
                  value={form.prenom}
                  onChange={(e) => set('prenom', e.target.value)}
                />
              </div>
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
              <Input
                label="Téléphone"
                type="tel"
                value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mot de passe</p>
            <Input
              label="Mot de passe *"
              type="password"
              value={form.mot_de_passe}
              onChange={(e) => set('mot_de_passe', e.target.value)}
              required
            />
            <Input
              label="Confirmer le mot de passe *"
              type="password"
              value={form.mot_de_passe_confirm}
              onChange={(e) => set('mot_de_passe_confirm', e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full justify-center">
            Créer mon compte
          </Button>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          En créant un compte, vous acceptez les conditions d'utilisation de Baobab Gestion.
        </p>
      </div>
    </div>
  );
}
