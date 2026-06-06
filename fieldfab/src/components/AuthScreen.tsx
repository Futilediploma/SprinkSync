import { useState } from 'react';
import { login, register } from '../api/auth';
import { ApiError } from '../api/client';

interface AuthScreenProps {
  onAuth: () => void;
  variant?: 'fullscreen' | 'panel';
}

export default function AuthScreen({ onAuth, variant = 'fullscreen' }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password, companyName || undefined);
      }
      onAuth();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
      padding: 32,
      width: '100%',
      maxWidth: 380,
    }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
          FieldFab
        </h1>
        <p style={{ margin: '0 0 24px', color: '#666', textAlign: 'center', fontSize: 14 }}>
          Fabrication management for fire protection contractors
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '2px solid #eee' }}>
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '8px 0',
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#1976d2' : '#666',
                borderBottom: tab === t ? '2px solid #1976d2' : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                fontSize: 15,
                textTransform: 'capitalize',
              }}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Company Name (optional)</label>
              <input
                style={inputStyle}
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Fire Protection"
                autoComplete="organization"
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={tab === 'register' ? 'At least 8 characters' : ''}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              minLength={tab === 'register' ? 8 : undefined}
            />
          </div>

          {error && (
            <div style={{
              background: '#fdecea',
              color: '#c62828',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading ? '#90caf9' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {tab === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
            Free plan: up to 3 projects. Unlimited with Pro.
          </p>
        )}
    </div>
  );

  if (variant === 'panel') {
    return card;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #0f172a 0%, #13233f 58%, #1d3358 100%)',
      padding: 16,
    }}>
      {card}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 15,
  boxSizing: 'border-box',
};
