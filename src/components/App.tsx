import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import BeatEmUpQTE from './BeatEmUpQTE';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/qte-test" element={<BeatEmUpQTE />} />
      </Routes>
    </Router>
  );
}

export default App;