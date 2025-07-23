import React, { useState } from 'react';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { movieService } from '../../services/movieService';
import { MovieInput } from '../../types/movie';
import styles from './AddMovieModal.module.css';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddMovieModal: React.FC<AddMovieModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<MovieInput>({
    title: '',
    genre: '',
    rating: 0,
    year: 0,
  });
  const [errors, setErrors] = useState<Partial<MovieInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<MovieInput> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required';
    }
    
    if (formData.rating < 0 || formData.rating > 10) {
      newErrors.rating = 0;
    }
    
    if (formData.year < 1900 || formData.year > 2100) {
      newErrors.year = 0;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await movieService.createMovie(formData);
      showSnackbar('Movie added successfully!', 'success');
      setFormData({
        title: '',
        genre: '',
        rating: 0,
        year: 0,
      });
      onSuccess();
      onClose();
    } catch (error) {
      showSnackbar('Failed to add movie. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            Add New Movie
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              placeholder="e.g., The Batman"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            />
            {errors.title && (
              <p className={styles.errorMessage}>
                {errors.title}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Genre *
            </label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              placeholder="e.g., Action, Drama, Comedy"
              className={`${styles.input} ${errors.genre ? styles.inputError : ''}`}
            />
            {errors.genre && (
              <p className={styles.errorMessage}>
                {errors.genre}
              </p>
            )}
          </div>

          <div className={styles.gridRow}>
            <div>
              <label className={styles.label}>
                Rating (0-10) *
              </label>
              <input
                type="number"
                value={formData.rating || ''}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 8.5"
                min="0"
                max="10"
                step="0.1"
                className={`${styles.input} ${errors.rating ? styles.inputError : ''}`}
              />
            </div>

            <div>
              <label className={styles.label}>
                Year *
              </label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 2023"
                min="1900"
                max="2100"
                className={`${styles.input} ${errors.year ? styles.inputError : ''}`}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.submitButton}`}
            >
              {isSubmitting ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMovieModal;