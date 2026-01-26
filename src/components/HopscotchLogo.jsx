// Official Hopscotch logo
export default function HopscotchLogo({ size = 'md' }) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <img
      src="/hopscotch-logo.png"
      alt="Hopscotch Children's Nurseries"
      className={sizeClass}
    />
  );
}
