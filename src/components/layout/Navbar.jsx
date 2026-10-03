import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import './Navbar.css';

const Navbar = ({ title, showBack = false }) => {
  const { farmer, logout } = useAuth();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  return (
    <header className="navbar" id="app-navbar">
      <div className="navbar-left">
        {showBack ? (
          <button
            className="navbar-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>
        ) : (
          <Link to="/dashboard" className="navbar-logo">
            <span className="navbar-logo-icon">🌾</span>
            <span className="navbar-logo-text">AgroSelf</span>
          </Link>
        )}
        {title && <h1 className="navbar-title">{title}</h1>}
      </div>

      <div className="navbar-right">
        {!isOnline && (
          <span className="offline-indicator" title="You are offline">
            📵 Offline
          </span>
        )}
        <Link to="/notifications" className="navbar-icon-btn" aria-label="Notifications" id="nav-notifications-link">
          🔔
        </Link>
        {farmer && (
          <Link
            to="/profile"
            id="nav-profile-link"
            title={`${farmer.name}'s Profile`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--green-600), var(--green-800))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(45,125,70,0.25)',
              border: '2px solid white',
              flexShrink: 0,
            }}
          >
            {farmer.name ? farmer.name[0].toUpperCase() : '👨‍🌾'}
          </Link>
        )}
        <button
          id="navbar-logout-btn"
          className="navbar-icon-btn"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          title="Logout"
          aria-label="Logout"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0.4rem', borderRadius: '8px' }}
        >
          🚪
        </button>
      </div>
    </header>
  );
};

export default Navbar;
