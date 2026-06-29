'use client';

const STATUT_CONFIG = {
  payee:     { label: 'Payée',     classes: 'border border-green-400 text-green-600 bg-green-50' },
  impayee:   { label: 'Impayée',   classes: 'border border-red-400 text-red-500 bg-red-50' },
  partielle: { label: 'Partielle', classes: 'border border-blue-400 text-blue-600 bg-blue-50' },
  annulee:   { label: 'Annulée',   classes: 'border border-gray-300 text-gray-500 bg-gray-50' },
  brouillon: { label: 'Brouillon', classes: 'border border-amber-400 text-amber-600 bg-amber-50' },
  envoye:    { label: 'Envoyé',    classes: 'border border-blue-400 text-blue-600 bg-blue-50' },
  accepte:   { label: 'Accepté',   classes: 'border border-green-400 text-green-600 bg-green-50' },
  refuse:    { label: 'Refusé',    classes: 'border border-red-400 text-red-500 bg-red-50' },
  expire:    { label: 'Expiré',    classes: 'border border-orange-400 text-orange-600 bg-orange-50' },
  converti:  { label: 'Converti',  classes: 'border border-purple-400 text-purple-600 bg-purple-50' },
};

export function BadgeStatut({ statut }: { statut: keyof typeof STATUT_CONFIG }) {
  const config = STATUT_CONFIG[statut] ?? { label: statut, classes: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

export function BadgeRole({ role }: { role: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    gerant:    { label: 'Gérant',    classes: 'bg-purple-100 text-purple-800' },
    employe:   { label: 'Employé',   classes: 'bg-blue-100 text-blue-800' },
    comptable: { label: 'Comptable', classes: 'bg-teal-100 text-teal-800' },
  };
  const c = config[role] ?? { label: role, classes: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  );
}
