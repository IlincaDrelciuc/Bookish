import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bookish_token');
    const savedUser = localStorage.getItem('bookish_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('bookish_token', jwtToken);
    localStorage.setItem('bookish_user', JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bookish_token');
    localStorage.removeItem('bookish_user');
  }

  function updateUser(userData, jwtToken) {
    setUser(userData);
    localStorage.setItem('bookish_user', JSON.stringify(userData));
    if (jwtToken) {
      setToken(jwtToken);
      localStorage.setItem('bookish_token', jwtToken);
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}