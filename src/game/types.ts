export enum GameState {
  SETUP = 'SETUP',
  DRAW_PHASE = 'DRAW_PHASE',
  CATEGORY_SELECTION = 'CATEGORY_SELECTION',
  VALUE_COMPARISON = 'VALUE_COMPARISON',
  RESOLVE_WINNER = 'RESOLVE_WINNER',
  HANDLE_TIE = 'HANDLE_TIE',
  CHECK_END = 'CHECK_END',
  GAME_OVER = 'GAME_OVER'
}

export enum Category {
  CHARISMA = 'Charisma',
  LEADERSHIP = 'Leadership',
  INFLUENCE = 'Influence',
  INTEGRITY = 'Integrity',
  TRICKERY = 'Trickery',
  WEALTH = 'Wealth'
}

export interface Card {
  name: string;
  imagePath: string;
  charisma: number;
  leadership: number;
  influence: number;
  integrity: number;
  trickery: number;
  wealth: number;
  quote?: string;
}

export interface Player {
  name: string;
  deck: Card[];
  isAI?: boolean;
}

export interface GameContext {
  state: GameState;
  player1: Player;
  player2: Player;
  tiePile: Card[];
  activePlayer: Player;
  selectedCategory?: Category;
  topCard1?: Card;
  topCard2?: Card;
  roundWinner?: Player;
}