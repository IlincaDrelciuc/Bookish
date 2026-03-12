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
      backgroundColor: '#0f0902',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px', fontWeight: '700',
          color: '#f0e0c0', letterSpacing: '0.03em', lineHeight: 1,
        }}>Bookish</span>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {[
          { to: '/home', label: 'Home' },
          { to: '/books', label: 'Browse' },
          { to: '/recommendations', label: 'Recommendations' },
          { to: '/my-books', label: 'My Books' },
          { to: '/stats', label: 'Stats' },
          { to: `/profile/${user?.username}`, label: 'Profile' },
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

        {/* Settings icon */}
        <Link
          to="/account"
          title="Account Settings"
          style={{
            color: 'rgba(232,213,176,0.5)',
            transition: 'color 0.2s',
            display: 'flex', alignItems: 'center',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#f0e0c0'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,213,176,0.5)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>

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