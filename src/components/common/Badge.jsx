/**
 * Badge component
 * @param {string} variant - 'green' | 'yellow' | 'red' | 'blue' | 'gray'
 */
const Badge = ({ children, variant = 'green', className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
