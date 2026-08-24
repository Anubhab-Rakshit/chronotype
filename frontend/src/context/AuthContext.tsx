import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apolloClient } from '../graphql/client';
import { ME_QUERY, LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/operations';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  bestScore: number | null;
  totalGames: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('monkeytype_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async (jwtToken: string) => {
    try {
      const { data } = await apolloClient.query<any>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
        context: {
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
        },
      });

      if (data?.me) {
        setUser(data.me);
        if (data.me.bestScore) {
          localStorage.setItem('monkeytype_best_score', data.me.bestScore.toString());
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user profile, token may be expired:', err);
      localStorage.removeItem('monkeytype_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await apolloClient.mutate<any>({
        mutation: LOGIN_MUTATION,
        variables: { input: { email, password } },
      });

      if (data?.login?.token) {
        const receivedToken = data.login.token;
        const loggedInUser = data.login.user;
        localStorage.setItem('monkeytype_token', receivedToken);
        setToken(receivedToken);
        setUser(loggedInUser);
        if (loggedInUser.bestScore) {
          localStorage.setItem('monkeytype_best_score', loggedInUser.bestScore.toString());
        }
        await apolloClient.resetStore();
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const { data } = await apolloClient.mutate<any>({
        mutation: REGISTER_MUTATION,
        variables: { input: { username, email, password } },
      });

      if (data?.register?.token) {
        const receivedToken = data.register.token;
        const registeredUser = data.register.user;
        localStorage.setItem('monkeytype_token', receivedToken);
        setToken(receivedToken);
        setUser(registeredUser);
        await apolloClient.resetStore();
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('monkeytype_token');
    setToken(null);
    setUser(null);
    apolloClient.resetStore().catch(() => {});
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
