import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(field) {
    return (e) => {
      setForm({ ...form, [field]: e.target.value });
      setErrors({ ...errors, [field]: undefined });
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors || Object.keys(err.errors).length === 0) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="brand brand-large">
          <span className="brand-dot" aria-hidden="true" />
          Sweety
        </div>
        <h1>Create your account</h1>
        <p className="muted">Track up to four readings a day and see how your month is going.</p>

        <div className="field">
          <label htmlFor="register-name">Name</label>
          <input id="register-name" autoComplete="name" value={form.name} onChange={update('name')} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
          {errors.password ? (
            <p className="field-error">{errors.password}</p>
          ) : (
            <p className="hint">At least 8 characters.</p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
