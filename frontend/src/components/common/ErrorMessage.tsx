import React from 'react';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          ⚠️
        </div>
        <div>
          <h4 className={styles.title}>
            Error Loading Data
          </h4>
          <p className={styles.message}>
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className={styles.retryButton}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;