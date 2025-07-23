// Hawkins Professional Design System
// Used across Netflix's 80+ internal tools

export const colors = {
  // Primary colors
  background: {
    primary: '#121212',    // Main dark grey background
    secondary: '#1e1e1e',  // Card/component background
    tertiary: '#2e2e2e',   // Hover/active states
  },
  
  // Netflix Red - Reserved for critical actions only
  critical: {
    primary: '#E50914',    // Netflix Red
    hover: '#F40612',      // Lighter red for hover
    muted: '#831010',      // Muted red for backgrounds
  },
  
  text: {
    primary: '#ffffff',    // Primary text
    secondary: '#9e9e9e',  // Secondary/muted text
    disabled: '#5e5e5e',   // Disabled text
  },
  
  // Accent colors (minimal use)
  accent: {
    primary: '#E50914',    // Primary accent
    secondary: '#E50914',  // Secondary accent
  },
  
  // Status colors
  status: {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#ff6b6b',
    info: '#2196f3',
  },
  
  // Borders and dividers
  border: {
    primary: '#333333',
    secondary: '#444444',
  },
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  
  heading: {
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
  },
  
  body: {
    large: {
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    regular: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    small: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.2)',
  md: '0 2px 8px rgba(0, 0, 0, 0.3)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.4)',
};

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Component-specific styles
export const components = {
  button: {
    primary: {
      backgroundColor: colors.critical.primary,
      color: colors.text.primary,
      padding: `${spacing.sm} ${spacing.lg}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.body.regular.fontSize,
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
      transition: `background-color ${transitions.normal}`,
      '&:hover': {
        backgroundColor: colors.critical.hover,
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      padding: `${spacing.sm} ${spacing.lg}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.body.regular.fontSize,
      fontWeight: 500,
      border: `1px solid ${colors.border.primary}`,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      '&:hover': {
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.secondary,
      },
    },
  },
  
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    boxShadow: shadows.md,
  },
  
  input: {
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.border.primary}`,
    fontSize: typography.body.regular.fontSize,
    transition: `border-color ${transitions.normal}`,
    '&:focus': {
      borderColor: colors.accent.primary,
      outline: 'none',
    },
  },
};