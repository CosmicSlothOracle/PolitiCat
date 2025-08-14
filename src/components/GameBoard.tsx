import React, { useRef, useEffect } from 'react';
import CardDisplay from './CardDisplay';
import { HUD } from './HUD';
import { Category, GameContext, GameState, Card } from '../game/types';

interface GameBoardProps {
  game: GameContext;
  onCategorySelect: (category: Category) => void;
  onNextPhase: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, onCategorySelect, onNextPhase }) => {
  const { state, player1, player2, topCard1, topCard2, selectedCategory1, selectedCategory2, roundWinner } = game;
  const comparisonBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      state === GameState.RESOLVE_WINNER ||
      state === GameState.VALUE_COMPARISON
    ) {
      const isMobile = typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 768px)').matches;
      if (!isMobile) {
        comparisonBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      comparisonBarRef.current?.classList.add('focus-glow');
      setTimeout(() => {
        comparisonBarRef.current?.classList.remove('focus-glow');
      }, 1200);
    }
  }, [state]);

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

  // Neue Komponente für die Anzeige der gewählten Kategorien und Werte im Zeilen-Layout (Variante B)
  const CategoryComparisonBar: React.FC<{
    selectedCategory1?: Category;
    selectedCategory2?: Category;
    topCard1?: Card;
    topCard2?: Card;
    player1: { name: string };
    player2: { name: string };
    roundWinner?: { name: string };
  }> = ({ selectedCategory1, selectedCategory2, topCard1, topCard2, player1, player2, roundWinner }) => {
    // Hilfsfunktion für Wertanzeige
    const getValue = (card: Card | undefined, category: Category | undefined) => {
      if (!card || !category) return null;
      return card[category.toLowerCase() as keyof Card];
    };
    // Kategorie-Icon (Unicode als Fallback)
    const getIcon = (category?: Category) => {
      switch (category) {
        case Category.CHARISMA: return '✨';
        case Category.LEADERSHIP: return '👑';
        case Category.INFLUENCE: return '🌐';
        case Category.INTEGRITY: return '🛡️';
        case Category.TRICKERY: return '🦊';
        case Category.WEALTH: return '💰';
        default: return '❓';
      }
    };
    // Gewinner-Highlight
    const highlight = (player: 'p1' | 'p2', category: Category | undefined) => {
      if (!selectedCategory1 || !selectedCategory2 || !topCard1 || !topCard2) return '';
      if (!category) return '';
      // Wer hat in dieser Kategorie gewonnen?
      const v1 = getValue(topCard1, category);
      const v2 = getValue(topCard2, category);
      if (v1 == null || v2 == null) return '';
      if (v1 > v2 && player === 'p1') return 'winner-value';
      if (v2 > v1 && player === 'p2') return 'winner-value';
      if (v1 === v2) return 'tie-value';
      return '';
    };
    return (
      <div className="category-comparison-bar">
        <div className="player-comparison left">
          <div className="player-label">{player1.name}</div>
          <div className="category-row">
            {selectedCategory1 && (
              <>
                <span className="category-icon">{getIcon(selectedCategory1)}</span>
                <span className="category-name">{selectedCategory1}</span>
                <span className={`category-value ${highlight('p1', selectedCategory1)}`}>{getValue(topCard1, selectedCategory1) ?? '-'}</span>
              </>
            )}
          </div>
          <div className="category-row">
            {selectedCategory2 && (
              <>
                <span className="category-icon">{getIcon(selectedCategory2)}</span>
                <span className="category-name">{selectedCategory2}</span>
                <span className={`category-value ${highlight('p1', selectedCategory2)}`}>{getValue(topCard1, selectedCategory2) ?? '-'}</span>
              </>
            )}
          </div>
        </div>
        <div className="vs-indicator">VS</div>
        <div className="player-comparison right">
          <div className="player-label">{player2.name}</div>
          <div className="category-row">
            {selectedCategory1 && (
              <>
                <span className="category-icon">{getIcon(selectedCategory1)}</span>
                <span className="category-name">{selectedCategory1}</span>
                <span className={`category-value ${highlight('p2', selectedCategory1)}`}>{getValue(topCard2, selectedCategory1) ?? '-'}</span>
              </>
            )}
          </div>
          <div className="category-row">
            {selectedCategory2 && (
              <>
                <span className="category-icon">{getIcon(selectedCategory2)}</span>
                <span className="category-name">{selectedCategory2}</span>
                <span className={`category-value ${highlight('p2', selectedCategory2)}`}>{getValue(topCard2, selectedCategory2) ?? '-'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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

      <div ref={comparisonBarRef}>
        <CategoryComparisonBar
          selectedCategory1={selectedCategory1}
          selectedCategory2={selectedCategory2}
          topCard1={topCard1}
          topCard2={topCard2}
          player1={player1}
          player2={player2}
          roundWinner={roundWinner}
        />
      </div>

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
