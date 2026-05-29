import Phaser from 'phaser';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Pickup, PickupType } from '../entities/Pickup';
import type { PlayerBullet } from '../entities/PlayerBullet';
import type { PlayerPlane } from '../entities/PlayerPlane';
import { COLLISION_DAMAGE, canProcessCollisionPair } from './collisionRules';

type CollisionSystemConfig = {
  bossBullets?: Phaser.GameObjects.Group;
  bosses?: Phaser.GameObjects.Group;
  enemies: Phaser.GameObjects.Group;
  enemyBullets: Phaser.GameObjects.Group;
  onBossDamaged?: () => void;
  onBossDestroyed?: (scoreValue: number) => void;
  onEnemyDestroyed: (scoreValue: number, x: number, y: number) => void;
  onPlayerHit: (damage: number) => void;
  onPickupCollected?: (type: PickupType) => void;
  pickups?: Phaser.GameObjects.Group;
  player: PlayerPlane;
  playerBullets: Phaser.GameObjects.Group;
};

type ArcadeOverlapObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class CollisionSystem {
  private readonly colliders: Phaser.Physics.Arcade.Collider[];

  constructor(
    scene: Phaser.Scene,
    private readonly config: CollisionSystemConfig,
  ) {
    this.colliders = [
      scene.physics.add.overlap(
        config.playerBullets,
        config.enemies,
        this.handlePlayerBulletEnemy,
      ),
      scene.physics.add.overlap(
        config.player,
        config.enemies,
        this.handlePlayerEnemy,
      ),
      scene.physics.add.overlap(
        config.player,
        config.enemyBullets,
        this.handlePlayerEnemyBullet,
      ),
    ];

    if (config.bosses) {
      this.colliders.push(
        scene.physics.add.overlap(
          config.playerBullets,
          config.bosses,
          this.handlePlayerBulletBoss,
        ),
        scene.physics.add.overlap(
          config.player,
          config.bosses,
          this.handlePlayerBoss,
        ),
      );
    }

    if (config.bossBullets) {
      this.colliders.push(
        scene.physics.add.overlap(
          config.player,
          config.bossBullets,
          this.handlePlayerEnemyBullet,
        ),
      );
    }

    if (config.pickups) {
      this.colliders.push(
        scene.physics.add.overlap(
          config.player,
          config.pickups,
          this.handlePlayerPickup,
        ),
      );
    }
  }

  destroy(): void {
    for (const collider of this.colliders) {
      collider.destroy();
    }
  }

  private readonly handlePlayerBulletEnemy = (
    bulletObject: ArcadeOverlapObject,
    enemyObject: ArcadeOverlapObject,
  ): void => {
    const bullet = this.resolveGameObject(bulletObject) as PlayerBullet | null;
    const enemy = this.resolveGameObject(enemyObject) as Enemy | null;

    if (!bullet || !enemy) {
      return;
    }

    if (!canProcessCollisionPair(bullet, enemy)) {
      return;
    }

    const dropX = enemy.x;
    const dropY = enemy.y;

    bullet.recycle();

    if (enemy.takeDamage(COLLISION_DAMAGE.playerBullet)) {
      this.config.onEnemyDestroyed(enemy.scoreValue, dropX, dropY);
    }
  };

  private readonly handlePlayerEnemy = (
    playerObject: ArcadeOverlapObject,
    enemyObject: ArcadeOverlapObject,
  ): void => {
    const player = this.resolveGameObject(playerObject) as PlayerPlane | null;
    const enemy = this.resolveGameObject(enemyObject) as Enemy | null;

    if (!player || !enemy) {
      return;
    }

    if (!canProcessCollisionPair(player, enemy)) {
      return;
    }

    enemy.recycle();
    this.config.onPlayerHit(COLLISION_DAMAGE.enemyContact);
  };

  private readonly handlePlayerBulletBoss = (
    bulletObject: ArcadeOverlapObject,
    bossObject: ArcadeOverlapObject,
  ): void => {
    const bullet = this.resolveGameObject(bulletObject) as PlayerBullet | null;
    const boss = this.resolveGameObject(bossObject) as Boss | null;

    if (!bullet || !boss) {
      return;
    }

    if (!canProcessCollisionPair(bullet, boss)) {
      return;
    }

    bullet.recycle();

    if (boss.takeDamage(COLLISION_DAMAGE.playerBullet)) {
      this.config.onBossDestroyed?.(boss.scoreValue);
      return;
    }

    this.config.onBossDamaged?.();
  };

  private readonly handlePlayerBoss = (
    playerObject: ArcadeOverlapObject,
    bossObject: ArcadeOverlapObject,
  ): void => {
    const player = this.resolveGameObject(playerObject) as PlayerPlane | null;
    const boss = this.resolveGameObject(bossObject) as Boss | null;

    if (!player || !boss) {
      return;
    }

    if (!canProcessCollisionPair(player, boss)) {
      return;
    }

    this.config.onPlayerHit(COLLISION_DAMAGE.enemyContact);
  };

  private readonly handlePlayerEnemyBullet = (
    playerObject: ArcadeOverlapObject,
    bulletObject: ArcadeOverlapObject,
  ): void => {
    const player = this.resolveGameObject(playerObject) as PlayerPlane | null;
    const bullet = this.resolveGameObject(bulletObject) as EnemyBullet | null;

    if (!player || !bullet) {
      return;
    }

    if (!canProcessCollisionPair(player, bullet)) {
      return;
    }

    bullet.recycle();
    this.config.onPlayerHit(COLLISION_DAMAGE.enemyBullet);
  };

  private readonly handlePlayerPickup = (
    playerObject: ArcadeOverlapObject,
    pickupObject: ArcadeOverlapObject,
  ): void => {
    const player = this.resolveGameObject(playerObject) as PlayerPlane | null;
    const pickup = this.resolveGameObject(pickupObject) as Pickup | null;

    if (!player || !pickup) {
      return;
    }

    if (!canProcessCollisionPair(player, pickup)) {
      return;
    }

    const type = pickup.pickupType;
    pickup.recycle();
    this.config.onPickupCollected?.(type);
  };

  private resolveGameObject(
    value: ArcadeOverlapObject,
  ): Phaser.GameObjects.GameObject | null {
    if (value instanceof Phaser.Tilemaps.Tile) {
      return null;
    }

    if ('gameObject' in value) {
      return value.gameObject;
    }

    return value;
  }
}
