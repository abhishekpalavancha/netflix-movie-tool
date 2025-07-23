import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Layout } from './components/layout';

import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import AddMovie from './pages/AddMovie';
import MovieDetail from './pages/MovieDetail';
import ApiDocs from './pages/ApiDocs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="movies" element={<Movies />} />
          <Route path="movie/:id" element={<MovieDetail />} />
          <Route path="add-movie" element={<AddMovie />} />
          <Route path="api-docs" element={<ApiDocs />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;