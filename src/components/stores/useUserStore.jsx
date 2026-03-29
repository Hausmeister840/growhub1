import { createContext, useContext, useState, useCallback } from 'react';

/**
 * 👤 USER STORE - FIXED
 * Verbesserte User-State-Verwaltung
 */

const UserStoreContext = createContext(null);

export function UserStoreProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading, null = not authenticated

  const updateUser = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') {
      console.error('updateUser: updates must be an object');
      return;
    }

    setCurrentUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    
    // ✅ FIX: Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('growhub_user_data');
    }
  }, []);

  const setUser = useCallback((user) => {
    setCurrentUser(user);
    
    // ✅ FIX: Persist zu localStorage
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.setItem('growhub_user_data', JSON.stringify({
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatar_url,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error saving user to localStorage:', error);
      }
    }
  }, []);

  const loadCachedUser = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem('growhub_user_data');
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - (parsed.timestamp || 0);
      
      // Cache für 24h
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('growhub_user_data');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading cached user:', error);
      return null;
    }
  }, []);

  const value = {
    currentUser,
    setCurrentUser: setUser,
    updateUser,
    logout,
    loadCachedUser
  };

  return (
    <UserStoreContext.Provider value={value}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserStoreContext);
  if (!context) {
    throw new Error('useUserStore must be used within UserStoreProvider');
  }
  return context;
}