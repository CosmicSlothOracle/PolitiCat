import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { GameLogger } from '../ui/GameLogger';
import { DebugPanel } from './DebugPanel';
import { Category, GameContext, GameState } from '../game/types';
import {
  initializeGame,
  drawTopCards,
  selectCategory,
  compareValues,
  resolveWinner,
  handleTie,
  checkGameEnd,
  selectAICategory
} from '../game/gameEngine';

export const InGamePage: React.FC = () => {
  const [game, setGame] = useState<GameContext | null>(null);
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [showSetup, setShowSetup] = useState<boolean>(true);
  const navigate = useNavigate();

  // 🛠 Dummy-Debug-Funktionen für DebugPanel
  const enableClickHighlighting = () => {
    console.log('[Debug] Click highlighting ENABLED');
    // Hier könnte ein Overlay o. Ä. getriggert werden
  };

  const disableClickHighlighting = () => {
    console.log('[Debug] Click highlighting DISABLED');
    // Hier könnte ein Overlay entfernt werden
  };

  // Initialisiere das Spiel nach Setup
  useEffect(() => {
    if (!showSetup && !game) {
      const initializedGame = initializeGame(playerName, 'AI Opponent');
      setGame(initializedGame);

      setTimeout(() => {
        setGame(prev => prev ? { ...prev, state: GameState.DRAW_PHASE } : null);
      }, 500);
    }
  }, [showSetup, playerName]);

  // GameState-Verwaltung
  useEffect(() => {
    if (!game) return;

    const handleGameState = async () => {
      switch (game.state) {
        case GameState.DRAW_PHASE:
          const updatedGame = drawTopCards(game);
          setGame(updatedGame);
          break;

        case GameState.CATEGORY_SELECTION:
          if (game.activePlayer.isAI && game.topCard1 && game.topCard2) {
            const aiCard = game.activePlayer === game.player1 ? game.topCard1 : game.topCard2;
            const aiCategory = selectAICategory(aiCard);
            setTimeout(() => {
              handleCategorySelect(aiCategory);
            }, 1000);
          }
          break;

        default:
          break;
      }
    };

    handleGameState();
  }, [game?.state]);

  // Kategorieauswahl
  const handleCategorySelect = (category: Category) => {
    if (!game) return;

    console.log('Kategorie gewählt:', category);
    console.log('Zustand vor Auswahl:', game.state);

    const updatedGame = selectCategory(game, category);
    setGame(updatedGame);

    setTimeout(() => {
      const comparedGame = compareValues(updatedGame);
      setGame(comparedGame);
    }, 500);
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
