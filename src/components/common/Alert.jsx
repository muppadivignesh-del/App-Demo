/**
 * Alert/Info box component
 * @param {string} type - 'info' | 'success' | 'warning' | 'danger'
 */
const Alert = ({ type = 'info', icon, children, className = '', id, ...rest }) => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '🚨',
  };

  return (
    <div id={id} className={`alert alert-${type} ${className}`} {...rest}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon || icons[type]}</span>
      <div>{children}</div>
    </div>
  );
};

export default Alert;
