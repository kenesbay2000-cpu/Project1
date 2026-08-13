import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSafeDisplayName } from '../lib/username';
import { ensureGoogleDisplayName } from '../lib/auth';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getDisplayName(user: User | null) {
  if (!user) return '';
  const metadataName = user.user_metadata.display_name ?? user.user_metadata.full_name;
  return getSafeDisplayName(metadataName, 'Путешественник');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isActive) { setUser(data.session?.user ?? null); setIsLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => { isActive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || user.user_metadata.display_name) return;
    void ensureGoogleDisplayName(user).then(setUser).catch(() => undefined);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    displayName: getDisplayName(user),
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
