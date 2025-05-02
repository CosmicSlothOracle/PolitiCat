import React from 'react';
import CardDisplay from './CardDisplay';
import { HUD } from './HUD';
import { Category, GameContext, GameState } from '../game/types';

interface GameBoardProps {
  game: GameContext;
  onCategorySelect: (category: Category) => void;
  onNextPhase: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, onCategorySelect, onNextPhase }) => {
  const { state, player1, player2, topCard1, topCard2, selectedCategory1, selectedCategory2, roundWinner } = game;

  // Determine card visibility based on game state
  const isCard1Visible = state !== GameState.SETUP && topCard1 !== undefined;
  const isCard2Visible = state !== GameState.SETUP && topCard2 !== undefined;

  // Kategorieauswahl für Spieler 1 (Mensch)
  const isCategorySelectable1 = state === GameState.CATEGORY_SELECTION_BOTH && !selectedCategory1;
  // Kategorieauswahl für Spieler 2 (AI, im Multiplayer ggf. echter Spieler)
  const isCategorySelectable2 = state === GameState.CATEGORY_SELECTION_BOTH && !selectedCategory2 && !player2.isAI;

  const availableCategories = Object.values(Category);

  const isCard1Winner = state === GameState.RESOLVE_WINNER && roundWinner?.name === player1.name;
  const isCard2Winner = state === GameState.RESOLVE_WINNER && roundWinner?.name === player2.name;

  return (
    <div className="game-board">
      <div className="player-info">
        <div className="player-stats">
          <h3>{player1.name}</h3>
          <p>Cards: {player1.deck.length}</p>
        </div>
        <div className="player-stats">
          <h3>{player2.name}</h3>
          <p>Cards: {player2.deck.length}</p>
        </div>
      </div>

      <div className="tie-pile-info">
        {game.tiePile.length > 0 && (
          <p>Tie Pile: {game.tiePile.length} cards</p>
        )}
      </div>

      <div className="cards-container">
        {topCard1 && (
          <div className="player1-card">
            <CardDisplay
              card={topCard1}
              isVisible={isCard1Visible}
              isWinner={isCard1Winner}
              selectedCategory={selectedCategory1}
              onCategorySelect={onCategorySelect}
              isCategorySelectable={isCategorySelectable1}
            />
          </div>
        )}

        {topCard2 && (
          <div className="player2-card">
            <CardDisplay
              card={topCard2}
              isVisible={isCard2Visible}
              isWinner={isCard2Winner}
              selectedCategory={selectedCategory2}
              onCategorySelect={onCategorySelect}
              isCategorySelectable={isCategorySelectable2}
            />
          </div>
        )}
      </div>

      {state === GameState.GAME_OVER && (
        <div className="game-over-overlay">
          <h2>{roundWinner?.name} Wins!</h2>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}

      <HUD
        gameState={state}
        onCategorySelect={onCategorySelect}
        onNextPhase={onNextPhase}
        availableCategories={availableCategories.map(c => c.toString())}
        isCategorySelectable={isCategorySelectable1}
      />
    </div>
  );
};

export default GameBoard;
