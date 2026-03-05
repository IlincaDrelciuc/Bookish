import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!isLoggedIn) return null;

  return (
    <nav style={{
      backgroundColor: '#2c1a06',
      borderBottom: '1px solid rgba(212,175,100,0.15)',
      padding: '0 48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
    }}>

      <Link to='/home' style={{
        textDecoration: 'none',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '22px',
        fontWeight: '700',
        color: '#f0e0c0',
        letterSpacing: '0.03em',
      }}>
        Bookish
      </Link>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {[
          { to: '/books', label: 'Browse' },
          { to: '/recommendations', label: 'Recommendations' },
          { to: '/my-books', label: 'My Books' },
          { to: '/stats', label: 'Stats' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{
            textDecoration: 'none',
            color: 'rgba(232,213,176,0.6)',
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '14px',
            letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = '#f0e0c0'}
            onMouseLeave={e => e.target.style.color = 'rgba(232,213,176,0.6)'}
          >
            {label}
          </Link>
          
        ))}

        <span style={{
          color: 'rgba(212,175,100,0.6)',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          fontStyle: 'italic',
        }}>
          {user?.username}
        </span>

        <button onClick={handleLogout} style={{
          padding: '7px 18px',
          border: '1px solid rgba(212,175,100,0.25)',
          borderRadius: '2px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: 'rgba(232,213,176,0.5)',
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          letterSpacing: '0.06em',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            e.target.style.borderColor = 'rgba(212,175,100,0.5)';
            e.target.style.color = '#f0e0c0';
          }}
          onMouseLeave={e => {
            e.target.style.borderColor = 'rgba(212,175,100,0.25)';
            e.target.style.color = 'rgba(232,213,176,0.5)';
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}