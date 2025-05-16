import React, { createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  initialLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContext.Provider');
  }
  return context;
};