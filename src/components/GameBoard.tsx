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
  const { state, player1, player2, topCard1, topCard2, activePlayer, selectedCategory, roundWinner } = game;

  // Determine card visibility based on game state
  const isCard1Visible = state !== GameState.SETUP && topCard1 !== undefined;
  const isCard2Visible = state !== GameState.SETUP &&
                         topCard2 !== undefined &&
                         (state !== GameState.CATEGORY_SELECTION ||
                          activePlayer.name === player2.name ||
                          [GameState.VALUE_COMPARISON, GameState.RESOLVE_WINNER].includes(state));

  // ✅ FIXED: Avoid object reference check — use `.name` comparison
  const isCategorySelectable = state === GameState.CATEGORY_SELECTION &&
    (!activePlayer.isAI);

  console.log('Game state:', state);
  console.log('Active player:', activePlayer.name);
  console.log('Is category selectable:', isCategorySelectable);

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
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              isCategorySelectable={isCategorySelectable && activePlayer.name === player1.name}
            />
          </div>
        )}

        {topCard2 && (
          <div className="player2-card">
            <CardDisplay
              card={topCard2}
              isVisible={isCard2Visible}
              isWinner={isCard2Winner}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              isCategorySelectable={isCategorySelectable && activePlayer.name === player2.name}
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
        isCategorySelectable={isCategorySelectable}
      />
    </div>
  );
};

export default GameBoard;
