import {
  initializeGame,
  drawTopCards,
  selectCategory,
  compareValues,
  resolveWinner,
  handleTie,
  checkGameEnd
} from '../game/gameEngine';

import { GameState, Category } from '../game/types';

describe('Game Engine - Integration Test', () => {
  it('should play a full round between player and AI', () => {
    // Schritt 1: Spiel initialisieren
    const gameStart = initializeGame('Player');

    // Erwartung: Setup-Phase, beide Decks vorhanden
    expect(gameStart.state).toBe(GameState.SETUP);
    expect(gameStart.player1.deck.length).toBeGreaterThan(0);
    expect(gameStart.player2.deck.length).toBeGreaterThan(0);

    // Schritt 2: Karten ziehen
    const gameWithCards = drawTopCards(gameStart);
    expect(gameWithCards.state).toBe(GameState.CATEGORY_SELECTION);
    expect(gameWithCards.topCard1).toBeDefined();
    expect(gameWithCards.topCard2).toBeDefined();

    // Schritt 3: Spieler wählt Kategorie basierend auf eigener Karte
    const card = gameWithCards.topCard1!;
    const categoryToSelect = Category.CHARISMA; // z.B. Testweise CHARISMA nehmen

    const gameCategorySelected = selectCategory(gameWithCards, categoryToSelect);
    expect(gameCategorySelected.state).toBe(GameState.VALUE_COMPARISON);
    expect(gameCategorySelected.selectedCategory).toBe(categoryToSelect);

    // Schritt 4: Werte vergleichen
    const gameCompared = compareValues(gameCategorySelected);
    expect(
      [GameState.RESOLVE_WINNER, GameState.HANDLE_TIE]
    ).toContain(gameCompared.state);

    // Schritt 5: Entweder Tie-Handling oder Gewinner auflösen
    let gameResolved;
    if (gameCompared.state === GameState.RESOLVE_WINNER) {
      gameResolved = resolveWinner(gameCompared);
      expect(gameResolved.state).toBe(GameState.CHECK_END);
      // The winner is still set until checkGameEnd is called
      expect(gameResolved.roundWinner).toBeDefined();
    } else {
      gameResolved = gameCompared; // Tie → keine Auflösung
      expect(gameResolved.state).toBe(GameState.HANDLE_TIE);
    }

    // Schritt 6: Nächster Zug oder Spielende prüfen
    const gameNext = checkGameEnd(gameResolved);
    expect(
      [GameState.DRAW_PHASE, GameState.GAME_OVER]
    ).toContain(gameNext.state);
  });
});