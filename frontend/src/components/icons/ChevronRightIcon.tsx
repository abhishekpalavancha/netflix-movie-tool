import React from 'react';

interface ChevronRightIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({ 
  size = 24, 
  color = 'white',
  className = ''
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={className}
    >
      <path 
        d="M9 18L15 12L9 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronRightIcon;