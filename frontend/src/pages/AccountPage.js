import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function AccountPage() {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [usernameMsg, setUsernameMsg] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  const overlayBg = (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,5,2,0.72)',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );

  const cardStyle = {
    background: 'rgba(20,12,4,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(212,175,100,0.12)',
    borderRadius: '10px',
    padding: '32px',
    marginBottom: '20px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,245,220,0.06)',
    border: '1px solid rgba(212,175,100,0.2)',
    borderRadius: '6px',
    color: '#e8d5b0',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '6px',
  };

  const labelStyle = {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '12px',
    color: 'rgba(212,175,100,0.5)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'block',
    marginTop: '16px',
  };

  const btnPrimary = (disabled) => ({
    marginTop: '20px',
    padding: '10px 28px',
    background: disabled
      ? 'rgba(212,175,100,0.08)'
      : 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
    border: '1px solid rgba(212,175,100,0.25)',
    borderRadius: '6px',
    color: disabled ? 'rgba(212,175,100,0.3)' : '#fff8ee',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '13px', fontWeight: '600',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  async function handleUsernameChange() {
    setUsernameErr(''); setUsernameMsg('');
    if (newUsername.trim().length < 3) {
      setUsernameErr('Username must be at least 3 characters.');
      return;
    }
    try {
      const data = await apiCall('PATCH', '/auth/username', { username: newUsername.trim() }, token);
      updateUser(data.user, data.token);
      setUsernameMsg('Username updated successfully!');
      setNewUsername('');
    } catch (err) {
      setUsernameErr(err.message);
    }
  }

  async function handlePasswordChange() {
    setPasswordErr(''); setPasswordMsg('');
    if (newPassword.length < 8) {
      setPasswordErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match.');
      return;
    }
    try {
      await apiCall('PATCH', '/auth/password', { currentPassword, newPassword }, token);
      setPasswordMsg('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPasswordErr(err.message);
    }
  }

  async function handleDeleteAccount() {
    setDeleteErr('');
    try {
      await apiCall('DELETE', '/auth/account', { password: deletePassword }, token);
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteErr(err.message);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '80px',
      position: 'relative',
    }}>
      {overlayBg}

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20,12,4,0.25)',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Your Profile</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#f0e0c0', margin: 0,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>Account Settings</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '48px', maxWidth: '640px', margin: '0 auto' }}>

        {/* Current details */}
        <div style={cardStyle}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px', fontWeight: '600',
            color: '#f0e0c0', margin: '0 0 20px 0',
          }}>Account Details</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Username', value: user?.username },
              { label: 'Email', value: user?.email },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '12px 16px',
                background: 'rgba(212,175,100,0.04)',
                border: '1px solid rgba(212,175,100,0.1)',
                borderRadius: '6px',
              }}>
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '12px', color: 'rgba(212,175,100,0.45)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{label}</span>
                <span style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '15px', color: '#f0e0c0',
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change username */}
        <div style={cardStyle}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px', fontWeight: '600',
            color: '#f0e0c0', margin: '0 0 4px 0',
          }}>Change Username</h2>
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: 'rgba(212,175,100,0.4)',
            fontStyle: 'italic', margin: '0 0 16px 0',
          }}>You'll be logged in with your new username automatically.</p>

          <label style={labelStyle}>New Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder={user?.username}
            style={inputStyle}
          />

          {usernameErr && (
            <p style={{ color: '#e09090', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }}>
              {usernameErr}
            </p>
          )}
          {usernameMsg && (
            <p style={{ color: '#90c878', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }}>
              {usernameMsg}
            </p>
          )}

          <button
            onClick={handleUsernameChange}
            disabled={!newUsername.trim()}
            style={btnPrimary(!newUsername.trim())}
          >
            Update Username
          </button>
        </div>

        {/* Change password */}
        <div style={cardStyle}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px', fontWeight: '600',
            color: '#f0e0c0', margin: '0 0 4px 0',
          }}>Change Password</h2>
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: 'rgba(212,175,100,0.4)',
            fontStyle: 'italic', margin: '0 0 16px 0',
          }}>Must be at least 8 characters.</p>

          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            style={inputStyle}
          />

          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
          />

          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            style={inputStyle}
          />

          {passwordErr && (
            <p style={{ color: '#e09090', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }}>
              {passwordErr}
            </p>
          )}
          {passwordMsg && (
            <p style={{ color: '#90c878', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }}>
              {passwordMsg}
            </p>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            style={btnPrimary(!currentPassword || !newPassword || !confirmPassword)}
          >
            Update Password
          </button>
        </div>

        {/* Delete account */}
        <div style={{
          ...cardStyle,
          border: '1px solid rgba(180,60,60,0.2)',
          marginBottom: 0,
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '18px', fontWeight: '600',
            color: '#e09090', margin: '0 0 4px 0',
          }}>Delete Account</h2>
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '13px', color: 'rgba(212,175,100,0.4)',
            fontStyle: 'italic', margin: '0 0 16px 0',
          }}>This is permanent and cannot be undone. All your data will be deleted.</p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '10px 28px',
                background: 'transparent',
                border: '1px solid rgba(180,60,60,0.35)',
                borderRadius: '6px',
                color: 'rgba(220,120,120,0.7)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Delete My Account
            </button>
          ) : (
            <div>
              <label style={labelStyle}>Confirm with your password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
              />
              {deleteErr && (
                <p style={{ color: '#e09090', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }}>
                  {deleteErr}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword}
                  style={{
                    padding: '10px 24px',
                    background: deletePassword ? 'rgba(160,40,40,0.7)' : 'rgba(160,40,40,0.2)',
                    border: '1px solid rgba(180,60,60,0.4)',
                    borderRadius: '6px',
                    color: deletePassword ? '#ffe0e0' : 'rgba(220,120,120,0.3)',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '13px', fontWeight: '600',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: deletePassword ? 'pointer' : 'not-allowed',
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteErr(''); }}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    border: '1px solid rgba(212,175,100,0.2)',
                    borderRadius: '6px',
                    color: 'rgba(212,175,100,0.5)',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}