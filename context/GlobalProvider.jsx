// context/GlobalProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/appwrite';

const GlobalContext = createContext(null);

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.log('getUser error:', error.message);
          if (!isMounted) return;
          setUser(null);
          setIsLoggedIn(false);
        } else if (data?.user) {
          if (!isMounted) return;
          setUser(data.user);
          setIsLoggedIn(true);
        } else {
          if (!isMounted) return;
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.log('Auth init error:', err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoggedIn(!!currentUser);
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Logout error:', error);
        throw error;
      }
      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      // Navigate to sign-in
      router.replace('/sign-in');
    } catch (err) {
      console.log('Logout failed:', err);
      throw err;
    }
  };

  const value = {
    user,
    isLoggedIn,
    isAuthLoading,
    setUser,
    setIsLoggedIn,
    logout,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};
