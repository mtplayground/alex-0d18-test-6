export type WeaponLevel = 1 | 2 | 3;

export type GameState = {
  bombs: number;
  hasShield: boolean;
  health: number;
  invulnerableUntil: number;
  isGameOver: boolean;
  lives: number;
  maxHealth: number;
  score: number;
  weaponLevel: WeaponLevel;
};

export type PlayerHitResult = {
  healthChanged: boolean;
  ignored: boolean;
  lifeLost: boolean;
  shieldAbsorbed: boolean;
};

const DEFAULT_LIVES = 3;
const DEFAULT_MAX_HEALTH = 100;
const DEFAULT_BOMBS = 3;
const MAX_BOMBS = 9;
const MAX_WEAPON_LEVEL: WeaponLevel = 3;
const PLAYER_INVULNERABLE_MS = 1_200;

export const createInitialGameState = (): GameState => ({
  bombs: DEFAULT_BOMBS,
  hasShield: false,
  health: DEFAULT_MAX_HEALTH,
  invulnerableUntil: 0,
  isGameOver: false,
  lives: DEFAULT_LIVES,
  maxHealth: DEFAULT_MAX_HEALTH,
  score: 0,
  weaponLevel: 1,
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

export const upgradePlayerWeapon = (state: GameState): boolean => {
  if (state.isGameOver || state.weaponLevel >= MAX_WEAPON_LEVEL) {
    return false;
  }

  state.weaponLevel = (state.weaponLevel + 1) as WeaponLevel;
  return true;
};

export const grantPlayerBomb = (state: GameState, amount = 1): void => {
  if (state.isGameOver || amount <= 0) {
    return;
  }

  state.bombs = Math.min(MAX_BOMBS, state.bombs + amount);
};

export const usePlayerBomb = (state: GameState): boolean => {
  if (state.isGameOver || state.bombs <= 0) {
    return false;
  }

  state.bombs -= 1;
  return true;
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
