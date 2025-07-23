import React from 'react';

interface CrossIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

const CrossIcon: React.FC<CrossIconProps> = ({ 
  size = 24, 
  color = '#ffffff',
  style,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CrossIcon;