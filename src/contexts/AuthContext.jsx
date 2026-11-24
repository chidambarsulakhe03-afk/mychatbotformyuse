import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const localId = localStorage.getItem('chatai_user_id') || 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('chatai_user_id', localId);
    return {
      id: localId,
      email: 'user@chatai.local',
      username: 'User',
    };
  });
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(() => ({
    id: localStorage.getItem('chatai_user_id') || 'user_default',
    username: 'You',
    avatar_url: null,
  }));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt seamless anonymous session in Supabase if configured
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setProfile({
            id: session.user.id,
            username: session.user.user_metadata?.username || 'You',
            avatar_url: null,
          });
        } else {
          // Attempt seamless anonymous login
          try {
            const { data } = await supabase.auth.signInAnonymously();
            if (data?.session) {
              setSession(data.session);
              setUser(data.user);
              setProfile({ id: data.user.id, username: 'You', avatar_url: null });
            }
          } catch (e) {
            // Anonymous auth disabled in Supabase, keep local persistent user
          }
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading: false,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
