export const COLLISION_DAMAGE = {
  enemyBullet: 28,
  enemyContact: 34,
  playerBullet: 1,
} as const;

export type CollisionActivity = {
  active: boolean;
};

export const canProcessCollisionPair = (
  first: CollisionActivity | null,
  second: CollisionActivity | null,
): boolean => Boolean(first?.active && second?.active);
