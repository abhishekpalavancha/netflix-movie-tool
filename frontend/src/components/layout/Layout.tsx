import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import AddMovieModal from '../modals/AddMovieModal';
import SearchIcon from '../icons/SearchIcon';
import CrossIcon from '../icons/CrossIcon';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // If we're on the movies page with a search query, navigate to movies without search
    if (location.pathname === '/movies' && location.search.includes('search=')) {
      navigate('/movies');
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navLeft}>
            <h1 
              className={styles.title}
              onClick={() => navigate('/')}
            >
              <span className={styles.titleHighlight}>Netflix</span> Movie Tool
            </h1>
            
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <SearchIcon 
                size={20}
                color="#9e9e9e"
                className={styles.searchIcon}
              />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchQuery(newValue);
                  
                  // If text is completely removed and we're on movies page with search, reset
                  if (newValue === '' && location.pathname === '/movies' && location.search.includes('search=')) {
                    navigate('/movies');
                  }
                }}
                className={styles.searchInput}
              />
              {searchQuery && (
                <CrossIcon
                  size={16}
                  color="#9e9e9e"
                  className={styles.clearIcon}
                  onClick={handleClearSearch}
                />
              )}
            </form>
          </div>
          
          <ul className={styles.navLinks}>
            <li>
              <Link 
                to="/" 
                className={`${styles.navLink} ${isActiveRoute('/') ? styles.navLinkActive : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/movies" 
                className={`${styles.navLink} ${isActiveRoute('/movies') ? styles.navLinkActive : ''}`}
              >
                Movies
              </Link>
            </li>
            <li>
              <Link 
                to="/api-docs" 
                className={`${styles.navLink} ${isActiveRoute('/api-docs') ? styles.navLinkActive : ''}`}
              >
                API Docs
              </Link>
            </li>
            <li>
              <button
                onClick={() => setShowAddMovieModal(true)}
                className={styles.addButton}
              >
                <span>+</span> Add Movie
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
      
      <AddMovieModal
        isOpen={showAddMovieModal}
        onClose={() => setShowAddMovieModal(false)}
        onSuccess={() => {
          // Refresh the current page if on movies or dashboard
          if (location.pathname === '/' || location.pathname === '/movies') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};

export default Layout;