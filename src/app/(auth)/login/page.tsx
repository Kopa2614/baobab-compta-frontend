'use client';
import { useState } from 'react';
import { Dancing_Script } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';

const dancing = Dancing_Script({ subsets: ['latin'], weight: '700' });

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [showPwd, setShowPwd] = useState(false);

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
    <div className="min-h-screen flex">

      {/* ── Colonne gauche – photo uniquement ── */}
      {/* Ajouter /public/login-photo.jpg pour afficher la photo */}
      <div
        className="hidden md:block md:w-[38%] bg-[#1B3A2D] bg-cover bg-center"
        style={{ backgroundImage: "url('/login-photo.jpg')" }}
      />

      {/* ── Colonne droite – logo + titre + formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-10 py-12">
        <div className="w-full max-w-[340px]">

          {/* Logo */}
          <div className="flex items-center justify-center mb-7">
            <div className="text-center">
              <span className="text-[#1B3A2D] font-bold text-xl tracking-tight">Baobab</span>
              <span className="block text-[#1B3A2D] font-bold text-xl tracking-tight -mt-1">Gestion</span>
            </div>
          </div>

          {/* ── Vue Connexion ── */}
          {vue === 'login' && (
            <>
              <div className="text-center mb-9">
                <h1 className={`${dancing.className} text-[2.6rem] leading-tight text-gray-900 mb-2`}>
                  Bienvenue de nouveau !
                </h1>
                <p className="text-sm text-gray-400">
                  Connectez-vous pour accéder à votre compte
                </p>
              </div>

              <form
                onSubmit={async (e) => { e.preventDefault(); await login(email, mot_de_passe); }}
                className="space-y-8"
              >
                {/* Email */}
                <div className="relative">
                  <User size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse email ou numéro de téléphone"
                    required
                    className="w-full border-0 border-b border-gray-200 pb-3 pl-6 pr-3 text-sm bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1B3A2D] transition-colors"
                  />
                </div>

                {/* Mot de passe */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Lock size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={mot_de_passe}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="Mot de passe"
                      required
                      className="w-full border-0 border-b border-gray-200 pb-3 pl-6 pr-9 text-sm bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1B3A2D] transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setVue('oublie'); setEmailOublie(email); setOublieSuccess(false); setOublieError(''); }}
                      className="text-xs text-gray-400 hover:text-[#1B3A2D] transition-colors"
                    >
                      Mots de passe oublié ?
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1B3A2D] text-white rounded-full text-sm font-semibold hover:bg-[#162E22] transition-colors disabled:opacity-60 shadow-lg shadow-[#1B3A2D]/20"
                >
                  {loading ? 'Connexion...' : 'Connexion'}
                </button>
              </form>
            </>
          )}

          {/* ── Vue Mot de passe oublié ── */}
          {vue === 'oublie' && (
            <>
              <div className="text-center mb-9">
                <h1 className={`${dancing.className} text-[2.6rem] leading-tight text-gray-900 mb-2`}>
                  Mot de passe oublié
                </h1>
                <p className="text-sm text-gray-400">
                  Réinitialisez l'accès à votre compte
                </p>
              </div>

              {oublieSuccess ? (
                <div className="space-y-6">
                  <div className="bg-[#1B3A2D]/5 border border-[#1B3A2D]/15 rounded-2xl px-5 py-5 text-center">
                    <p className="text-sm font-semibold text-[#1B3A2D] mb-1">Email envoyé ✓</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Si cette adresse est enregistrée, vous recevrez les instructions de réinitialisation.
                    </p>
                  </div>
                  <button
                    onClick={() => setVue('login')}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#1B3A2D] transition-colors font-medium"
                  >
                    <ArrowLeft size={14} /> Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOublie} className="space-y-8">
                  <div className="relative">
                    <User size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={emailOublie}
                      onChange={(e) => setEmailOublie(e.target.value)}
                      placeholder="Adresse email"
                      required
                      className="w-full border-0 border-b border-gray-200 pb-3 pl-6 pr-3 text-sm bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1B3A2D] transition-colors"
                    />
                  </div>

                  {oublieError && <p className="text-sm text-red-500">{oublieError}</p>}

                  <button
                    type="submit"
                    disabled={oubliePending}
                    className="w-full py-4 bg-[#1B3A2D] text-white rounded-full text-sm font-semibold hover:bg-[#162E22] transition-colors disabled:opacity-60 shadow-lg shadow-[#1B3A2D]/20"
                  >
                    {oubliePending ? 'Envoi...' : 'Envoyer le lien'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVue('login')}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#1B3A2D] transition-colors font-medium"
                  >
                    <ArrowLeft size={14} /> Retour à la connexion
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
