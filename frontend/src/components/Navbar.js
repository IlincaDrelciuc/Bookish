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
      backgroundColor:'white',
      borderBottom:'1px solid #E2E8F0',
      padding:'0 24px',
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      height:'60px',
      position:'sticky',
      top:0,
      zIndex:100,
    }}>
      <Link to='/home' style={{textDecoration:'none',color:'#2563EB',fontWeight:'bold',fontSize:'20px',fontFamily:'Arial'}}>
        📚 Bookish
      </Link>
      <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
        <Link to='/books' style={{textDecoration:'none',color:'#475569',fontFamily:'Arial',fontSize:'15px'}}>Browse</Link>
        <Link to='/my-books' style={{textDecoration:'none',color:'#475569',fontFamily:'Arial',fontSize:'15px'}}>My Books</Link>
        <Link to='/stats' style={{textDecoration:'none',color:'#475569',fontFamily:'Arial',fontSize:'15px'}}>Stats</Link>
        <span style={{color:'#94A3B8',fontSize:'14px',fontFamily:'Arial'}}>Hi, {user?.username}</span>
        <button onClick={handleLogout} style={{padding:'6px 14px',border:'1px solid #E2E8F0',borderRadius:'6px',backgroundColor:'white',cursor:'pointer',color:'#64748B',fontSize:'14px'}}>
          Log out
        </button>
      </div>
    </nav>
  );
}

