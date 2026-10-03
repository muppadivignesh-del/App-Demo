const Loader = ({ size = 'md', text = '', fullScreen = false }) => {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg-app)',
        }}
      >
        <div className={`spinner ${sizeClass}`} />
        {text && <p className="text-sm text-muted">{text}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
      <div className={`spinner ${sizeClass}`} />
      {text && <span className="text-sm text-muted">{text}</span>}
    </div>
  );
};

export default Loader;
