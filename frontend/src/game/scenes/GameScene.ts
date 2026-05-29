import Phaser from 'phaser';
import { levelConfigs } from '../data/levels';
import type { LevelConfig } from '../data/levels';
import type { PickupType } from '../entities/Pickup';
import { PlayerPlane } from '../entities/PlayerPlane';
import { SceneKeys } from '../keys';
import {
  applyPlayerHit,
  addScore,
  completeCurrentLevel,
  createInitialGameState,
  getRunResult,
  grantPlayerBomb,
  grantPlayerShield,
  isPlayerInvulnerable,
  upgradePlayerWeapon,
  usePlayerBomb,
} from '../state/GameState';
import type { GameState, RunResult } from '../state/GameState';
import { BossHealthBar } from '../systems/BossHealthBar';
import { BossManager } from '../systems/BossManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyManager } from '../systems/EnemyManager';
import { Hud } from '../systems/Hud';
import { PickupManager } from '../systems/PickupManager';
import { PlayerBulletPool } from '../systems/PlayerBulletPool';
import { ScrollingBackground } from '../systems/ScrollingBackground';
import { WaveSystem } from '../systems/WaveSystem';

const FIRE_INTERVAL_MS = 140;
const DEFAULT_PLAYER_DAMAGE = 34;
const BOMB_DETONATED_EVENT = 'screen-bomb-detonated';
const LEVEL_COMPLETED_EVENT = 'level-completed';
const PLAYER_BOMB_GRANTED_EVENT = 'player-bomb-granted';
const PLAYER_HIT_EVENT = 'player-hit';
const PLAYER_SHIELD_EVENT = 'player-shield-granted';
const PLAYER_WEAPON_UPGRADE_EVENT = 'player-weapon-upgraded';

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private bullets?: PlayerBulletPool;

  private bounds?: Phaser.Geom.Rectangle;

  private background?: ScrollingBackground;

  private bombKey?: Phaser.Input.Keyboard.Key;

  private bossHealthBar?: BossHealthBar;

  private bossDefeated = false;

  private bossSpawned = false;

  private bosses?: BossManager;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private collisions?: CollisionSystem;

  private currentLevelConfig?: LevelConfig;

  private enemies?: EnemyManager;

  private fireKey?: Phaser.Input.Keyboard.Key;

  private gameState?: GameState;

  private hud?: Hud;

  private nextShotAt = 0;

  private player?: PlayerPlane;

  private pickups?: PickupManager;

  private resultStarted = false;

  private wasd?: MovementKeys;

  private waves?: WaveSystem;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const { width, height } = this.scale;

    this.resultStarted = false;
    this.background = new ScrollingBackground(this, width, height);
    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.bullets = new PlayerBulletPool(this);
    this.bosses = new BossManager(this);
    this.enemies = new EnemyManager(this);
    this.pickups = new PickupManager(this);
    this.gameState = createInitialGameState();
    this.player = new PlayerPlane(this, width / 2, height * 0.78);
    this.hud = new Hud(this, this.gameState);
    this.bossHealthBar = new BossHealthBar(this);
    this.collisions = new CollisionSystem(this, {
      bossBullets: this.bosses.getBossBulletGroup(),
      bosses: this.bosses.getBossGroup(),
      enemies: this.enemies.getGroup(),
      enemyBullets: this.enemies.getEnemyBulletGroup(),
      onBossDamaged: this.handleBossChanged,
      onBossDestroyed: this.handleBossDestroyed,
      onEnemyDestroyed: this.handleEnemyDestroyed,
      onPlayerHit: (damage) => {
        this.handlePlayerHit(damage);
      },
      onPickupCollected: this.handlePickupCollected,
      pickups: this.pickups.getGroup(),
      player: this.player,
      playerBullets: this.bullets.getGroup(),
    });
    this.events.on(PLAYER_HIT_EVENT, this.handlePlayerHit, this);
    this.events.on(PLAYER_SHIELD_EVENT, this.handlePlayerShieldGranted, this);
    this.events.on(PLAYER_WEAPON_UPGRADE_EVENT, this.handleWeaponUpgrade, this);
    this.events.on(PLAYER_BOMB_GRANTED_EVENT, this.handleBombGranted, this);
    this.events.on(LEVEL_COMPLETED_EVENT, this.handleLevelCompleted, this);
    this.events.on(BOMB_DETONATED_EVENT, this.handleBombDetonated, this);
    this.startLevel(0);
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.removeStateEvents,
      this,
    );

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is not available for player movement.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.bombKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(time: number, delta: number): void {
    if (
      !this.bounds ||
      !this.background ||
      !this.bosses ||
      !this.bossHealthBar ||
      !this.bullets ||
      !this.bombKey ||
      !this.collisions ||
      !this.cursors ||
      !this.enemies ||
      !this.fireKey ||
      !this.gameState ||
      !this.hud ||
      !this.pickups ||
      !this.player ||
      !this.wasd ||
      !this.waves
    ) {
      return;
    }

    const direction = new Phaser.Math.Vector2(
      Number(this.isRightDown()) - Number(this.isLeftDown()),
      Number(this.isDownDown()) - Number(this.isUpDown()),
    );

    this.background.update(delta);
    this.player.move(direction, delta, this.bounds);
    this.player.updateStatusEffects(
      time,
      isPlayerInvulnerable(this.gameState, time),
      this.gameState.hasShield,
    );
    this.firePlayerBullet(time);
    this.useBomb();
    this.bullets.update(delta, this.bounds);
    this.pickups.update(delta, this.bounds);
    this.waves.update(delta, this.bounds.width);
    this.enemies.update(time, delta, this.bounds, this.player);
    this.bosses.update(time, delta, this.bounds, this.player);
    this.bossHealthBar.update(this.bosses.getStatus());
    this.updateLevelProgression();
    this.hud.update(this.gameState);
    this.startResultSceneIfComplete();
  }

  private firePlayerBullet(time: number): void {
    if (!this.bullets || !this.fireKey || !this.gameState || !this.player) {
      return;
    }

    if (!this.fireKey.isDown || time < this.nextShotAt) {
      return;
    }

    if (this.gameState.isGameOver) {
      return;
    }

    const fired = this.bullets.firePattern(
      this.player.x,
      this.player.y - this.player.displayHeight / 2,
      this.gameState.weaponLevel,
    );

    if (fired) {
      this.nextShotAt = time + FIRE_INTERVAL_MS;
    }
  }

  private useBomb(): void {
    if (!this.bombKey || !this.gameState || !this.hud) {
      return;
    }

    if (!Phaser.Input.Keyboard.JustDown(this.bombKey)) {
      return;
    }

    const usedBomb = usePlayerBomb(this.gameState);

    if (!usedBomb) {
      return;
    }

    this.events.emit(BOMB_DETONATED_EVENT);
    this.hud.update(this.gameState);
  }

  private handleBombDetonated(): void {
    this.enemies?.clearAll();
    this.bosses?.clearBullets();
  }

  private handlePlayerHit(damage = DEFAULT_PLAYER_DAMAGE): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    applyPlayerHit(this.gameState, damage, this.time.now);
    this.hud.update(this.gameState);
    this.startResultSceneIfComplete();
  }

  private readonly handleEnemyDestroyed = (
    scoreValue: number,
    x: number,
    y: number,
  ): void => {
    if (!this.gameState || !this.hud) {
      return;
    }

    addScore(this.gameState, scoreValue);
    this.pickups?.tryDrop(x, y);
    this.hud.update(this.gameState);
  };

  private readonly handlePickupCollected = (type: PickupType): void => {
    if (!this.gameState || !this.hud) {
      return;
    }

    switch (type) {
      case 'weapon':
        upgradePlayerWeapon(this.gameState);
        break;
      case 'shield':
        grantPlayerShield(this.gameState);
        break;
      case 'bomb':
        grantPlayerBomb(this.gameState);
        break;
    }

    this.hud.update(this.gameState);
  };

  private readonly handleBossChanged = (): void => {
    this.bossHealthBar?.update(this.bosses?.getStatus() ?? null);
  };

  private readonly handleBossDestroyed = (scoreValue: number): void => {
    if (!this.gameState || !this.hud) {
      return;
    }

    addScore(this.gameState, scoreValue);
    this.bossDefeated = true;
    this.bossHealthBar?.hide();
    this.hud.update(this.gameState);
  };

  private handlePlayerShieldGranted(): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    grantPlayerShield(this.gameState);
    this.hud.update(this.gameState);
  }

  private handleWeaponUpgrade(): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    upgradePlayerWeapon(this.gameState);
    this.hud.update(this.gameState);
  }

  private handleBombGranted(amount = 1): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    grantPlayerBomb(this.gameState, amount);
    this.hud.update(this.gameState);
  }

  private handleLevelCompleted(): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    const result = completeCurrentLevel(this.gameState);

    this.hud.update(this.gameState);

    if (result) {
      this.startResultScene(result);
    }
  }

  private startLevel(levelIndex: number): void {
    if (
      !this.enemies ||
      !this.bosses ||
      !this.bossHealthBar ||
      !this.gameState
    ) {
      return;
    }

    const nextConfig = levelConfigs[levelIndex] ?? levelConfigs[0];

    this.currentLevelConfig = nextConfig;
    this.bossDefeated = false;
    this.bossSpawned = false;
    this.gameState.currentLevel = nextConfig.id;
    this.gameState.totalLevels = levelConfigs.length;
    this.enemies.reset();
    this.pickups?.clearAll();
    this.bosses.clearBoss();
    this.bosses.clearBullets();
    this.bossHealthBar.hide();
    this.waves = new WaveSystem(this.enemies, nextConfig.waveScript);
    this.hud?.update(this.gameState);
  }

  private updateLevelProgression(): void {
    if (
      !this.bounds ||
      !this.bosses ||
      !this.currentLevelConfig ||
      !this.enemies ||
      !this.gameState ||
      !this.waves
    ) {
      return;
    }

    if (!this.waves.isComplete() || this.enemies.hasActiveEnemies()) {
      return;
    }

    if (!this.bossSpawned) {
      this.bossSpawned = true;
      this.bosses.spawnBoss(
        this.currentLevelConfig.bossType,
        this.bounds.width / 2,
        -104,
      );
      return;
    }

    if (!this.bossDefeated || this.bosses.isBossActive()) {
      return;
    }

    const result = completeCurrentLevel(this.gameState);

    if (result) {
      this.startResultScene(result);
      return;
    }

    this.startLevel(this.gameState.currentLevel - 1);
  }

  private removeStateEvents(): void {
    this.collisions?.destroy();
    this.collisions = undefined;
    this.events.off(PLAYER_HIT_EVENT, this.handlePlayerHit, this);
    this.events.off(PLAYER_SHIELD_EVENT, this.handlePlayerShieldGranted, this);
    this.events.off(
      PLAYER_WEAPON_UPGRADE_EVENT,
      this.handleWeaponUpgrade,
      this,
    );
    this.events.off(PLAYER_BOMB_GRANTED_EVENT, this.handleBombGranted, this);
    this.events.off(LEVEL_COMPLETED_EVENT, this.handleLevelCompleted, this);
    this.events.off(BOMB_DETONATED_EVENT, this.handleBombDetonated, this);
  }

  private startResultSceneIfComplete(): void {
    if (!this.gameState) {
      return;
    }

    const result = getRunResult(this.gameState);

    if (result) {
      this.startResultScene(result);
    }
  }

  private startResultScene(result: RunResult): void {
    if (this.resultStarted) {
      return;
    }

    this.resultStarted = true;
    this.scene.start(SceneKeys.Result, result);
  }

  private isUpDown(): boolean {
    return this.cursors?.up.isDown === true || this.wasd?.up.isDown === true;
  }

  private isDownDown(): boolean {
    return (
      this.cursors?.down.isDown === true || this.wasd?.down.isDown === true
    );
  }

  private isLeftDown(): boolean {
    return (
      this.cursors?.left.isDown === true || this.wasd?.left.isDown === true
    );
  }

  private isRightDown(): boolean {
    return (
      this.cursors?.right.isDown === true || this.wasd?.right.isDown === true
    );
  }
}
