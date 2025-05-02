import { Card, Category, GameContext, GameState, Player } from './types';
import { allCards } from './gameData';

// Fisher-Yates algorithm to shuffle cards
export const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// AI category selection based on the top card
export const selectAICategory = (topCard: Card): Category => {
  const categories = [
    { category: Category.CHARISMA, value: topCard.charisma },
    { category: Category.LEADERSHIP, value: topCard.leadership },
    { category: Category.INFLUENCE, value: topCard.influence },
    { category: Category.INTEGRITY, value: topCard.integrity },
    { category: Category.TRICKERY, value: topCard.trickery },
    { category: Category.WEALTH, value: topCard.wealth },
  ];

  // Sort by highest value
  categories.sort((a, b) => b.value - a.value);
  return categories[0].category;
};

// Initialize a new game
export const initializeGame = (playerName: string, aiName = "AI Opponent"): GameContext => {
  const shuffled = shuffleCards(allCards);
  const half = Math.ceil(shuffled.length / 2);

  const player1: Player = {
    name: playerName,
    deck: shuffled.slice(0, half),
    isAI: false
  };

  const player2: Player = {
    name: aiName,
    deck: shuffled.slice(half),
    isAI: true
  };

  // Randomly determine first player
  const firstPlayerIdx = Math.random() < 0.5 ? 0 : 1;
  const activePlayer = [player1, player2][firstPlayerIdx];

  return {
    state: GameState.SETUP,
    player1,
    player2,
    tiePile: [],
    activePlayer
  };
};

// Draw top cards for both players
export const drawTopCards = (game: GameContext): GameContext => {
  if (game.player1.deck.length === 0 || game.player2.deck.length === 0) {
    return {
      ...game,
      state: GameState.GAME_OVER,
      roundWinner: game.player1.deck.length === 0 ? game.player2 : game.player1
    };
  }

  const topCard1 = game.player1.deck[0];
  const topCard2 = game.player2.deck[0];

  // Remove top cards from players' decks
  const player1Updated = {
    ...game.player1,
    deck: game.player1.deck.slice(1)
  };

  const player2Updated = {
    ...game.player2,
    deck: game.player2.deck.slice(1)
  };

  return {
    ...game,
    state: GameState.CATEGORY_SELECTION,
    player1: player1Updated,
    player2: player2Updated,
    topCard1,
    topCard2
  };
};

// Select a category and proceed to comparison
export const selectCategory = (game: GameContext, category: Category): GameContext => {
  return {
    ...game,
    state: GameState.VALUE_COMPARISON,
    selectedCategory: category
  };
};

// Compare card values and determine winner
export const compareValues = (game: GameContext): GameContext => {
  if (!game.topCard1 || !game.topCard2 || !game.selectedCategory) {
    return game;
  }

  const card1Value = game.topCard1[game.selectedCategory.toLowerCase() as keyof Card] as number;
  const card2Value = game.topCard2[game.selectedCategory.toLowerCase() as keyof Card] as number;

  if (card1Value > card2Value) {
    return {
      ...game,
      state: GameState.RESOLVE_WINNER,
      roundWinner: game.player1
    };
  } else if (card2Value > card1Value) {
    return {
      ...game,
      state: GameState.RESOLVE_WINNER,
      roundWinner: game.player2
    };
  } else {
    return {
      ...game,
      state: GameState.HANDLE_TIE
    };
  }
};

// Handle a tied round
export const handleTie = (game: GameContext): GameContext => {
  if (!game.topCard1 || !game.topCard2) {
    return game;
  }

  return {
    ...game,
    state: GameState.DRAW_PHASE,
    tiePile: [...game.tiePile, game.topCard1, game.topCard2],
    topCard1: undefined,
    topCard2: undefined,
    selectedCategory: undefined
  };
};

