import { notificationAPI } from '../services/notificationAPI';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/dateUtils';

const TYPE_CONFIG = {
  rain_alert: {
    icon: '🌧️',
    label: 'Weather & Rain',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    link: '/weather',
    linkLabel: 'View Weather Forecast →',
  },
  watering_reminder: {
    icon: '💧',
    label: 'Irrigation',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    link: '/irrigation',
    linkLabel: 'Open Irrigation Advisor →',
  },
  harvest_reminder: {
    icon: '🌾',
    label: 'Harvest Alert',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    link: '/crops',
    linkLabel: 'View My Crops →',
  },
  market_alert: {
    icon: '📊',
    label: 'Mandi Rate Pulse',
    badgeBg: '#f3e8ff',
    badgeColor: '#7e22ce',
    link: '/market',
    linkLabel: 'Check Mandi Prices →',
  },
  crop_protection: {
    icon: '🛡️',
    label: 'Crop Protection',
    badgeBg: '#ffedd5',
    badgeColor: '#c2410c',
    link: '/advisor',
    linkLabel: 'Consult Crop Advisor →',
  },
  general: {
    icon: '🔔',
    label: 'General Notice',
    badgeBg: '#f1f5f9',
    badgeColor: '#475569',
    link: '/dashboard',
    linkLabel: 'Go to Dashboard →',
  },
};

