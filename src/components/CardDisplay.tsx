import React, { useEffect, useRef } from 'react';
import { Card, Category } from '../game/types';

interface CardDisplayProps {
  card: Card;
  isVisible: boolean;
  isWinner?: boolean;
  selectedCategory?: Category;
  onCategorySelect?: (category: Category) => void;
  isCategorySelectable?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  isVisible,
  isWinner = false,
  selectedCategory,
  onCategorySelect,
  isCategorySelectable = false,
}) => {
  // Maps a category to its display format and value - kept for possible HUD usage
  const categoryMap = [
    { key: Category.CHARISMA, value: card.charisma },
    { key: Category.LEADERSHIP, value: card.leadership },
    { key: Category.INFLUENCE, value: card.influence },
    { key: Category.INTEGRITY, value: card.integrity },
    { key: Category.TRICKERY, value: card.trickery },
    { key: Category.WEALTH, value: card.wealth },
  ];

  // Add debug info on mount
  useEffect(() => {
    if (isCategorySelectable) {
      console.log('Card is ready for category selection', card.name);
      console.log('Categories available:', categoryMap.map(c => c.key));
    }
  }, [isCategorySelectable, card.name]);

  // Add forced focus for keyboard accessibility
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isCategorySelectable && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isCategorySelectable]);

  return (
    <div
      className={`card-display ${isWinner ? 'card-winner' : ''}`}
      ref={cardRef}
      tabIndex={isCategorySelectable ? 0 : -1}
    >
      {isVisible ? (
        <>
          <h3 className="card-name">{card.name}</h3>
          <div className="card-image-container">
            <img src={card.imagePath} alt={card.name} className="card-image" />
          </div>
          {/* Category attributes have been removed as requested */}
          {card.quote && <p className="card-quote">"{card.quote}"</p>}
        </>
      ) : (
        <div className="card-back">
          <h3>POLITI CAT</h3>
          <div className="card-back-design">
            {/* Card back design */}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDisplay;