import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import CataloguePage from './pages/CataloguePage';
import BookDetailPage from './pages/BookDetailPage';
import MyBooksPage from './pages/MyBooksPage';
import StatsPage from './pages/StatsPage';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import RecommendationsTestPage from './pages/RecommendationsTestPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return <Navigate to='/login' replace />;
  return children;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/home' element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path='/onboarding' element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path='/books' element={<ProtectedRoute><CataloguePage /></ProtectedRoute>} />
        <Route path='/books/:id' element={<ProtectedRoute><BookDetailPage /></ProtectedRoute>} />
        <Route path='/my-books' element={<ProtectedRoute><MyBooksPage /></ProtectedRoute>} />
        <Route path='/stats' element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path='/' element={<Navigate to={isLoggedIn ? '/home' : '/register'} replace />} />
        <Route path='/recommendations' element={<ProtectedRoute><RecommendationsTestPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}