import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import {
  api,
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser
} from '../services/api';
import {
  signInWithGoogle as firebaseGoogleSignIn,
  logoutFirebase,
  subscribeToAuthChanges,
  isFirebaseConfigured
} from '../services/firebase';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isFirebaseConfigured: boolean;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithCredentials: (username: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // If we don't have a token or have a stale token, sync with backend
        const currentToken = getAuthToken();
        if (!currentToken) {
          try {
            const idToken = await fbUser.getIdToken();
            const backendResp = await api.firebaseLogin(idToken);
            setAuthToken(backendResp.access_token);
            const profile: UserProfile = {
              id: backendResp.user_id,
              username: backendResp.username,
              email: fbUser.email || `${backendResp.username}@scamshield.local`,
              full_name: backendResp.full_name || fbUser.displayName || backendResp.username,
              role: (backendResp.role || 'USER').toLowerCase() as any,
              is_active: true,
              created_at: new Date().toISOString()
            };
            setStoredUser(profile);
            setUser(profile);
            setToken(backendResp.access_token);
          } catch (err) {
            console.warn('Failed to sync Firebase user with backend:', err);
          }
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setError(null);
    setLoading(true);
    try {
      const res = await firebaseGoogleSignIn();
      if (!res) throw new Error('Google sign-in was cancelled or returned empty.');

      // Exchange Firebase ID Token with backend
      const backendResp = await api.firebaseLogin(res.token);
      setAuthToken(backendResp.access_token);

      const profile: UserProfile = {
        id: backendResp.user_id,
        username: backendResp.username,
        email: res.user.email || backendResp.email || `${backendResp.username}@scamshield.local`,
        full_name: backendResp.full_name || res.user.displayName || backendResp.username,
        role: (backendResp.role || 'USER').toLowerCase() as any,
        is_active: true,
        created_at: new Date().toISOString()
      };

      setStoredUser(profile);
      setUser(profile);
      setFirebaseUser(res.user);
      setToken(backendResp.access_token);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Firebase Google Sign-In failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (username: string, password: string): Promise<UserProfile> => {
    setError(null);
    setLoading(true);
    try {
      const resp = await api.login(username.trim(), password);
      setAuthToken(resp.access_token);
      const profile: UserProfile = {
        id: resp.user_id,
        username: resp.username,
        email: `${resp.username}@scamshield.local`,
        full_name: resp.full_name,
        role: (resp.role || 'ANALYST').toLowerCase() as any,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setStoredUser(profile);
      setUser(profile);
      setToken(resp.access_token);
      return profile;
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setFirebaseUser(null);
    setToken(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        loading,
        error,
        isFirebaseConfigured,
        loginWithGoogle,
        loginWithCredentials,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
