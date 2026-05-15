'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getImpersonationInfo, stopImpersonation } from '@/lib/impersonate';
import type { ImpersonationInfo } from '@/lib/impersonate';
import { Eye, ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
  const router = useRouter();
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);

  useEffect(() => {
    setInfo(getImpersonationInfo());

    function onUpdate() {
      setInfo(getImpersonationInfo());
    }
    window.addEventListener('baobab_user_updated', onUpdate);
    return () => window.removeEventListener('baobab_user_updated', onUpdate);
  }, []);

  if (!info) return null;

  function handleReturn() {
    stopImpersonation();
    router.push('/admin/entreprises');
  }

  return (
    <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm shrink-0">
      <div className="flex items-center gap-2">
        <Eye size={14} />
        <span>
          Mode consultation Ayas Digital —{' '}
          <strong>{info.entrepriseNom}</strong>
        </span>
      </div>
      <button
        onClick={handleReturn}
        className="flex items-center gap-1.5 font-medium hover:text-orange-100 transition-colors"
      >
        <ArrowLeft size={14} />
        Retour au panel admin
      </button>
    </div>
  );
}
