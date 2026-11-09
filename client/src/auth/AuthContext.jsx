import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user: me }) => setUser(me))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleSession = useCallback(({ token, user: signedIn }) => {
    tokenStore.set(token);
    setUser(signedIn);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (credentials) => handleSession(await api.login(credentials)),
      register: async (details) => handleSession(await api.register(details)),
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading, handleSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
