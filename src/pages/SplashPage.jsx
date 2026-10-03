import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SplashPage.css';

const SplashPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="splash-page" id="splash-screen">
      <div className="splash-content fade-in">
        {/* Logo */}
        <div className="splash-logo">
          <span className="splash-logo-icon">🌾</span>
        </div>

        {/* App Name */}
        <h1 className="splash-title">AgroSelf</h1>
        <p className="splash-tagline">Smart Farming for Every Farmer</p>

        {/* Decorative dots */}
        <div className="splash-dots">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </div>

        {/* Bottom text */}
        <p className="splash-footer">Agriculture & AgriTech Platform</p>
      </div>
    </div>
  );
};

export default SplashPage;
