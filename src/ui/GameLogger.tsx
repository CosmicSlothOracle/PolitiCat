
import React from 'react';
import { GameContext, GameState } from '../game/types';

export const GameLogger: React.FC<{ game: GameContext }> = ({ game }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: '#00ffff',
      padding: '1rem',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      zIndex: 1000,
      width: '300px',
      height: 'auto'
    }}>
      <strong>DEBUG LOG</strong><br />
      GameState: {GameState[game.state]}<br />
      Active Player: {game.activePlayer.name}<br />
      Player1 Deck: {game.player1.deck.length}<br />
      Player2 Deck: {game.player2.deck.length}<br />
      Selected Category: {game.selectedCategory || 'None'}<br />
      Round Winner: {game.roundWinner?.name || 'None'}<br />
      Tie Pile: {game.tiePile.length}
    </div>
  );
};
