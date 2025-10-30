import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

type Mode = 'sign-in' | 'sign-up' | 'reset';

function AuthPanel() {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setStatus('');
    clearError();
    setPassword('');
    setConfirmation('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');
    clearError();

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else if (mode === 'sign-up') {
        if (password !== confirmation) {
          setStatus('Passwords do not match.');
          return;
        }
        await signUp(email, password);
        setStatus('Account created successfully! You are now signed in.');
      } else {
        await resetPassword(email);
        setStatus('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      if (mode === 'reset' && err instanceof Error) {
        setStatus(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordFields = mode !== 'reset';

  return (
    <div className="auth-panel">
      <h2 className="auth-title">
        {mode === 'sign-in' && 'Sign in to GlassVision'}
        {mode === 'sign-up' && 'Create your GlassVision account'}
        {mode === 'reset' && 'Reset your password'}
      </h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </label>

        {renderPasswordFields && (
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a secure password"
              minLength={6}
              required
            />
          </label>
        )}

        {mode === 'sign-up' && (
          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Re-enter your password"
              minLength={6}
              required
            />
          </label>
        )}

        {(error || status) && (
          <div className={`auth-message ${error ? 'auth-error' : 'auth-success'}`}>
            {error ?? status}
          </div>
        )}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : mode === 'sign-in'
            ? 'Sign in'
            : mode === 'sign-up'
            ? 'Create account'
            : 'Send reset email'}
        </button>
      </form>

      <div className="auth-links">
        {mode !== 'sign-in' && (
          <button type="button" onClick={() => switchMode('sign-in')}>
            Already have an account? Sign in
          </button>
        )}
        {mode !== 'sign-up' && (
          <button type="button" onClick={() => switchMode('sign-up')}>
            Need an account? Sign up
          </button>
        )}
        {mode !== 'reset' && (
          <button type="button" onClick={() => switchMode('reset')}>
            Forgot your password?
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthPanel;
