import React from 'react';

interface SearchIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

const SearchIcon: React.FC<SearchIconProps> = ({ size = 24, color = "white", style = {}, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    style={style}
    className={className}
  >
    <circle 
      cx="10" 
      cy="10" 
      r="7" 
      stroke={color} 
      strokeWidth="2"
    />
    <path 
      d="M21 21l-5.2-5.2" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export default SearchIcon;