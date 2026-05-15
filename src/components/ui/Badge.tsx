'use client';

const STATUT_CONFIG = {
  payee:     { label: 'Payée',     classes: 'bg-green-100 text-green-800' },
  impayee:   { label: 'Impayée',   classes: 'bg-orange-100 text-orange-800' },
  partielle: { label: 'Partielle', classes: 'bg-blue-100 text-blue-800' },
  annulee:   { label: 'Annulée',   classes: 'bg-gray-100 text-gray-500' },
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