// Resolve a round with a winner
export const resolveWinner = (game: GameContext): GameContext => {
  if (!game.roundWinner || !game.topCard1 || !game.topCard2) {
    return game;
  }

  const cardsToAdd = [...game.tiePile, game.topCard1, game.topCard2];

  let player1Updated = { ...game.player1 };
  let player2Updated = { ...game.player2 };

  if (game.roundWinner === game.player1) {
    player1Updated = {
      ...game.player1,
      deck: [...game.player1.deck, ...cardsToAdd]
    };
  } else {
    player2Updated = {
      ...game.player2,
      deck: [...game.player2.deck, ...cardsToAdd]
    };
  }

  return {
    ...game,
    state: GameState.CHECK_END,
    player1: player1Updated,
    player2: player2Updated,
    tiePile: [],
    topCard1: undefined,
    topCard2: undefined,
    selectedCategory: undefined
  };
};

// Check if the game is over
export const checkGameEnd = (game: GameContext): GameContext => {
  if (game.player1.deck.length === 0) {
    return {
      ...game,
      state: GameState.GAME_OVER,
      roundWinner: game.player2
    };
  } else if (game.player2.deck.length === 0) {
    return {
      ...game,
      state: GameState.GAME_OVER,
      roundWinner: game.player1
    };
  } else {
    // Switch active player to the round winner if there is one
    const activePlayer = game.roundWinner || game.activePlayer;
    return {
      ...game,
      state: GameState.DRAW_PHASE,
      activePlayer,
      roundWinner: undefined
    };
  }
};

// Vergleicht die von beiden Spielern gewählten Kategorien und bestimmt den Gewinner
export const compareBothCategories = (game: GameContext): GameContext => {
  if (!game.topCard1 || !game.topCard2 || !game.selectedCategory1 || !game.selectedCategory2) {
    return game;
  }

  // Wenn beide dieselbe Kategorie gewählt haben: Standardvergleich
  if (game.selectedCategory1 === game.selectedCategory2) {
    const cat = game.selectedCategory1;
    const val1 = game.topCard1[cat.toLowerCase() as keyof Card] as number;
    const val2 = game.topCard2[cat.toLowerCase() as keyof Card] as number;
    if (val1 > val2) {
      return {
        ...game,
        state: GameState.RESOLVE_WINNER,
        roundWinner: game.player1
      };
    } else if (val2 > val1) {
      return {
        ...game,
        state: GameState.RESOLVE_WINNER,
        roundWinner: game.player2
      };
    } else {
      return {
        ...game,
        state: GameState.HANDLE_TIE
      };
    }
  }

  // Unterschiedliche Kategorien: Wer in einer Kategorie gewinnt, gewinnt die Runde
  const cat1 = game.selectedCategory1;
  const cat2 = game.selectedCategory2;
  const val1_cat1 = game.topCard1[cat1.toLowerCase() as keyof Card] as number;
  const val2_cat1 = game.topCard2[cat1.toLowerCase() as keyof Card] as number;
  const val1_cat2 = game.topCard1[cat2.toLowerCase() as keyof Card] as number;
  const val2_cat2 = game.topCard2[cat2.toLowerCase() as keyof Card] as number;

  let p1Wins = 0;
  let p2Wins = 0;

  // Kategorie 1 Vergleich
  if (val1_cat1 > val2_cat1) p1Wins++;
  else if (val2_cat1 > val1_cat1) p2Wins++;

  // Kategorie 2 Vergleich
  if (val1_cat2 > val2_cat2) p1Wins++;
  else if (val2_cat2 > val1_cat2) p2Wins++;

  if (p1Wins > p2Wins) {
    return {
      ...game,
      state: GameState.RESOLVE_WINNER,
      roundWinner: game.player1
    };
  } else if (p2Wins > p1Wins) {
    return {
      ...game,
      state: GameState.RESOLVE_WINNER,
      roundWinner: game.player2
    };
  } else {
    // Beide Kategorien Gleichstand
    return {
      ...game,
      state: GameState.HANDLE_TIE
    };
  }
};