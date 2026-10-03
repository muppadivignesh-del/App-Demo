import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import BottomNav from './BottomNav';
import './AppLayout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/crops', icon: '🌿', label: 'My Crops' },
  { to: '/irrigation', icon: '💧', label: 'Smart Irrigation' },
  { to: '/weather', icon: '🌤️', label: 'Weather & Forecast' },
  { to: '/advisor', icon: '🤖', label: 'AI Crop Advisor' },
  { to: '/market', icon: '📊', label: 'Market & Demand' },
  { to: '/calculator', icon: '💰', label: 'Profit Calculator' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

const AppLayout = ({ children, title, subtitle, showBack = false }) => {
  const { farmer, logout } = useAuth();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Read unread notifications
  useEffect(() => {
    try {
      const raw = localStorage.getItem('agri_notifications');
      if (raw) {
        const notifs = JSON.parse(raw);
        const count = notifs.filter((n) => n.farmerId === farmer?.id && !n.isRead).length;
        setUnreadCount(count);
      }
    } catch {}
  }, [farmer?.id, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const farmerName = farmer?.name || 'Farmer';
  const locationText = [
    farmer?.location?.village || farmer?.village,
    farmer?.location?.district || farmer?.district,
  ]
    .filter(Boolean)
    .join(', ') || 'Agricultural Farm';

  return (
    <div className="app-shell">
      {/* ── Mobile Backdrop ── */}
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Professional Sidebar (Desktop & Mobile Drawer) ── */}
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <span className="sidebar-brand-icon">🌾</span>
            <div>
              <h2 className="sidebar-brand-title">AgroSelf</h2>
              <p className="sidebar-brand-subtitle">Farmer Self-Service</p>
            </div>
          </Link>
        </div>

        {/* Current Farmer Profile Tile */}
        <div className="sidebar-farmer-card">
          <div className="sidebar-farmer-avatar">
            {farmerName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-farmer-info">
            <p className="sidebar-farmer-name" title={farmerName}>{farmerName}</p>
            <p className="sidebar-farmer-location" title={locationText}>📍 {locationText}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              id={`sidebar-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            id="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Work Area ── */}
      <div className="app-main">
        {/* Top Navbar */}
        <header className="app-topbar" id="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              ☰
            </button>

            {showBack && (
              <button
                type="button"
                className="topbar-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Go Back"
              >
                ←
              </button>
            )}

            <div className="topbar-title-block">
              <h1>{title || 'AgroSelf Farmer Portal'}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          <div className="topbar-right">
            {/* Online / Offline status badge */}
            <span
              className={`status-chip ${isOnline ? 'online' : 'offline'}`}
              title={isOnline ? 'Connected to agricultural network' : 'Offline — showing local saved data'}
            >
              <span style={{ fontSize: '0.65rem' }}>{isOnline ? '🟢' : '📵'}</span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="topbar-icon-link"
              id="topbar-notif-link"
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="topbar-badge-dot" />}
            </Link>

            {/* Profile Avatar Chip */}
            <Link
              to="/profile"
              className="topbar-profile-link"
              id="topbar-profile-link"
              title="My Farmer Profile"
            >
              <div className="topbar-avatar">
                {farmerName.charAt(0).toUpperCase()}
              </div>
              <span className="d-none-mobile">{farmerName.split(' ')[0]}</span>
            </Link>

            {/* Logout button */}
            <button
              type="button"
              id="navbar-logout-btn"
              onClick={handleLogout}
              className="topbar-icon-link"
              title="Sign Out"
              aria-label="Logout"
              style={{ cursor: 'pointer', border: '1px solid #e2e8e2', background: '#f8faf8' }}
            >
              🚪
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="app-content-container fade-in">
          {!isOnline && (
            <div
              id="offline-status-banner"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(180,83,9,0.06)',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📵</span>
              <span>Offline — showing saved information. All your farm data remains safely accessible locally.</span>
            </div>
          )}
          {children}
        </main>

        {/* Responsive Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