const getInitialFarmerNotifications = (farmerId, farmerName) => [
  {
    _id: `notif_rain_${farmerId}`,
    farmerId,
    title: 'Rain Forecast Alert',
    message: 'Precipitation expected in your region over the next 48 hours. Consider delaying scheduled tube-well irrigation.',
    type: 'rain_alert',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: `notif_water_${farmerId}`,
    farmerId,
    title: 'Irrigation Schedule Reminder',
    message: 'Check soil moisture for your standing crops. 2 days have elapsed since last recorded watering cycle.',
    type: 'watering_reminder',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: `notif_market_${farmerId}`,
    farmerId,
    title: 'Mandi Rate Pulse',
    message: 'Tomato and Chilli wholesale prices surged +8% to +12% in nearby regional APMCs. Favorable trading window.',
    type: 'market_alert',
    isRead: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    _id: `notif_protect_${farmerId}`,
    farmerId,
    title: 'Crop Protection & Spray Alert',
    message: 'Low wind conditions (<14 km/h) forecasted for tomorrow morning. Safe window for protective spray application.',
    type: 'crop_protection',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: `notif_harvest_${farmerId}`,
    farmerId,
    title: 'Harvest Preparation Notice',
    message: `Welcome ${farmerName || 'Farmer'}! Keep your harvest schedules up-to-date to receive automated storage reminders.`,
    type: 'harvest_reminder',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const NotificationsPage = () => {
  const { farmer } = useAuth();
  const farmerId = farmer?.id || farmer?._id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationAPI.getNotifications();
        if (res.data?.data?.notifications && res.data.data.notifications.length > 0) {
          setNotifications(res.data.data.notifications);
          setLoading(false);
          return;
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem('agri_notifications');
        let allNotifs = raw ? JSON.parse(raw) : [];
        let farmerNotifs = allNotifs.filter((n) => n.farmerId === farmerId);

        if (farmerNotifs.length === 0 && farmerId) {
          const seeded = getInitialFarmerNotifications(farmerId, farmer.name);
          allNotifs = [...seeded, ...allNotifs];
          localStorage.setItem('agri_notifications', JSON.stringify(allNotifs));
          farmerNotifs = [...seeded];
        }

        setNotifications(farmerNotifs);
      } catch {
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [farmerId, farmer?.name]);

  const showFeedback = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  // Mark single as read
  const markRead = (id) => {
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = raw ? JSON.parse(raw) : [];
      const updated = allNotifs.map((n) => (n._id === id ? { ...n, isRead: true } : n));
      localStorage.setItem('agri_notifications', JSON.stringify(updated));
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  // Mark ALL as read
  const markAllAsRead = () => {
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = raw ? JSON.parse(raw) : [];
      const updated = allNotifs.map((n) =>
        n.farmerId === farmerId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('agri_notifications', JSON.stringify(updated));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showFeedback('✓ All notifications marked as read.');
    } catch {}
  };

  // Clear single notification
  const deleteNotification = (e, id) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = raw ? JSON.parse(raw) : [];
      const updated = allNotifs.filter((n) => n._id !== id);
      localStorage.setItem('agri_notifications', JSON.stringify(updated));
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showFeedback('Notification dismissed.');
    } catch {}
  };

  // Clear ALL notifications for this farmer
  const clearAllNotifications = () => {
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = raw ? JSON.parse(raw) : [];
      const updated = allNotifs.filter((n) => n.farmerId !== farmerId);
      localStorage.setItem('agri_notifications', JSON.stringify(updated));
      setNotifications([]);
      showFeedback('🗑️ All notifications have been cleared.');
    } catch {}
  };

  // Clear ONLY read notifications
  const clearRead = () => {
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = raw ? JSON.parse(raw) : [];
      const updated = allNotifs.filter((n) => !(n.farmerId === farmerId && n.isRead));
      localStorage.setItem('agri_notifications', JSON.stringify(updated));
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      showFeedback('Cleared all read notifications.');
    } catch {}
  };

  // Restore sample alerts
  const restoreSampleAlerts = () => {
    if (!farmerId) return;
    try {
      const raw = localStorage.getItem('agri_notifications');
      const allNotifs = (raw ? JSON.parse(raw) : []).filter((n) => n.farmerId !== farmerId);
      const seeded = getInitialFarmerNotifications(farmerId, farmer?.name);
      localStorage.setItem('agri_notifications', JSON.stringify([...seeded, ...allNotifs]));
      setNotifications(seeded);
      showFeedback('Fresh sample alerts generated.');
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtered notifications
  const filteredNotifs = useMemo(() => {
    if (activeFilter === 'unread') return notifications.filter((n) => !n.isRead);
    if (activeFilter === 'weather') return notifications.filter((n) => n.type === 'rain_alert');
    if (activeFilter === 'irrigation') return notifications.filter((n) => n.type === 'watering_reminder');
    if (activeFilter === 'market') return notifications.filter((n) => n.type === 'market_alert');
    if (activeFilter === 'protection') return notifications.filter((n) => n.type === 'crop_protection');
    return notifications;
  }, [notifications, activeFilter]);

  return (
    <AppLayout
      title="Farm Notifications & Alerts"
      subtitle={`${unreadCount} unread advisory alert${unreadCount !== 1 ? 's' : ''}`}
      showBack
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Action Bar with Clear Buttons ── */}
        <div
          className="card"
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            background: '#ffffff',
          }}
        >
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🔔 Notifications Inbox
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              ({notifications.length} total · {unreadCount} unread)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                type="button"
                className="btn btn-sm"
                onClick={markAllAsRead}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Mark All Read
              </button>
            )}

            {notifications.some((n) => n.isRead) && (
              <button
                id="clear-read-btn"
                type="button"
                className="btn btn-outline btn-sm"
                onClick={clearRead}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '10px',
                }}
              >
                Clear Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                id="clear-all-notifs-btn"
                type="button"
                className="btn btn-sm"
                onClick={clearAllNotifications}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {actionMsg && <Alert type="success">{actionMsg}</Alert>}
        {error && <Alert type="danger">{error}</Alert>}

        {/* ── Category Filter Tabs ── */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'weather', label: '🌧️ Weather' },
            { id: 'irrigation', label: '💧 Irrigation' },
            { id: 'market', label: '📊 Market' },
            { id: 'protection', label: '🛡️ Protection' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '16px',
                border: activeFilter === tab.id ? '1.5px solid #1e6b3c' : '1px solid #e5e7eb',
                background: activeFilter === tab.id ? '#1e6b3c' : '#ffffff',
                color: activeFilter === tab.id ? '#ffffff' : '#374151',
                fontWeight: activeFilter === tab.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <Loader text="Loading alerts..." />}

        {/* ── Empty State ── */}
        {!loading && filteredNotifs.length === 0 && (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              borderRadius: '16px',
              background: '#f8faf8',
              border: '1px dashed #cbd5e1',
            }}
          >
            <span style={{ fontSize: '3rem' }}>✨</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.75rem 0 0.25rem', color: 'var(--text-primary)' }}>
              {activeFilter === 'all'
                ? 'All Clear! No notifications.'
                : `No notifications under "${activeFilter}".`}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 1.25rem' }}>
              Your notification center is clean. Agricultural advisories and alerts will appear here automatically.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={restoreSampleAlerts}
              style={{ borderRadius: '12px', padding: '0.5rem 1.25rem' }}
            >
              🔄 Restore Default Farm Alerts
            </button>
          </div>
        )}

        {/* ── Notifications List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifs.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
            return (
              <div
                key={notif._id}
                id={`notif-${notif._id}`}
                className="card notif-card"
                style={{
                  borderRadius: '14px',
                  padding: '1.1rem',
                  opacity: notif.isRead ? 0.78 : 1,
                  borderLeft: `4px solid ${notif.isRead ? '#cbd5e1' : '#16a34a'}`,
                  background: notif.isRead ? '#ffffff' : '#f9fdfa',
                  boxShadow: notif.isRead ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.08)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onClick={() => !notif.isRead && markRead(notif._id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{cfg.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header: Tag + Title + Unread dot + Dismiss button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.5rem',
                            borderRadius: '10px',
                            background: cfg.badgeBg,
                            color: cfg.badgeColor,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <h4
                          style={{
                            fontWeight: notif.isRead ? 700 : 900,
                            fontSize: '0.94rem',
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#16a34a',
                              display: 'inline-block',
                              boxShadow: '0 0 0 2px #dcfce7',
                            }}
                          />
                        )}
                      </div>

                      {/* Individual Clear / Dismiss Button */}
                      <button
                        type="button"
                        title="Dismiss notification"
                        onClick={(e) => deleteNotification(e, notif._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          lineHeight: 1,
                          padding: '0.2rem',
                          borderRadius: '6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Message Body */}
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.48 }}>
                      {notif.message}
                    </p>

                    {/* Footer: Timestamp + Action Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🕒 {timeAgo(notif.createdAt)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(notif._id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#166534',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Mark as read
                          </button>
                        )}
                        <Link
                          to={cfg.link}
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#15803d',
                            textDecoration: 'none',
                          }}
                        >
                          {cfg.linkLabel}
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
