import React from 'react';

interface ChevronLeftIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChevronLeftIcon: React.FC<ChevronLeftIconProps> = ({ 
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
        d="M15 18L9 12L15 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronLeftIcon;