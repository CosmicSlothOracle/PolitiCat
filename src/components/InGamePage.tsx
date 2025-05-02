import React, { useEffect, useState } from 'react';
import GameBoard from './GameBoard';
import { GameLogger } from '../ui/GameLogger';
import { DebugPanel } from './DebugPanel';
import { Category, GameContext, GameState } from '../game/types';
import {
  initializeGame,
  drawTopCards,
  selectAICategory,
  compareBothCategories,
  resolveWinner,
  handleTie,
  checkGameEnd
} from '../game/gameEngine';

export const InGamePage: React.FC = () => {
  const [game, setGame] = useState<GameContext | null>(null);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [showSetup, setShowSetup] = useState<boolean>(true);

  // Initialisiere das Spiel nach Setup
  useEffect(() => {
    if (!showSetup && !game) {
      const initializedGame = initializeGame(playerName, 'AI Opponent');
      setGame(initializedGame);

      setTimeout(() => {
        setGame(prev => prev ? { ...prev, state: GameState.DRAW_PHASE } : null);
      }, 500);
    }
  }, [showSetup, playerName, game]);

  // GameState-Verwaltung
  useEffect(() => {
    if (!game) return;

    const handleGameState = async () => {
      switch (game.state) {
        case GameState.DRAW_PHASE:
          const updatedGame = drawTopCards(game);
          // Nach dem Ziehen: State auf CATEGORY_SELECTION_BOTH setzen
          setGame({ ...updatedGame, state: GameState.CATEGORY_SELECTION_BOTH, selectedCategory1: undefined, selectedCategory2: undefined });
          break;

        case GameState.CATEGORY_SELECTION_BOTH:
          // AI wählt automatisch, falls noch nicht gewählt
          if (!game.selectedCategory2 && game.topCard2 && game.player2.isAI) {
            const aiCategory = selectAICategory(game.topCard2);
            setTimeout(() => {
              setGame(prev => prev ? { ...prev, selectedCategory2: aiCategory } : null);
            }, 800);
          }
          // Wenn beide gewählt haben, auswerten
          if (game.selectedCategory1 && game.selectedCategory2) {
            setTimeout(() => {
              setGame(prev => prev ? compareBothCategories(prev) : null);
            }, 500);
          }
          break;

        default:
          break;
      }
    };

    handleGameState();
  }, [game]);

  // Kategorieauswahl für den Menschen
  const handleCategorySelect = (category: Category) => {
    if (!game) return;
    if (game.state !== GameState.CATEGORY_SELECTION_BOTH || game.selectedCategory1) return;
    setGame({ ...game, selectedCategory1: category });
  };

  // Phasensteuerung
  const handleNextPhase = () => {
    if (!game) return;

    switch (game.state) {
      case GameState.VALUE_COMPARISON:
      case GameState.RESOLVE_WINNER:
        setGame(resolveWinner(game));
        break;

      case GameState.HANDLE_TIE:
        setGame(handleTie(game));
        break;

      case GameState.CHECK_END:
        setGame(checkGameEnd(game));
        break;

      default:
        break;
    }
  };

  // Setup-Ansicht
  if (showSetup) {
    return (
      <div className="setup-screen">
        <div className="setup-form">
          <h2>Game Setup</h2>
          <div>
            <label>Your Name:
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </label>
          </div>
          <button
            className="play-button"
            onClick={() => setShowSetup(false)}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Game view
  return (
    <div className="game-container">
      {game && (
        <>
          <GameBoard
            game={game}
            onCategorySelect={handleCategorySelect}
            onNextPhase={handleNextPhase}
          />
          {process.env.NODE_ENV !== 'production' && (
            <>
              <GameLogger game={game} />
              <DebugPanel game={game} />
            </>
          )}
        </>
      )}
      {!game && (
        <div className="loading">Loading game...</div>
      )}
    </div>
  );
};
