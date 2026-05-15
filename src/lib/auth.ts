export const setToken = (token: string) => localStorage.setItem('baobab_token', token);
export const getToken = () => localStorage.getItem('baobab_token');
export const removeToken = () => localStorage.removeItem('baobab_token');
export const isAuthenticated = () => !!getToken();
