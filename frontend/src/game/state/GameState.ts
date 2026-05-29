export type GameState = {
  health: number;
  lives: number;
  maxHealth: number;
  score: number;
};

export const createInitialGameState = (): GameState => ({
  health: 100,
  lives: 3,
  maxHealth: 100,
  score: 0,
});
