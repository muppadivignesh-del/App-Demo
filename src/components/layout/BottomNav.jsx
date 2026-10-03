import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/crops', icon: '🌿', label: 'Crops' },
  { to: '/weather', icon: '🌤️', label: 'Weather' },
  { to: '/market', icon: '📊', label: 'Market' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const BottomNav = () => {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
