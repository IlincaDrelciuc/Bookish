import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LIBRARY_IMAGE = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900&q=85';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0a06 0%, #1a1008 40%, #0d0b08 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    maxWidth: '920px',
    width: '100%',
    background: 'rgba(20, 13, 6, 0.85)',
    border: '1px solid rgba(212, 175, 100, 0.18)',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,175,100,0.1)',
  },
  imagePanel: {
    position: 'relative',
    minHeight: '560px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, rgba(10,6,2,0.2) 0%, rgba(10,6,2,0.65) 100%)',
  },
  imageBranding: {
  position: 'absolute',
  bottom: '40px',
  left: '36px',
  right: '36px',
  background: 'rgba(10,6,2,0.55)',
  backdropFilter: 'blur(4px)',
  padding: '20px 24px',
  borderLeft: '2px solid rgba(212,175,100,0.4)',
},
  brandIcon: {
    fontSize: '28px',
    marginBottom: '10px',
    display: 'block',
  },
  brandName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '38px',
    fontWeight: '700',
    color: '#f0e0c0',
    letterSpacing: '0.02em',
    lineHeight: 1,
    display: 'block',
  },
  brandTagline: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    color: 'rgba(240,224,192,0.55)',
    fontStyle: 'italic',
    marginTop: '8px',
    display: 'block',
    letterSpacing: '0.04em',
  },
  formPanel: {
    padding: '56px 48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  ornament: {
    color: 'rgba(212,175,100,0.5)',
    fontSize: '20px',
    letterSpacing: '8px',
    marginBottom: '28px',
    display: 'block',
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '30px',
    fontWeight: '600',
    color: '#f0e0c0',
    marginBottom: '6px',
    lineHeight: 1.2,
  },
  subheading: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    color: 'rgba(232,213,176,0.45)',
    fontStyle: 'italic',
    marginBottom: '36px',
    letterSpacing: '0.02em',
  },
  divider: {
    width: '40px',
    height: '1px',
    background: 'rgba(212,175,100,0.4)',
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(232,213,176,0.5)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,245,220,0.05)',
    border: '1px solid rgba(212,175,100,0.2)',
    borderRadius: '2px',
    color: '#e8d5b0',
    fontSize: '14px',
    fontFamily: "'Lora', Georgia, serif",
    marginBottom: '22px',
    transition: 'border-color 0.2s, background 0.2s',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)',
    border: '1px solid rgba(212,175,100,0.3)',
    borderRadius: '2px',
    color: '#f5e6c0',
    fontSize: '13px',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  error: {
    background: 'rgba(160,40,40,0.15)',
    border: '1px solid rgba(160,40,40,0.35)',
    borderRadius: '2px',
    padding: '11px 14px',
    marginBottom: '20px',
    color: '#e09090',
    fontSize: '13px',
    fontFamily: "'Lora', Georgia, serif",
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    color: 'rgba(232,213,176,0.35)',
    fontStyle: 'italic',
  },
  link: {
    color: 'rgba(212,175,100,0.8)',
    textDecoration: 'none',
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        login(data.user, data.token);
        navigate(data.needsOnboarding ? '/onboarding' : '/home');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.noise} />
      <div style={styles.card}>

        <div style={{
          ...styles.imagePanel,
          backgroundImage: `url(${LIBRARY_IMAGE})`,
        }}>
          <div style={styles.imageOverlay} />
          <div style={styles.imageBranding}>
            <span style={styles.brandName}>Bookish</span>
            <span style={styles.brandTagline}>Your personal reading companion</span>
          </div>
        </div>

        <div style={styles.formPanel}>
          <span style={styles.ornament}>— ✦ —</span>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.subheading}>Continue your literary journey</p>
          <div style={styles.divider} />

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(212,175,100,0.5)';
                e.target.style.background = 'rgba(255,245,220,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(212,175,100,0.2)';
                e.target.style.background = 'rgba(255,245,220,0.05)';
              }}
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(212,175,100,0.5)';
                e.target.style.background = 'rgba(255,245,220,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(212,175,100,0.2)';
                e.target.style.background = 'rgba(255,245,220,0.05)';
              }}
              required
            />

            <button
              style={styles.button}
              type="submit"
              disabled={loading}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={styles.footer}>
            New to Bookish?{' '}
            <Link to="/register" style={styles.link}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}