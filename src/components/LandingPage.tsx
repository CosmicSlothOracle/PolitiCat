import React, { useMemo, useState, useEffect } from 'react';
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

  // PokemonZ card assets as sliced tiles from sprite sheets (4 suits * 9 tiles)
  const ASSET_URLS = useMemo(() => ({
    hearts: 'https://link.storjshare.io/raw/jxgwkm6k4w6qbqumyqm4ulb7zt5a/pokemonzgameassets/9xherz.png',
    diamonds: 'https://link.storjshare.io/raw/jvqqptyhfqhwsnijhxkwzr3erooa/pokemonzgameassets/9xkaro.png',
    clubs: 'https://link.storjshare.io/raw/jvoeq2u2xyl7qssgbmojhlnxopbq/pokemonzgameassets/9xkreuz.png',
    spades: 'https://link.storjshare.io/raw/jxbvhemvtt5ng67pgginrfpwr7ca/pokemonzgameassets/9xpiek.png'
  }), []);

  const TILE_W = 487;
  const TILE_H = 682;
  const SHEET_W = 1462;
  const SHEET_H = 2048;
  const SCALE = 0.18; // thumbnail size
  const ZOOM_SCALE = 0.5; // zoom size

  type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
  const [zoomCard, setZoomCard] = useState<{ suit: Suit; idx: number } | null>(null);

  const spriteTiles = useMemo(() => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    const items: { key: string; suit: typeof suits[number]; idx: number; bg: React.CSSProperties }[] = [];
    suits.forEach((suit) => {
      for (let idx = 0; idx < 9; idx++) {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = -Math.round(col * TILE_W * SCALE);
        const y = -Math.round(row * TILE_H * SCALE);
        items.push({
          key: `${suit}-${idx}`,
          suit,
          idx,
          bg: {
            backgroundImage: `url(${ASSET_URLS[suit]})`,
            backgroundPosition: `${x}px ${y}px`,
            backgroundSize: `${Math.round(SHEET_W * SCALE)}px ${Math.round(SHEET_H * SCALE)}px`,
            backgroundRepeat: 'no-repeat',
            width: `${Math.round(TILE_W * SCALE)}px`,
            height: `${Math.round(TILE_H * SCALE)}px`,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
          }
        });
      }
    });
    return items;
  }, [ASSET_URLS]);

  // Library card preview component (PokemonZ Cards)
  const CardLibrary = () => (
    <div className="library-modal">
      <div className="library-header">
        <h2>PokemonZ Cards</h2>
        <button className="close-button" onClick={toggleLibrary}>×</button>
      </div>
      <div
        className="card-list"
        style={{
          maxHeight: '72vh',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '14px',
          padding: '8px'
        }}
      >
        {spriteTiles.map((t) => (
          <div
            key={t.key}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'zoom-in' }}
            onClick={() => setZoomCard({ suit: t.suit, idx: t.idx })}
          >
            <div style={t.bg} />
          </div>
        ))}
      </div>
      {zoomCard && (
        <div
          role="dialog"
          aria-label="Card Zoom"
          onClick={() => setZoomCard(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100
          }}
        >
          {(() => {
            const col = zoomCard.idx % 3;
            const row = Math.floor(zoomCard.idx / 3);
            const x = -Math.round(col * TILE_W * ZOOM_SCALE);
            const y = -Math.round(row * TILE_H * ZOOM_SCALE);
            const style: React.CSSProperties = {
              backgroundImage: `url(${ASSET_URLS[zoomCard.suit]})`,
              backgroundPosition: `${x}px ${y}px`,
              backgroundSize: `${Math.round(SHEET_W * ZOOM_SCALE)}px ${Math.round(SHEET_H * ZOOM_SCALE)}px`,
              backgroundRepeat: 'no-repeat',
              width: `${Math.round(TILE_W * ZOOM_SCALE)}px`,
              height: `${Math.round(TILE_H * ZOOM_SCALE)}px`,
              border: '2px solid #00ffff',
              borderRadius: 12,
              boxShadow: '0 0 20px rgba(0,255,255,0.5)',
              cursor: 'zoom-out'
            };
            return <div style={style} />;
          })()}
        </div>
      )}
    </div>
  );

  return (
    <div className="landing-background">
      <div className="scanline-overlay"></div>

      <h1 className="game-title">Play Milch</h1>
      <p className="subtitle">Live slow, play whenever.</p>

      {/* Keep PokemonZ entry visible */}
      <div className="main-buttons">
        <button
          className="play-button"
          onClick={() => navigate('/pokemonz')}
        >
          Play PokemonZ
        </button>
        <button
          className="play-button"
          onClick={() => navigate('/pokemonz-online')}
        >
          Play PokemonZ Online (Beta)
        </button>
      </div>

      <button
        className="cat-library"
        onClick={toggleLibrary}
      >
        PokemonZ Cards
      </button>

      <VinylMusicControl />

      {showLibrary && <CardLibrary />}
    </div>
  );
};

export default LandingPage;
