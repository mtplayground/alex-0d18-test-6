import Phaser from 'phaser';
import type { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { PlayerBullet } from '../entities/PlayerBullet';
import type { PlayerPlane } from '../entities/PlayerPlane';

type CollisionSystemConfig = {
  bossBullets?: Phaser.GameObjects.Group;
  bosses?: Phaser.GameObjects.Group;
  enemies: Phaser.GameObjects.Group;
  enemyBullets: Phaser.GameObjects.Group;
  onBossDamaged?: () => void;
  onBossDestroyed?: (scoreValue: number) => void;
  onEnemyDestroyed: (scoreValue: number) => void;
  onPlayerHit: (damage: number) => void;
  player: PlayerPlane;
  playerBullets: Phaser.GameObjects.Group;
};

type ArcadeOverlapObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

const ENEMY_CONTACT_DAMAGE = 34;
const ENEMY_BULLET_DAMAGE = 28;
const PLAYER_BULLET_DAMAGE = 1;

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

    if (!bullet.active || !enemy.active) {
      return;
    }

    bullet.recycle();

    if (enemy.takeDamage(PLAYER_BULLET_DAMAGE)) {
      this.config.onEnemyDestroyed(enemy.scoreValue);
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

    if (!player.active || !enemy.active) {
      return;
    }

    enemy.recycle();
    this.config.onPlayerHit(ENEMY_CONTACT_DAMAGE);
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

    if (!bullet.active || !boss.active) {
      return;
    }

    bullet.recycle();

    if (boss.takeDamage(PLAYER_BULLET_DAMAGE)) {
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

    if (!player.active || !boss.active) {
      return;
    }

    this.config.onPlayerHit(ENEMY_CONTACT_DAMAGE);
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

    if (!player.active || !bullet.active) {
      return;
    }

    bullet.recycle();
    this.config.onPlayerHit(ENEMY_BULLET_DAMAGE);
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
