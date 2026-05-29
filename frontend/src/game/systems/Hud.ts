import Phaser from 'phaser';
import type { GameState } from '../state/GameState';

const HEALTH_BAR_WIDTH = 148;
const HEALTH_BAR_HEIGHT = 12;

export class Hud {
  private readonly bombsText: Phaser.GameObjects.Text;

  private readonly healthFill: Phaser.GameObjects.Graphics;

  private readonly livesText: Phaser.GameObjects.Text;

  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly shieldText: Phaser.GameObjects.Text;

  private readonly weaponText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, state: GameState) {
    const { width } = scene.scale;

    const panel = scene.add
      .rectangle(0, 0, width, 98, 0x020617, 0.58)
      .setOrigin(0, 0);

    const healthLabel = scene.add.text(16, 12, 'HP', {
      color: '#e0f2fe',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    });

    const healthTrack = scene.add.graphics();
    healthTrack.fillStyle(0x1e293b, 1);
    healthTrack.fillRoundedRect(48, 15, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 4);

    this.healthFill = scene.add.graphics();

    this.scoreText = scene.add
      .text(width - 16, 10, '', {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.livesText = scene.add.text(16, 34, '', {
      color: '#fef3c7',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    });

    this.shieldText = scene.add.text(128, 34, '', {
      color: '#bae6fd',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    });

    this.weaponText = scene.add.text(16, 56, '', {
      color: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    });

    this.bombsText = scene.add.text(128, 56, '', {
      color: '#fde68a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    });

    for (const item of [
      panel,
      healthLabel,
      healthTrack,
      this.healthFill,
      this.scoreText,
      this.livesText,
      this.shieldText,
      this.weaponText,
      this.bombsText,
    ]) {
      item.setDepth(100);
      item.setScrollFactor(0);
    }

    this.update(state);
  }

  update(state: GameState): void {
    const healthRatio = Phaser.Math.Clamp(
      state.health / Math.max(1, state.maxHealth),
      0,
      1,
    );

    this.healthFill.clear();
    this.healthFill.fillStyle(0x22c55e, 1);
    this.healthFill.fillRoundedRect(
      48,
      15,
      HEALTH_BAR_WIDTH * healthRatio,
      HEALTH_BAR_HEIGHT,
      4,
    );

    this.scoreText.setText(`SCORE ${state.score.toString().padStart(6, '0')}`);
    this.livesText.setText(`LIVES ${state.lives}`);
    this.shieldText.setText(`SHIELD ${state.hasShield ? 'ON' : 'OFF'}`);
    this.shieldText.setColor(state.hasShield ? '#67e8f9' : '#94a3b8');
    this.weaponText.setText(`WEAPON ${state.weaponLevel}`);
    this.bombsText.setText(`BOMBS ${state.bombs}`);
    this.bombsText.setColor(state.bombs > 0 ? '#fde68a' : '#94a3b8');
  }
}
