import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './SnackbarContext.module.css';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  } | null>(null);

  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({ message, type, isVisible: true });
    setTimeout(() => {
      setSnackbar(null);
    }, 4000);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div
          className={`${styles.snackbar} ${styles[snackbar.type]} ${snackbar.isVisible ? styles.visible : styles.hidden}`}
        >
          <span className={styles.icon}>{getIcon(snackbar.type)}</span>
          <span>{snackbar.message}</span>
        </div>
      )}
    </SnackbarContext.Provider>
  );
};