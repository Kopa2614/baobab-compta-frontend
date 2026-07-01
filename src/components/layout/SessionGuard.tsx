'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export function SessionGuard() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function onExpired() {
      setExpired(true);
      setTimeout(() => router.replace('/login'), 4000);
    }
    window.addEventListener('baobab_session_expired', onExpired);
    return () => window.removeEventListener('baobab_session_expired', onExpired);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/auth/me').catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!expired) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={26} className="text-orange-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Session fermée</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Votre compte vient d&apos;être ouvert sur un autre appareil. Vous avez été déconnecté de cette session.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-[#1B3A2D] rounded-full animate-spin" />
          Redirection vers la connexion...
        </div>
      </div>
    </div>
  );
}
