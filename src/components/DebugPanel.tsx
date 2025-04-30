import React, { useState, useEffect } from 'react';
import { GameContext, GameState } from '../game/types';

interface DebugPanelProps {
  game?: GameContext;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ game }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [clickableHighlight, setClickableHighlight] = useState(false);

  useEffect(() => {
    // Add keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Function to highlight clickable elements
  const highlightClickableElements = () => {
    const isHighlighting = !clickableHighlight;
    setClickableHighlight(isHighlighting);

    const elements = document.querySelectorAll('button, [role="button"], .attribute.selectable, .category-button');

    elements.forEach(el => {
      if (isHighlighting) {
        el.classList.add('debug-highlight');
      } else {
        el.classList.remove('debug-highlight');
      }
    });
  };

  // Function to try to fix click handling
  const fixClickHandling = () => {
    // Force rebinding click events
    const clickables = document.querySelectorAll('.attribute.selectable, .category-button');

    clickables.forEach(el => {
      el.classList.add('forced-clickable');

      // Clone and replace to reset event listeners
      const clone = el.cloneNode(true);
      el.parentNode?.replaceChild(clone, el);

      // Add debug click handler
      clone.addEventListener('click', (e) => {
        console.log('Debug click handler triggered on', e.target);

        // Find the category from the element
        const categoryText = (clone as HTMLElement).textContent?.trim().split('\n')[0];
        console.log('Category detected:', categoryText);

        // Try to force a state update by dispatching a custom event
        const customEvent = new CustomEvent('forced-category-select', {
          detail: { category: categoryText },
          bubbles: true
        });
        document.dispatchEvent(customEvent);
      });
    });

    // Add global handler for the custom event
    document.addEventListener('forced-category-select', (e: any) => {
      console.log('Forced category select event received:', e.detail);
    });

    alert('Click handling fixed, try again!');
  };

  if (!isVisible) {
    return (
      <div
        className="debug-toggle"
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          width: '20px',
          height: '20px',
          backgroundColor: 'red',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 9999
        }}
      />
    );
  }

  return (
    <div
      className="debug-panel"
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '400px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div>
        <button
          onClick={highlightClickableElements}
          style={{ marginRight: '5px', marginBottom: '5px' }}
        >
          {clickableHighlight ? 'Hide Clickable Elements' : 'Show Clickable Elements'}
        </button>

        <button
          onClick={fixClickHandling}
          style={{ marginBottom: '5px' }}
        >
          Fix Click Handling
        </button>
      </div>

      {game && (
        <div style={{ marginTop: '10px' }}>
          <div>Game State: {GameState[game.state]}</div>
          <div>Active Player: {game.activePlayer.name} (AI: {game.activePlayer.isAI ? 'Yes' : 'No'})</div>
          <div>Category Selectable: {game.state === GameState.CATEGORY_SELECTION ? 'Yes' : 'No'}</div>
          {game.selectedCategory && <div>Selected Category: {game.selectedCategory}</div>}
        </div>
      )}
    </div>
  );
};