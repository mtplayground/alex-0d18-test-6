export type GameState = {
  hasShield: boolean;
  health: number;
  invulnerableUntil: number;
  isGameOver: boolean;
  lives: number;
  maxHealth: number;
  score: number;
};

export type PlayerHitResult = {
  healthChanged: boolean;
  ignored: boolean;
  lifeLost: boolean;
  shieldAbsorbed: boolean;
};

const DEFAULT_LIVES = 3;
const DEFAULT_MAX_HEALTH = 100;
const PLAYER_INVULNERABLE_MS = 1_200;

export const createInitialGameState = (): GameState => ({
  hasShield: false,
  health: DEFAULT_MAX_HEALTH,
  invulnerableUntil: 0,
  isGameOver: false,
  lives: DEFAULT_LIVES,
  maxHealth: DEFAULT_MAX_HEALTH,
  score: 0,
});

export const isPlayerInvulnerable = (
  state: GameState,
  timeMs: number,
): boolean => timeMs < state.invulnerableUntil;

export const grantPlayerShield = (state: GameState): void => {
  if (state.isGameOver) {
    return;
  }

  state.hasShield = true;
};

export const applyPlayerHit = (
  state: GameState,
  damage: number,
  timeMs: number,
): PlayerHitResult => {
  if (state.isGameOver || damage <= 0 || isPlayerInvulnerable(state, timeMs)) {
    return {
      healthChanged: false,
      ignored: true,
      lifeLost: false,
      shieldAbsorbed: false,
    };
  }

  state.invulnerableUntil = timeMs + PLAYER_INVULNERABLE_MS;

  if (state.hasShield) {
    state.hasShield = false;
    return {
      healthChanged: false,
      ignored: false,
      lifeLost: false,
      shieldAbsorbed: true,
    };
  }

  state.health = Math.max(0, state.health - damage);

  if (state.health > 0) {
    return {
      healthChanged: true,
      ignored: false,
      lifeLost: false,
      shieldAbsorbed: false,
    };
  }

  state.lives = Math.max(0, state.lives - 1);

  if (state.lives <= 0) {
    state.isGameOver = true;
    return {
      healthChanged: true,
      ignored: false,
      lifeLost: true,
      shieldAbsorbed: false,
    };
  }

  state.health = state.maxHealth;

  return {
    healthChanged: true,
    ignored: false,
    lifeLost: true,
    shieldAbsorbed: false,
  };
};
