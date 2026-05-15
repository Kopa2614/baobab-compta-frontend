export const formatFCFA = (montant: number): string =>
  new Intl.NumberFormat('fr-SN', { style: 'decimal', minimumFractionDigits: 0 })
    .format(montant) + ' FCFA';

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const formatTelephone = (tel?: string): string =>
  tel?.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') || '';

export const getStatutColor = (statut: string): string => {
  const colors: Record<string, string> = {
    payee: 'bg-green-100 text-green-800',
    impayee: 'bg-orange-100 text-orange-800',
    partielle: 'bg-blue-100 text-blue-800',
    annulee: 'bg-gray-100 text-gray-500',
  };
  return colors[statut] || 'bg-gray-100 text-gray-800';
};
