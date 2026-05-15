const ADMIN_SESSION_KEY = 'baobab_admin_session';
const USER_KEY = 'baobab_user';
const TOKEN_KEY = 'baobab_token';

export interface ImpersonationInfo {
  entrepriseNom: string;
  entrepriseId: string;
}

export function startImpersonation(
  token: string,
  utilisateur: Record<string, unknown>,
  entreprise: Record<string, unknown>
) {
  // Sauvegarder la session super_admin
  const adminSession = {
    token: localStorage.getItem(TOKEN_KEY),
    user: localStorage.getItem(USER_KEY),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));

  // Activer la session de l'entreprise cible
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ utilisateur, entreprise }));

  window.dispatchEvent(new CustomEvent('baobab_user_updated'));
}

export function stopImpersonation() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return;

  try {
    const adminSession = JSON.parse(raw);
    if (adminSession.token) localStorage.setItem(TOKEN_KEY, adminSession.token);
    if (adminSession.user) localStorage.setItem(USER_KEY, adminSession.user);
  } catch {}

  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('baobab_user_updated'));
}

export function getImpersonationInfo(): ImpersonationInfo | null {
  if (typeof window === 'undefined') return null;
  const adminRaw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!adminRaw) return null;

  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (!userRaw) return null;
    const parsed = JSON.parse(userRaw);
    return {
      entrepriseNom: (parsed.entreprise?.nom as string) ?? 'Entreprise inconnue',
      entrepriseId: (parsed.entreprise?.id as string) ?? '',
    };
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(ADMIN_SESSION_KEY);
}
