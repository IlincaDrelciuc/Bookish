import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LIBRARY_IMAGE = '/foto-register.webp';

const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: `url(${LIBRARY_IMAGE})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 6, 2, 0.55)',
    zIndex: 0,
  },
  appName: {
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '48px',
    fontWeight: '700',
    color: '#f0e0c0',
    letterSpacing: '0.04em',
    marginBottom: '8px',
    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
  },
  tagline: {
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    color: 'rgba(240,224,192,0.6)',
    fontStyle: 'italic',
    marginBottom: '32px',
    letterSpacing: '0.06em',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '550px',
    background: 'rgba(20, 12, 4, 0.55)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(212, 175, 100, 0.2)',
    borderRadius: '4px',
    padding: '52px 64px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,100,0.08)',
  },
  ornament: {
    color: 'rgba(212,175,100,0.5)',
    fontSize: '18px',
    letterSpacing: '8px',
    marginBottom: '0px',
    display: 'block',
    textAlign: 'center',
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '26px',
    fontWeight: '600',
    color: '#f0e0c0',
    marginBottom: '6px',
    lineHeight: 1.2,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    color: 'rgba(232,213,176,0.45)',
    fontStyle: 'italic',
    marginBottom: '28px',
    letterSpacing: '0.02em',
    textAlign: 'center',
  },
  divider: {
    width: '40px',
    height: '1px',
    background: 'rgba(212,175,100,0.4)',
    margin: '0 auto 28px',
  },
  label: {
    display: 'block',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(232,213,176,0.5)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    padding: '11px 15px',
    background: 'rgba(255,245,220,0.06)',
    border: '1px solid rgba(212,175,100,0.2)',
    borderRadius: '2px',
    color: '#e8d5b0',
    fontSize: '14px',
    fontFamily: "'Lora', Georgia, serif",
    marginBottom: '18px',
    transition: 'border-color 0.2s, background 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  },
 button: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
    border: '1px solid rgba(212,155,60,0.35)',
    borderRadius: '2px',
    color: '#f5e6c0',
    fontSize: '13px',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'opacity 0.2s',
  },
  error: {
    background: 'rgba(160,40,40,0.15)',
    border: '1px solid rgba(160,40,40,0.35)',
    borderRadius: '2px',
    padding: '10px 14px',
    marginBottom: '16px',
    color: '#e09090',
    fontSize: '13px',
    fontFamily: "'Lora', Georgia, serif",
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
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

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const focusStyle = (e) => {
    e.target.style.borderColor = 'rgba(212,175,100,0.5)';
    e.target.style.background = 'rgba(255,245,220,0.1)';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = 'rgba(212,175,100,0.2)';
    e.target.style.background = 'rgba(255,245,220,0.06)';
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        localStorage.setItem('token', data.token);
        navigate('/onboarding');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />

      <span style={styles.appName}>Bookish</span>
      <span style={styles.tagline}>Begin your reading story</span>

      <div style={styles.card}>
        <span style={styles.ornament}>— ✦ —</span>
        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.subheading}>Join a community of readers</p>
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
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />

          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />

          <label style={styles.label}>Confirm password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            required
          />

          <button
            style={styles.button}
            type="submit"
            disabled={loading}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}