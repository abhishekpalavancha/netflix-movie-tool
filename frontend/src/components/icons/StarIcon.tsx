import React from 'react';
import styles from './Icons.module.css';

interface StarIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const StarIcon: React.FC<StarIconProps> = ({ size = 16, color = "#FFD700", style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    className={styles.starIcon}
    style={style}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export default StarIcon;