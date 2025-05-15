import { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

// Auth context
export const AuthContext = createContext<{
    session: Session | null;
    loading: boolean;
    initialLoading: boolean;
  }>({
    session: null,
    loading: true,
    initialLoading: true,
  });
  
  export const useAuth = () => useContext(AuthContext);