import type { WeaponLevel } from '../state/GameState';

export type BulletPatternItem = {
  horizontalSpeed: number;
  offsetX: number;
};

const WEAPON_PATTERNS: Record<WeaponLevel, BulletPatternItem[]> = {
  1: [{ horizontalSpeed: 0, offsetX: 0 }],
  2: [
    { horizontalSpeed: -180, offsetX: -14 },
    { horizontalSpeed: 0, offsetX: 0 },
    { horizontalSpeed: 180, offsetX: 14 },
  ],
  3: [
    { horizontalSpeed: -260, offsetX: -24 },
    { horizontalSpeed: -130, offsetX: -12 },
    { horizontalSpeed: 0, offsetX: 0 },
    { horizontalSpeed: 130, offsetX: 12 },
    { horizontalSpeed: 260, offsetX: 24 },
  ],
};

export const getPlayerBulletPattern = (
  weaponLevel: WeaponLevel,
): readonly BulletPatternItem[] => WEAPON_PATTERNS[weaponLevel];

export const canFirePlayerBulletPattern = (
  availableBulletCount: number,
  weaponLevel: WeaponLevel,
): boolean =>
  availableBulletCount >= getPlayerBulletPattern(weaponLevel).length;
