import React, { useCallback } from 'react';
import { GameState, Category } from '../game/types';

interface HUDProps {
  gameState: GameState;
  onCategorySelect?: (category: Category) => void;
  onNextPhase?: () => void;
  availableCategories?: string[];
  isCategorySelectable?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  onCategorySelect,
  onNextPhase,
  availableCategories = [],
  isCategorySelectable = false,
}) => {
  const phaseLabels: Record<GameState, string> = {
    [GameState.SETUP]: 'Setup',
    [GameState.DRAW_PHASE]: 'Draw Phase',
    [GameState.CATEGORY_SELECTION]: 'Select a Category',
    [GameState.CATEGORY_SELECTION_BOTH]: 'Select a Category',
    [GameState.VALUE_COMPARISON]: 'Compare Values',
    [GameState.RESOLVE_WINNER]: 'Resolving Round',
    [GameState.HANDLE_TIE]: 'Tie Detected',
    [GameState.CHECK_END]: 'Check for End',
    [GameState.GAME_OVER]: 'Game Over',
  };

  const handleCategoryClick = useCallback((categoryStr: string, event: React.MouseEvent | React.TouchEvent) => {
    // Prevent default and stop propagation to avoid any interference
    event.preventDefault();
    event.stopPropagation();

    console.log('HUD category clicked:', categoryStr);
    console.log('Is selectable:', isCategorySelectable);

    if (isCategorySelectable && onCategorySelect) {
      // Convert string to Category enum value
      const categoryValue =
        Object.values(Category).find(cat => cat === categoryStr) ||
        (categoryStr as unknown as Category);

      console.log('Category value after conversion:', categoryValue);

      // Add slight delay to ensure UI feedback
      setTimeout(() => {
        onCategorySelect(categoryValue);
      }, 50);
    }
  }, [isCategorySelectable, onCategorySelect]);

  return (
    <div className="hud-container" style={{ margin: '32px auto 0 auto', maxWidth: 700 }}>
      <div className="phase-indicator">
        <strong>{phaseLabels[gameState]}</strong>
      </div>

      {(gameState === GameState.CATEGORY_SELECTION || gameState === GameState.CATEGORY_SELECTION_BOTH) && isCategorySelectable && (
        <div className="category-buttons">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={(e) => handleCategoryClick(cat, e)}
              onTouchStart={(e) => handleCategoryClick(cat, e)}
              className={`category-button ${isCategorySelectable ? 'selectable' : ''}`}
              disabled={!isCategorySelectable}
              aria-label={`Select ${cat} category`}
              data-testid={`hud-category-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {(gameState === GameState.VALUE_COMPARISON ||
        gameState === GameState.RESOLVE_WINNER ||
        gameState === GameState.HANDLE_TIE ||
        gameState === GameState.CHECK_END) && (
        <button
          className="next-phase-button"
          onClick={onNextPhase}
          data-testid="next-phase-button"
        >
          Continue
        </button>
      )}

      {gameState === GameState.GAME_OVER && (
        <button
          className="restart-button"
          onClick={() => window.location.reload()}
          data-testid="restart-button"
        >
          Play Again
        </button>
      )}
    </div>
  );
};
