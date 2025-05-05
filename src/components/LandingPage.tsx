import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
import VinylMusicControl from './VinylMusicControl';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showLibrary, setShowLibrary] = useState<boolean>(false);

  // Handle animation effects
  useEffect(() => {
    // Title shimmer animation already handled in CSS
    // Add any additional effects here
  }, []);

  // Handle navigation to game
  const handlePlayAI = () => {
    navigate('/play');
  };

  // Handle navigation to multiplayer game
  const handlePlayMultiplayer = () => {
    navigate('/multiplayer');
  };

  // Toggle library view
  const toggleLibrary = () => {
    setShowLibrary(!showLibrary);
  };

  // Library card preview component
  const CardLibrary = () => (
    <div className="library-modal">
      <div className="library-header">
        <h2>CAT Library</h2>
        <button className="close-button" onClick={toggleLibrary}>×</button>
      </div>
      <div className="card-list">
        {/* List of card previews would go here */}
        <p>Coming soon: Browse all Politician Cards</p>
      </div>
    </div>
  );

  return (
    <div className="landing-background">
      <div className="scanline-overlay"></div>

      <h1 className="game-title">POLITI CAT</h1>
      <p className="subtitle">The Ultimate Political Card Game</p>

      <div className="main-buttons">
        <button
          className="play-button"
          onClick={handlePlayAI}
        >
          Play Against AI
        </button>
        <button
          className="play-button"
          onClick={handlePlayMultiplayer}
        >
          Play Against a Friend
        </button>
        <button
          className="play-button"
          onClick={() => navigate('/qte-test')}
        >
          QTE Test Area
        </button>
      </div>

      <button
        className="cat-library"
        onClick={toggleLibrary}
      >
        CAT Library
      </button>

      <VinylMusicControl />

      {showLibrary && <CardLibrary />}
    </div>
  );
};

export default LandingPage;
