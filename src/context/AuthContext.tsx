import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthContextState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected authentication error occurred.');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async (email: string, password: string) => {
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  }, [clearError, handleAuthError]);

  const signUp = useCallback(async (email: string, password: string) => {
    clearError();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  }, [clearError, handleAuthError]);

  const signOutUser = useCallback(async () => {
    clearError();
    try {
      await signOut(auth);
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  }, [clearError, handleAuthError]);

  const resetPassword = useCallback(async (email: string) => {
    clearError();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  }, [clearError, handleAuthError]);

  const value = useMemo<AuthContextState>(
    () => ({ user, loading, signIn, signUp, signOut: signOutUser, resetPassword, error, clearError }),
    [user, loading, signIn, signUp, signOutUser, resetPassword, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
