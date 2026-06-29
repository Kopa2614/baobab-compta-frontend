'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Dancing_Script } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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

      {/* ── Colonne gauche – panneau décoratif (remplacer par une <Image> si /public/login-photo.jpg est ajouté) ── */}
      <div className="hidden md:flex md:w-[40%] bg-[#1B3A2D] flex-col items-center justify-center relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 left-8 w-48 h-48 bg-white/5 rounded-full" />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <Image
              src="/logo.png"
              alt="Baobab Gestion"
              width={130}
              height={87}
              className="object-contain brightness-0 invert opacity-90"
            />
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold mb-2">Baobab Gestion</h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-[220px]">
              La solution comptable simple et rapide pour les commerçants sénégalais.
            </p>
          </div>
        </div>
      </div>

      {/* ── Colonne droite – formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[340px]">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 md:hidden">
            <Image src="/logo.png" alt="Baobab Gestion" width={100} height={67} className="object-contain" />
          </div>

          {/* Logo desktop (petit, dans la colonne form) */}
          <div className="hidden md:flex justify-center mb-6">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={36} height={24} className="object-contain" />
              <span className="text-[#1B3A2D] font-bold text-lg tracking-tight">Baobab Gestion</span>
            </div>
          </div>

          {/* ── Vue Connexion ── */}
          {vue === 'login' && (
            <>
              <div className="text-center mb-9">
                <h1 className={`${dancing.className} text-[2.6rem] leading-tight text-gray-900 mb-1.5`}>
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
                    placeholder="Adresse email"
                    required
                    className="w-full border-0 border-b border-gray-200 pb-3 pl-6 pr-3 text-sm bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1B3A2D] transition-colors"
                  />
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
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
                      onClick={() => setShowPwd(!showPwd)}
                      tabIndex={-1}
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
                  <p className="text-sm text-red-500 text-center -mt-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1B3A2D] text-white rounded-full text-sm font-semibold hover:bg-[#162E22] transition-colors disabled:opacity-60 shadow-lg shadow-[#1B3A2D]/20 mt-2"
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
                <h1 className={`${dancing.className} text-[2.6rem] leading-tight text-gray-900 mb-1.5`}>
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
