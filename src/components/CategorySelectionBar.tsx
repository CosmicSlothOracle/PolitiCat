import React from 'react';

interface CardType {
  [key: string]: number | string | undefined;
}

interface Props {
  selectedCategory1?: string;
  selectedCategory2?: string;
  topCard1?: CardType;
  topCard2?: CardType;
  state: 'selecting' | 'reveal' | 'result';
  winner?: 1 | 2 | 'draw' | null;
}

export const CategorySelectionBar: React.FC<Props> = ({
  selectedCategory1,
  selectedCategory2,
  topCard1,
  topCard2,
  state,
  winner
}) => {
  const showValue = state !== 'selecting' && selectedCategory1 && selectedCategory2;

  return (
    <div className="category-selection-bar">
      <div className={`player-category left ${selectedCategory1 ? 'selected' : 'waiting'} ${winner === 1 ? 'winner' : ''} ${winner === 'draw' ? 'draw' : ''}`}>
        {selectedCategory1 ? (
          <>
            <span className="category-name">{selectedCategory1}</span>
            {showValue && topCard1 && (
              <span className="category-value">{topCard1[selectedCategory1]}</span>
            )}
            {winner === 1 && <span className="winner-indicator">🏆</span>}
            {winner === 'draw' && <span className="winner-indicator">🤝</span>}
          </>
        ) : (
          <span className="waiting-text">Wählt...</span>
        )}
      </div>
      <div className="vs-symbol">VS</div>
      <div className={`player-category right ${selectedCategory2 ? 'selected' : 'waiting'} ${winner === 2 ? 'winner' : ''} ${winner === 'draw' ? 'draw' : ''}`}>
        {selectedCategory2 ? (
          <>
            <span className="category-name">{selectedCategory2}</span>
            {showValue && topCard2 && (
              <span className="category-value">{topCard2[selectedCategory2]}</span>
            )}
            {winner === 2 && <span className="winner-indicator">🏆</span>}
            {winner === 'draw' && <span className="winner-indicator">🤝</span>}
          </>
        ) : (
          <span className="waiting-text">Wählt...</span>
        )}
      </div>
    </div>
  );
};

export default CategorySelectionBar;