import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui';

function Shell({ children }) {
  return (
    <div className="auth">
      <section className="auth-side">
        <Wallet size={40} />
        <h1>Take control of your finances</h1>
        <p>Track income and expenses, set monthly budgets and watch your savings grow, all in one place.</p>
      </section>
      <section className="auth-main">{children}</section>
    </div>
  );
}

const useForm = (initial) => {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bind = (name) => ({ value: values[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })) });
  return { values, bind, busy, setBusy, error, setError };
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const f = useForm({ email: '', password: '' });

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true); f.setError('');
    try { await login(f.values); navigate('/'); } catch (err) { f.setError(errMsg(err)); } finally { f.setBusy(false); }
  };

  return (
    <Shell>
      <form className="auth-form" onSubmit={submit}>
        <h2>Sign in</h2>
        <Field label="Email"><input className="input" type="email" required autoComplete="email" {...f.bind('email')} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" {...f.bind('password')} /></Field>
        {f.error && <p className="error-text" role="alert">{f.error}</p>}
        <button className="btn block" disabled={f.busy}>{f.busy ? 'Signing in...' : 'Sign in'}</button>
        <div className="row between">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account</Link>
        </div>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const f = useForm({ name: '', email: '', password: '' });

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true); f.setError('');
    try { await register(f.values); toast.success('Account created. Check your email to verify it.'); navigate('/'); }
    catch (err) { f.setError(errMsg(err)); } finally { f.setBusy(false); }
  };

  return (
    <Shell>
      <form className="auth-form" onSubmit={submit}>
        <h2>Create your account</h2>
        <Field label="Full name"><input className="input" required minLength={2} autoComplete="name" {...f.bind('name')} /></Field>
        <Field label="Email"><input className="input" type="email" required autoComplete="email" {...f.bind('email')} /></Field>
        <Field label="Password"><input className="input" type="password" required minLength={8} autoComplete="new-password" {...f.bind('password')} /></Field>
        <p className="muted" style={{ fontSize: 12 }}>At least 8 characters, with letters and numbers.</p>
        {f.error && <p className="error-text" role="alert">{f.error}</p>}
        <button className="btn block" disabled={f.busy}>{f.busy ? 'Creating...' : 'Create account'}</button>
        <p className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const f = useForm({ email: '' });
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true); f.setError('');
    try { await api.post('/auth/forgot-password', f.values); setSent(true); } catch (err) { f.setError(errMsg(err)); } finally { f.setBusy(false); }
  };

  return (
    <Shell>
      <form className="auth-form" onSubmit={submit}>
        <h2>Reset your password</h2>
        {sent ? (
          <p className="notice">If that email is registered, a reset link is on its way. It stays valid for 30 minutes.</p>
        ) : (
          <>
            <p className="muted">Enter your email and we'll send you a reset link.</p>
            <Field label="Email"><input className="input" type="email" required {...f.bind('email')} /></Field>
            {f.error && <p className="error-text">{f.error}</p>}
            <button className="btn block" disabled={f.busy}>Send reset link</button>
          </>
        )}
        <Link to="/login">Back to sign in</Link>
      </form>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const f = useForm({ password: '' });

  const submit = async (e) => {
    e.preventDefault();
    f.setBusy(true); f.setError('');
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password: f.values.password });
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login');
    } catch (err) { f.setError(errMsg(err)); } finally { f.setBusy(false); }
  };

  return (
    <Shell>
      <form className="auth-form" onSubmit={submit}>
        <h2>Choose a new password</h2>
        <Field label="New password"><input className="input" type="password" required minLength={8} autoComplete="new-password" {...f.bind('password')} /></Field>
        {f.error && <p className="error-text">{f.error}</p>}
        <button className="btn block" disabled={f.busy || !params.get('token')}>Update password</button>
      </form>
    </Shell>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const { user, setUser } = useAuth();
  const [state, setState] = useState({ loading: true, message: '', ok: false });

  useEffect(() => {
    api.post('/auth/verify-email', { token: params.get('token') })
      .then(() => { setState({ loading: false, ok: true, message: 'Your email is verified.' }); if (user) setUser({ ...user, isVerified: true }); })
      .catch((e) => setState({ loading: false, ok: false, message: errMsg(e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell>
      <div className="auth-form">
        <h2>Email verification</h2>
        <p className={state.ok ? 'notice' : 'error-text'}>{state.loading ? 'Checking your link...' : state.message}</p>
        <Link className="btn" to="/">Continue</Link>
      </div>
    </Shell>
  );
}
