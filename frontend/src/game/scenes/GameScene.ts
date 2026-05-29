import Phaser from 'phaser';
import { PlayerPlane } from '../entities/PlayerPlane';
import { SceneKeys } from '../keys';
import {
  applyPlayerHit,
  createInitialGameState,
  grantPlayerShield,
  isPlayerInvulnerable,
} from '../state/GameState';
import type { GameState } from '../state/GameState';
import { Hud } from '../systems/Hud';
import { PlayerBulletPool } from '../systems/PlayerBulletPool';
import { ScrollingBackground } from '../systems/ScrollingBackground';

const FIRE_INTERVAL_MS = 140;
const DEFAULT_PLAYER_DAMAGE = 34;
const PLAYER_HIT_EVENT = 'player-hit';
const PLAYER_SHIELD_EVENT = 'player-shield-granted';

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

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private fireKey?: Phaser.Input.Keyboard.Key;

  private gameState?: GameState;

  private hud?: Hud;

  private nextShotAt = 0;

  private player?: PlayerPlane;

  private wasd?: MovementKeys;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const { width, height } = this.scale;

    this.background = new ScrollingBackground(this, width, height);
    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.bullets = new PlayerBulletPool(this);
    this.gameState = createInitialGameState();
    this.player = new PlayerPlane(this, width / 2, height * 0.78);
    this.hud = new Hud(this, this.gameState);
    this.events.on(PLAYER_HIT_EVENT, this.handlePlayerHit, this);
    this.events.on(PLAYER_SHIELD_EVENT, this.handlePlayerShieldGranted, this);
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
      !this.bullets ||
      !this.cursors ||
      !this.fireKey ||
      !this.gameState ||
      !this.hud ||
      !this.player ||
      !this.wasd
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
    this.bullets.update(delta, this.bounds);
    this.hud.update(this.gameState);
  }

  private firePlayerBullet(time: number): void {
    if (!this.bullets || !this.fireKey || !this.player) {
      return;
    }

    if (!this.fireKey.isDown || time < this.nextShotAt) {
      return;
    }

    const fired = this.bullets.fire(
      this.player.x,
      this.player.y - this.player.displayHeight / 2,
    );

    if (fired) {
      this.nextShotAt = time + FIRE_INTERVAL_MS;
    }
  }

  private handlePlayerHit(damage = DEFAULT_PLAYER_DAMAGE): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    applyPlayerHit(this.gameState, damage, this.time.now);
    this.hud.update(this.gameState);
  }

  private handlePlayerShieldGranted(): void {
    if (!this.gameState || !this.hud) {
      return;
    }

    grantPlayerShield(this.gameState);
    this.hud.update(this.gameState);
  }

  private removeStateEvents(): void {
    this.events.off(PLAYER_HIT_EVENT, this.handlePlayerHit, this);
    this.events.off(PLAYER_SHIELD_EVENT, this.handlePlayerShieldGranted, this);
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
