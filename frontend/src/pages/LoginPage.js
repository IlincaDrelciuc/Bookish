import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('POST', '/auth/login', {
        email, password
      });

      login(data.user, data.token);

      if (data.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📚 Welcome Back</h1>
        <p style={styles.subtitle}>Log in to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder='your@email.com'
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder='Enter your password'
              required
            />
          </div>

          <button type='submit' style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{textAlign:'center', marginTop:'16px'}}>
          Don't have an account? <Link to='/register'>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f8fafc' },
  card: { backgroundColor:'white', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.07)', width:'100%', maxWidth:'400px' },
  title: { margin:'0 0 8px 0', color:'#2563EB', fontSize:'28px' },
  subtitle: { margin:'0 0 24px 0', color:'#64748B' },
  error: { backgroundColor:'#FEF2F2', color:'#B91C1C', padding:'12px', borderRadius:'8px', marginBottom:'16px', fontSize:'14px' },
  field: { marginBottom:'16px' },
  label: { display:'block', marginBottom:'6px', fontWeight:'bold', color:'#374151', fontSize:'14px' },
  input: { width:'100%', padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:'8px', fontSize:'16px', boxSizing:'border-box' },
  button: { width:'100%', padding:'12px', backgroundColor:'#2563EB', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', fontWeight:'bold', cursor:'pointer' },
};